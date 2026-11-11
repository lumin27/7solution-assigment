import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { createUser } from "../users/__tests__/createUser.js";
import { DUMMY_JSON_USERS_URL } from "../users/dummyJsonClient.js";

const SUMMARY_PATH = "/api/users/department-summary";

const users = [
  createUser({
    firstName: "Terry",
    lastName: "Medhurst",
    gender: "male",
    age: 50,
    hair: { color: "Black" },
    address: { postalCode: "11111" },
    company: { department: "Engineering" },
  }),
  createUser({
    firstName: "Jane",
    lastName: "Smith",
    gender: "female",
    age: 28,
    hair: { color: "Blond" },
    address: { postalCode: "22222" },
    company: { department: "Engineering" },
  }),
  createUser({
    firstName: "Amy",
    lastName: "Lee",
    gender: "female",
    age: 35,
    hair: { color: "Black" },
    address: { postalCode: "33333" },
    company: { department: "Support" },
  }),
];

function createAppWithUsers(fakeUsers: unknown[]) {
  return createApp({ fetchUsers: async () => fakeUsers });
}

describe(`GET ${SUMMARY_PATH}`, () => {
  describe("success", () => {
    it("returns 200 with one JSON summary per department", async () => {
      const response = await request(createAppWithUsers(users)).get(SUMMARY_PATH);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.body).toEqual({
        Engineering: {
          male: 1,
          female: 1,
          ageRange: "28-50",
          hair: { Black: 1, Blond: 1 },
          addressUser: { TerryMedhurst: "11111", JaneSmith: "22222" },
        },
        Support: {
          male: 0,
          female: 1,
          ageRange: "35-35",
          hair: { Black: 1 },
          addressUser: { AmyLee: "33333" },
        },
      });
    });

    it("returns correct gender counts", async () => {
      const { body } = await request(createAppWithUsers(users)).get(SUMMARY_PATH);

      expect(body.Engineering).toMatchObject({ male: 1, female: 1 });
      expect(body.Support).toMatchObject({ male: 0, female: 1 });
    });

    it("returns correct age ranges", async () => {
      const { body } = await request(createAppWithUsers(users)).get(SUMMARY_PATH);

      expect(body.Engineering.ageRange).toBe("28-50");
      expect(body.Support.ageRange).toBe("35-35");
    });

    it("returns correct hair counts", async () => {
      const { body } = await request(createAppWithUsers(users)).get(SUMMARY_PATH);

      expect(body.Engineering.hair).toEqual({ Black: 1, Blond: 1 });
      expect(body.Support.hair).toEqual({ Black: 1 });
    });

    it("returns correct addressUser mapping", async () => {
      const { body } = await request(createAppWithUsers(users)).get(SUMMARY_PATH);

      expect(body.Engineering.addressUser).toEqual({
        TerryMedhurst: "11111",
        JaneSmith: "22222",
      });
    });

    it("returns 200 with an empty object when there are no users", async () => {
      const response = await request(createAppWithUsers([])).get(SUMMARY_PATH);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it("skips invalid user records and summarizes the valid ones", async () => {
      const mixedUsers = [null, { firstName: "NoOtherFields" }, { ...users[0], age: "50" }, users[2]];

      const response = await request(createAppWithUsers(mixedUsers)).get(SUMMARY_PATH);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(["Support"]);
    });

    it("uses the real DummyJSON client by default", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(Response.json({ users, total: users.length }));

      const response = await request(createApp()).get(SUMMARY_PATH);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(["Engineering", "Support"]);
      expect(fetch).toHaveBeenCalledWith(DUMMY_JSON_USERS_URL, expect.anything());
    });
  });

  describe("errors", () => {
    beforeEach(() => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("returns 502 when DummyJSON responds with an HTTP error", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json({ users, total: users.length }, { status: 503 }),
      );

      const response = await request(createApp()).get(SUMMARY_PATH);

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        error: { message: "User service is unavailable" },
      });
    });

    it("returns 504 when DummyJSON times out", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(
        new DOMException("The operation was aborted due to timeout", "TimeoutError"),
      );

      const response = await request(createApp()).get(SUMMARY_PATH);

      expect(response.status).toBe(504);
      expect(response.body).toEqual({
        error: { message: "User service timed out" },
      });
    });

    it("returns 502 when the network request fails", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));

      const response = await request(createApp()).get(SUMMARY_PATH);

      expect(response.status).toBe(502);
    });

    it("returns 502 when DummyJSON sends invalid JSON", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response("<html>not json</html>"));

      const response = await request(createApp()).get(SUMMARY_PATH);

      expect(response.status).toBe(502);
    });

    it("returns 502 when the response has no users array", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(Response.json({ products: [] }));

      const response = await request(createApp()).get(SUMMARY_PATH);

      expect(response.status).toBe(502);
    });

    it("returns 502 instead of a partial summary when DummyJSON sends fewer users than total", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(Response.json({ users, total: 208 }));

      const response = await request(createApp()).get(SUMMARY_PATH);

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        error: { message: "User service is unavailable" },
      });
    });

    it("returns 500 without leaking details for an unexpected internal error", async () => {
      const app = createApp({
        fetchUsers: async () => {
          throw new Error("secret internal detail");
        },
      });

      const response = await request(app).get(SUMMARY_PATH);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: { message: "Internal server error" } });
      expect(JSON.stringify(response.body)).not.toContain("secret");
      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404", async () => {
    const response = await request(createAppWithUsers([])).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: "Not found" } });
  });
});

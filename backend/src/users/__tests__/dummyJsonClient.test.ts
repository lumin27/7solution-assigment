import { describe, expect, it, vi } from "vitest";
import { UpstreamServiceError, UpstreamTimeoutError } from "../../errors.js";
import { DUMMY_JSON_USERS_URL, fetchDummyJsonUsers } from "../dummyJsonClient.js";
import { createUser } from "./createUser.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function completeUsersResponse(users: unknown[]): Response {
  return jsonResponse({ users, total: users.length, skip: 0, limit: users.length });
}

async function getRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the promise to reject, but it resolved");
}

describe("fetchDummyJsonUsers", () => {
  describe("successful responses", () => {
    it("requests all users and returns the complete users array", async () => {
      const users = [createUser(), createUser({ firstName: "Jane" })];
      vi.mocked(fetch).mockResolvedValueOnce(completeUsersResponse(users));

      await expect(fetchDummyJsonUsers()).resolves.toEqual(users);

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = vi.mocked(fetch).mock.calls[0] ?? [];
      expect(url).toBe(DUMMY_JSON_USERS_URL);
      expect(new URL(String(url)).searchParams.get("limit")).toBe("0");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    });

    it("accepts an empty dataset when total is 0", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ users: [], total: 0, skip: 0, limit: 0 }));

      await expect(fetchDummyJsonUsers()).resolves.toEqual([]);
    });

    it("returns invalid records unchanged and logs only how many there are", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const users = [null, { firstName: "Secret", lastName: "Person" }, createUser()];
      vi.mocked(fetch).mockResolvedValueOnce(completeUsersResponse(users));

      await expect(fetchDummyJsonUsers()).resolves.toEqual(users);

      expect(warn).toHaveBeenCalledTimes(1);
      const message = String(warn.mock.calls[0]?.[0]);
      expect(message).toContain("2 invalid users");
      expect(message).not.toContain("Secret");
    });

    it("does not warn when every user is valid", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.mocked(fetch).mockResolvedValueOnce(completeUsersResponse([createUser()]));

      await fetchDummyJsonUsers();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("incomplete or malformed responses", () => {
    it.each([
      ["fewer users than total", { users: [createUser()], total: 208 }, "DummyJSON returned 1 of 208 users"],
      ["more users than total", { users: [createUser(), createUser()], total: 1 }, "DummyJSON returned 2 of 1 users"],
    ])("throws UpstreamServiceError for %s", async (_description, body, expectedMessage) => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(body));

      const error = await getRejection(fetchDummyJsonUsers());

      expect(error).toBeInstanceOf(UpstreamServiceError);
      expect(error).toHaveProperty("message", expectedMessage);
    });

    it.each([
      ["missing", undefined],
      ["a string", "1"],
      ["negative", -1],
      ["a decimal", 1.5],
      ["null", null],
    ])("throws UpstreamServiceError when total is %s", async (_description, total) => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ users: [createUser()], total }));

      const error = await getRejection(fetchDummyJsonUsers());

      expect(error).toBeInstanceOf(UpstreamServiceError);
      expect(error).toHaveProperty("message", "DummyJSON response did not contain a valid total");
    });

    it.each([
      ["an object without users", { total: 0 }],
      ["users that is not an array", { users: "nope", total: 0 }],
      ["users that is null", { users: null, total: 0 }],
      ["a top-level array", [createUser()]],
      ["null", null],
      ["a string", "users"],
    ])("throws UpstreamServiceError for %s", async (_description, body) => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(body));

      const error = await getRejection(fetchDummyJsonUsers());

      expect(error).toBeInstanceOf(UpstreamServiceError);
      expect(error).toHaveProperty("message", "DummyJSON response did not contain a users array");
    });

    it("throws UpstreamServiceError without leaking the body when the JSON is invalid", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response("<html>secret page</html>", { status: 200 }),
      );

      const error = await getRejection(fetchDummyJsonUsers());

      expect(error).toBeInstanceOf(UpstreamServiceError);
      expect(error).toHaveProperty("message", "DummyJSON returned invalid JSON");
    });
  });

  describe("transport failures", () => {
    it("throws UpstreamServiceError when DummyJSON responds with an HTTP error", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ message: "down" }, 503));

      const error = await getRejection(fetchDummyJsonUsers());

      expect(error).toBeInstanceOf(UpstreamServiceError);
      expect(error).toHaveProperty("message", "DummyJSON responded with HTTP 503");
    });

    it("throws UpstreamServiceError when the network request fails", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));

      const error = await getRejection(fetchDummyJsonUsers());

      expect(error).toBeInstanceOf(UpstreamServiceError);
      expect(error).toHaveProperty("message", "Could not reach DummyJSON");
    });

    it("throws UpstreamTimeoutError when DummyJSON does not answer in time", async () => {
      vi.mocked(fetch).mockImplementationOnce(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          }),
      );

      const error = await getRejection(fetchDummyJsonUsers({ timeoutMs: 20 }));

      expect(error).toBeInstanceOf(UpstreamTimeoutError);
    });
  });
});

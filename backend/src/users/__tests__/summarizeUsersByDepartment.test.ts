import { describe, expect, it } from "vitest";
import { summarizeUsersByDepartment } from "../summarizeUsersByDepartment.js";
import { createUser } from "./createUser.js";

describe("summarizeUsersByDepartment", () => {
  it("produces the summary shape from the assignment example", () => {
    const users = [
      createUser({
        firstName: "Terry",
        lastName: "Medhurst",
        gender: "male",
        age: 28,
        hair: { color: "Black" },
        address: { postalCode: "12345" },
      }),
      createUser({
        firstName: "Jane",
        lastName: "Smith",
        gender: "female",
        age: 32,
        hair: { color: "Blond" },
        address: { postalCode: "54321" },
      }),
    ];

    expect(summarizeUsersByDepartment(users)).toEqual({
      Engineering: {
        male: 1,
        female: 1,
        ageRange: "28-32",
        hair: { Black: 1, Blond: 1 },
        addressUser: { TerryMedhurst: "12345", JaneSmith: "54321" },
      },
    });
  });

  it("returns an empty object for an empty list", () => {
    expect(summarizeUsersByDepartment([])).toEqual({});
  });

  describe("grouping", () => {
    it("creates one summary per department, in the order departments first appear", () => {
      const users = [
        createUser({ company: { department: "Support" } }),
        createUser({ company: { department: "Engineering" } }),
        createUser({ company: { department: "Support" } }),
      ];

      const result = summarizeUsersByDepartment(users);

      expect(Object.keys(result)).toEqual(["Support", "Engineering"]);
    });

    it("combines all users of the same department into one summary", () => {
      const users = [
        createUser({ firstName: "Ann", company: { department: "Sales" } }),
        createUser({ firstName: "Bob", company: { department: "Sales" } }),
        createUser({ firstName: "Cat", company: { department: "Sales" } }),
      ];

      const result = summarizeUsersByDepartment(users);

      expect(Object.keys(result)).toEqual(["Sales"]);
      expect(Object.keys(result.Sales?.addressUser ?? {})).toHaveLength(3);
    });
  });

  describe("gender counts", () => {
    it("counts male and female users separately per department", () => {
      const users = [
        createUser({ gender: "male" }),
        createUser({ gender: "female" }),
        createUser({ gender: "female" }),
        createUser({ gender: "male", company: { department: "Support" } }),
      ];

      const result = summarizeUsersByDepartment(users);

      expect(result.Engineering).toMatchObject({ male: 1, female: 2 });
      expect(result.Support).toMatchObject({ male: 1, female: 0 });
    });
  });

  describe("ageRange", () => {
    it("uses the youngest and oldest age, regardless of input order", () => {
      const users = [
        createUser({ age: 31 }),
        createUser({ age: 45 }),
        createUser({ age: 23 }),
      ];

      expect(summarizeUsersByDepartment(users).Engineering?.ageRange).toBe("23-45");
    });

    it("repeats the same age when a department has one user", () => {
      const users = [createUser({ age: 30 })];

      expect(summarizeUsersByDepartment(users).Engineering?.ageRange).toBe("30-30");
    });

    it("calculates each department's range from its own users only", () => {
      const users = [
        createUser({ age: 20 }),
        createUser({ age: 60, company: { department: "Support" } }),
        createUser({ age: 25 }),
      ];

      const result = summarizeUsersByDepartment(users);

      expect(result.Engineering?.ageRange).toBe("20-25");
      expect(result.Support?.ageRange).toBe("60-60");
    });
  });

  describe("hair", () => {
    it("counts each hair color found in the data", () => {
      const users = [
        createUser({ hair: { color: "Black" } }),
        createUser({ hair: { color: "Blond" } }),
        createUser({ hair: { color: "Black" } }),
        createUser({ hair: { color: "Purple" } }),
      ];

      expect(summarizeUsersByDepartment(users).Engineering?.hair).toEqual({
        Black: 2,
        Blond: 1,
        Purple: 1,
      });
    });
  });

  describe("addressUser", () => {
    it("maps first name + last name, without spaces, to the home postal code", () => {
      const users = [
        createUser({ firstName: "Terry", lastName: "Medhurst", address: { postalCode: "12345" } }),
        createUser({ firstName: "Mary Ann", lastName: "Lee", address: { postalCode: "99999" } }),
      ];

      expect(summarizeUsersByDepartment(users).Engineering?.addressUser).toEqual({
        TerryMedhurst: "12345",
        MaryAnnLee: "99999",
      });
    });

    it("keeps the later postal code when two users in a department share a name", () => {
      const users = [
        createUser({ address: { postalCode: "11111" } }),
        createUser({ address: { postalCode: "22222" } }),
      ];

      expect(summarizeUsersByDepartment(users).Engineering?.addressUser).toEqual({
        TerryMedhurst: "22222",
      });
    });
  });

  describe("invalid and unexpected data", () => {
    it("skips invalid users and still summarizes the valid ones", () => {
      const users: unknown[] = [
        null,
        "not a user",
        { ...createUser(), company: undefined },
        { ...createUser(), age: "30" },
        createUser({ firstName: "Valid", age: 40 }),
      ];

      expect(summarizeUsersByDepartment(users)).toEqual({
        Engineering: {
          male: 1,
          female: 0,
          ageRange: "40-40",
          hair: { Black: 1 },
          addressUser: { ValidMedhurst: "12345" },
        },
      });
    });

    it("returns an empty object when every user is invalid", () => {
      expect(summarizeUsersByDepartment([null, {}, 42])).toEqual({});
    });

    it("includes users with an unexpected gender everywhere except the male/female counts", () => {
      const users = [
        createUser({ firstName: "Alex", gender: "other", age: 50, hair: { color: "Red" } }),
        createUser({ firstName: "Sam", gender: "Male", age: 20 }),
      ];

      expect(summarizeUsersByDepartment(users).Engineering).toEqual({
        male: 0,
        female: 0,
        ageRange: "20-50",
        hair: { Red: 1, Black: 1 },
        addressUser: { AlexMedhurst: "12345", SamMedhurst: "12345" },
      });
    });

    it("treats names that exist on every JavaScript object as normal keys", () => {
      const users = [
        createUser({ hair: { color: "constructor" }, company: { department: "__proto__" } }),
      ];

      const result = summarizeUsersByDepartment(users);

      expect(Object.keys(result)).toEqual(["__proto__"]);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(result["__proto__"]?.hair).toEqual({ constructor: 1 });
    });
  });

  it("does not modify the input array or the user objects", () => {
    const users = [
      createUser({ age: 40 }),
      createUser({ age: 20, company: { department: "Support" } }),
    ];
    const snapshot = structuredClone(users);

    summarizeUsersByDepartment(users);

    expect(users).toEqual(snapshot);
  });
});

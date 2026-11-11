import { describe, expect, it } from "vitest";
import { isDummyJsonUser } from "../validateUser.js";
import { createUser } from "./createUser.js";

describe("isDummyJsonUser", () => {
  it("accepts a user with every required field", () => {
    expect(isDummyJsonUser(createUser())).toBe(true);
  });

  it("accepts extra fields the API sends that we do not use", () => {
    expect(isDummyJsonUser({ ...createUser(), id: 1, email: "terry@x.com" })).toBe(true);
  });

  it("accepts unexpected gender values, so the summary can decide how to count them", () => {
    expect(isDummyJsonUser(createUser({ gender: "other" }))).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "Terry"],
    ["a number", 42],
    ["an array", [createUser()]],
    ["an empty object", {}],
    ["a missing first name", { ...createUser(), firstName: undefined }],
    ["an empty last name", createUser({ lastName: "  " })],
    ["age as a string", { ...createUser(), age: "30" }],
    ["age as NaN", createUser({ age: Number.NaN })],
    ["a negative age", createUser({ age: -1 })],
    ["a non-string gender", { ...createUser(), gender: 1 }],
    ["missing hair", { ...createUser(), hair: undefined }],
    ["an empty hair color", createUser({ hair: { color: "" } })],
    ["missing address", { ...createUser(), address: null }],
    ["a numeric postal code", { ...createUser(), address: { postalCode: 12345 } }],
    ["missing company", { ...createUser(), company: undefined }],
    ["an empty department", createUser({ company: { department: "" } })],
  ])("rejects %s", (_description, value) => {
    expect(isDummyJsonUser(value)).toBe(false);
  });
});

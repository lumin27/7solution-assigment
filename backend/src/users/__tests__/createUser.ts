import type { DummyJsonUser } from "../types.js";

export function createUser(overrides: Partial<DummyJsonUser> = {}): DummyJsonUser {
  return {
    firstName: "Terry",
    lastName: "Medhurst",
    age: 30,
    gender: "male",
    hair: { color: "Black" },
    address: { postalCode: "12345" },
    company: { department: "Engineering" },
    ...overrides,
  };
}

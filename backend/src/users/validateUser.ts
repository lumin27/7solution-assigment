import type { DummyJsonUser } from "./types.js";

export function isDummyJsonUser(value: unknown): value is DummyJsonUser {
  if (!isObject(value)) {
    return false;
  }

  const { firstName, lastName, age, gender, hair, address, company } = value;

  return (
    isNonEmptyString(firstName) &&
    isNonEmptyString(lastName) &&
    isValidAge(age) &&
    typeof gender === "string" &&
    isObject(hair) &&
    isNonEmptyString(hair.color) &&
    isObject(address) &&
    isNonEmptyString(address.postalCode) &&
    isObject(company) &&
    isNonEmptyString(company.department)
  );
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isValidAge(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

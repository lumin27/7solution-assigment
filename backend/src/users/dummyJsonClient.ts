import { UpstreamServiceError, UpstreamTimeoutError } from "../errors.js";
import { isDummyJsonUser, isObject } from "./validateUser.js";

export type FetchUsers = () => Promise<unknown[]>;

export const DUMMY_JSON_TIMEOUT_MS = 5000;

export const DUMMY_JSON_USERS_URL =
  "https://dummyjson.com/users?" +
  new URLSearchParams({
    limit: "0",
    select: "firstName,lastName,age,gender,hair,address,company",
  }).toString();

type FetchDummyJsonUsersOptions = {
  timeoutMs?: number;
};

export async function fetchDummyJsonUsers({
  timeoutMs = DUMMY_JSON_TIMEOUT_MS,
}: FetchDummyJsonUsersOptions = {}): Promise<unknown[]> {
  const signal = AbortSignal.timeout(timeoutMs);

  let response: Response;
  try {
    response = await fetch(DUMMY_JSON_USERS_URL, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw toUpstreamError(error, "Could not reach DummyJSON");
  }

  if (!response.ok) {
    throw new UpstreamServiceError(`DummyJSON responded with HTTP ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw toUpstreamError(error, "DummyJSON returned invalid JSON");
  }

  const users = readUsers(body);
  warnAboutInvalidUsers(users);
  return users;
}

function readUsers(body: unknown): unknown[] {
  if (!isObject(body) || !Array.isArray(body.users)) {
    throw new UpstreamServiceError("DummyJSON response did not contain a users array");
  }

  const users = body.users;
  const total = body.total;

  if (!isNonNegativeInteger(total)) {
    throw new UpstreamServiceError("DummyJSON response did not contain a valid total");
  }

  if (users.length !== total) {
    throw new UpstreamServiceError(`DummyJSON returned ${users.length} of ${total} users`);
  }

  return users;
}

function warnAboutInvalidUsers(users: unknown[]): void {
  const invalidCount = users.filter((user) => !isDummyJsonUser(user)).length;

  if (invalidCount > 0) {
    console.warn(`Skipping ${invalidCount} invalid users from DummyJSON`);
  }
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function toUpstreamError(error: unknown, message: string): Error {
  if (error instanceof Error && error.name === "TimeoutError") {
    return new UpstreamTimeoutError("DummyJSON did not respond in time");
  }

  return new UpstreamServiceError(message);
}

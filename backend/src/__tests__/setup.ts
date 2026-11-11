import { afterEach, beforeEach, vi } from "vitest";

const blockedRequests: string[] = [];

beforeEach(() => {
  blockedRequests.length = 0;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      blockedRequests.push(String(input));
      throw new Error("Network requests are not allowed in tests");
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  if (blockedRequests.length > 0) {
    throw new Error(`Unmocked fetch call to: ${blockedRequests.join(", ")}`);
  }
});

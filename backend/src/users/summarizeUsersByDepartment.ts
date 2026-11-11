import type {
  DepartmentSummaries,
  DepartmentSummary,
  DummyJsonUser,
} from "./types.js";
import { isDummyJsonUser } from "./validateUser.js";

type DepartmentAccumulator = {
  male: number;
  female: number;
  minAge: number;
  maxAge: number;
  hairColorCounts: Map<string, number>;
  postalCodeByFullName: Map<string, string>;
};

export function summarizeUsersByDepartment(
  users: readonly unknown[],
): DepartmentSummaries {
  const accumulatorsByDepartment = new Map<string, DepartmentAccumulator>();

  for (const user of users) {
    if (!isDummyJsonUser(user)) {
      continue;
    }

    const department = user.company.department;
    let accumulator = accumulatorsByDepartment.get(department);
    if (!accumulator) {
      accumulator = createEmptyAccumulator();
      accumulatorsByDepartment.set(department, accumulator);
    }

    addUserToAccumulator(accumulator, user);
  }

  return Object.fromEntries(
    Array.from(
      accumulatorsByDepartment,
      ([department, accumulator]): [string, DepartmentSummary] => [
        department,
        toDepartmentSummary(accumulator),
      ],
    ),
  );
}

function createEmptyAccumulator(): DepartmentAccumulator {
  return {
    male: 0,
    female: 0,
    minAge: Infinity,
    maxAge: -Infinity,
    hairColorCounts: new Map(),
    postalCodeByFullName: new Map(),
  };
}

function addUserToAccumulator(
  accumulator: DepartmentAccumulator,
  user: DummyJsonUser,
): void {
  if (user.gender === "male") {
    accumulator.male += 1;
  } else if (user.gender === "female") {
    accumulator.female += 1;
  }

  accumulator.minAge = Math.min(accumulator.minAge, user.age);
  accumulator.maxAge = Math.max(accumulator.maxAge, user.age);

  const hairColor = user.hair.color;
  const currentCount = accumulator.hairColorCounts.get(hairColor) ?? 0;
  accumulator.hairColorCounts.set(hairColor, currentCount + 1);

  const fullName = toFullNameKey(user.firstName, user.lastName);
  accumulator.postalCodeByFullName.set(fullName, user.address.postalCode);
}

function toDepartmentSummary(accumulator: DepartmentAccumulator): DepartmentSummary {
  return {
    male: accumulator.male,
    female: accumulator.female,
    ageRange: `${accumulator.minAge}-${accumulator.maxAge}`,
    hair: Object.fromEntries(accumulator.hairColorCounts),
    addressUser: Object.fromEntries(accumulator.postalCodeByFullName),
  };
}

function toFullNameKey(firstName: string, lastName: string): string {
  return `${firstName}${lastName}`.replace(/\s+/g, "");
}

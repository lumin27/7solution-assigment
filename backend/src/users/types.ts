export type DummyJsonAddress = {
  postalCode: string;
};

export type DummyJsonCompany = {
  department: string;
};

export type DummyJsonHair = {
  color: string;
};

export type DummyJsonUser = {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  hair: DummyJsonHair;
  address: DummyJsonAddress;
  company: DummyJsonCompany;
};

export type DummyJsonUsersResponse = {
  users: DummyJsonUser[];
  total: number;
  skip: number;
  limit: number;
};

export type DepartmentSummary = {
  male: number;
  female: number;
  ageRange: string;
  hair: Record<string, number>;
  addressUser: Record<string, string>;
};

export type DepartmentSummaries = Record<string, DepartmentSummary>;

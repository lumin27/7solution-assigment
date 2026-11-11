import { Router } from "express";
import type { FetchUsers } from "../users/dummyJsonClient.js";
import { summarizeUsersByDepartment } from "../users/summarizeUsersByDepartment.js";

export function createUsersRouter(fetchUsers: FetchUsers): Router {
  const router = Router();

  router.get("/department-summary", async (_request, response) => {
    const users = await fetchUsers();
    response.json(summarizeUsersByDepartment(users));
  });

  return router;
}

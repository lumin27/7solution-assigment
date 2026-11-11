import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { createUsersRouter } from "./routes/usersRouter.js";
import { fetchDummyJsonUsers, type FetchUsers } from "./users/dummyJsonClient.js";

export type AppDependencies = {
  fetchUsers?: FetchUsers;
};

export function createApp({
  fetchUsers = fetchDummyJsonUsers,
}: AppDependencies = {}): Express {
  const app = express();
  app.disable("x-powered-by");

  app.use("/api/users", createUsersRouter(fetchUsers));

  app.use((_request, response) => {
    response.status(404).json({ error: { message: "Not found" } });
  });

  app.use(errorHandler);

  return app;
}

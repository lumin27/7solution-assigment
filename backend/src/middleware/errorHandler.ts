import type { ErrorRequestHandler, Response } from "express";
import { UpstreamServiceError, UpstreamTimeoutError } from "../errors.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof UpstreamTimeoutError) {
    console.warn(error.message);
    sendError(response, 504, "User service timed out");
    return;
  }

  if (error instanceof UpstreamServiceError) {
    console.warn(error.message);
    sendError(response, 502, "User service is unavailable");
    return;
  }

  console.error(error);
  sendError(response, 500, "Internal server error");
};

function sendError(response: Response, status: number, message: string) {
  response.status(status).json({ error: { message } });
}

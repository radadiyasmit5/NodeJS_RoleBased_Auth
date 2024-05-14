import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js';

export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // if error is not an instance of ApiError then create ApiError class with the passed error

    const statusCode =
      error?.statusCode || error instanceof mongoose.Error ? 400 : 500;
    const message = error.message || "something went wrong";
    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  // by this time we will have error as instence of ApiError
  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode || 500).json(response);
};

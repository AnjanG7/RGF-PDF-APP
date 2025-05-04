import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import requestIp from "request-ip";
import morganMiddleware from "./logger/morgan.logger.js";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middlewares.js";

import { createServer } from "http";
const app = express();
const httpServer = createServer(app);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "18kb" }));
app.use(express.urlencoded({ extended: true, limit: "18kb" }));
app.use(express.static("uploads"));

app.use(requestIp.mw());

// Rate limiter to avoid misuse of the service and avoid cost spikes

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (req, res) => 500, // replaces deprecated `max`
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.clientIp,
  handler: (req, res, next, options) => {
    throw new ApiError(
      options.statusCode || 429,
      `Too many requests. You are allowed ${
        typeof options.limit === "function"
          ? options.limit(req, res)
          : options.limit
      } requests per ${options.windowMs / 60000} minutes.`
    );
  },
});

// Apply the rate limiting middleware to all requests
app.use(limiter);
app.use(morganMiddleware);
app.use(errorHandler);

//route import
import pdfRouter from "./routes/pdf.routes.js";
import chatRouter from "./routes/chat.routes.js";

//route declaration
app.use("/ap1/v1/upload", pdfRouter);
app.use("/ap1/v1", chatRouter);

export { httpServer };

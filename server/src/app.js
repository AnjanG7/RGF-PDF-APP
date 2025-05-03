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
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
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

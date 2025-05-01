import connectDB from "./database/db.js";
import dotenv from "dotenv";
import cluster from "node:cluster";
import { httpServer } from "./app.js";
import os from "node:os";
import logger from "./logger/wiston.logger.js";

const totalCpu = os.cpus().length;

dotenv.config({
  path: "./.env",
});
if (cluster.isPrimary) {
  logger.info(`Primary process ${process.pid} running!!!`);
  //building workers
  for (let i = 0; i < totalCpu; i++) {
    cluster.fork();
  }

  //suppose when some workers died by any resons it will create next workers
  cluster.on("exit", (worker, code, signal) => {
    logger.info(`Worker process ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  connectDB()
    .then(() => {
      httpServer.listen(process.env.PORT || 5000, () => {
        logger.info("⚙️  Server is running on port: " + process.env.PORT);
      });
    })
    .catch((error) => {
      logger.error("Mongodb connection failed!!!", error);
    }),
    logger.info(`Worker process ${process.pid} running!!!`);
}

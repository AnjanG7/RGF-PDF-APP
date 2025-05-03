import { Worker } from "bullmq";
import { CohereEmbeddings } from "@langchain/cohere";
import { QdrantVectorStore } from "@langchain/qdrant";
import * as dotenv from "dotenv";
import { ApiError } from "./utils/ApiError.js";
import logger from "./logger/wiston.logger.js";

dotenv.config({ path: "./.env" });

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      const { cloudinaryUrl, pdftext } = job.data;

      if (!cloudinaryUrl) {
        throw new ApiError(400, "Cloudinary URL is missing", []);
      }
      if (!pdftext) {
        throw new ApiError(400, "text is missing", []);
      }

      const fullText = pdftext.join(" ").trim(); // Joining pages with a space in between

      if (!fullText || fullText === "") {
        throw new ApiError(400, "PDF text is empty or couldn't be parsed", []);
      }

      logger.info(`Full text length after extraction: ${fullText.length}`);

      // Create a single document with the full text
      const docs = [
        {
          pageContent: fullText,
          metadata: { source: cloudinaryUrl },
        },
      ];

      // Initialize embeddings
      const embeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY,
        model: "embed-english-v3.0",
      });

      // Insert directly into the vector store without chunking
      try {
        const vectorStore = await QdrantVectorStore.fromDocuments(
          docs,
          embeddings,
          {
            url: "http://localhost:6333",
            collectionName: "ragapp",
          }
        );
        logger.info("✅ Document added to vector store.");
      } catch (error) {
        logger.error(
          `❌ Error while adding document to vector store: ${error.message}`,
          { stack: error.stack }
        );
      }
    } catch (error) {
      logger.error(`❌ Worker error: ${error.message}`, { stack: error.stack });
    }
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

worker.on("completed", (job) => {
  logger.info(
    `🎉 Job ${job.id} completed successfully)}`
  );
});

worker.on("failed", (job, err) => {
  logger.error(`🔥 Job ${job.id} failed: ${err.message}`, { stack: err.stack });
});
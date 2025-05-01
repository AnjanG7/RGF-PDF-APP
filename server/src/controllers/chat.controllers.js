import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CohereEmbeddings } from "@langchain/cohere";
import { QdrantVectorStore } from "@langchain/qdrant";
import { CohereClient } from "cohere-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});
const chatSectionHandling = asyncHandler(async (req, res) => {
  const userQuery = req.query.message;
  if (!userQuery) {
    throw new ApiError(400, "Userquery is nedded!!!");
  }
  // Cohere embeddings
  const embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-english-v3.0",
  });

  // Load from vector store
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName:"ragapp",
    }
  );

  const retriever = vectorStore.asRetriever({ k: 2 });
  const result = await retriever.invoke(userQuery);

  const SYSTEM_PROMPT = `
You are a helpful AI Assistant who answers the user's query based on the context from a PDF file.
Context:
${JSON.stringify(result)}
`;

  // Cohere chat
  const chatResult = await cohere.chat({
    model: "command-r-plus",
    temperature: 0.5,
    message: userQuery,
    promptTruncation: "AUTO",
    chatHistory: [{ role: "SYSTEM", message: SYSTEM_PROMPT }],
  });

  return res.json({
    message: chatResult.text,
    docs: result,
  });
});
export { chatSectionHandling }; 
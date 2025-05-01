import { asyncHandler } from "../utils/asyncHandler.js";
import { Pdf } from "../models/pdf.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../services/cloudinary.services.js";
import { Queue } from "bullmq";
import axios from "axios";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

// Helper: extract text from Cloudinary PDF
async function extractTextFromPDF(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const data = await pdfParse(response.data);
    const pages = data.text
      .split("\f")
      .filter((page) => page.trim().length > 0);
    return pages;
  } catch (err) {
    throw new ApiError(500, "Failed to extract text from PDF", [err.message]);
  }
}

const uploadPdf = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;
  if (!localPath) {
    throw new ApiError(400, "PDF file is missing!", []);
  }

  // Step 1: Upload to Cloudinary
  const pdfFile = await uploadOnCloudinary(localPath);
  if (!pdfFile) {
    throw new ApiError(400, "PDF upload failed", []);
  }

  // Step 2: Save PDF metadata to DB
  const pdfDoc = await Pdf.create({
    pdfUrl: pdfFile.secure_url,
  });
  if (!pdfDoc) {
    throw new ApiError(400, "Failed to save PDF info to DB", []);
  }

  // Step 3: Extract text from PDF (Cloudinary URL)
  const pdfText = await extractTextFromPDF(pdfFile.secure_url);

  // Step 4: Add job to queue
  await queue.add(
    "file-ready",
    {
      cloudinaryUrl: pdfFile.secure_url,
      publicId: pdfFile.public_id,
      originalFilename: req.file?.originalname,
      pdftext: pdfText, // <-- now passing extracted text
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully uploaded and queued PDF!"));
});

export { uploadPdf };

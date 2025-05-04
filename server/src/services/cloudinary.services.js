import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import logger from "../logger/wiston.logger.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw", // for PDF
      folder: "pdf_uploads",
    });
    // file has been uploaded successfull

    await fs.unlink(localFilePath);
    return response;
  } catch (error) {
    try {
      await fs.unlink(localFilePath);
    } catch (unlinkErr) {
      logger.warn("Failed to delete temp file:", unlinkErr.message);
    }

    // Let the calling code handle the failure properly
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export { uploadOnCloudinary };

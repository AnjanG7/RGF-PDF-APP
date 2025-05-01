import mongoose, { Schema } from "mongoose";
const pdfSchema = new mongoose.Schema(
  {
    pdfUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Pdf = mongoose.model("pdf", pdfSchema);

import { Request, Response } from "express";
import { uploadFile } from "../utils/s3";

export async function uploadHandler(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).send("No file uploaded");
    return;
  }
  const file = req.file;

  const key = `uploads/${Date.now()}_${file.originalname}`;

  try {
    await uploadFile(file.path, key);
    res.status(200).json({ message: "Uploaded", key });
  } catch (e) {
    console.error("Upload failed", e);
    res.status(500).json({ error: "Upload failed", details: e });
  }
}

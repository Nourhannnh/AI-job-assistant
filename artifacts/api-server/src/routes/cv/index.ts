/**
 * CV routes - PDF parsing for CV upload.
 */
import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { requireAuth } from "../../lib/auth";
import type { IRouter } from "express";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

/**
 * POST /cv/parse - Extract text from an uploaded PDF CV.
 */
router.post("/cv/parse", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file uploaded" });
    return;
  }

  try {
    const data = await pdfParse(req.file.buffer);
    const text = data.text.trim();

    if (!text || text.length < 50) {
      res.status(422).json({ error: "Could not extract enough text from the PDF. Try pasting your CV text instead." });
      return;
    }

    res.json({ text });
  } catch {
    res.status(422).json({ error: "Failed to parse PDF. The file may be scanned or password-protected. Try pasting your CV text instead." });
  }
});

export default router;

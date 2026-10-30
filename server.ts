import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function generateVisionContent(
  prompt: string,
  images: Array<{ base64: string; mimeType?: string }>
): Promise<string> {
  const parts: any[] = [{ text: prompt }];

  for (const img of images) {
    let cleanBase64 = img.base64 || "";
    let mimeType = img.mimeType || "image/png";

    if (cleanBase64.startsWith("data:")) {
      const match = cleanBase64.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      }
    }

    parts.push({
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    });
  }

  const models = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3-flash-preview"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      // Allow 7s for the attempt before falling back to next available model
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout waiting for model ${model}`)), 7000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Server Gemini] Attempt with model ${model} failed:`, err?.message || err);
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini API on server");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "QA Inspection System (Server-Side AI Enabled)",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Server-side Gemini Vision OCR & Extraction endpoint
  app.post("/api/gemini/vision", async (req, res) => {
    try {
      const { prompt, images } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt parameter" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please check your environment variables.",
        });
      }

      const text = await generateVisionContent(prompt, Array.isArray(images) ? images : []);
      return res.json({ text });
    } catch (err: any) {
      console.error("[Server Gemini Vision Error]:", err?.message || err);
      return res.status(500).json({
        error: err?.message || "Internal server error during Gemini analysis",
      });
    }
  });

  // Server-side Gemini Streaming endpoint
  app.post("/api/gemini/stream", async (req, res) => {
    try {
      const { prompt, model = "gemini-3.8-flash" } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt parameter" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await ai.models.generateContentStream({
        model,
        contents: prompt,
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.error("[Server Gemini Stream Error]:", err?.message || err);
      res.write(`data: ${JSON.stringify({ error: err?.message || "Stream error" })}\n\n`);
      res.end();
    }
  });

  // Vite middleware for development vs production static serve
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QA Inspection Server listening on http://localhost:${PORT}`);
  });
}

startServer();


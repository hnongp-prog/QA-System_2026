import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (process.env as any).REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured on Vercel environment variables.",
    });
  }

  try {
    const { prompt, images } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt parameter" });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build-vercel",
        },
      },
    });

    const parts: any[] = [{ text: prompt }];

    for (const img of Array.isArray(images) ? images : []) {
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

    const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-3-flash-preview"];
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
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

        if (response && response.text) {
          return res.status(200).json({ text: response.text });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Vercel Serverless Gemini] Model ${model} failed:`, err?.message || err);
      }
    }

    throw lastError || new Error("Failed to generate content with Gemini API on Vercel");
  } catch (err: any) {
    console.error("[Vercel Serverless Vision Error]:", err?.message || err);
    return res.status(500).json({
      error: err?.message || "Internal server error during Gemini analysis on Vercel",
    });
  }
}

import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import mammoth from "mammoth";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- AI Service ----
import { GoogleGenAI } from "@google/genai";
import type { ScoringWeights, JdAnalysis, AnalysisResult } from "./src/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";
const GEMINI_MODEL = "gemini-2.0-flash";

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

async function callAi(prompt: string, expectJson: boolean = false): Promise<string> {
  if (!GEMINI_API_KEY && !DEEPSEEK_API_KEY) {
    throw new Error("AI API Key is missing. Please configure GEMINI_API_KEY or DEEPSEEK_API_KEY in .env");
  }

  if (ai && GEMINI_API_KEY) {
    console.log(`[Server AI] Calling Gemini (${GEMINI_MODEL})...`);
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: expectJson ? { responseMimeType: "application/json" } : undefined,
      });
      const text = response.text;
      if (!text) throw new Error("Gemini returned empty response");
      return text;
    } catch (error) {
      console.error("[Server AI] Gemini call failed:", error);
      if (!DEEPSEEK_API_KEY) throw error;
      console.log("[Server AI] Falling back to DeepSeek...");
    }
  }

  if (DEEPSEEK_API_KEY) {
    console.log(`[Server AI] Calling DeepSeek (${DEEPSEEK_MODEL})...`);
    const response = await fetch(DEEPSEEK_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: expectJson ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("No AI service available");
}

async function extractFileText(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  if (mimetype === "application/pdf") {
    const parser = new PDFParse();
    await parser.load(buffer);
    const text = await parser.getText();
    return text;
  } else if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword" ||
    originalname.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    return buffer.toString("utf-8");
  }
}
// ---- End AI Service ----

async function startServer() {
  const app = express();
  const PORT = 3000;
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.json());

  // ---- AI Endpoints ----

  // Analyze JD: extract weights & thresholds from JD text
  app.post("/api/ai/analyze-jd", async (req, res) => {
    try {
      const { jdText } = req.body;
      if (!jdText) {
        return res.status(400).json({ error: "jdText is required" });
      }

      const prompt = `
        Analyze the following Job Description (JD) and extract job title, scoring weights, and hard thresholds.

        [Rules]:
        1. jobTitle: Extract the position title from the JD (e.g. "Senior Frontend Engineer").
        2. minEdu must be one of: 'none', 'associate', 'bachelor', 'master', 'doctor'.
        3. minExp is an integer (years).
        4. suggestedWeights should be an array of items (id, label, value), totaling exactly 100%.
        5. requiredSkills should be 3-8 key technical tags.

        Return ONLY JSON:
        {
          "jobTitle": "Position Title",
          "suggestedWeights": [{ "id": "edu", "label": "Education Match", "value": 20 }, ...],
          "thresholds": {
            "minEdu": "EduLevel",
            "minExp": int,
            "requiredSkills": ["skill1", "skill2"]
          }
        }

        [JD Context]:
        ${jdText}
      `;

      const text = await callAi(prompt, true);
      const result: JdAnalysis = JSON.parse(text);
      res.json(result);
    } catch (error) {
      console.error("[Server AI] analyze-jd error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to analyze JD" });
    }
  });

  // Analyze Resume: upload file + JD + weights, returns analysis result
  app.post("/api/ai/analyze-resume", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const jdText = req.body.jdText as string;
      let weights: ScoringWeights;
      try {
        weights = JSON.parse(req.body.weights || "[]");
      } catch {
        return res.status(400).json({ error: "Invalid weights JSON" });
      }
      const language = (req.body.language as "en" | "zh") || "en";

      if (!jdText) {
        return res.status(400).json({ error: "jdText is required" });
      }

      // Extract text from uploaded file
      const resumeText = await extractFileText(req.file.buffer, req.file.mimetype, req.file.originalname);
      if (!resumeText.trim()) {
        return res.status(400).json({ error: "Resume is empty or could not be read" });
      }

      const weightIds = weights.map(w => w.id).join(', ');
      const langInstruction = language === 'zh'
        ? 'ALL text output MUST be in Chinese (简体中文). This is critical: highlights, gaps, key_skills, personal_info.name, education_level, fit_status, and logic must ALL be Chinese. Do not output any English text.'
        : 'ALL text fields must be in English.';

      const prompt = `
        You are an expert HR recruiter. Analyze this resume against the JD below.

        ${langInstruction}

        Scoring weights: ${weightIds}
        Weight details:
        ${weights.map(w => `- ${w.id}: ${w.label} (${w.value}%)`).join('\n')}

        Return ONLY this exact JSON structure (no markdown, no code fences):
        {
          "overall_score": <0-100>,
          "detailed_scores": { ${weights.map(w => `"${w.id}": <0-100>`).join(', ')} },
          "summary": {
            "highlights": ["<string>", ...],
            "gaps": ["<string>", ...],
            "key_skills": ["<string>", ...],
            "personal_info": {
              "name": "<string>",
              "email": "<string or null>",
              "phone": "<string or null>",
              "education_level": "<string>",
              "experience_years": <number>
            }
          },
          "overall_recommendation": {
            "fit_status": "<string>",
            "logic": "<string>"
          }
        }

        [JD]:
        ${jdText}

        [Resume]:
        ${resumeText}
      `;

      const text = await callAi(prompt, true);
      const analysis = JSON.parse(text);

      const result: Partial<AnalysisResult> = {
        ...analysis,
        candidate_name: analysis.summary?.personal_info?.name || req.file.originalname.split('.')[0],
        ai_score_initial: analysis.overall_score || 0,
        file_name: req.file.originalname,
      };

      res.json(result);
    } catch (error) {
      console.error("[Server AI] analyze-resume error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to analyze resume" });
    }
  });

  // Generic AI generate endpoint (for chat widget)
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, expectJson } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }
      const text = await callAi(prompt, !!expectJson);
      res.json({ text });
    } catch (error) {
      console.error("[Server AI] generate error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "AI generation failed" });
    }
  });

  // ---- Legacy Text Extraction Endpoint ----
  app.post("/api/extract-text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const text = await extractFileText(req.file.buffer, req.file.mimetype, req.file.originalname);
      res.json({ text });
    } catch (error) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: "Failed to extract text from file" });
    }
  });

  // ---- Vite Integration ----
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
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// In-memory tracking of recent interaction runs
interface StoredRun {
  id: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  environmentId?: string;
  previousInteractionId?: string;
  summary?: string;
}

const interactionStore = new Map<string, StoredRun>();

// Lazy initialization of Gemini API Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please ensure it is set in AI Studio settings.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Helper to extract full text output across all model_output steps
function extractFullOutput(steps: any[], fallbackText?: string | null): string {
  let fullOutput = "";
  if (Array.isArray(steps)) {
    for (const step of steps) {
      if (step.type === "model_output" && Array.isArray(step.content)) {
        for (const c of step.content) {
          if (c.type === "text" && typeof c.text === "string") {
            fullOutput += c.text;
          }
        }
      }
    }
  }
  if (!fullOutput && fallbackText) {
    fullOutput = fallbackText;
  }
  return fullOutput;
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Start an interaction with Antigravity Agent
app.post("/api/interactions", async (req, res) => {
  try {
    const {
      input,
      tools,
      environment,
      previous_interaction_id,
      background = true,
    } = req.body;

    if (!input || typeof input !== "string" || !input.trim()) {
      res.status(400).json({ error: "Input prompt is required." });
      return;
    }

    const ai = getGenAI();

    // Default tools match the python script provided by the user
    const agentTools = Array.isArray(tools) && tools.length > 0
      ? tools
      : [
          { type: "code_execution" },
          { type: "google_search" },
          { type: "url_context" },
        ];

    // Default environment matches the python script provided by the user
    const agentEnvironment = environment || {
      type: "remote",
      network: {
        allowlist: [
          {
            domain: "generativelanguage.googleapis.com",
            transform: [
              {
                key: "x-goog-api-key",
                value: "GEMINI_API_KEY",
              },
            ],
          },
        ],
      },
    };

    const requestParams: any = {
      agent: "antigravity-preview-05-2026",
      input: input.trim(),
      background: Boolean(background),
      tools: agentTools,
      environment: agentEnvironment,
    };

    if (previous_interaction_id && typeof previous_interaction_id === "string") {
      requestParams.previous_interaction_id = previous_interaction_id;
    }

    const interaction = await ai.interactions.create(requestParams, { timeout: 300000 });

    const runRecord: StoredRun = {
      id: interaction.id,
      prompt: input.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: interaction.status || "in_progress",
      environmentId: interaction.environment_id,
      previousInteractionId: previous_interaction_id,
      summary: input.trim().slice(0, 80),
    };

    interactionStore.set(interaction.id, runRecord);

    const fullOutput = extractFullOutput(interaction.steps || [], interaction.output_text);

    res.json({
      id: interaction.id,
      status: interaction.status,
      environment_id: interaction.environment_id,
      steps: interaction.steps || [],
      output_text: interaction.output_text || null,
      fullOutput,
      usage: interaction.usage || null,
      error: (interaction as any).error || (interaction as any).errors || null,
    });
  } catch (err: any) {
    console.error("Error creating interaction:", err);
    res.status(500).json({
      error: err.message || "Failed to start Antigravity Agent interaction",
      details: err.stack || String(err),
    });
  }
});

// Get interaction details / status by ID (used for polling)
app.get("/api/interactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Interaction ID is required." });
      return;
    }

    const ai = getGenAI();
    const interaction = await ai.interactions.get(id);

    const fullOutput = extractFullOutput(interaction.steps || [], interaction.output_text);

    // Update stored record
    const existing = interactionStore.get(id);
    if (existing) {
      existing.status = interaction.status;
      existing.updatedAt = new Date().toISOString();
      if (interaction.environment_id) {
        existing.environmentId = interaction.environment_id;
      }
      interactionStore.set(id, existing);
    } else {
      interactionStore.set(id, {
        id: interaction.id,
        prompt: "Retrieved interaction",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: interaction.status,
        environmentId: interaction.environment_id,
      });
    }

    res.json({
      id: interaction.id,
      status: interaction.status,
      environment_id: interaction.environment_id,
      steps: interaction.steps || [],
      output_text: interaction.output_text || null,
      fullOutput,
      usage: interaction.usage || null,
      error: (interaction as any).error || (interaction as any).errors || null,
    });
  } catch (err: any) {
    console.error(`Error retrieving interaction ${req.params.id}:`, err);
    res.status(500).json({
      error: err.message || `Failed to retrieve interaction ${req.params.id}`,
      details: err.stack || String(err),
    });
  }
});

// List tracked interaction runs
app.get("/api/history", (_req, res) => {
  const historyList = Array.from(interactionStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(historyList);
});

// Delete history item
app.delete("/api/history/:id", (req, res) => {
  const { id } = req.params;
  interactionStore.delete(id);
  res.json({ success: true });
});

// Download environment sandbox snapshot as tarball
app.get("/api/environment/:envId/download", async (req, res) => {
  try {
    const { envId } = req.params;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      return;
    }

    const downloadUrl = `https://generativelanguage.googleapis.com/v1beta/files/environment-${envId}:download?alt=media`;
    const response = await fetch(downloadUrl, {
      headers: {
        "x-goog-api-key": apiKey,
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Failed to download sandbox snapshot: ${response.statusText}`,
      });
      return;
    }

    res.setHeader("Content-Disposition", `attachment; filename="sandbox-env-${envId}.tar"`);
    res.setHeader("Content-Type", "application/x-tar");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err: any) {
    console.error("Error downloading environment snapshot:", err);
    res.status(500).json({
      error: err.message || "Failed to download environment snapshot",
    });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Antigravity Agent server listening on port ${PORT}`);
  });
}

startServer();

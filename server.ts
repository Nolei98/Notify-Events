import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data", "roster.json");
const BUILDS_FILE = path.join(__dirname, "data", "builds.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}

// Initial data if file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    roster: [
      { id: '1', name: 'Nolei', className: 'Lord Knight', confirmed: true },
      { id: '2', name: 'Creative', className: 'High Priest', confirmed: null },
      { id: '3', name: 'Player1', className: 'Sniper', confirmed: false },
    ],
    woeSchedule: { days: ['Terça', 'Quinta', 'Sábado'], time: '20:00' }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

if (!fs.existsSync(BUILDS_FILE)) {
  const initialBuilds = {
    builds: []
  };
  fs.writeFileSync(BUILDS_FILE, JSON.stringify(initialBuilds, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/data", (req, res) => {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/data", (req, res) => {
    try {
      const newData = req.body;
      fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.get("/api/builds", (req, res) => {
    try {
      const data = fs.readFileSync(BUILDS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read builds" });
    }
  });

  app.post("/api/builds", (req, res) => {
    try {
      const newData = req.body;
      fs.writeFileSync(BUILDS_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save builds" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data", "roster.json");
const BUILDS_FILE = path.join(__dirname, "data", "builds.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");
const UTILITIES_FILE = path.join(__dirname, "data", "utilities.json");
const EVENTS_FILE = path.join(__dirname, "data", "events.json");
const CATEGORIES_FILE = path.join(__dirname, "data", "categories.json");

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
    woeSchedule: { days: ['Terça', 'Quinta', 'Sábado'], startTime: '20:00', endTime: '21:00' }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

if (!fs.existsSync(BUILDS_FILE)) {
  const initialBuilds = {
    builds: []
  };
  fs.writeFileSync(BUILDS_FILE, JSON.stringify(initialBuilds, null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    { id: '1', username: 'administrador', password: 'admin123', role: 'admin' },
    { id: '2', username: 'jogador', password: '1234', role: 'player' }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
}

if (!fs.existsSync(UTILITIES_FILE)) {
  const initialUtilities = [];
  fs.writeFileSync(UTILITIES_FILE, JSON.stringify(initialUtilities, null, 2));
}

if (!fs.existsSync(EVENTS_FILE)) {
  const initialEvents = [];
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(initialEvents, null, 2));
}

if (!fs.existsSync(CATEGORIES_FILE)) {
  const initialCategories = {
    utilityCategories: ['Geral', 'Guias', 'Dicas', 'Anúncios', 'Outros'],
    playerAllowedCategory: ''
  };
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(initialCategories, null, 2));
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

  app.get("/api/users", (req, res) => {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, "utf-8");
        res.json(JSON.parse(data));
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error reading users:", error);
      res.status(500).json({ error: "Failed to read users" });
    }
  });

  app.post("/api/users", (req, res) => {
    try {
      const newData = req.body;
      if (Array.isArray(newData)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(newData, null, 2));
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid data format" });
      }
    } catch (error) {
      console.error("Error saving users:", error);
      res.status(500).json({ error: "Failed to save users" });
    }
  });

  app.post("/api/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!fs.existsSync(USERS_FILE)) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
        res.json({ 
          success: true, 
          user: { id: user.id, username: user.username, role: user.role } 
        });
      } else {
        res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro no servidor" });
    }
  });

  app.get("/api/utilities", (req, res) => {
    try {
      const data = fs.readFileSync(UTILITIES_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read utilities" });
    }
  });

  app.post("/api/utilities", (req, res) => {
    try {
      const newData = req.body;
      fs.writeFileSync(UTILITIES_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save utilities" });
    }
  });

  app.get("/api/events", (req, res) => {
    try {
      const data = fs.readFileSync(EVENTS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read events" });
    }
  });

  app.post("/api/events", (req, res) => {
    try {
      const newData = req.body;
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save events" });
    }
  });

  app.get("/api/categories", (req, res) => {
    try {
      const data = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read categories" });
    }
  });

  app.post("/api/categories", (req, res) => {
    try {
      const newData = req.body;
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save categories" });
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

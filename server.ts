import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const FILES = {
  roster: path.join(DATA_DIR, "roster.json"),
  builds: path.join(DATA_DIR, "builds.json"),
  utilities: path.join(DATA_DIR, "utilities.json"),
  events: path.join(DATA_DIR, "events.json"),
  users: path.join(DATA_DIR, "users.json"),
  categories: path.join(DATA_DIR, "categories.json"),
  settings: path.join(DATA_DIR, "settings.json") // We'll keep this but the user wants to remove the UI for it
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize files if they don't exist
const INITIAL_DATA = {
  roster: { roster: [], woeSchedule: { days: ['Terça', 'Quinta', 'Sábado'], startTime: '20:00', endTime: '21:00' } },
  builds: { builds: [] },
  utilities: { posts: [], categories: ['Geral', 'Guias', 'MvP', 'PvP', 'Builds'], playerAllowedCategory: '' },
  events: { customEvents: [] },
  users: { 
    users: [
      { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
      { id: '2', username: 'player', password: '1234', role: 'player' }
    ] 
  },
  categories: { categories: ['Geral', 'Guias', 'MvP', 'PvP', 'Builds'] },
  settings: {
    siteTitle: 'Leprechaun Village',
    clanIconUrl: 'https://images.habbo.com/web_images/habbo-web-articles/spromo_emeralds_rebrand2023.png',
    mainPageIconUrl: 'https://i.pinimg.com/originals/3f/05/d8/3f05d83924eef0ed0561fa2352a7b9d4.gif',
    backgroundUrl: 'https://picsum.photos/seed/ragnarok/1920/1080?blur=2',
    primaryColor: '#10b981',
    accentColor: '#fbbf24',
    fontColor: '#ffffff',
    effectsEnabled: true
  }
};

Object.entries(FILES).forEach(([key, filePath]) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(INITIAL_DATA[key as keyof typeof INITIAL_DATA], null, 2));
  }
});

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/",
    transports: ["polling", "websocket"]
  });
  const PORT = 3000;

  app.use(express.json());

  // Helper to read/write data
  const readData = (key: keyof typeof FILES) => {
    try {
      const content = fs.readFileSync(FILES[key], "utf-8");
      if (!content || content.trim() === "") {
        throw new Error("Empty file");
      }
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      const defaultData = INITIAL_DATA[key];
      writeData(key, defaultData);
      return defaultData;
    }
  };

  const writeData = (key: keyof typeof FILES, data: any) => {
    try {
      fs.writeFileSync(FILES[key], JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing ${key}:`, e);
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/all-data", (req, res) => {
    console.log("Fetching all data");
    const allData = Object.keys(FILES).reduce((acc, key) => {
      acc[key] = readData(key as keyof typeof FILES);
      return acc;
    }, {} as any);
    res.json(allData);
  });

  // Socket.io for real-time updates
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    socket.on("update-data", ({ key, data }: { key: keyof typeof FILES, data: any }) => {
      console.log(`Data update for ${key} from ${socket.id}`);
      writeData(key, data);
      // Broadcast to all other clients
      socket.broadcast.emit("data-updated", { key, data });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

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
  users: { users: [] },
  categories: { categories: ['Geral', 'Guias', 'MvP', 'PvP', 'Builds'] },
  settings: {
    siteTitle: 'Leprechaun Village',
    clanIconUrl: 'https://images.habbo.com/web_images/habbo-web-articles/spromo_emeralds_rebrand2023.png',
    mainPageIconUrl: 'https://i.pinimg.com/originals/3f/05/d8/3f05d83924eef0ed0561fa2352a7b9d4.gif',
    backgroundImageUrl: 'https://picsum.photos/seed/ragnarok/1920/1080?blur=2',
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
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // Helper to read/write data
  const readData = (key: keyof typeof FILES) => {
    try {
      return JSON.parse(fs.readFileSync(FILES[key], "utf-8"));
    } catch (e) {
      return INITIAL_DATA[key];
    }
  };

  const writeData = (key: keyof typeof FILES, data: any) => {
    fs.writeFileSync(FILES[key], JSON.stringify(data, null, 2));
  };

  // API Routes
  app.get("/api/all-data", (req, res) => {
    const allData = Object.keys(FILES).reduce((acc, key) => {
      acc[key] = readData(key as keyof typeof FILES);
      return acc;
    }, {} as any);
    res.json(allData);
  });

  // Socket.io for real-time updates
  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("update-data", ({ key, data }: { key: keyof typeof FILES, data: any }) => {
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

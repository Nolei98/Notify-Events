import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google Sheets Configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

async function getDoc() {
  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Google Sheets credentials are not configured. Please set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in your environment variables.');
  }

  const serviceAccountAuth = new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

async function getSheet(doc: any, title: string, initialData?: any) {
  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    const headers = initialData ? Object.keys(initialData) : ['id'];
    sheet = await doc.addSheet({ title, headerValues: headers });
  }
  return sheet;
}

function parseRow(row: any, headers: string[]) {
  const data: any = {};
  headers.forEach(header => {
    const val = row.get(header);
    try {
      data[header] = JSON.parse(val);
    } catch {
      data[header] = val;
    }
  });
  return data;
}

function stringifyData(data: any) {
  const row: any = {};
  Object.keys(data).forEach(key => {
    row[key] = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
  });
  return row;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes for Google Sheets
  app.get("/api/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const doc = await getDoc();
      const sheet = doc.sheetsByTitle[collection];
      if (!sheet) return res.json([]);
      
      const rows = await sheet.getRows();
      const data = rows.map(row => parseRow(row, sheet.headerValues));
      res.json(data);
    } catch (error: any) {
      console.error(`Error reading ${req.params.collection}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const data = req.body;
      const doc = await getDoc();
      const sheet = await getSheet(doc, collection, data);
      
      const rows = await sheet.getRows();
      const idKey = collection === 'users' ? 'uid' : 'id';
      const existingRow = rows.find(row => row.get(idKey) === data[idKey]);

      const rowData = stringifyData(data);

      if (existingRow) {
        // Update existing row
        Object.assign(existingRow, rowData);
        await existingRow.save();
      } else {
        // Add new row
        // Ensure all headers exist
        const currentHeaders = sheet.headerValues;
        const newKeys = Object.keys(rowData).filter(k => !currentHeaders.includes(k));
        if (newKeys.length > 0) {
          await sheet.setHeaderRow([...currentHeaders, ...newKeys]);
        }
        await sheet.addRow(rowData);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error saving ${req.params.collection}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "ID is required" });

      const doc = await getDoc();
      const sheet = doc.sheetsByTitle[collection];
      if (!sheet) return res.json({ success: true });

      const rows = await sheet.getRows();
      const idKey = collection === 'users' ? 'uid' : 'id';
      const existingRow = rows.find(row => row.get(idKey) === id);

      if (existingRow) {
        await existingRow.delete();
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting from ${req.params.collection}:`, error.message);
      res.status(500).json({ error: error.message });
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

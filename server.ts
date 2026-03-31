import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Inactivity Check Simulation (Every 8 hours)
  // In a real app, this would query Firestore and send real emails.
  // For this demo, we'll simulate it by logging to the console.
  setInterval(() => {
    console.log("[Inactivity Check] Checking for users inactive for > 8 hours...");
    // Logic: 
    // 1. Query Firestore for users where lastActive < (now - 8 hours)
    // 2. For each user, send an email (log it)
    console.log("[Email Simulation] Sending inactivity reminder to vignayreddymuduganti@gmail.com...");
  }, 8 * 60 * 60 * 1000); // 8 hours

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

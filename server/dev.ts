import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { pool } from "./db";
import usersRoutes from "./routes/users";
import productsRoutes from "./routes/products";
import pricingPlansRoutes from "./routes/pricing-plans";
import remunerationTablesRoutes from "./routes/remuneration-tables";
import supportMaterialsRoutes from "./routes/support-materials";
import clientsRoutes from "./routes/clients";
import transactionsRoutes from "./routes/transactions";
import prospectsRoutes from "./routes/prospects";
import notificationsRoutes from "./routes/notifications";
import uploadsRoutes from "./routes/uploads";
import nfeUploadsRoutes from "./routes/nfe-uploads";
import stripeRoutes from "./routes/stripe";
import initRoutes from "./routes/init";

dotenv.config();

async function createDevServer() {
  const app = express();

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : [/localhost/, /127\.0\.0\.1/, /172\.\d+\.\d+\.\d+/, /\.replit\.dev$/];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const devOriginRegex =
          /localhost|127\.0\.0\.1|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|\.replit\.dev$/;
        if (devOriginRegex.test(origin)) {
          callback(null, true);
          return;
        }
        if (/\.replit\.dev$/.test(origin)) {
          callback(null, true);
          return;
        }
        const isAllowed = allowedOrigins.some((allowed) => {
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return origin === allowed;
        });
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.set("trust proxy", 1);

  const replitAuthEnabled = !!process.env.REPL_ID && !!process.env.SESSION_SECRET;

  if (replitAuthEnabled) {
    await setupAuth(app);
    console.log("🔑 Replit Auth enabled");

    app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    });
  } else {
    console.warn("⚠️  Auth disabled - missing REPL_ID or SESSION_SECRET");
    app.get("/api/auth/user", (req, res) => {
      res.status(503).json({
        error: "Authentication service unavailable",
        message: "Replit Auth is not configured.",
      });
    });
    app.get("/api/login", (req, res) => {
      res.status(503).json({
        error: "Authentication service unavailable",
        message: "Replit Auth is not configured.",
      });
    });
  }

  app.get("/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "healthy", database: "connected" });
    } catch (error) {
      res.status(500).json({ status: "unhealthy", database: "disconnected" });
    }
  });

  app.get("/status", (req, res) => {
    res.json({
      success: true,
      status: "operational",
      version: "1.0.0",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/users", usersRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/pricing-plans", pricingPlansRoutes);
  app.use("/api/remuneration-tables", remunerationTablesRoutes);
  app.use("/api/support-materials", supportMaterialsRoutes);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/transactions", transactionsRoutes);
  app.use("/api/prospects", prospectsRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/uploads", uploadsRoutes);
  app.use("/api/nfe_uploads", nfeUploadsRoutes);
  app.use("/api/stripe", stripeRoutes);
  app.use("/api/init", initRoutes);

  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error("❌ [Server Error]", err.message);
      res.status(err.status || 500).json({
        success: false,
        error: err.message || "Erro interno do servidor",
      });
    }
  );

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  const PORT = parseInt(process.env.PORT || "5000");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Dev server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🔐 Environment: development (unified server)`);
  });
}

createDevServer().catch(console.error);

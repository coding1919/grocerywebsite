import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import path from "path";

// Create separate apps for API and client
const apiApp = express();
const clientApp = express();
const app = express();
const server = createServer(app);

// Parse JSON and URL-encoded bodies for API app
apiApp.use(express.json());
apiApp.use(express.urlencoded({ extended: false }));

// API request logging middleware
apiApp.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    log(logLine);
  });

  next();
});

// Error handling middleware for API routes
apiApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

(async () => {
  // Register API routes on the API app
  await registerRoutes(apiApp);

  // Mount API app first
  app.use('/api', apiApp);

  // Setup client app serving
  if (app.get("env") === "development") {
    // Setup Vite on the client app
    await setupVite(clientApp, server);
    
    // Mount client app for all non-API routes
    app.use((req, res, next) => {
      clientApp(req, res, next);
    });
  } else {
    // Serve static files for all non-API routes
    app.use((req, res, next) => {
      express.static(path.resolve(import.meta.dirname, "public"))(req, res, next);
    });

    // Serve index.html for all non-API routes
    app.use((req, res) => {
      res.sendFile(path.resolve(import.meta.dirname, "public", "index.html"));
    });
  }

  // Error handling for client routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).send("Internal Server Error");
  });

  const port = 5000;
  server.listen({
    port,
    host: "127.0.0.1",
  }, () => {
    log(`serving on port ${port}`);
  });
})();

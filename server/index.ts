import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import MongoStore from "connect-mongo";
import { setupRoutes } from "./api/router";
import { setupVite, serveStatic, log } from "./vite";
import { connectToMongoDB, getUsersCollection, getMongoClient } from "./mongodb";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use((req, res, next) => {
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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function seedAdminUser() {
  try {
    const usersCol = await getUsersCollection();
    const count = await usersCol.countDocuments();
    if (count === 0) {
      log("No users found in database — seeding admin user");
      await usersCol.insertOne({
        username: "nugent",
        name: "Jason Nugent",
        email: "nugent@southerncast.com",
        password: "bamboohr_placeholder",
        role: "Admin",
        permissions: ["Dashboard", "Job Information", "Design Information", "Assembly Information", "Cleaning Room Info", "Checklist Design", "Workflow Status", "User Management", "Materials", "Time & Attendance", "Employee Scheduling"],
        department: "Management",
        jobTitle: "Administrator",
      });
      log("Admin user seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

(async () => {
  try {
    await connectToMongoDB();
    log("MongoDB connected successfully");
  } catch (error) {
    log("MongoDB connection failed - some features may not work");
    console.error("MongoDB connection error:", error);
  }

  const mongoClient = getMongoClient();
  if (mongoClient) {
    app.use(
      session({
        store: MongoStore.create({
          client: mongoClient,
          dbName: "JobBoss",
          collectionName: "sessions",
        }),
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        name: "foundry.sid",
        proxy: true,
        cookie: {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "none",
        },
      })
    );
  }

  await seedAdminUser();
  
  setupRoutes(app);
  
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

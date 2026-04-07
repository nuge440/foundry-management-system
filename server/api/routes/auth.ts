import { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getUsersCollection } from "../../mongodb";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userName: string;
    userRole: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authUserName?: string;
      authUserRole?: string;
    }
  }
}

const pendingSetupTokens = new Map<string, string>();

setInterval(() => {
  pendingSetupTokens.clear();
}, 15 * 60 * 1000);

const TOKEN_SECRET = process.env.SESSION_SECRET;
if (!TOKEN_SECRET) {
  throw new Error("SESSION_SECRET environment variable must be set");
}

function generateAuthToken(userId: string, userName: string, userRole: string): string {
  const payload = JSON.stringify({
    userId,
    userName,
    userRole,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

function verifyAuthToken(token: string): { userId: string; userName: string; userRole: string } | null {
  const dotIdx = token.indexOf(".");
  if (dotIdx === -1) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, userName: payload.userName, userRole: payload.userRole };
  } catch {
    return null;
  }
}

export function tokenAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    req.authUserId = req.session.userId;
    req.authUserName = req.session.userName;
    req.authUserRole = req.session.userRole;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const data = verifyAuthToken(token);
    if (data) {
      req.authUserId = data.userId;
      req.authUserName = data.userName;
      req.authUserRole = data.userRole;
      return next();
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.authUserId) {
    return next();
  }
  return res.status(401).json({ error: "Authentication required" });
}

export function setupAuthRoutes(app: Express): void {
  app.get("/api/auth/me", async (req, res) => {
    if (!req.authUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const usersCol = await getUsersCollection();
      const user = await usersCol.findOne({ _id: new (await import("mongodb")).ObjectId(req.authUserId) });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      res.json({
        id: user._id!.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        department: user.department,
        jobTitle: user.jobTitle,
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email: rawEmail, password } = req.body;
      if (!rawEmail || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const email = rawEmail.trim().toLowerCase();

      const usersCol = await getUsersCollection();
      const user = await usersCol.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isBcryptHash = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");

      if (!isBcryptHash) {
        const token = crypto.randomBytes(32).toString("hex");
        pendingSetupTokens.set(user.email, token);
        return res.json({
          requiresSetup: true,
          userId: user._id!.toString(),
          email: user.email,
          setupToken: token,
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const userId = user._id!.toString();
      req.session.userId = userId;
      req.session.userName = user.name;
      req.session.userRole = user.role;

      const authToken = generateAuthToken(userId, user.name, user.role);

      res.json({
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        department: user.department,
        jobTitle: user.jobTitle,
        authToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/set-password", async (req, res) => {
    try {
      const { email, newPassword, setupToken } = req.body;
      if (!email || !newPassword || !setupToken) {
        return res.status(400).json({ error: "Email, new password, and setup token are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const expected = pendingSetupTokens.get(email);
      if (!expected || expected !== setupToken) {
        return res.status(403).json({ error: "Invalid or expired setup token. Please log in again." });
      }
      pendingSetupTokens.delete(email);

      const usersCol = await getUsersCollection();
      const user = await usersCol.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isAlreadyHashed = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
      if (isAlreadyHashed) {
        return res.status(400).json({ error: "Password already set. Contact an admin to reset." });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await usersCol.updateOne({ _id: user._id }, { $set: { password: hashed } });

      const userId = user._id!.toString();
      req.session.userId = userId;
      req.session.userName = user.name;
      req.session.userRole = user.role;

      const authToken = generateAuthToken(userId, user.name, user.role);

      res.json({
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        department: user.department,
        jobTitle: user.jobTitle,
        authToken,
      });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ error: "Failed to set password" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("foundry.sid");
      res.json({ message: "Logged out" });
    });
  });
}

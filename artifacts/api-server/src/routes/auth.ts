import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { AppError } from "../lib/api-helpers";
import { requireAuth } from "../middlewares/authenticate";
import {
  register,
  login,
  refreshTokens,
  logout,
  logoutAll,
  requestPasswordReset,
  resetPassword,
  createEmailVerificationToken,
  verifyEmail,
} from "../services/authService";
import { logAuthEvent } from "../services/auditService";
import type { PublicUser } from "@workspace/db/schema";

const router: IRouter = Router();

// ─── DTO helpers ──────────────────────────────────────────────────────────────

function toUserDto(user: typeof usersTable.$inferSelect): PublicUser {
  const { passwordHash: _ph, ...rest } = user;
  return rest;
}

// ─── Input validation ─────────────────────────────────────────────────────────

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  nameAr?: string;
  role?: "buyer" | "merchant";
  storeId?: string;
  deviceId?: string;
  platform?: string;
}

interface LoginBody {
  email: string;
  password: string;
  deviceId?: string;
  platform?: string;
}

function validateRegisterBody(
  raw: unknown,
): { ok: true; data: RegisterBody } | { ok: false; errors: string[] } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }
  const b = raw as Record<string, unknown>;
  const errors: string[] = [];

  const email = typeof b.email === "string" ? b.email.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required");
  }
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (password.length > 128) {
    errors.push("Password must be at most 128 characters");
  }
  if (name.length < 2) {
    errors.push("Name must be at least 2 characters");
  }
  if (name.length > 80) {
    errors.push("Name must be at most 80 characters");
  }

  const role = b.role;
  if (role !== undefined && role !== "buyer" && role !== "merchant") {
    errors.push('Role must be "buyer" or "merchant"');
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      email,
      password,
      name,
      nameAr: (typeof b.nameAr === "string" ? b.nameAr.trim() : "") || name,
      role: (role as "buyer" | "merchant" | undefined) ?? "buyer",
      storeId: typeof b.storeId === "string" ? b.storeId : undefined,
      deviceId: typeof b.deviceId === "string" ? b.deviceId : undefined,
      platform: typeof b.platform === "string" ? b.platform : undefined,
    },
  };
}

function validateLoginBody(
  raw: unknown,
): { ok: true; data: LoginBody } | { ok: false; errors: string[] } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object"] };
  }
  const b = raw as Record<string, unknown>;
  const errors: string[] = [];

  const email = typeof b.email === "string" ? b.email.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      email,
      password,
      deviceId: typeof b.deviceId === "string" ? b.deviceId : undefined,
      platform: typeof b.platform === "string" ? b.platform : undefined,
    },
  };
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

router.post("/auth/register", async (req, res) => {
  const v = validateRegisterBody(req.body);
  if (!v.ok) {
    res.status(400).json({ error: "Validation failed", details: v.errors });
    return;
  }

  const { user, tokens } = await register(v.data, req.ip, req.headers["user-agent"]);

  await logAuthEvent({
    userId: user.id,
    event: "register",
    success: true,
    req,
  });

  res.status(201).json({ user: toUserDto(user), ...tokens });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  const v = validateLoginBody(req.body);
  if (!v.ok) {
    res.status(400).json({ error: "Validation failed", details: v.errors });
    return;
  }

  let userId: string | undefined;

  try {
    const { user, tokens } = await login(
      v.data,
      req.ip,
      req.headers["user-agent"],
    );
    userId = user.id;

    await logAuthEvent({ userId: user.id, event: "login", success: true, req });

    res.json({ user: toUserDto(user), ...tokens });
  } catch (err) {
    await logAuthEvent({
      userId,
      event: "login",
      success: false,
      metadata: {
        email: v.data.email,
        reason: err instanceof AppError ? err.code : "unknown",
      },
      req,
    });
    throw err;
  }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

router.post("/auth/refresh", async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const refreshToken = typeof raw.refreshToken === "string" ? raw.refreshToken : null;

  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  const tokens = await refreshTokens(refreshToken);

  await logAuthEvent({
    event: "token_refresh",
    success: true,
    req,
  });

  res.json(tokens);
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

router.post("/auth/logout", requireAuth, async (req, res) => {
  await logout(req.user!.sessionId);

  await logAuthEvent({
    userId: req.user!.sub,
    event: "logout",
    success: true,
    req,
  });

  res.status(204).send();
});

// ─── POST /auth/logout-all ────────────────────────────────────────────────────

router.post("/auth/logout-all", requireAuth, async (req, res) => {
  await logoutAll(req.user!.sub);

  await logAuthEvent({
    userId: req.user!.sub,
    event: "logout",
    success: true,
    metadata: { allDevices: true },
    req,
  });

  res.status(204).send();
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.sub));

  if (!user) {
    res.status(401).json({ error: "User not found", code: "UNAUTHORIZED" });
    return;
  }

  res.json({ user: toUserDto(user) });
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

router.post("/auth/forgot-password", async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim() : "";

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const resetToken = await requestPasswordReset(email);

  await logAuthEvent({
    event: "password_reset_requested",
    success: true,
    metadata: {
      // Log token presence, never the value
      tokenIssued: resetToken !== null,
    },
    req,
  });

  // Always return 200 — do not reveal whether the email exists
  res.json({
    message:
      "If an account with that email exists, a reset link has been sent.",
    ...(process.env.NODE_ENV !== "production" && resetToken
      ? { _devToken: resetToken }
      : {}),
  });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────

router.post("/auth/reset-password", async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const token = typeof raw.token === "string" ? raw.token : "";
  const newPassword = typeof raw.newPassword === "string" ? raw.newPassword : "";

  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  if (newPassword.length > 128) {
    res.status(400).json({ error: "Password must be at most 128 characters" });
    return;
  }

  await resetPassword(token, newPassword);

  await logAuthEvent({
    event: "password_reset_completed",
    success: true,
    req,
  });

  res.json({ message: "Password has been reset successfully." });
});

// ─── POST /auth/send-verification ─────────────────────────────────────────────

router.post("/auth/send-verification", requireAuth, async (req, res) => {
  const [user] = await db
    .select({ isEmailVerified: usersTable.isEmailVerified })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.sub));

  if (user?.isEmailVerified) {
    res.status(400).json({ error: "Email is already verified" });
    return;
  }

  const verifyToken = await createEmailVerificationToken(req.user!.sub);

  await logAuthEvent({
    userId: req.user!.sub,
    event: "email_verification_sent",
    success: true,
    req,
  });

  res.json({
    message: "Verification email sent.",
    ...(process.env.NODE_ENV !== "production"
      ? { _devToken: verifyToken }
      : {}),
  });
});

// ─── POST /auth/verify-email ──────────────────────────────────────────────────

router.post("/auth/verify-email", async (req, res) => {
  const raw = req.body as Record<string, unknown>;
  const token = typeof raw.token === "string" ? raw.token : "";

  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  await verifyEmail(token);

  await logAuthEvent({
    event: "email_verified",
    success: true,
    req,
  });

  res.json({ message: "Email verified successfully." });
});

export default router;

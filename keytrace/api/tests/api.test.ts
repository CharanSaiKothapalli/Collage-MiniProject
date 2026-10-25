import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { TypingProfile } from "../src/models/TypingProfile.js";
import { hashPassword } from "../src/utils/security.js";
import { USER_ROLE, PROFILE_STATUS } from "@keytrace/shared";

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: "keytrace-test", ip: "127.0.0.1" },
  });
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("KEYTRACE API Integration Test Suite", () => {
  let userCookies: string[] = [];
  let csrfToken: string;
  let adminCookies: string[] = [];
  let adminCsrfToken: string;
  let activeSessionId: string;

  describe("Health & Diagnostics Endpoints", () => {
    it("GET /health/live returns 200 alive", async () => {
      const res = await request(app).get("/health/live");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("alive");
    });

    it("GET /health/ready returns database connection status", async () => {
      const res = await request(app).get("/health/ready");
      expect(res.status).toBe(200);
      expect(res.body.components.mongodb).toBe("connected");
    });
  });

  describe("Authentication Module", () => {
    it("POST /api/v1/auth/register creates user account and sets session cookie", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          username: "alice_crypto",
          email: "alice@keytrace.test",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.username).toBe("alice_crypto");
      expect(res.body.csrfToken).toBeDefined();

      userCookies = res.headers["set-cookie"] || [];
      expect(userCookies.length).toBeGreaterThanOrEqual(1);
      csrfToken = res.body.csrfToken;
    });

    it("POST /api/v1/auth/register rejects duplicate registration", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          username: "alice_crypto",
          email: "another@keytrace.test",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("USER_ALREADY_EXISTS");
    });

    it("POST /api/v1/auth/login succeeds with valid credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          emailOrUsername: "alice_crypto",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.username).toBe("alice_crypto");
      userCookies = res.headers["set-cookie"] || [];
      csrfToken = res.body.csrfToken;
    });

    it("POST /api/v1/auth/login fails on incorrect password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          emailOrUsername: "alice_crypto",
          password: "WrongPassword999!",
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("GET /api/v1/auth/me returns current authenticated user details", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", userCookies);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.username).toBe("alice_crypto");
      expect(res.body.user.hasConsent).toBe(false);
    });

    it("Rejects unauthenticated access to protected routes", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("Informed Consent & Privacy Module", () => {
    it("Enrolment is rejected prior to explicit consent", async () => {
      const res = await request(app)
        .post("/api/v1/enrollment/sessions")
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          schemaVersion: 1,
          sessionId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          elapsedMs: 2500,
          observations: Array(10).fill({ holdMs: 110, flightMs: 150 }),
          inputMethod: "keyboard",
          consentVersion: "1.0",
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CONSENT_REQUIRED");
    });

    it("POST /api/v1/consent/accept records behavioural consent", async () => {
      const res = await request(app)
        .post("/api/v1/consent/accept")
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          consentVersion: "1.0",
          acceptedTerms: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.hasConsent).toBe(true);

      const meRes = await request(app).get("/api/v1/auth/me").set("Cookie", userCookies);
      expect(meRes.body.user.hasConsent).toBe(true);
    });
  });

  describe("Enrolment Module", () => {
    it("POST /api/v1/enrollment/sessions accepts valid keystroke timing sample", async () => {
      const res = await request(app)
        .post("/api/v1/enrollment/sessions")
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          schemaVersion: 1,
          sessionId: "11111111-2222-3333-4444-555555555555",
          elapsedMs: 3000,
          observations: [
            { holdMs: 105, flightMs: 140 },
            { holdMs: 115, flightMs: 160 },
            { holdMs: 110, flightMs: 150 },
            { holdMs: 120, flightMs: 145 },
            { holdMs: 108, flightMs: 155 },
            { holdMs: 112, flightMs: 152 },
            { holdMs: 118, flightMs: 148 },
            { holdMs: 114, flightMs: 158 },
          ],
          inputMethod: "keyboard",
          consentVersion: "1.0",
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.features.mean_hold).toBeGreaterThan(100);
    });

    it("GET /api/v1/enrollment/status reflects recorded sample count", async () => {
      const res = await request(app)
        .get("/api/v1/enrollment/status")
        .set("Cookie", userCookies);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.required).toBe(10);
    });

    it("GET /api/v1/enrollment/samples lists user samples", async () => {
      const res = await request(app)
        .get("/api/v1/enrollment/samples")
        .set("Cookie", userCookies);

      expect(res.status).toBe(200);
      expect(res.body.samples.length).toBe(1);
    });
  });

  describe("Verification Module", () => {
    it("POST /api/v1/verification/sessions starts continuous verification session", async () => {
      const res = await request(app)
        .post("/api/v1/verification/sessions")
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", csrfToken)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.sessionId).toBeDefined();
      activeSessionId = res.body.sessionId;
    });

    it("POST /api/v1/verification/sessions/:sessionId/evaluate evaluates window", async () => {
      const res = await request(app)
        .post(`/api/v1/verification/sessions/${activeSessionId}/evaluate`)
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          payload: {
            schemaVersion: 1,
            sessionId: "22222222-3333-4444-5555-666666666666",
            elapsedMs: 2800,
            observations: [
              { holdMs: 108, flightMs: 145 },
              { holdMs: 112, flightMs: 155 },
              { holdMs: 110, flightMs: 150 },
              { holdMs: 115, flightMs: 148 },
              { holdMs: 106, flightMs: 152 },
              { holdMs: 118, flightMs: 158 },
              { holdMs: 114, flightMs: 146 },
              { holdMs: 111, flightMs: 154 },
            ],
            inputMethod: "keyboard",
            consentVersion: "1.0",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.decision).toBeDefined();
    });

    it("POST /api/v1/verification/sessions/:sessionId/end terminates session", async () => {
      const res = await request(app)
        .post(`/api/v1/verification/sessions/${activeSessionId}/end`)
        .set("Cookie", userCookies)
        .set("X-CSRF-Token", csrfToken)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.session.status).toBe("completed");
    });
  });

  describe("Analytics & Data Export", () => {
    it("GET /api/v1/analytics/overview returns aggregate stats", async () => {
      const res = await request(app)
        .get("/api/v1/analytics/overview")
        .set("Cookie", userCookies);

      expect(res.status).toBe(200);
      expect(res.body.stats.totalEvents).toBeGreaterThanOrEqual(1);
    });

    it("GET /api/v1/data/export downloads user personal data", async () => {
      const res = await request(app)
        .get("/api/v1/data/export")
        .set("Cookie", userCookies);

      expect(res.status).toBe(200);
      expect(res.body.account.username).toBe("alice_crypto");
      expect(res.body.enrolledSamples.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Administrative Role-Based Access Control", () => {
    it("Non-admin user is rejected from admin overview (403)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/overview")
        .set("Cookie", userCookies);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("Admin user can access /api/v1/admin/overview", async () => {
      const adminPass = await hashPassword("AdminSecurePass123!");
      const admin = await User.create({
        username: "system_admin",
        email: "admin@keytrace.test",
        passwordHash: adminPass,
        role: USER_ROLE.ADMIN,
        accountStatus: "active",
        hasConsent: true,
      });

      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({
          emailOrUsername: "system_admin",
          password: "AdminSecurePass123!",
        });

      adminCookies = loginRes.headers["set-cookie"] || [];

      const res = await request(app)
        .get("/api/v1/admin/overview")
        .set("Cookie", adminCookies);

      expect(res.status).toBe(200);
      expect(res.body.stats.totalUsers).toBeGreaterThanOrEqual(2);
    });
  });
});

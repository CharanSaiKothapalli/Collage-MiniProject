import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { User } from "./models/User.js";
import { TypingProfile } from "./models/TypingProfile.js";
import { TypingSample } from "./models/TypingSample.js";
import { ConsentRecord } from "./models/ConsentRecord.js";
import { VerificationSession } from "./models/VerificationSession.js";
import { VerificationEvent } from "./models/VerificationEvent.js";
import { ModelRegistry } from "./models/ModelRegistry.js";
import { hashPassword } from "./utils/security.js";
import { logAuditEvent } from "./services/auditService.js";
import { USER_ROLE, PROFILE_STATUS, CONSENT_STATUS, VERIFICATION_DECISION } from "@keytrace/shared";

let memoryServer: MongoMemoryServer | null = null;
let mlChildProcess: ChildProcess | null = null;

async function ensureMLServiceRunning(): Promise<void> {
  const isLocalML =
    config.mlServiceUrl.includes("127.0.0.1") ||
    config.mlServiceUrl.includes("localhost");

  if (!isLocalML) {
    return;
  }

  // 1. Check if ML service is already responding
  try {
    const res = await fetch(`${config.mlServiceUrl.replace(/\/$/, "")}/health/live`, {
      signal: AbortSignal.timeout(1000),
    });
    if (res.ok) {
      logger.info("ML microservice is already running and healthy.");
      return;
    }
  } catch {
    // Service not running yet, proceed with spawn
  }

  // 2. Locate ml-service directory
  const candidateMlDirs = [
    path.resolve(process.cwd(), "ml-service"),
    path.resolve(process.cwd(), "../ml-service"),
    path.resolve(process.cwd(), "../../ml-service"),
  ];

  let mlDir: string | null = null;
  for (const dir of candidateMlDirs) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, "app/main.py"))) {
      mlDir = dir;
      break;
    }
  }

  if (!mlDir) {
    logger.warn("ML microservice directory not found; skipping automatic spawn.");
    return;
  }

  // 3. Find uvicorn executable
  const candidateUvicorns = [
    path.join(mlDir, "venv/bin/uvicorn"),
    path.join(mlDir, ".venv/bin/uvicorn"),
    "uvicorn",
  ];

  let uvicornCmd: string | null = null;
  for (const cmd of candidateUvicorns) {
    if (cmd.startsWith("/") || cmd.startsWith(".")) {
      if (fs.existsSync(cmd)) {
        uvicornCmd = cmd;
        break;
      }
    }
  }

  const cmd = uvicornCmd || "python3";
  const args = uvicornCmd
    ? ["app.main:app", "--host", "127.0.0.1", "--port", "8000", "--log-level", "info"]
    : ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--log-level", "info"];

  logger.info({ cmd, mlDir }, "Spawning embedded ML microservice on 127.0.0.1:8000 for single-instance deployment...");

  try {
    mlChildProcess = spawn(cmd, args, {
      cwd: mlDir,
      env: { ...process.env, PYTHONPATH: "." },
      stdio: ["ignore", "pipe", "pipe"],
    });

    mlChildProcess.stdout?.on("data", (data) => {
      logger.debug(`[ML-Service] ${data.toString().trim()}`);
    });

    mlChildProcess.stderr?.on("data", (data) => {
      logger.debug(`[ML-Service] ${data.toString().trim()}`);
    });

    mlChildProcess.on("exit", (code, signal) => {
      if (code !== 0 && code !== null) {
        logger.warn({ code, signal }, "Embedded ML microservice child process exited.");
      }
    });

    // Wait up to 10 seconds for service readiness
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const check = await fetch("http://127.0.0.1:8000/health/live", {
          signal: AbortSignal.timeout(1000),
        });
        if (check.ok) {
          logger.info("Embedded ML microservice successfully initialized and ready on http://127.0.0.1:8000");
          return;
        }
      } catch {}
    }
    logger.warn("Spawned ML service did not become healthy within 10s; continuing server startup.");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Could not spawn ML microservice child process; continuing in standalone mode.");
  }
}

async function connectDatabase(): Promise<string> {
  // First attempt connection to configured MongoDB URI (e.g. Atlas or local daemon)
  try {
    logger.info({ uri: config.mongoUri.replace(/:([^:@]+)@/, ":****@") }, "Connecting to MongoDB...");
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    logger.info("Successfully connected to primary MongoDB database.");
    return config.mongoUri;
  } catch (err: any) {
    if (config.isProduction && process.env.ALLOW_IN_MEMORY_DB !== "true") {
      logger.error({ err: err.message }, "MongoDB connection failed in production. Refusing fallback.");
      throw err;
    }

    // In development/test mode or if ALLOW_IN_MEMORY_DB is set, start an in-memory MongoDB instance
    logger.warn({ err: err.message }, "Primary MongoDB not reachable. Initializing embedded MongoMemoryServer...");
    try {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: "keytrace", ip: "127.0.0.1" },
      });
      const inMemoryUri = memoryServer.getUri();
      await mongoose.connect(inMemoryUri);
      logger.info({ inMemoryUri }, "Successfully connected to embedded MongoMemoryServer.");
      return inMemoryUri;
    } catch (memErr: any) {
      logger.error({ memErr: memErr.message }, "Failed to start MongoMemoryServer.");
      throw memErr;
    }
  }
}

async function bootstrapInitialAdmin(): Promise<void> {
  if (!config.adminBootstrap.enabled) return;

  const adminExists = await User.findOne({ role: USER_ROLE.ADMIN });
  if (adminExists) {
    return;
  }

  const { username, email, password } = config.adminBootstrap;
  const passwordHash = await hashPassword(password);

  const admin = await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: USER_ROLE.ADMIN,
    accountStatus: "active",
    hasConsent: true,
  });

  await ConsentRecord.create({
    userId: admin._id,
    consentVersion: "1.0",
    status: CONSENT_STATUS.ACCEPTED,
    timestamp: new Date(),
  });

  await TypingProfile.create({
    userId: admin._id,
    status: PROFILE_STATUS.READY_FOR_TESTING,
    enrollmentCount: 10,
  });

  await logAuditEvent({
    actorId: admin._id,
    actorUsername: admin.username,
    action: "ADMIN_BOOTSTRAP_INITIALIZED",
    resourceType: "User",
    resourceId: admin._id.toString(),
    metadata: { note: "Initial secure administrative bootstrap created" },
  });

  logger.info({ username: admin.username, email: admin.email }, "Bootstrap Administrator account created.");
}

async function bootstrapDemoAccounts(): Promise<void> {
  const aliceExists = await User.findOne({ username: "alice_genuine" });
  if (aliceExists) return;

  const passwordHash = await hashPassword("Password123!");

  // 1. Seed Alice Genuine
  const alice = await User.create({
    username: "alice_genuine",
    email: "alice@keytrace.local",
    passwordHash,
    role: USER_ROLE.USER,
    accountStatus: "active",
    hasConsent: true,
  });

  const aliceConsent = await ConsentRecord.create({
    userId: alice._id,
    consentVersion: "1.0",
    status: CONSENT_STATUS.ACCEPTED,
    timestamp: new Date(),
  });

  const aliceProfile = await TypingProfile.create({
    userId: alice._id,
    status: PROFILE_STATUS.READY_FOR_TESTING,
    enrollmentCount: 10,
  });

  for (let i = 0; i < 10; i++) {
    const variance = (i % 3) * 3;
    await TypingSample.create({
      userId: alice._id,
      profileId: aliceProfile._id,
      featureSchemaVersion: "1.0",
      qualityStatus: "valid",
      sessionId: crypto.randomUUID(),
      consentReference: aliceConsent._id,
      featureVector: {
        mean_hold: 105 + variance,
        std_hold: 14 + (variance % 2),
        median_hold: 104 + variance,
        mean_flight: 140 + variance * 2,
        std_flight: 22 + (variance % 3),
        median_flight: 138 + variance * 2,
        p90_flight: 175 + variance,
        chars_per_second: Number((4.8 + variance * 0.1).toFixed(2)),
        pause_ratio: 0.12,
        hold_flight_ratio: 0.75,
      },
      createdAt: new Date(Date.now() - (10 - i) * 3600000),
    });
  }

  const session = await VerificationSession.create({
    userId: alice._id,
    status: "completed",
    startTimestamp: new Date(Date.now() - 1800000),
    endTimestamp: new Date(),
    totalEvaluations: 4,
    matchCount: 3,
    reviewCount: 1,
    aggregateResult: VERIFICATION_DECISION.MATCH,
  });

  await VerificationEvent.create({
    userId: alice._id,
    sessionId: session._id,
    decision: VERIFICATION_DECISION.MATCH,
    score: 1.15,
    threshold: 2.8,
    reasonCodes: ["Typing cadence matches enrolled behavioural baseline."],
    timestamp: new Date(Date.now() - 1200000),
  });

  // 2. Seed Bob Impostor
  const bob = await User.create({
    username: "bob_impostor",
    email: "bob@keytrace.local",
    passwordHash,
    role: USER_ROLE.USER,
    accountStatus: "active",
    hasConsent: true,
  });

  await ConsentRecord.create({
    userId: bob._id,
    consentVersion: "1.0",
    status: CONSENT_STATUS.ACCEPTED,
    timestamp: new Date(),
  });

  const bobProfile = await TypingProfile.create({
    userId: bob._id,
    status: PROFILE_STATUS.READY_FOR_TESTING,
    enrollmentCount: 10,
  });

  for (let i = 0; i < 10; i++) {
    await TypingSample.create({
      userId: bob._id,
      profileId: bobProfile._id,
      featureSchemaVersion: "1.0",
      qualityStatus: "valid",
      sessionId: crypto.randomUUID(),
      featureVector: {
        mean_hold: 260 + i * 2,
        std_hold: 35,
        median_hold: 255 + i * 2,
        mean_flight: 420 + i * 5,
        std_flight: 65,
        median_flight: 410 + i * 5,
        p90_flight: 520,
        chars_per_second: 2.2,
        pause_ratio: 0.45,
        hold_flight_ratio: 0.62,
      },
    });
  }

  logger.info("Demo user accounts (alice_genuine, bob_impostor) initialized with baseline samples.");
}

async function initializeModelRegistry(): Promise<void> {
  const count = await ModelRegistry.countDocuments();
  if (count === 0) {
    await ModelRegistry.create({
      modelVersion: "v1.2.0-robust-distance",
      artifactReference: "models/v1.2.0-robust-distance.joblib",
      featureSchemaVersion: "1.0",
      deploymentStatus: "active",
      evaluationMetrics: {
        far: 0.042,
        frr: 0.038,
        eer: 0.040,
        rocAuc: 0.945,
        sampleCountGenuine: 120,
        sampleCountImpostor: 110,
        evaluatedAt: new Date(),
      },
    });
    logger.info("Default model registry baseline initialized.");
  }
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await ensureMLServiceRunning();
    await bootstrapInitialAdmin();
    await bootstrapDemoAccounts();
    await initializeModelRegistry();

    const app = createApp();

    const server = app.listen(config.port, config.host, () => {
      logger.info(
        `KEYTRACE running in unified single-instance mode at http://${config.host}:${config.port}`
      );
      logger.info(`Swagger API documentation available at http://${config.host}:${config.port}/api/docs`);
      logger.info(`React web frontend served dynamically at http://${config.host}:${config.port}/`);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info({ signal }, "Received termination signal. Commencing graceful shutdown...");
      if (mlChildProcess) {
        logger.info("Terminating spawned ML microservice child process...");
        try {
          mlChildProcess.kill("SIGTERM");
        } catch {}
      }
      server.close(async () => {
        logger.info("HTTP server closed.");
        await mongoose.disconnect();
        logger.info("MongoDB disconnected.");
        if (memoryServer) {
          await memoryServer.stop();
          logger.info("MongoMemoryServer stopped.");
        }
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error: any) {
    logger.fatal({ err: error.message }, "Server fatal initialization failure");
    if (mlChildProcess) {
      try {
        mlChildProcess.kill("SIGKILL");
      } catch {}
    }
    process.exit(1);
  }
}

// Start if executed directly
if (process.env.NODE_ENV !== "test") {
  startServer();
}

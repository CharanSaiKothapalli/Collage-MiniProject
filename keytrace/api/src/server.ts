import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { User } from "./models/User.js";
import { TypingProfile } from "./models/TypingProfile.js";
import { ModelRegistry } from "./models/ModelRegistry.js";
import { hashPassword } from "./utils/security.js";
import { logAuditEvent } from "./services/auditService.js";
import { USER_ROLE, PROFILE_STATUS } from "@keytrace/shared";

let memoryServer: MongoMemoryServer | null = null;

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
    if (config.isProduction) {
      logger.error({ err: err.message }, "MongoDB connection failed in production. Refusing fallback.");
      throw err;
    }

    // In development/test mode, seamlessly start an in-memory MongoDB instance
    logger.warn({ err: err.message }, "Primary MongoDB not reachable. Initializing embedded MongoMemoryServer for development...");
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
    await bootstrapInitialAdmin();
    await initializeModelRegistry();

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(
        `KEYTRACE Backend API running at http://localhost:${config.port}${config.apiPrefix}`
      );
      logger.info(`Swagger API documentation available at http://localhost:${config.port}/api/docs`);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info({ signal }, "Received termination signal. Commencing graceful shutdown...");
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
    process.exit(1);
  }
}

// Start if executed directly
if (process.env.NODE_ENV !== "test") {
  startServer();
}

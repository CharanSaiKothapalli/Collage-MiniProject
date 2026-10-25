import mongoose from "mongoose";
import { User } from "../api/src/models/User.js";
import { TypingProfile } from "../api/src/models/TypingProfile.js";
import { TypingSample } from "../api/src/models/TypingSample.js";
import { ConsentRecord } from "../api/src/models/ConsentRecord.js";
import { VerificationSession } from "../api/src/models/VerificationSession.js";
import { VerificationEvent } from "../api/src/models/VerificationEvent.js";
import { hashPassword } from "../api/src/utils/security.js";
import { config } from "../api/src/config/index.js";
import {
  USER_ROLE,
  PROFILE_STATUS,
  VERIFICATION_DECISION,
  CONSENT_STATUS,
} from "@keytrace/shared";

async function seed() {
  console.log("Connecting to MongoDB:", config.mongoUri);
  await mongoose.connect(config.mongoUri);

  console.log("Clearing existing demonstration data...");
  await Promise.all([
    User.deleteMany({}),
    TypingProfile.deleteMany({}),
    TypingSample.deleteMany({}),
    ConsentRecord.deleteMany({}),
    VerificationSession.deleteMany({}),
    VerificationEvent.deleteMany({}),
  ]);

  const defaultPassword = "DemoPassword123!";
  const passwordHash = await hashPassword(defaultPassword);

  console.log("Seeding Administrative User...");
  const admin = await User.create({
    username: "admin",
    email: "admin@keytrace.local",
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

  console.log("Seeding Genuine Enrolled User (Alice)...");
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

  // Base profile for Alice: fast typist, short hold times ~105ms, flight times ~140ms
  const aliceSamples = [];
  for (let i = 0; i < 10; i++) {
    const variance = (i % 3) * 3;
    const sample = await TypingSample.create({
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
    aliceSamples.push(sample);
  }

  // Create demonstration verification session and events for Alice
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

  // 3 Matches, 1 Review
  await VerificationEvent.create({
    userId: alice._id,
    sessionId: session._id,
    decision: VERIFICATION_DECISION.MATCH,
    score: 1.15,
    threshold: 2.8,
    reasonCodes: ["Typing cadence matches enrolled behavioural baseline."],
    timestamp: new Date(Date.now() - 1200000),
  });

  await VerificationEvent.create({
    userId: alice._id,
    sessionId: session._id,
    decision: VERIFICATION_DECISION.MATCH,
    score: 1.42,
    threshold: 2.8,
    reasonCodes: ["Consistent key-hold and flight intervals."],
    timestamp: new Date(Date.now() - 900000),
  });

  await VerificationEvent.create({
    userId: alice._id,
    sessionId: session._id,
    decision: VERIFICATION_DECISION.REVIEW,
    score: 3.12,
    threshold: 2.8,
    reasonCodes: ["Prolonged flight transitions detected."],
    timestamp: new Date(Date.now() - 600000),
  });

  await VerificationEvent.create({
    userId: alice._id,
    sessionId: session._id,
    decision: VERIFICATION_DECISION.MATCH,
    score: 1.28,
    threshold: 2.8,
    reasonCodes: ["Rhythm returned to baseline cadence."],
    timestamp: new Date(Date.now() - 300000),
  });

  console.log("Seeding Impostor Comparison User (Bob)...");
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

  // Bob is a slow typist with long hold times ~260ms, flight ~420ms
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

  console.log("\n==========================================================");
  console.log("KEYTRACE Demonstration Database Seed Complete!");
  console.log("----------------------------------------------------------");
  console.log("1. Administrator Account:");
  console.log("   Username: admin");
  console.log("   Password:", defaultPassword);
  console.log("   Email:    admin@keytrace.local\n");
  console.log("2. Genuine Enrolled User (Alice):");
  console.log("   Username: alice_genuine");
  console.log("   Password:", defaultPassword);
  console.log("   Cadence:  Fast (~105ms holds, ~140ms flights)\n");
  console.log("3. Impostor User (Bob):");
  console.log("   Username: bob_impostor");
  console.log("   Password:", defaultPassword);
  console.log("   Cadence:  Slow (~260ms holds, ~420ms flights)");
  console.log("==========================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

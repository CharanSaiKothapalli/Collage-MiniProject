import { FeatureVector, KeystrokeObservation, ENROLLMENT_THRESHOLDS } from "@keytrace/shared";

export function extractFeaturesFromTiming(
  observations: KeystrokeObservation[],
  elapsedMs: number
): FeatureVector {
  if (observations.length < 5) {
    throw new Error(`Insufficient timing observations: ${observations.length} provided, at least 5 required.`);
  }
  if (elapsedMs <= 0) {
    throw new Error("Elapsed session duration must be positive.");
  }

  // Clip observations to plausible browser physical bounds
  const holds = observations.map((o) =>
    Math.min(Math.max(o.holdMs, 1), ENROLLMENT_THRESHOLDS.MAX_HOLD_MS)
  );
  const flights = observations.map((o) =>
    Math.min(Math.max(o.flightMs, 1), ENROLLMENT_THRESHOLDS.MAX_FLIGHT_MS)
  );

  const meanHold = holds.reduce((a, b) => a + b, 0) / holds.length;
  const stdHold = Math.sqrt(
    holds.map((x) => Math.pow(x - meanHold, 2)).reduce((a, b) => a + b, 0) / holds.length
  );
  const medianHold = getMedian(holds);

  const meanFlight = flights.reduce((a, b) => a + b, 0) / flights.length;
  const stdFlight = Math.sqrt(
    flights.map((x) => Math.pow(x - meanFlight, 2)).reduce((a, b) => a + b, 0) / flights.length
  );
  const medianFlight = getMedian(flights);
  const p90Flight = getPercentile(flights, 90);

  const elapsedSec = Math.max(elapsedMs / 1000, 0.001);
  const charsPerSecond = holds.length / elapsedSec;
  const pauseRatio = flights.filter((f) => f > 250).length / flights.length;
  const holdFlightRatio = meanHold / Math.max(meanFlight, 1.0);

  return {
    mean_hold: Number(meanHold.toFixed(3)),
    std_hold: Number(stdHold.toFixed(3)),
    median_hold: Number(medianHold.toFixed(3)),
    mean_flight: Number(meanFlight.toFixed(3)),
    std_flight: Number(stdFlight.toFixed(3)),
    median_flight: Number(medianFlight.toFixed(3)),
    p90_flight: Number(p90Flight.toFixed(3)),
    chars_per_second: Number(charsPerSecond.toFixed(3)),
    pause_ratio: Number(pauseRatio.toFixed(4)),
    hold_flight_ratio: Number(holdFlightRatio.toFixed(4)),
  };
}

function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getPercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

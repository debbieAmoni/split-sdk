/** Feature flags for experimental SDK features. All default to false. */
export interface FeatureFlags {
  enableBatchOps?: boolean;
  enableOptimisticUpdates?: boolean;
  enableTelemetry?: boolean;
}

/**
 * Returns true if the given flag is enabled in the provided flags object.
 * Defaults to false when not provided.
 */
export function isFeatureEnabled(
  flag: keyof FeatureFlags,
  flags?: FeatureFlags
): boolean {
  return flags?.[flag] === true;
}

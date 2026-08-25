import type { IntegrationRegistry } from "./types";
import { createMockIntegrations } from "./adapters/mock";
import { createLiveIntegrations } from "./adapters/live";

let cached: IntegrationRegistry | null = null;

export function getIntegrations(): IntegrationRegistry {
  if (cached) return cached;
  const mode = process.env.INTEGRATION_MODE ?? "mock";
  cached = mode === "live" ? createLiveIntegrations() : createMockIntegrations();
  return cached;
}

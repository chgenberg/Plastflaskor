export function getFortnoxConnection() {
  const mode = (process.env.INTEGRATION_MODE ?? "mock") === "live" ? "live" : "mock";
  return {
    mode,
    connected: true,
    label: mode === "live" ? "Fortnox ansluten" : "Fortnox ansluten (mock)",
  };
}

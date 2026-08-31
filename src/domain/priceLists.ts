export function priceListDisplayName(name?: string | null) {
  const map: Record<string, string> = {
    Standard: "Standard",
    Silver: "Silver",
    Gold: "Guld",
    "Special Agreement": "Specialavtal",
  };
  if (!name) return "–";
  return map[name] ?? name;
}

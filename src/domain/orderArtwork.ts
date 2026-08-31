export function orderArtworkLink(order: {
  documents: { id: string; kind: string; title: string }[];
  designs: { files: { id: string; fileName: string }[] }[];
}): { href: string; label: string } | null {
  const proof = order.documents.find((d) => d.kind === "PROOF");
  if (proof) return { href: `/api/documents/${proof.id}`, label: proof.title };
  const artwork = order.documents.find((d) => d.kind === "ARTWORK");
  if (artwork) return { href: `/api/documents/${artwork.id}`, label: artwork.title };
  const file = order.designs.flatMap((d) => d.files)[0];
  if (file) return { href: `/api/artwork-files/${file.id}`, label: file.fileName };
  return null;
}

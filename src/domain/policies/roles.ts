/** Aqua intern yta. AQUA_STAFF är alias för Admin (samma befogenheter). */
export function isAquaAdmin(role?: string | null) {
  return role === "AQUA_ADMIN" || role === "AQUA_STAFF";
}

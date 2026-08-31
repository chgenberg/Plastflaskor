import { redirect } from "next/navigation";

export default function EtiketterRedirect() {
  redirect("/operations/ordrar?phase=artwork");
}

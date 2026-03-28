import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dynovare_session");
  }
  await signOut(auth);
}

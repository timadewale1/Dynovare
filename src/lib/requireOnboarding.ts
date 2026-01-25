import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function requireOnboarding(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists() || !snap.data().onboardingComplete) {
    return false;
  }

  return true;
}

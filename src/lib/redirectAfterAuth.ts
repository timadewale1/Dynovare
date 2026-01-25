import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function shouldGoToOnboarding(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  // If no profile doc yet, onboarding is required
  if (!snap.exists()) return true;

  const data = snap.data();
  return !data.onboardingComplete;
}

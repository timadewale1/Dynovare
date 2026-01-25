import {
  GoogleAuthProvider,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function controlledGoogleSignIn(
  email?: string,
  password?: string
) {
  const provider = new GoogleAuthProvider();

  // If email is already entered, check providers first
  if (email) {
    const methods = await fetchSignInMethodsForEmail(auth, email);

    // Case: email/password account exists → REQUIRE password
    if (methods.includes("password")) {
      if (!password) {
        throw {
          code: "PASSWORD_REQUIRED_FOR_LINKING",
        };
      }

      // Login with password first
      const passwordUser = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Now link Google
      const googleResult = await signInWithPopup(auth, provider);
      const googleCred =
        GoogleAuthProvider.credentialFromResult(googleResult);

      if (googleCred) {
        await linkWithCredential(passwordUser.user, googleCred);
      }

      return passwordUser.user;
    }

    // Case: Google-only user → allow Google
    if (methods.includes("google.com")) {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }
  }

  // New user or unknown email → allow Google
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

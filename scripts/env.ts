import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Optional debug (keep for now)
console.log("ENV CHECK:", {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "✅" : "❌",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "✅" : "❌",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "✅" : "❌",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ? "✅"
    : "❌",
});

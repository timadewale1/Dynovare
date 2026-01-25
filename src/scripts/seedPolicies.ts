import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { slugify } from "../lib/slugify";



// ✅ Validate env vars early (so we don't get vague Firestore errors)
const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("❌ Missing env vars. Make sure they exist in .env.local:");
  for (const k of missing) console.error(" -", k);
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

async function seedPolicies() {
  // Helpful debug (optional)
  console.log("✅ Seeding to project:", firebaseConfig.projectId);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const policies = [
    {
      title: "National Renewable Energy and Energy Efficiency Policy",
      summary:
        "Framework to increase renewable energy deployment and improve energy efficiency nationwide.",
      country: "Nigeria",
      jurisdictionLevel: "federal",
      state: "Federal",
      policyYear: 2015,
      type: "public_source",
      tags: ["renewable", "energy efficiency", "electricity"],
      source: {
        publisher: "Federal Government of Nigeria",
        url: "https://energy.gov.ng",
      },
      visibility: "public",
    },
    {
      title: "Nigeria Energy Transition Plan",
      summary:
        "Strategic plan outlining Nigeria’s pathway to net-zero emissions by 2060.",
      country: "Nigeria",
      jurisdictionLevel: "federal",
      state: "Federal",
      policyYear: 2022,
      type: "public_source",
      tags: ["climate", "emissions", "net-zero"],
      source: {
        publisher: "Federal Ministry of Power",
        url: "https://energytransition.gov.ng",
      },
      visibility: "public",
    },
    {
      title: "Lagos State Electricity Market Law",
      summary:
        "Legal framework enabling Lagos State to regulate and operate its own electricity market.",
      country: "Nigeria",
      jurisdictionLevel: "state",
      state: "Lagos",
      policyYear: 2023,
      type: "uploaded",
      tags: ["electricity", "power market", "regulation"],
      visibility: "public",
    },
    {
      title: "Kaduna State Climate Change Policy",
      summary:
        "Policy document guiding climate mitigation and adaptation strategies in Kaduna State.",
      country: "Nigeria",
      jurisdictionLevel: "state",
      state: "Kaduna",
      policyYear: 2021,
      type: "public_source",
      tags: ["climate", "adaptation", "mitigation"],
      source: {
        publisher: "Climate Policy Radar",
        url: "https://climatepolicyradar.org",
      },
      visibility: "public",
    },
    {
      title: "AI-Generated Mini-Grid Expansion Policy",
      summary:
        "AI-generated draft policy proposing incentives for rural mini-grid deployment.",
      country: "Nigeria",
      jurisdictionLevel: "federal",
      state: "Federal",
      policyYear: 2024,
      type: "ai_generated",
      tags: ["mini-grid", "rural electrification", "energy access"],
      contentText:
        "This policy proposes targeted subsidies and regulatory reforms to accelerate mini-grid deployment across underserved rural communities in Nigeria.",
      visibility: "public",
    },
  ];

  const ref = collection(db, "policies");

  for (const policy of policies) {
    await addDoc(ref, {
      ...policy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      slug: slugify(policy.title),
    });
  }

  console.log("✅ Seed policies added successfully");
}

seedPolicies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error seeding policies:", err);
    process.exit(1);
  });

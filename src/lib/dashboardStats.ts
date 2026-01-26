import { db } from "@/lib/firebase";
import {
  collection,
  getCountFromServer,
  limit,
  orderBy,
  query,
  getDocs,
  where,
} from "firebase/firestore";

export type ActivityItem = {
  type: "upload" | "critique" | "simulation";
  title: string;
  policyTitle: string;
  policySlug?: string | null;
  createdAt?: any;
};

export async function getDashboardStats(uid: string) {
  // ✅ My uploads count (user index)
  const myUploadsCol = collection(db, "users", uid, "policies");
  const myUploadsCountSnap = await getCountFromServer(myUploadsCol);

  // ✅ My critiques count (user index)
  const myCritiquesCol = collection(db, "users", uid, "critiques");
  const myCritiquesCountSnap = await getCountFromServer(myCritiquesCol);

  // ✅ My simulations count (user index)
  const mySimulationsCol = collection(db, "users", uid, "simulations");
  const mySimulationsCountSnap = await getCountFromServer(mySimulationsCol);

  // ✅ Global policies count
  const globalPoliciesCol = collection(db, "policies");
  const globalPoliciesCountSnap = await getCountFromServer(globalPoliciesCol);

  // ✅ Recent uploads (last 5)
  const recentUploadsQ = query(myUploadsCol, orderBy("createdAt", "desc"), limit(5));
  const recentUploadsSnap = await getDocs(recentUploadsQ);
  const recentUploads = recentUploadsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

  // ✅ Recent critiques (global critiques collection)
  const recentCritiquesQ = query(
    collection(db, "critiques"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const recentCritiquesSnap = await getDocs(recentCritiquesQ);
  const recentCritiques: ActivityItem[] = recentCritiquesSnap.docs.map((d) => {
    const data = d.data() as any;
    return {
      type: "critique",
      title: "Critiqued",
      policyTitle: data.policyTitle ?? "Untitled policy",
      policySlug: data.policySlug ?? null,
      createdAt: data.createdAt ?? null,
    };
  });

  // ✅ Recent simulations (global simulations collection)
  const recentSimsQ = query(
    collection(db, "simulations"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const recentSimsSnap = await getDocs(recentSimsQ);
  const recentSimulations: ActivityItem[] = recentSimsSnap.docs.map((d) => {
    const data = d.data() as any;
    return {
      type: "simulation",
      title: "Simulated",
      policyTitle: data.policyTitle ?? "Untitled policy",
      policySlug: data.policySlug ?? null,
      createdAt: data.createdAt ?? null,
    };
  });

  // ✅ Recent uploads as activities too (from user index)
  const uploadActivities: ActivityItem[] = recentUploads.map((p: any) => ({
    type: "upload",
    title: "Uploaded",
    policyTitle: p.title ?? "Untitled policy",
    policySlug: p.slug ?? null,
    createdAt: p.createdAt ?? null,
  }));

  // ✅ Merge activities and sort by createdAt desc
  const recentActivities = [...uploadActivities, ...recentCritiques, ...recentSimulations]
    .sort((a, b) => {
      const at = a.createdAt?.toMillis?.() ?? 0;
      const bt = b.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    })
    .slice(0, 4);

  return {
    myUploadsCount: myUploadsCountSnap.data().count ?? 0,
    myCritiquesCount: myCritiquesCountSnap.data().count ?? 0,
    mySimulationsCount: mySimulationsCountSnap.data().count ?? 0,
    globalPoliciesCount: globalPoliciesCountSnap.data().count ?? 0,

    recentUploads, // kept in case you still want it somewhere later
    recentActivities,
  };
}

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
  const myUploadsCol = collection(db, "users", uid, "policies");
  const myCritiquesCol = collection(db, "users", uid, "critiques");
  const mySimulationsCol = collection(db, "users", uid, "simulations");

  const [myUploadsCountSnap, myCritiquesCountSnap, mySimulationsCountSnap] = await Promise.all([
    getCountFromServer(myUploadsCol),
    getCountFromServer(myCritiquesCol),
    getCountFromServer(mySimulationsCol),
  ]);

  const recentUploadsQ = query(myUploadsCol, orderBy("createdAt", "desc"), limit(5));
  const workspacePoliciesQ = query(myUploadsCol, orderBy("updatedAt", "desc"), limit(100));
  const recentCritiquesQ = query(
    collection(db, "critiques"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const recentSimsQ = query(
    collection(db, "simulations"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  const [recentUploadsSnap, workspacePoliciesSnap, recentCritiquesSnap, recentSimsSnap] = await Promise.all([
    getDocs(recentUploadsQ),
    getDocs(workspacePoliciesQ),
    getDocs(recentCritiquesQ),
    getDocs(recentSimsQ),
  ]);

  const recentUploads = recentUploadsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
  const workspacePolicies = workspacePoliciesSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

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

  const uploadActivities: ActivityItem[] = recentUploads.map((p: any) => ({
    type: "upload",
    title: "Uploaded",
    policyTitle: p.title ?? "Untitled policy",
    policySlug: p.slug ?? null,
    createdAt: p.createdAt ?? null,
  }));

  const recentActivities = [...uploadActivities, ...recentCritiques, ...recentSimulations]
    .sort((a, b) => {
      const at = a.createdAt?.toMillis?.() ?? 0;
      const bt = b.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    })
    .slice(0, 3);

  const critiqueScores = recentCritiquesSnap.docs
    .map((d) => Number((d.data() as any).overallScore))
    .filter((score) => Number.isFinite(score));

  const workspaceAverageScore =
    critiqueScores.length > 0
      ? Math.round((critiqueScores.reduce((sum, score) => sum + score, 0) / critiqueScores.length) * 10) / 10
      : null;

  const stateSignalsCount = new Set(
    workspacePolicies
      .map((policy: any) => (policy.jurisdictionLevel === "state" ? policy.state : null))
      .filter(Boolean)
  ).size;

  return {
    myUploadsCount: myUploadsCountSnap.data().count ?? 0,
    myCritiquesCount: myCritiquesCountSnap.data().count ?? 0,
    mySimulationsCount: mySimulationsCountSnap.data().count ?? 0,
    globalPoliciesCount: 0,
    workspaceAverageScore,
    stateSignalsCount,
    recentActivities,
  };
}

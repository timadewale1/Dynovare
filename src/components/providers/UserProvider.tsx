"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { logout as doLogout } from "@/lib/logout";

type UserContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);
const SESSION_KEY = "dynovare_session";
const SESSION_DURATION_MS = 3 * 60 * 60 * 1000;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      setUser(u);

      if (!u) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(SESSION_KEY);
        }
        setProfile(null);
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(SESSION_KEY);
        const now = Date.now();
        let session = stored ? JSON.parse(stored) as { uid?: string; startedAt?: number } : null;

        if (!session || session.uid !== u.uid || typeof session.startedAt !== "number") {
          session = { uid: u.uid, startedAt: now };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }

        const startedAt = session.startedAt;
        if (typeof startedAt !== "number") {
          localStorage.removeItem(SESSION_KEY);
        } else if (now - startedAt >= SESSION_DURATION_MS) {
          await doLogout();
          localStorage.removeItem(SESSION_KEY);
          setProfile(null);
          setLoading(false);
          return;
        }
      }

      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;

    try {
      const session = JSON.parse(raw) as { uid?: string; startedAt?: number };
      if (session.uid !== user.uid || typeof session.startedAt !== "number") return;

      const remaining = SESSION_DURATION_MS - (Date.now() - session.startedAt);
      if (remaining <= 0) {
        void doLogout();
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      const timer = window.setTimeout(() => {
        void doLogout();
        localStorage.removeItem(SESSION_KEY);
      }, remaining);

      return () => window.clearTimeout(timer);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const logout = async () => {
    await doLogout();
  };

  return (
    <UserContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider />");
  return ctx;
}

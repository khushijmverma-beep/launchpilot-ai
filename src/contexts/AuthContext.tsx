"use client";

import { auth } from "@/lib/firebase";
import { setAuthUserSnapshot } from "@/lib/auth-session";
import { getUserProfile, saveUserIdentity } from "@/lib/users/firestore";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserProfile(firebaseUser: User): Promise<void> {
  const existing = await getUserProfile(firebaseUser.uid);
  if (existing) return;

  await saveUserIdentity(firebaseUser.uid, {
    displayName: firebaseUser.displayName?.trim() || firebaseUser.email?.split("@")[0] || "Founder",
    email: firebaseUser.email ?? undefined,
    avatarUrl: firebaseUser.photoURL ?? undefined,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUserSnapshot(firebaseUser);
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        void ensureUserProfile(firebaseUser).catch(() => {
          // Profile seed is best-effort on sign-in
        });
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      throw new Error("You must be signed in with email to change your password.");
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      changePassword,
      signOut,
    }),
    [user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, changePassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

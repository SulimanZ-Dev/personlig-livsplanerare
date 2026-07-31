import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, firebaseEnabled } from "./firebase";

const AuthContext = createContext(null);

const authMessage = (error) => {
  const code = error?.code || "";
  if (code.includes("invalid-credential")) return "Fel e-post eller lösenord.";
  if (code.includes("email-already-in-use")) return "E-postadressen har redan ett konto.";
  if (code.includes("weak-password")) return "Lösenordet behöver minst sex tecken.";
  if (code.includes("invalid-email")) return "Kontrollera e-postadressen.";
  if (code.includes("too-many-requests")) return "För många försök. Vänta en stund och försök igen.";
  return "Något gick fel med inloggningen. Försök igen.";
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!firebaseEnabled);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!firebaseEnabled) return undefined;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    }, () => {
      setAuthReady(true);
      setAuthError("Kunde inte ansluta till kontotjänsten.");
    });
  }, []);

  const actions = useMemo(() => ({
    async login(email, password) {
      setAuthError("");
      try { await signInWithEmailAndPassword(auth, email, password); }
      catch (error) { const message = authMessage(error); setAuthError(message); throw new Error(message); }
    },
    async register(name, email, password) {
      setAuthError("");
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } catch (error) { const message = authMessage(error); setAuthError(message); throw new Error(message); }
    },
    async logout() {
      setAuthError("");
      await signOut(auth);
    },
    async reset(email) {
      setAuthError("");
      try { await sendPasswordResetEmail(auth, email); }
      catch (error) { const message = authMessage(error); setAuthError(message); throw new Error(message); }
    },
  }), []);

  return <AuthContext.Provider value={{ user, authReady, authError, firebaseEnabled, ...actions }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

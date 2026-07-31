import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "../sync/firebase";
import { reconcileGoalAchievements } from "../goals/goalEngine";
import { loadOrMigrate, normalizeState } from "./migrations";

const KEY = "life-planner:v2";
const DEVICE_KEY = "life-planner:device-id";

const getDeviceId = () => {
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

const cleanForCloud = (value) => JSON.parse(JSON.stringify(value));

const loadInitial = () => {
  try {
    const loaded = normalizeState(loadOrMigrate());
    loaded.meta.deviceId = getDeviceId();
    window.localStorage.setItem(KEY, JSON.stringify(loaded));
    return { state: loaded, error: "" };
  } catch {
    return { state: null, error: "Kunde inte läsa sparad data." };
  }
};

export function useAppStorage(user) {
  const [initial] = useState(loadInitial);
  const [state, setState] = useState(initial.state);
  const [error, setError] = useState(initial.error);
  const [syncStatus, setSyncStatus] = useState({ state: "local", label: "Sparas lokalt" });
  const stateRef = useRef(initial.state);
  const syncTimer = useRef(null);
  const applyingRemote = useRef(false);
  const resolvedUserId = useRef("");
  const userId = user?.uid || "";
  const stateReady = state !== null;

  useEffect(() => {
    if (!firebaseEnabled || !userId || !stateRef.current) {
      resolvedUserId.current = "";
      setSyncStatus({ state: "local", label: userId ? "Molnet ej konfigurerat" : "Endast denna enhet" });
      return undefined;
    }

    resolvedUserId.current = "";
    setSyncStatus({ state: "syncing", label: "Ansluter…" });
    const stateDoc = doc(db, "users", userId, "planner", "state");
    return onSnapshot(stateDoc, async (snapshot) => {
      if (!snapshot.exists()) {
        if (snapshot.metadata.fromCache) {
          setSyncStatus({ state: "syncing", label: "Kontrollerar molnet…" });
          return;
        }
        setSyncStatus({ state: "syncing", label: "Skapar molnkopia…" });
        resolvedUserId.current = userId;
        await setDoc(stateDoc, { state: cleanForCloud(stateRef.current), serverUpdatedAt: serverTimestamp() });
        setSyncStatus({ state: "synced", label: "Synkad" });
        return;
      }

      const remote = normalizeState(snapshot.data().state);
      const local = stateRef.current;
      if (resolvedUserId.current !== userId) {
        applyingRemote.current = true;
        stateRef.current = remote;
        window.localStorage.setItem(KEY, JSON.stringify(remote));
        setState(remote);
        applyingRemote.current = false;
        resolvedUserId.current = userId;
        setSyncStatus({ state: "synced", label: "Synkad" });
        return;
      }

      const sameWrite = remote.meta.deviceId === local.meta.deviceId && remote.meta.revision === local.meta.revision;
      if (!sameWrite && new Date(remote.meta.updatedAt).getTime() > new Date(local.meta.updatedAt).getTime()) {
        applyingRemote.current = true;
        stateRef.current = remote;
        window.localStorage.setItem(KEY, JSON.stringify(remote));
        setState(remote);
        applyingRemote.current = false;
      } else if (!sameWrite && new Date(local.meta.updatedAt).getTime() > new Date(remote.meta.updatedAt).getTime()) {
        await setDoc(stateDoc, { state: cleanForCloud(local), serverUpdatedAt: serverTimestamp() });
      }
      setSyncStatus({ state: "synced", label: "Synkad" });
    }, () => {
      setSyncStatus({ state: "offline", label: "Offline · köar ändringar" });
    });
  }, [userId, stateReady]);

  const scheduleSync = useCallback((next) => {
    if (!firebaseEnabled || !userId || applyingRemote.current || resolvedUserId.current !== userId) return;
    window.clearTimeout(syncTimer.current);
    setSyncStatus({ state: "syncing", label: "Synkar…" });
    syncTimer.current = window.setTimeout(async () => {
      try {
        const stateDoc = doc(db, "users", userId, "planner", "state");
        await setDoc(stateDoc, { state: cleanForCloud(next), serverUpdatedAt: serverTimestamp() });
        setSyncStatus({ state: "synced", label: "Synkad" });
      } catch {
        setSyncStatus({ state: "offline", label: "Offline · sparad lokalt" });
      }
    }, 450);
  }, [userId]);

  const update = useCallback((recipe, activityEntry = null) => {
    setState((previous) => {
      if (!previous) return previous;
      let next = typeof recipe === "function" ? recipe(previous) : recipe;
      if (activityEntry) next = { ...next, activity: [...(next.activity || []), activityEntry] };
      next = reconcileGoalAchievements(next);
      const stamped = {
        ...next,
        meta: {
          ...next.meta,
          deviceId: getDeviceId(),
          revision: (previous.meta?.revision || 0) + 1,
          updatedAt: new Date().toISOString(),
        },
      };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(stamped));
        stateRef.current = stamped;
        setError("");
        scheduleSync(stamped);
      } catch {
        setError("Kunde inte spara lokalt.");
      }
      return stamped;
    });
  }, [scheduleSync]);

  return { state, update, error, syncStatus };
}

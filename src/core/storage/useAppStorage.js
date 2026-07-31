import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "../sync/firebase";
import { reconcileGoalAchievements } from "../goals/goalEngine";
import { loadOrMigrate, normalizeState } from "./migrations";
import { createInitialState } from "./schema";

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
  const [undoInfo, setUndoInfo] = useState(null);
  const stateRef = useRef(initial.state);
  const syncTimer = useRef(null);
  const undoTimer = useRef(null);
  const undoRef = useRef(null);
  const applyingRemote = useRef(false);
  const ignoreRemoteUntil = useRef(0);
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
      if (Date.now() < ignoreRemoteUntil.current) return;
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
      if (activityEntry) {
        undoRef.current = previous;
        setUndoInfo({ label: activityEntry.title || "Senaste ändringen" });
        window.clearTimeout(undoTimer.current);
        undoTimer.current = window.setTimeout(() => {
          undoRef.current = null;
          setUndoInfo(null);
        }, 8000);
      }
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

  const replaceState = useCallback((incoming, label = "Importerad backup") => {
    const normalized = normalizeState(incoming);
    setState((previous) => {
      if (previous) undoRef.current = previous;
      const stamped = {
        ...normalized,
        meta: {
          ...normalized.meta,
          deviceId: getDeviceId(),
          revision: (previous?.meta?.revision || 0) + 1,
          updatedAt: new Date().toISOString(),
        },
      };
      window.localStorage.setItem(KEY, JSON.stringify(stamped));
      stateRef.current = stamped;
      setUndoInfo({ label });
      scheduleSync(stamped);
      return stamped;
    });
  }, [scheduleSync]);

  const resetState = useCallback(async ({ syncCloud = false } = {}) => {
    const fresh = createInitialState();
    fresh.meta.deviceId = getDeviceId();
    window.localStorage.removeItem("life-planner:v1");
    window.localStorage.removeItem("ekonomi-state-v1");
    Object.keys(window.localStorage).filter((key) => key.startsWith("life-planner:notification:")).forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem(KEY, JSON.stringify(fresh));
    stateRef.current = fresh;
    undoRef.current = null;
    setUndoInfo(null);
    setState(fresh);
    if (!syncCloud) ignoreRemoteUntil.current = Date.now() + 2000;
    if (syncCloud && firebaseEnabled && userId) {
      const stateDoc = doc(db, "users", userId, "planner", "state");
      await setDoc(stateDoc, { state: cleanForCloud(fresh), serverUpdatedAt: serverTimestamp() });
      resolvedUserId.current = userId;
      setSyncStatus({ state: "synced", label: "Molndata tömd" });
    }
  }, [userId]);

  const undo = useCallback(() => {
    const snapshot = undoRef.current;
    if (!snapshot) return;
    setState((current) => {
      const restored = {
        ...snapshot,
        meta: {
          ...snapshot.meta,
          deviceId: getDeviceId(),
          revision: (current?.meta?.revision || 0) + 1,
          updatedAt: new Date().toISOString(),
        },
      };
      window.localStorage.setItem(KEY, JSON.stringify(restored));
      stateRef.current = restored;
      scheduleSync(restored);
      return restored;
    });
    undoRef.current = null;
    setUndoInfo(null);
    window.clearTimeout(undoTimer.current);
  }, [scheduleSync]);

  return { state, update, replaceState, resetState, undo, undoInfo, error, syncStatus };
}

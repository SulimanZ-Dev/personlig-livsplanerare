import { useCallback, useEffect, useState } from "react";
import { loadOrMigrate } from "./migrations";

const KEY = "life-planner:v1";

export function useAppStorage() {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const loaded = loadOrMigrate();
      window.localStorage.setItem(KEY, JSON.stringify(loaded));
      setState(loaded);
    } catch {
      setError("Kunde inte läsa sparad data.");
    }
  }, []);

  const update = useCallback((recipe) => {
    setState((previous) => {
      const next = typeof recipe === "function" ? recipe(previous) : recipe;
      const stamped = { ...next, meta: { ...next.meta, updatedAt: new Date().toISOString() } };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(stamped));
        setError("");
      } catch {
        setError("Kunde inte spara lokalt.");
      }
      return stamped;
    });
  }, []);

  return { state, update, error };
}


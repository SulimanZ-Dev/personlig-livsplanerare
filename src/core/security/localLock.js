const PIN_KEY = "life-planner:pin-hash";

async function hash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const hasLocalPin = () => Boolean(window.localStorage.getItem(PIN_KEY));
export const setLocalPin = async (pin) => window.localStorage.setItem(PIN_KEY, await hash(pin));
export const removeLocalPin = () => window.localStorage.removeItem(PIN_KEY);
export const verifyLocalPin = async (pin) => window.localStorage.getItem(PIN_KEY) === await hash(pin);

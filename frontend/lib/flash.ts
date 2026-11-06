// One-time success message carried across a page navigation.
const KEY = "sportbook_flash";

export const setFlash = (msg: string) => sessionStorage.setItem(KEY, msg);

// Read without removing, so React's double render in dev cannot lose it.
export const peekFlash = () => (typeof window === "undefined" ? null : sessionStorage.getItem(KEY));

export const clearFlash = () => sessionStorage.removeItem(KEY);

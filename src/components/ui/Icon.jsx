const paths = {
  home: "M3 11l9-8 9 8v10h-6v-6H9v6H3z",
  target: "M12 22a10 10 0 100-20 10 10 0 000 20zm0-6a4 4 0 100-8 4 4 0 000 8zm0-4h.01",
  wallet: "M3 6h16v14H3z M3 9h16 M15 13h6v4h-6z",
  dumbbell: "M6 7v10 M3 9v6 M18 7v10 M21 9v6 M6 12h12",
  check: "M20 6L9 17l-5-5",
  book: "M4 4h7a3 3 0 013 3v13a3 3 0 00-3-3H4z M20 4h-3a3 3 0 00-3 3v13a3 3 0 013-3h3z",
  review: "M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5",
  plus: "M12 5v14 M5 12h14",
  close: "M6 6l12 12 M18 6L6 18",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
  flame: "M12 22c4 0 7-3 7-7 0-5-4-8-6-12 0 4-2 6-4 8 0-2-1-3-2-4-1 3-2 5-2 8 0 4 3 7 7 7z",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zm0-15v5l3 2",
  trend: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  archive: "M4 7h16v14H4z M3 3h18v4H3z M9 11h6",
  edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z",
  pin: "M9 3h6l-1 6 4 4H6l4-4z M12 13v8",
  arrowUp: "M12 19V5 M6 11l6-6 6 6",
  arrowDown: "M12 5v14 M18 13l-6 6-6-6",
  swap: "M7 7h13l-3-3 M20 7l-3 3 M17 17H4l3-3 M4 17l3 3",
  minus: "M5 12h14",
  scale: "M4 19h16 M7 19l1-10h8l1 10 M10 9a2 2 0 114 0",
  calendar: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16",
  pulse: "M3 12h4l2-5 4 10 2-5h6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0",
  logout: "M10 17l5-5-5-5 M15 12H3 M19 4h2v16h-2",
};

export function Icon({ name, size = 20 }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.target} /></svg>;
}

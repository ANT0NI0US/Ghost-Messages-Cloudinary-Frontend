import { read, write } from "./storage.js";

// which received messages this viewer already opened, so new ones stay veiled (per browser only)
const KEY = "gm.opened";

export const isOpened = (id) => read(KEY, []).includes(id);

export const markOpened = (id) => {
  const list = read(KEY, []);
  if (!list.includes(id)) write(KEY, [...list, id].slice(-500));
};

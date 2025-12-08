import type { Item } from "../models/Item";
import { clearItems, deleteItem, getItem, listItems, searchItems } from "../storage/items";
import { listRooms, createRoom, renameRoom, deleteRoom } from "../storage/rooms";

type DebugApi = {
  list: () => Promise<Item[]>;
  get: (id: string) => Promise<Item | null>;
  delete: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  search: (term: string) => Promise<Item[]>;
  rooms: {
    list: typeof listRooms;
    create: typeof createRoom;
    rename: typeof renameRoom;
    delete: typeof deleteRoom;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var findItLaterDebug: DebugApi | undefined;
}

export function attachFindItLaterDebug(): void {
  const api: DebugApi = {
    list: listItems,
    get: getItem,
    delete: deleteItem,
    clear: clearItems,
    search: searchItems,
    rooms: {
      list: listRooms,
      create: createRoom,
      rename: renameRoom,
      delete: deleteRoom,
    },
  };
  globalThis.findItLaterDebug = api;
  // eslint-disable-next-line no-console
  console.log("[find-it-later] Debug helpers attached to globalThis.findItLaterDebug");
}

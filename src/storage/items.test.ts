import { clearItems, deleteItem, getItem, listItems, updateItem } from "./items";

jest.mock("./db", () => {
  const mockDb = {
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
  };
  return { getDb: jest.fn().mockResolvedValue(mockDb), __mockDb: mockDb };
});

jest.mock("../utils/photoStorage", () => ({
  deletePhoto: jest.fn().mockResolvedValue(undefined),
}));

const { __mockDb: mockDb } = jest.requireMock("./db");
const { deletePhoto } = jest.requireMock("../utils/photoStorage");

describe("storage/items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps list rows to items ordered newest first", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: "2",
        label: "Second",
        note: null,
        photo_uri: "file:///second.jpg",
        created_at: 200,
        lat: null,
        lon: null,
        accuracy: null,
      },
      {
        id: "1",
        label: "First",
        note: "n",
        photo_uri: "file:///first.jpg",
        created_at: 100,
        lat: 1,
        lon: 2,
        accuracy: 5,
      },
    ]);

    const items = await listItems();

    expect(items).toEqual([
      {
        id: "2",
        label: "Second",
        note: undefined,
        photoUri: "file:///second.jpg",
        createdAt: 200,
        location: undefined,
      },
      {
        id: "1",
        label: "First",
        note: "n",
        photoUri: "file:///first.jpg",
        createdAt: 100,
        location: { lat: 1, lon: 2, accuracy: 5 },
      },
    ]);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      "SELECT * FROM items ORDER BY created_at DESC LIMIT ?",
      [100],
    );
  });

  it("updates label and note", async () => {
    await updateItem({ id: "abc", label: "New", note: "Note" });

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      "UPDATE items SET label = ?, note = ? WHERE id = ?",
      ["New", "Note", "abc"],
    );
  });

  it("gets a single item", async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      id: "1",
      label: "One",
      note: null,
      photo_uri: "file:///one.jpg",
      created_at: 123,
      lat: null,
      lon: null,
      accuracy: null,
    });

    const item = await getItem("1");
    expect(item).toMatchObject({ id: "1", label: "One", photoUri: "file:///one.jpg" });
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith("SELECT * FROM items WHERE id = ?", ["1"]);
  });

  it("deletes item and photo when present", async () => {
    mockDb.getFirstAsync.mockResolvedValue({ photo_uri: "file:///one.jpg" });

    await deleteItem("1");

    expect(deletePhoto).toHaveBeenCalledWith("file:///one.jpg");
    expect(mockDb.runAsync).toHaveBeenCalledWith("DELETE FROM items WHERE id = ?", ["1"]);
  });

  it("clears all items and photos", async () => {
    mockDb.getAllAsync.mockResolvedValue([{ photo_uri: "file:///one.jpg" }, { photo_uri: null }]);

    await clearItems();

    expect(deletePhoto).toHaveBeenCalledTimes(1);
    expect(deletePhoto).toHaveBeenCalledWith("file:///one.jpg");
    expect(mockDb.runAsync).toHaveBeenCalledWith("DELETE FROM items");
  });
});

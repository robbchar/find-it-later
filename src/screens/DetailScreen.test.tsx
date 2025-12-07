import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { DetailScreen } from "./DetailScreen";

jest.mock("../storage/items", () => ({
  getItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
}));

const { getItem, updateItem, deleteItem } = jest.requireMock("../storage/items");

const navigationMock = {
  goBack: jest.fn(),
} as any;

const baseItem = {
  id: "1",
  label: "One",
  note: "Note",
  photoUri: "file:///one.jpg",
  createdAt: 1,
  location: { lat: 1, lon: 2, accuracy: 10 },
};

describe("DetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY = "";
  });

  it("renders item info and location fallback when no map key", async () => {
    getItem.mockResolvedValue(baseItem);

    const { getByText, getByDisplayValue } = render(
      <DetailScreen
        navigation={navigationMock}
        route={{ key: "detail", name: "Detail", params: { itemId: "1" } } as any}
      />,
    );

    await waitFor(() => {
      expect(getByDisplayValue("One")).toBeTruthy();
    });
    expect(getByText("Accuracy ~10m")).toBeTruthy();
    expect(getByText("Map preview unavailable (no API key set).")).toBeTruthy();
  });

  it("saves updated label and note", async () => {
    getItem.mockResolvedValue(baseItem);

    const { getByPlaceholderText, getByText, getByDisplayValue } = render(
      <DetailScreen
        navigation={navigationMock}
        route={{ key: "detail", name: "Detail", params: { itemId: "1" } } as any}
      />,
    );

    await waitFor(() => {
      expect(getByDisplayValue("One")).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText("Add a label"), " Updated ");
    fireEvent.changeText(getByPlaceholderText("Add a note"), " Note2 ");
    fireEvent.press(getByText("Save changes"));

    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith({ id: "1", label: "Updated", note: "Note2" });
    });
  });

  it("deletes item and navigates back", async () => {
    getItem.mockResolvedValue(baseItem);
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const deleteBtn = buttons?.find((b) => b.style === "destructive");
      deleteBtn?.onPress?.();
    });

    const { getByText } = render(
      <DetailScreen
        navigation={navigationMock}
        route={{ key: "detail", name: "Detail", params: { itemId: "1" } } as any}
      />,
    );

    await waitFor(() => {
      expect(getByText("Delete")).toBeTruthy();
    });
    fireEvent.press(getByText("Delete"));

    await waitFor(() => {
      expect(deleteItem).toHaveBeenCalledWith("1");
    });
    expect(navigationMock.goBack).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { HomeScreen } from "./HomeScreen";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (cb: any) => {
      const React = require("react");
      const { useEffect } = React;
      useEffect(() => {
        const cleanup = cb();
        return cleanup;
      }, [cb]);
    },
  };
});

jest.mock("../storage/items", () => ({
  listItems: jest.fn(),
  deleteItem: jest.fn(),
}));

const { listItems, deleteItem } = jest.requireMock("../storage/items");

const navigationMock = {
  navigate: jest.fn(),
} as any;

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders items and navigates to detail on press", async () => {
    listItems.mockResolvedValue([
      { id: "1", label: "One", note: undefined, photoUri: "file:///one.jpg", createdAt: 1 },
    ]);

    const { getByText } = render(
      <HomeScreen navigation={navigationMock} route={{ key: "home", name: "Home" } as any} />,
    );

    await waitFor(() => {
      expect(getByText("One")).toBeTruthy();
    });

    fireEvent.press(getByText("One"));
    expect(navigationMock.navigate).toHaveBeenCalledWith("Detail", { itemId: "1" });
  });

  it("deletes item via swipe action", async () => {
    listItems.mockResolvedValue([
      { id: "1", label: "One", note: undefined, photoUri: "file:///one.jpg", createdAt: 1 },
    ]);
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      const deleteBtn = buttons?.find((b) => b.style === "destructive");
      deleteBtn?.onPress?.();
    });

    const { getByText } = render(
      <HomeScreen navigation={navigationMock} route={{ key: "home", name: "Home" } as any} />,
    );

    await waitFor(() => {
      expect(getByText("One")).toBeTruthy();
    });

    // Delete button is rendered by the mocked Swipeable renderRightActions
    fireEvent.press(getByText("Delete"));

    await act(async () => {});

    expect(deleteItem).toHaveBeenCalledWith("1");
    expect(listItems).toHaveBeenCalledTimes(2); // initial load + refresh after delete

    alertSpy.mockRestore();
  });
});

import React from "react";
import { View } from "react-native";

export const Swipeable = ({
  children,
  renderRightActions,
}: {
  children: React.ReactNode;
  renderRightActions?: () => React.ReactNode;
}) => (
  <View>
    {children}
    {renderRightActions ? renderRightActions() : null}
  </View>
);

export const GestureHandlerRootView = ({ children }: { children: React.ReactNode }) => (
  <View>{children}</View>
);

export const PanGestureHandler = View;
export const RectButton = View;
export default {
  Swipeable,
  GestureHandlerRootView,
  PanGestureHandler,
  RectButton,
};

import "dotenv/config";

export default {
  expo: {
    name: "find-it-later",
    slug: "find-it-later",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-sqlite"],
    extra: {
      googleMapsStaticKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY,
    },
  },
};

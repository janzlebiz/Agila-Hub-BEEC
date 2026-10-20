import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.tfoe.agilahub",
  appName: "AGILA Hub",
  webDir: "out",
  server: {
    androidScheme: "https",
    errorPath: "404.html",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#05379E",
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: "#05379E",
      style: "DARK",
    },
  },
};

export default config;

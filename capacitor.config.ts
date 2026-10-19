import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.tfoe.agilahub",
  appName: "AGILA Hub",
  webDir: "out",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://agila-hub-beec-a8cjywbv7-janzle.vercel.app",
    cleartext: false,
    androidScheme: "https",
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

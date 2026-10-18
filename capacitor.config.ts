import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.tfoe.agilahub",
  appName: "AGILA Hub",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;

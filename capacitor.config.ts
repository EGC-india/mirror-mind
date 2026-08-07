import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.mirrormind.app",
  appName: "MirrorMind",
  webDir: "public",
  server: {
    // Note: To view on an Android Emulator connected to your local server, use http://10.0.2.2:3000
    url: "https://mirrormind.egcindia.in/",
  },
}

export default config

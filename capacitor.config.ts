import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'dev.lozt.jamba',
  appName: 'Jamba',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config

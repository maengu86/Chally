import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'chally',
  brand: {
    displayName: 'Chally',
    primaryColor: '#CBE0FF',
    icon: 'https://chally-ko.vercel.app/appIcon.svg',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host 0.0.0.0',
      build: 'npm run build:web',
    },
  },
  webViewProps: {
    type: 'partner',
    bounces: false,
    pullToRefreshEnabled: false,
    allowsBackForwardNavigationGestures: true,
  },
  permissions: [],
  outdir: 'dist',
});

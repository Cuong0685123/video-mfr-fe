import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'video_mfr',
      filename: 'remoteEntry.js',
      exposes: {
        // Sau này Host app sẽ import './VideoSearchGallery'
        './VideoSearchGallery': './src/components/VideoSearchGallery.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 3004, // Port chạy dev của video-mfr
    cors: true,
  },
  preview: {
    port: 3004,
    cors: true,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
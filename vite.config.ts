import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
    __DEV__: JSON.stringify(true),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-native-web',
      'react-native-safe-area-context',
      'lucide-react',
    ],
  },
  resolve: {
    alias: [
      { find: 'react-native/Libraries/Utilities/codegenNativeComponent', replacement: path.resolve(__dirname, 'src/services/codegen-shim.js') },
      { find: /^@react-native\/assets-registry(\/.*)?$/, replacement: path.resolve(__dirname, 'src/services/assets-registry-shim.js') },
      { find: '@react-native-async-storage/async-storage', replacement: path.resolve(__dirname, 'src/services/storage-web-shim.ts') },
      { find: 'lucide-react-native', replacement: 'lucide-react' },
      { find: /^react-native$/, replacement: path.resolve(__dirname, 'src/services/react-native-shim.js') },
      { find: /^react-native\/(.*)$/, replacement: 'react-native-web/dist/$1' },
    ],
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
    ],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});

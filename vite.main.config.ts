import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    // browserField: false, // This option is not available in Vite 3.x and above.
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});
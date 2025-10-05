/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ React 컴포넌트 전체 대상
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};


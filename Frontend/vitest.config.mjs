import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react-swc"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    // La API de las pruebas no depende del .env local
    env: { VITE_API_URL: "https://api.nailsoft.test/api" },
    restoreMocks: true,
  },
})

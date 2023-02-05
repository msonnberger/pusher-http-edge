import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.{js,ts}"],
    exclude: ["tests/helpers/**/*.{js,ts}"],
    environment: "edge-runtime",
  },
})

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101418",
        line: "#d8dee5",
        panel: "#f7f8fa",
        accent: "#0f766e",
        signal: "#f59e0b"
      }
    }
  },
  plugins: []
};

export default config;

// AutoKosten v2 fix1
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/AutoKosten/",  // ← aanpassen naar jouw repo-naam
});

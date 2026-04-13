import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/dashboard-projects/",  // GitHub Pages 배포용 (repo name 기준)
});

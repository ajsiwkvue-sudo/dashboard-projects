import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/cart-vital-dashboard/",  // GitHub Pages 배포용
});

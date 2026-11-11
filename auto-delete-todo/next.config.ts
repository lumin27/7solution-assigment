import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      // Tailwind CSS v4 is compiled by its Turbopack loader instead of PostCSS.
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

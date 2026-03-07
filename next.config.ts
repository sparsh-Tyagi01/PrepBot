import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling server-only packages with native dependencies
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse', 'canvas'],
};

export default nextConfig;

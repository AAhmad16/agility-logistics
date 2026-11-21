import type { NextConfig } from "next";

// Almost every page is per-user (logged in), so we render dynamically on request
// instead of using Cache Components.
const nextConfig: NextConfig = {};

export default nextConfig;

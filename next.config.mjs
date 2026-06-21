/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint is run in the editor/CI; don't block production builds on stylistic lint.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

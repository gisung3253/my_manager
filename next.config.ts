import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 빌드 시 ESLint 검사 건너뛰기
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

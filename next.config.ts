import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel serverless에서 @libsql/client 사용을 위한 설정
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;

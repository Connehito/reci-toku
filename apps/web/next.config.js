/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // 将来のDockerビルドのため
};

module.exports = nextConfig;

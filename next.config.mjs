/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/api/download-mp3': [`./.media-bin/${process.platform}-${process.arch}/*`],
  },
  outputFileTracingExcludes: {
    '/api/download-mp3': ['linux-x64', 'darwin-arm64', 'darwin-x64']
      .filter(platform => platform !== `${process.platform}-${process.arch}`)
      .map(platform => `./.media-bin/${platform}/**/*`),
  },
};

export default nextConfig;

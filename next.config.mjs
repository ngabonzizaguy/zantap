/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Product validation allows 5 MB images; leave room for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "zantap-psi.vercel.app" }],
        destination: "https://zantap.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

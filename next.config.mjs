/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

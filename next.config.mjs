/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Camera, mic and screen capture are needed by this app; everything else is off.
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), geolocation=()",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
export default nextConfig;

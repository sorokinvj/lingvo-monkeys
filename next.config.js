/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;

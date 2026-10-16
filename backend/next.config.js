/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*', // 백엔드 파이썬 서버로 데이터 전달
        },
      ]
    },
  }
  
  module.exports = nextConfig
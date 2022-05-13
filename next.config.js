/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    "BASEPATH": process.env.BASEPATH
  }
}

module.exports = nextConfig

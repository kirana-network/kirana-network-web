/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    "BASEPATH": process.env.BASEPATH,
    "APP_NAME": process.env.APP_NAME
  }
}

module.exports = nextConfig

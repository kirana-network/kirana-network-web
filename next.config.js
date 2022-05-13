/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    "REACT_APP_BASEPATH": process.env.BASEPATH,
    "REACT_APP_NAME": process.env.APP_NAME
  }
}

module.exports = nextConfig

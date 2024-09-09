// next.config.js (or next.config.ts if using TypeScript for config files)
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add the Node polyfill plugin only for the client-side
    if (!isServer) {
      config.plugins.push(new NodePolyfillPlugin());
    }

    return config;
  },
};

module.exports = nextConfig;

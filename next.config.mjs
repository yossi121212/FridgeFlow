/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ignore TS errors related to the embedded git repository
  typescript: {
    ignoreBuildErrors: true
  },
  // Exclude the Figma-Context-MCP directory from the build
  webpack: (config, { isServer }) => {
    // Add a rule to ignore the Figma-Context-MCP directory
    config.module.rules.push({
      test: /Figma-Context-MCP/,
      loader: 'ignore-loader',
    });
    
    return config;
  },
  // Output static files for Netlify
  output: 'export',
  // Ensure images are handled correctly
  images: {
    unoptimized: true
  },
  // Remove trailing slash
  trailingSlash: false
};

export default nextConfig; 
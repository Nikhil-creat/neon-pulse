// Static export so the app can be served by nginx or GitHub Pages (set NEXT_PUBLIC_BASE_PATH=/neon-pulse for project pages).
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export default { output: "export", images: { unoptimized: true }, basePath: base, assetPrefix: base || undefined, trailingSlash: true };

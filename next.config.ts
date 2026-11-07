import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "true";
const extensoes = ["tsx", "ts", "jsx", "js"];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
  pageExtensions: pages ? extensoes : ["server.ts", ...extensoes],
  env: { NEXT_PUBLIC_LEITURA_FOTO: pages ? "false" : "true", NEXT_PUBLIC_BASE_PATH: pages ? "/meu-guia-carro" : "" },
  ...(pages && {
    output: "export",
    basePath: "/meu-guia-carro",
    assetPrefix: "/meu-guia-carro",
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;

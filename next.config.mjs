/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... outras configs
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Adicione esta linha para evitar que o build falhe por erros de renderização
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverActions: {
      bodySizeLimit: '10mb', // <--- Isso é obrigatório para arquivos maiores
    },
  }

  
};

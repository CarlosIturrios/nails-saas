import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/v2", destination: "/", permanent: false },
      { source: "/v2/capturar", destination: "/capturar", permanent: false },
      { source: "/v2/pendientes", destination: "/pendientes", permanent: false },
      { source: "/v2/agenda", destination: "/agenda", permanent: false },
      { source: "/v2/mas", destination: "/mas", permanent: false },
      { source: "/v2/clientes", destination: "/clientes", permanent: false },
      { source: "/v2/clientes/:id", destination: "/clientes/:id", permanent: false },
      { source: "/v2/propuestas", destination: "/propuestas", permanent: false },
      { source: "/v2/propuestas/:id", destination: "/propuestas/:id", permanent: false },
      { source: "/v2/ordenes", destination: "/ordenes", permanent: false },
      { source: "/v2/ordenes/:id", destination: "/ordenes/:id", permanent: false },
      { source: "/v2/caja", destination: "/caja", permanent: false },
      { source: "/v2/tablero", destination: "/tablero", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/capturar", destination: "/v2/capturar" },
      { source: "/pendientes", destination: "/v2/pendientes" },
      { source: "/agenda", destination: "/v2/agenda" },
      { source: "/mas", destination: "/v2/mas" },
      { source: "/clientes", destination: "/v2/clientes" },
      { source: "/clientes/:id", destination: "/v2/clientes/:id" },
      { source: "/propuestas", destination: "/v2/propuestas" },
      { source: "/propuestas/:id", destination: "/v2/propuestas/:id" },
      { source: "/ordenes", destination: "/v2/ordenes" },
      { source: "/ordenes/:id", destination: "/v2/ordenes/:id" },
      { source: "/caja", destination: "/v2/caja" },
      { source: "/tablero", destination: "/v2/tablero" },
    ];
  },
};

export default nextConfig;

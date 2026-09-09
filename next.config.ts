import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    // Batas bawaan server action adalah 1 MB, terlalu kecil untuk proposal dan
    // LPJ. Dokumentasi kegiatan berukuran besar tidak lewat sini melainkan
    // ditautkan sebagai folder Drive, sesuai PRD 8.18.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default config;

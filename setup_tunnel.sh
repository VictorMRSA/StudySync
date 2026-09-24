#!/bin/bash
# Script para expor o backend local via Cloudflare Tunnel
# Execute: bash setup_tunnel.sh

set -e

echo "=== Instalando cloudflared ==="
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -O /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
echo "✅ cloudflared instalado: $(cloudflared --version)"

echo ""
echo "=== Iniciando túnel para o backend (porta 8000) ==="
echo "⚠️  Copie a URL https://xxxx.trycloudflare.com que aparecer abaixo"
echo "    e cole no Vercel em: Settings → Environment Variables → VITE_API_URL"
echo ""

cloudflared tunnel --url http://localhost:8000

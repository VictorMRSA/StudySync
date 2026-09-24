#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║           StudySync — Iniciar IA para Apresentação           ║
# ║                  Execute: bash start_ia.sh                   ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

# ── Cores ─────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # Reset

BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
LOG_DIR="/tmp/studysync_logs"
mkdir -p "$LOG_DIR"

print_step() { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }
print_ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
print_warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
print_err()  { echo -e "  ${RED}❌ $1${NC}"; }

# ── Limpeza ao sair (Ctrl+C) ──────────────────────────────────
cleanup() {
  echo -e "\n\n${YELLOW}${BOLD}Encerrando StudySync IA...${NC}"
  [ -n "$TUNNEL_PID" ]  && kill "$TUNNEL_PID"  2>/dev/null
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  echo -e "${GREEN}Tudo encerrado. Até logo! 👋${NC}\n"
  exit 0
}
trap cleanup SIGINT SIGTERM

clear
echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║        StudySync — IA Local 🤖           ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. Verifica Ollama ────────────────────────────────────────
print_step "Verificando Ollama..."

if ! command -v ollama &>/dev/null; then
  print_err "Ollama não encontrado. Instale em: https://ollama.com"
  exit 1
fi

# Verifica se já está rodando
if curl -s http://localhost:11434/api/tags &>/dev/null; then
  print_ok "Ollama já está rodando"
else
  print_warn "Iniciando Ollama..."
  ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
  sleep 3
  if curl -s http://localhost:11434/api/tags &>/dev/null; then
    print_ok "Ollama iniciado"
  else
    print_err "Falha ao iniciar Ollama. Veja: $LOG_DIR/ollama.log"
    exit 1
  fi
fi

# Verifica se o modelo está disponível
MODEL="huihui_ai/qwen3-abliterated:4b"
if ollama list 2>/dev/null | grep -q "qwen3"; then
  print_ok "Modelo $MODEL disponível"
else
  print_warn "Baixando modelo $MODEL (~2.5GB, pode demorar)..."
  ollama pull "$MODEL"
  print_ok "Modelo baixado"
fi

# ── 2. Verifica cloudflared ───────────────────────────────────
print_step "Verificando cloudflared..."

if ! command -v cloudflared &>/dev/null; then
  print_warn "cloudflared não encontrado. Instalando..."
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb" \
    -O /tmp/cloudflared.deb
  sudo dpkg -i /tmp/cloudflared.deb > /dev/null 2>&1
  print_ok "cloudflared instalado"
else
  print_ok "cloudflared $(cloudflared --version 2>&1 | head -1)"
fi

# ── 3. Inicia o backend FastAPI ───────────────────────────────
print_step "Iniciando backend FastAPI..."

# Mata qualquer processo na porta 8000
if lsof -ti:8000 &>/dev/null; then
  print_warn "Porta 8000 ocupada — liberando..."
  kill "$(lsof -ti:8000)" 2>/dev/null || true
  sleep 1
fi

cd "$BACKEND_DIR"
source venv/bin/activate

uvicorn main:app --host 0.0.0.0 --port 8000 \
  > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Espera o backend ficar pronto
echo -n "  Aguardando backend"
for i in $(seq 1 15); do
  sleep 1
  echo -n "."
  if curl -s http://localhost:8000/health &>/dev/null || \
     curl -s http://localhost:8000/docs &>/dev/null; then
    break
  fi
done
echo ""

if kill -0 "$BACKEND_PID" 2>/dev/null; then
  print_ok "Backend rodando (PID: $BACKEND_PID)"
else
  print_err "Backend falhou ao iniciar. Veja: $LOG_DIR/backend.log"
  cat "$LOG_DIR/backend.log" | tail -20
  exit 1
fi

# ── 4. Inicia túnel Cloudflare ────────────────────────────────
print_step "Criando túnel público (Cloudflare)..."

cloudflared tunnel --url http://localhost:8000 \
  > "$LOG_DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!

# Captura a URL do túnel
echo -n "  Aguardando URL do túnel"
TUNNEL_URL=""
for i in $(seq 1 30); do
  sleep 1
  echo -n "."
  TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' \
    "$LOG_DIR/tunnel.log" 2>/dev/null | head -1)
  [ -n "$TUNNEL_URL" ] && break
done
echo ""

if [ -z "$TUNNEL_URL" ]; then
  print_err "Não foi possível obter a URL do túnel."
  print_warn "Veja o log: $LOG_DIR/tunnel.log"
  cat "$LOG_DIR/tunnel.log" | tail -10
  exit 1
fi

# ── 5. Exibe instruções finais ────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║            ✅ StudySync IA está ONLINE!              ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}  URL pública da IA:${NC}"
echo -e "  ${CYAN}${BOLD}${TUNNEL_URL}${NC}"
echo ""
echo -e "${BOLD}  📋 Cole no Vercel → Settings → Environment Variables:${NC}"
echo -e "  ${YELLOW}  Nome:  VITE_API_URL${NC}"
echo -e "  ${YELLOW}  Valor: ${TUNNEL_URL}${NC}"
echo ""
echo -e "${BOLD}  📝 Logs:${NC}"
echo -e "  Backend: $LOG_DIR/backend.log"
echo -e "  Túnel:   $LOG_DIR/tunnel.log"
echo ""
echo -e "  ${RED}Pressione Ctrl+C para encerrar tudo${NC}"
echo ""

# Mantém o script vivo
wait

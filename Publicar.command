#!/bin/zsh
# Publicar o site Arsenal da Cerveja — dá push nos commits preparados pelo Claude.
cd "$(dirname "$0")"
find .git -name "*.lock" -delete 2>/dev/null
echo "Enviando para o GitHub..."
git push
echo ""
echo "✅ Publicado! O site atualiza em ~1 minuto:"
echo "   https://arsenal-site.pages.dev"
echo ""
read -k 1 -s "?Pressione qualquer tecla para fechar."

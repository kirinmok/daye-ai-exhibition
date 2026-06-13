#!/bin/bash
# 把 qr_poster.html 一次產出 JPG + PDF 到桌面
# 用法：bash forms/make_qr_assets.sh
#
# 為什麼不用 ⌘P 列印 PDF：
#   Safari/Chrome 列印模式不支援 background-clip:text 等 CSS，
#   所以改用 Chrome --print-to-pdf 直接從 HTML render，
#   保證金黃漸層字、所有色塊、陰影都正常。

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HTML_PATH="$SCRIPT_DIR/qr_poster.html"
PNG_TMP="/tmp/qr_poster.png"
JPG_OUT="$HOME/Desktop/QR海報_大業AI繪圖社成果展.jpg"
PDF_OUT="$HOME/Desktop/大業 AI 繪圖社 成果展 · QR 海報.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "❌ 找不到 Chrome：$CHROME"
  exit 1
fi

echo "🎨 [1/3] 渲染 PNG（截圖用）..."
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=3 --window-size=794,1123 \
  --virtual-time-budget=15000 --screenshot="$PNG_TMP" \
  "file://$HTML_PATH" 2>/dev/null

echo "🗜  [2/3] PNG → JPG（q88，網頁/社群用）..."
sips -s format jpeg -s formatOptions 88 "$PNG_TMP" --out "$JPG_OUT" >/dev/null 2>&1

echo "📄 [3/3] 渲染 PDF（列印實體用）..."
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PDF_OUT" \
  --virtual-time-budget=15000 \
  "file://$HTML_PATH" 2>/dev/null

echo ""
echo "✅ 完成！"
ls -lh "$JPG_OUT" "$PDF_OUT" | awk '{print "   " $5 "  " $9}'
echo ""
open "$JPG_OUT"

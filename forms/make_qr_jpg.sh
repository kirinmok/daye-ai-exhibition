#!/bin/bash
# 把 qr_poster.html 渲染成 JPG，存到桌面
# 用法：bash forms/make_qr_jpg.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HTML_PATH="$SCRIPT_DIR/qr_poster.html"
PNG_OUT="/tmp/qr_poster.png"
JPG_OUT="$HOME/Desktop/QR海報_大業AI繪圖社成果展.jpg"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "❌ 找不到 Chrome：$CHROME"
  exit 1
fi

echo "🎨 渲染 HTML 海報..."
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=3 --window-size=794,1123 \
  --virtual-time-budget=15000 --screenshot="$PNG_OUT" \
  "file://$HTML_PATH" 2>/dev/null

echo "🗜  PNG → JPG（q88）..."
sips -s format jpeg -s formatOptions 88 "$PNG_OUT" --out "$JPG_OUT" >/dev/null 2>&1

echo "✅ 完成：$JPG_OUT"
ls -lh "$JPG_OUT" | awk '{print "   大小：" $5}'

open "$JPG_OUT"

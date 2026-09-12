#!/bin/bash
# Nhấn đúp file này để chạy cả hai dev server của dự án Xuân Hoà Số.
#   Mini App  -> http://localhost:5173
#   Điều hành -> http://localhost:5174
# Đóng cửa sổ Terminal (hoặc Ctrl+C) để dừng.

cd "$(dirname "$0")" || exit 1

if [ ! -d node_modules ] || [ ! -d node_modules/vite ]; then
  echo "==> Chưa có node_modules, đang cài đặt..."
  npm install || exit 1
fi

# Dọn tiến trình cũ còn chiếm cổng, tránh vite tự nhảy sang 5175, 5176...
lsof -ti tcp:5173 -sTCP:LISTEN | xargs -r kill 2>/dev/null
lsof -ti tcp:5174 -sTCP:LISTEN | xargs -r kill 2>/dev/null

echo "==> Mini App     : http://localhost:5173"
echo "==> Hệ điều hành : http://localhost:5174"
echo "==> Nhấn Ctrl+C để dừng cả hai."
echo

npm run dev:mini &
PID_MINI=$!
npm run dev:admin &
PID_ADMIN=$!

trap 'kill $PID_MINI $PID_ADMIN 2>/dev/null' INT TERM
wait

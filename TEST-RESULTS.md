# Kết quả kiểm thử — 2026-11-02

Môi trường: Linux, Node.js, Chromium headless `/usr/bin/chromium`; frontend **dist production**, Node cùng origin port 3000. Không dùng NPC thay người chơi trong test multiplayer.

- `npm test`: 4/4 nhóm PASS. Bundle thật / 111 objects / 3 roads / nguồn ảnh nhúng / lighting night; roadGeometry giữ Bézier. Đường chéo cùng tốc độ, chia bước di chuyển chống xuyên vật cản, clamp dt. Quy tắc nước/cầu và ưu tiên blocked dùng fixture vì map thật không có nước/cầu. Footprint thật theo objectLocal/world. Attack range/cooldown, sequence trùng, validation, timeout, respawn và spawn quái hợp lệ.
- `npm run build`: PASS TypeScript + Vite, không thực thi JSON runtime.source.
- `node tests/protocol.cjs`: PASS với server local. JSON sai, magnitude bất thường, duplicate input, dữ liệu identity/HP giả không có thẩm quyền; ngừng input sau 300ms; giới hạn 50 msg/s và 2048 byte, server tiếp tục hoạt động sau oversized payload.
- `node tests/browser.cjs`: PASS trên bản đóng gói. Hai page Chromium thật kết nối WebSocket; thấy hai player, A di chuyển được quan sát từ B; đánh gây thay đổi mob chung; đóng A thì B thấy xóa player. Offline, menu, đổi phiên, wheel/button zoom; mobile 390×844 @3x và 844×390, joystick pointercancel, pinch qua CDP touch thật, không có pageerror. Ảnh kiểm tra nằm trong `tests/*.png`.
- `node tests/offline-no-backend.cjs`: PASS khi đã dừng Node server 3000, chỉ phục vụ file tĩnh dist tại 4173. Offline chơi được, zero WebSocket, blur dừng di chuyển, quay lại lobby và vào phiên mới được.
- Kiểm tra trực quan screenshots: map đêm, curves, neo ảnh, Y sorting cây/actor và ánh sáng trên actor; không áp DPR/camera hai lần.

## Chưa kiểm chứng / giới hạn

Chưa kiểm thử thiết bị vật lý iOS/Android, tải nhiều người, latency/loss cao, độ ổn định chạy hàng ngày, backend WSS công khai hoặc Docker image chạy thực. Không có cache/PWA để đảm bảo chơi hoàn toàn mất Internet. Chưa có map thật chứa nước/cầu/warp; fixtures chỉ chứng minh quy tắc va chạm, không thay thế QA trực quan trên map tương lai. Chưa có bộ phát cutout thật; interface và factory tách rời đã được TypeScript kiểm tra, chưa thử asset bundle tương lai. Mob chưa có pathfinding. Dự đoán và ack mới là MVP; cần đo và cải thiện dưới mạng xấu.

# Darkin Frontier — MMORPG foundation MVP

Game riêng, không thay đổi Studio. Nhân vật mặc định hiện là Traveler thật từ cutout-demo. Xem [ASSETS.md](ASSETS.md) để biết nguồn, API, clip mapping và quy trình đăng ký tài nguyên. TypeScript + Vite + Canvas 2D, Node.js + ws.

## Chơi và chạy

- Frontend Sites: chọn **Chơi Offline**. Không cần backend game; lần tải đầu cần Internet. Không có service worker hoặc cam kết chơi khi mất Internet.
- Online: mở **Thiết lập kết nối Online**, nhập `wss://your-host/ws`, rồi chọn **Chơi Online**. Chưa triển khai backend công khai. Không tự chuyển Offline khi kết nối lỗi. Thử lại tạo phiên khách mới, không khôi phục danh tính cũ.
- `npm ci`
- Development: `npm run dev` (Vite 5173) và `npm run server` (3000), nhập `ws://localhost:3000/ws` khi thử từ HTTP local.
- Production: `npm run build && PORT=3000 npm start`. Node phục vụ `dist` và `/ws` cùng origin. Dùng reverse proxy HTTPS/WSS cho máy chủ công khai.
- Docker: `docker build -t darkin-frontier .` rồi `docker run --rm -p 3000:3000 -e PORT=3000 darkin-frontier`. Dockerfile đã chuẩn bị; chưa chạy Docker trong môi trường bàn giao.
- `npm test`: kiểm thử map, tốc độ, đường chéo, chia bước va chạm, combat, input timeout.
- `node tests/protocol.cjs`: khi server 3000 chạy, kiểm thử giao thức, rate/payload limit.
- `node tests/browser.cjs`: kiểm thử Chromium tại môi trường bàn giao (đường dẫn Playwright có sẵn trong `/opt/codex/cua_node`; máy khác cần chỉnh đường dẫn require/executablePath hoặc cài Playwright).

## Map thật

Nguồn: https://github.com/kiemlol/Darkin.git; bản gốc được giữ nguyên tại `/workspace/darkin-source`. Bundle `public/game-data/maps/forest.map-bundle.json` sao chép nguyên byte, không thực thi `runtime.source`. `map-runtime.mjs` là MJS từ repository, có mở rộng nhỏ `actors` trong `MapRenderer.draw`: trộn actor với lớp sorted theo Y chân, giữ lớp ground/front và áp atmosphere sau lượt vẽ. API actor/drawActor cũ vẫn hoạt động.

Danh mục: `public/game-data/maps/index.json`. Client/server đọc cùng bundle qua danh mục. Thay bundle và MJS tương ứng ở đây, giữ format `darkin-map-bundle-v1` / `darkin-map-v1`. Nếu đổi tên runtime, cập nhật import trong shared/world.ts và client/main.ts rồi build. Server dùng validateMap/canWalk/moveActor từ chính MJS, không dựng ảnh. Ảnh map là data URI nhúng. Tọa độ chân XY, không chuyển isometric.

Map này: 24×16 ô 128px, 111 vật thể, 3 roads Bézier, night lighting, không có water tiles/bridge/warps. Quy tắc nước/cầu được kiểm thử bằng fixture; chưa có kiểm thử trực quan nước/cầu trên map thật. Dữ liệu warps vẫn giữ nguyên nhưng MVP hiện chỉ tạo một world từ mục đầu catalog; chuyển vùng nhiều map chưa triển khai.

## Kiến trúc

- `src/shared/world.ts`: mô phỏng 20Hz dùng chung Offline/server. Di chuyển chia bước 5px từ runtime, tốc độ server cố định, hit theo hướng/tầm/line-of-sight/cooldown; mob AI có leash, chết và hồi sinh 8 giây.
- `src/server/index.ts`: phiên khách UUID; message chỉ input/respawn. Giới hạn 32 người/world, 64 socket, payload 2KB, 50 message/giây/socket, timeout input 300ms. Snapshot 10Hz. Disconnect xóa player. Không nhận tọa độ/HP từ client. Chưa có account, lưu Online hoặc chống lạm dụng theo IP.
- `src/client/session.ts`: GameSession, LocalGameSession, NetworkGameSession. Dự đoán movement local, replay input chưa ack; nội suy remote 100ms. Không dùng save Offline cho Online. Offline save key riêng `darkin-frontier-mvp:offline:v1`, lưu vị trí/HP/số quái đã hạ; bản lưu đã chết được khôi phục tại spawn với đầy HP khi vào phiên Offline mới. Chết trong phiên hiện tại có bảng hồi sinh rõ ràng. Offline tạm dừng mô phỏng khi mở menu hoặc ứng dụng vào nền; không lưu toàn bộ mob world.
- `src/client/visual.ts`: interface load/update/playAnimation/draw/destroy. `cutout-visual.ts` đã triển khai bộ phát thật; catalog ánh xạ action → clip ID độc lập tên file. Gameplay/input/camera/network không biết hình vẽ placeholder.
- `src/client/input.ts`: bàn phím, joystick pointer capture, release/cancel/lost capture, pinch tách vùng joystick; blur/background gửi dừng.
- `src/client/map.ts` và `camera.ts`: tải danh mục/map, bounds gồm ảnh vật thể, camera follow độc lập networking.
- `src/client/main.ts`: vòng RAF duy nhất, DPR một lần, camera mượt độc lập nội suy remote, zoom .35–2, bounds gồm vật thể nhô ngoài mép, UI và damage numbers. Chuyển phiên hủy input listeners/socket/visuals.

## Phạm vi và giới hạn

MVP một map, sáu quái tạm, không phải MMORPG hoàn chỉnh hoặc đã kiểm thử tải lớn. Chưa có nhiệm vụ, inventory, tài khoản, PvP, kinh tế, cửa hàng asset. Mob dùng steering + va chạm, chưa pathfinding nên có thể mắc sau cây. Không có đảm bảo phục hồi phiên Online sau reload; nút kết nối lại cấp phiên mới. Chưa thử mạng latency cao/loss dài hạn hoặc thiết bị iOS/Android thật. Frontend Sites tĩnh không chạy tiến trình Node thường trú; backend cần host riêng, không có dịch vụ trả phí bắt buộc.

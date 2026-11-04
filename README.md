# Darkin Frontier — MMORPG foundation MVP

Game riêng, không thay đổi Studio. Nhân vật hiện dùng parts từ bundle Studio, bộ phát/bốn clip từ cutout-demo. Xem [MAP-UI.md](MAP-UI.md) để dùng minimap/đồng hồ/bản đồ khám phá; [STUDIO-ACCESSORIES.md](STUDIO-ACCESSORIES.md) để thử kính, đổi đầu/thân và kiểm tra cấu hình; [ASSETS.md](ASSETS.md) ghi API và clip mapping. TypeScript + Vite + Canvas 2D, Node.js + ws.

## Chơi và chạy

- Frontend Sites: chọn **Chơi Offline**. Không cần backend game; lần tải đầu cần Internet. Không có service worker hoặc cam kết chơi khi mất Internet.
- Bấm minimap/đồng hồ góc phải hoặc **M** để mở bản đồ: kéo/pinch/cuộn, **+/−**, **Về vị trí tôi**, **Toàn map**, đóng bằng **M/Escape/Đóng**. Khám phá tiếp tục khi panel đóng, vùng đã đi vẫn sáng.
- Online: mở **Thiết lập kết nối Online**, nhập `wss://your-host/ws`, rồi chọn **Chơi Online**. Chưa triển khai backend công khai. Không tự chuyển Offline khi kết nối lỗi. Server cấp guest token để khôi phục danh tính và vùng khám phá sau reload/kết nối lại; chưa lưu đầy đủ vị trí/HP/thế giới như tài khoản hoàn chỉnh.
- `npm ci`
- Development: `npm run dev` (Vite 5173) và `npm run server` (3000), nhập `ws://localhost:3000/ws` khi thử từ HTTP local.
- Production: `npm run build && PORT=3000 npm start`. Node phục vụ `dist` và `/ws` cùng origin. Dùng reverse proxy HTTPS/WSS cho máy chủ công khai.
- Docker: `docker build -t darkin-frontier .` rồi `docker run --rm -p 3000:3000 -e PORT=3000 -v darkin-data:/app/data darkin-frontier`. Volume giữ guest/exploration/clock; mặc định `GAME_STATE_FILE=data/world-state-v1.json`. Dockerfile đã chuẩn bị; chưa chạy Docker trong môi trường bàn giao.
- `npm test`: kiểm thử map, tốc độ, đường chéo, chia bước va chạm, combat, input timeout.
- `node tests/protocol.cjs`: khi server 3000 chạy, kiểm thử giao thức, rate/payload limit.
- `node tests/browser.cjs`: kiểm thử Chromium tại môi trường bàn giao (đường dẫn Playwright có sẵn trong `/opt/codex/cua_node`; máy khác cần chỉnh đường dẫn require/executablePath hoặc cài Playwright).

## Map thật

Nguồn: https://github.com/kiemlol/Darkin.git; bản gốc được giữ nguyên tại `/workspace/darkin-source`. Bundle `public/game-data/maps/forest.map-bundle.json` sao chép nguyên byte, không thực thi `runtime.source`. `map-runtime.mjs` là MJS từ repository, có mở rộng nhỏ `actors` trong `MapRenderer.draw`: trộn actor với lớp sorted theo Y chân, giữ lớp ground/front và áp atmosphere sau lượt vẽ. API actor/drawActor cũ vẫn hoạt động.

Danh mục: `public/game-data/maps/index.json`. Client/server đọc cùng bundle qua danh mục. Thay bundle và MJS tương ứng ở đây, giữ format `darkin-map-bundle-v1` / `darkin-map-v1`. Nếu đổi tên runtime, cập nhật import trong shared/world.ts và client/main.ts rồi build. Server dùng validateMap/canWalk/moveActor từ chính MJS, không dựng ảnh. Ảnh map là data URI nhúng. Tọa độ chân XY, không chuyển isometric.

Map này: 24×16 ô 128px, 111 vật thể, 3 roads Bézier, night lighting, không có water tiles/bridge/warps. Quy tắc nước/cầu được kiểm thử bằng fixture; chưa có kiểm thử trực quan nước/cầu trên map thật. Dữ liệu warps vẫn giữ nguyên nhưng MVP hiện chỉ tạo một world từ mục đầu catalog; chuyển vùng nhiều map chưa triển khai.

## Kiến trúc

- `src/shared/world.ts`: mô phỏng 20Hz dùng chung Offline/server. Di chuyển chia bước 5px từ runtime, tốc độ server cố định, hit theo hướng/tầm/line-of-sight/cooldown; mob AI có leash, chết và hồi sinh 8 giây.
- `src/server/index.ts`: phiên khách UUID; message input/respawn và ID ngoại hình/phụ kiện đã phát hành. Giới hạn 32 người/world, 64 socket, payload 2KB, 50 message/giây/socket, timeout input 300ms. Snapshot 10Hz có clock; mask khám phá chỉ gửi riêng cho chủ nhân, server lưu atomic theo guest token. Disconnect xóa actor, giữ danh tính/mask. Không nhận tọa độ/HP/fit transform/seen từ client. Chưa có account, lưu toàn thế giới Online hoặc chống lạm dụng theo IP.
- `src/client/session.ts`: GameSession, LocalGameSession, NetworkGameSession. Dự đoán movement local, replay input chưa ack; `presentation.ts` nội suy Offline và prediction giữa tick 20Hz ở tốc độ render, bù sai lệch server riêng và buffer remote 100ms theo server time. Camera theo cùng tọa độ hiển thị và tích phân theo thời gian frame. Không dùng save Offline cho Online. Offline save key `darkin-frontier-mvp:offline:v1:<characterId>`, lưu vị trí/HP/số quái/clock; đọc tương thích save Lữ khách cũ. Bản lưu đã chết khôi phục tại spawn đầy HP; chết trong phiên có bảng hồi sinh. Tạm dừng Offline khi mở menu/ứng dụng vào nền; cửa sổ bản đồ không pause. Không lưu toàn bộ mob world.
- `src/client/visual.ts`: interface load/update/playAnimation/draw/destroy. `cutout-visual.ts` đã triển khai bộ phát thật; catalog ánh xạ action → clip ID độc lập tên file. Gameplay/input/camera/network không biết hình vẽ placeholder.
- `src/client/input.ts`: bàn phím, joystick pointer capture, release/cancel/lost capture, pinch tách vùng joystick; blur/background gửi dừng.
- `src/client/map.ts` và `camera.ts`: tải danh mục/map, camera theo nhân vật và giới hạn trong nền terrain để không lộ phần ngoài map.
- `src/client/main.ts`: vòng RAF duy nhất, DPR một lần, camera mượt độc lập nội suy remote, zoom có mức tối thiểu theo kích thước màn hình để luôn phủ kín nền map, UI và damage numbers. Chuyển phiên hủy input listeners/socket/visuals.

## Phạm vi và giới hạn

MVP một map, sáu quái tạm, không phải MMORPG hoàn chỉnh hoặc đã kiểm thử tải lớn. Chưa có nhiệm vụ, inventory, tài khoản, PvP, kinh tế, cửa hàng asset. Mob dùng steering + va chạm, chưa pathfinding nên có thể mắc sau cây. Online khôi phục guest/exploration qua token trên cùng trình duyệt; chưa có tài khoản để khôi phục token đã mất hoặc chuyển thiết bị. Chưa thử mạng latency cao/loss dài hạn hoặc thiết bị iOS/Android thật. Frontend Sites tĩnh không chạy tiến trình Node thường trú; backend cần host riêng, không có dịch vụ trả phí bắt buộc.

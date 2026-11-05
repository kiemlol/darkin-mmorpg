# Darkin Frontier — MMORPG foundation MVP

Game riêng, không thay đổi Studio. Nhân vật hiện dùng parts từ bundle Studio, bộ phát/bốn clip từ cutout-demo. Xem [MAP-UI.md](MAP-UI.md) để dùng minimap/đồng hồ/bản đồ khám phá; [STUDIO-ACCESSORIES.md](STUDIO-ACCESSORIES.md) để thử kính, đổi đầu/thân và kiểm tra cấu hình; [ASSETS.md](ASSETS.md) ghi API và clip mapping. TypeScript + Vite + Canvas 2D, Node.js + ws.

## Chơi và chạy

Nhân vật tăng thêm **8%** (scale .7452), zoom mặc định **110%**. Điều khiển ngang lùi vào khỏi mép/safe area, nút phi kiếm đặt cạnh nút đánh. **Menu → Hoạt ảnh → Thử hoạt ảnh bắn cung** phát clip bow1 mới, tạm ẩn kiếm; chưa có cung/tên hoặc sát thương tầm xa. Xem [BOW-LAYOUT.md](BOW-LAYOUT.md).

Bấm **Phi kiếm** hoặc **F** khi đeo kiếm và rời giao chiến: kiếm bay một vòng, lớn nhẹ, nhân vật dùng clip Nhảy mới rồi đứng idle trên kiếm. WASD/joystick lái cùng nhân vật; bấm lại để hạ. Có bóng dưới kiếm, giữ va chạm/tốc độ/combat cũ. Xem [SWORD-FLIGHT.md](SWORD-FLIGHT.md) về clip gốc, config, sync và kiểm thử.

Kiếm chắp vá đã là vũ khí hiển thị mặc định, dùng đúng bốn bộ neo Studio theo idle/walk/run/attack (pack 4 cho attack). Menu → Thử phụ kiện Studio cho phép Đeo/Tháo. Gần linh thạch dùng búa tạm thời rồi trả lại kiếm; không thay chỉ số chiến đấu. Xem [PATCHWORK.md](PATCHWORK.md) về file nguồn, binding ID và kiểm thử.

Runtime hiện dùng gói Cutout v2 mới; ID hoạt ảnh đã được lưu cố định trong catalog, neo phụ kiện có thể cấu hình bằng `animationProfiles[].animationId`, thiếu profile dùng neo mặc định. Xem [RUNTIME-V2.md](RUNTIME-V2.md) về bảng ID, cách nạp animation/accessory pack và kiểm thử. Giữ nguyên các asset/clip/gameplay hiện tại.

Nhân vật mặc định hiện dùng nguyên asset/rig/khớp của `traveler.cutout 8.json`, búa và điểm neo mới. Hoạt ảnh idle/walk/run/attack và vung búa đào cũ giữ nguyên. Hai gói kính mới đã thay nhưng profile đang nhắm một đầu khác, nên thao tác Đeo sẽ báo thiếu cấu hình thay vì gắn sai; xem [STUDIO-ACCESSORIES.md](STUDIO-ACCESSORIES.md). Không cần xóa save để nhận nhân vật mới.

Map hiện tại là nguyên bundle upload `spawn_map.map-bundle 6.json`. Map/runtime cũ được sao lưu trong `backups/maps/`. Xem [MINING.md](MINING.md) về tương tác, clip/búa thật từ `traveler.cutout.json`, ví và lưu giao dịch. Đi gần đá có tương tác, dừng lại rồi bấm **Đào** trên chính nút đánh hoặc Space. Đào đủ 3 giây nhận 3–8 Linh thạch; đá biến mất và chờ 30 giây. Di chuyển, chết, giao chiến hoặc ngắt kết nối trước khi đủ thời gian sẽ hủy. Khi giao chiến nút ưu tiên đánh. HUD hiển thị một nguồn số dư `wallet.spirit_stone`.

HUD người chơi mới ở trái, cụm map/clock đã thu nhỏ bên phải; xem [HUD-REALMS.md](HUD-REALMS.md) về tài nguyên, registry/migration cảnh giới và kiểm thử. Nhân vật mới Người phàm, ẩn bậc nhỏ; chưa có MP hoặc cơ chế đột phá.

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

Nguồn map mới: file upload `spawn_map.map-bundle 6.json`. Bundle `public/game-data/maps/forest.map-bundle.json` sao chép nguyên byte, không thực thi `runtime.source`. Runtime MJS nền từ https://github.com/kiemlol/Darkin.git (v2 đang phát hành trong repository) có adapter schema tương tác mới: ẩn node/va chạm runtime, rung vẽ không đổi tọa độ gốc, grounding và bóng theo metadata. Không tuyên bố đã dùng toàn bộ runtime v5 nhúng trong JSON. Mở rộng `actors` trộn actor với lớp sorted theo Y chân, giữ lớp ground/front và ánh sáng sau lượt vẽ; API actor/drawActor cũ vẫn hoạt động.

Danh mục: `public/game-data/maps/index.json`. Client/server đọc cùng bundle qua danh mục. Thay bundle và MJS tương ứng ở đây, giữ format `darkin-map-bundle-v1` / `darkin-map-v1`. Nếu đổi tên runtime, cập nhật import trong shared/world.ts và client/main.ts rồi build. Server dùng validateMap/canWalk/moveActor từ chính MJS, không dựng ảnh. Ảnh map là data URI nhúng. Tọa độ chân XY, không chuyển isometric.

Map này: 24×16 ô 128px, 111 vật thể, 3 roads Bézier, night lighting, 10 node tương tác và 8 vùng monsterSpawns nguyên bản chưa kích hoạt theo yêu cầu. Spawn mới (2076,831). Sáu quái MVP vẫn dùng luật cũ, chưa lấy vị trí từ các vùng thiết kế. Không có water tiles/bridge/warps; nước/cầu được kiểm thử bằng fixture. MVP hiện chỉ tạo một world từ mục đầu catalog; chuyển vùng nhiều map chưa triển khai.

## Kiến trúc

- `src/shared/interactions.ts` và `resources.ts`: dùng chung cho Offline/server, handler theo actionId, range/LOS/thời gian/khóa node/chu kỳ, wallet số nguyên. Server chọn reward, lưu wallet+node+ledger trong một lần ghi atomic trước khi công bố; không tin kết quả Offline. Reconnect cùng tab dùng bearer token tiếp quản phiên cũ; không tạo hai actor của cùng phiên.
- `src/server/guest-store.ts`: payload v3 giữ guest/exploration/clock/cảnh giới/ví và node/ledger, hàng đợi ghi + fsync + atomic rename. Docker volume `/app/data` phải giữ toàn bộ file `GAME_STATE_FILE` (mặc định `data/world-state-v1.json`), không xóa riêng ledger. Chỉ một tiến trình ghi file. Giới hạn hiện tại 100.000 giao dịch/map instance; chưa phải cơ sở dữ liệu phân tán.
- Offline giữ key cũ `darkin-frontier-mvp:offline:v1:<characterId>` nhưng payload v3 thêm ví và interactionMaps; migration giữ các trường hợp lệ, không ghi khóa Studio. Hết quota localStorage thì từ chối thưởng/biến mất node và báo lỗi. Danh tính, tiền và node Online tách hoàn toàn khỏi Offline. Sáu quái và HP/vị trí Online vẫn không được lưu như tài khoản đầy đủ.
- `src/shared/world.ts`: mô phỏng 20Hz dùng chung Offline/server. Di chuyển chia bước 5px từ runtime, tốc độ server cố định, hit theo hướng/tầm/line-of-sight/cooldown; mob AI có leash, chết và hồi sinh 8 giây.
- `src/server/index.ts`: phiên khách UUID; message input/respawn và ID ngoại hình/phụ kiện đã phát hành. Giới hạn 32 người/world, 64 socket, payload 2KB, 50 message/giây/socket, timeout input 300ms. Snapshot 10Hz có clock; mask khám phá chỉ gửi riêng cho chủ nhân, server lưu atomic theo guest token. Disconnect xóa actor, giữ danh tính/mask. Không nhận tọa độ/HP/fit transform/seen từ client. Chưa có account, lưu toàn thế giới Online hoặc chống lạm dụng theo IP.
- `src/client/session.ts`: GameSession, LocalGameSession, NetworkGameSession. Dự đoán movement local, replay input chưa ack; `presentation.ts` nội suy Offline và prediction giữa tick 20Hz ở tốc độ render, bù sai lệch server riêng và buffer remote 100ms theo server time. Camera theo cùng tọa độ hiển thị và tích phân theo thời gian frame. Không dùng save Offline cho Online. Offline save key `darkin-frontier-mvp:offline:v1:<characterId>`, lưu vị trí/HP/số quái/clock; đọc tương thích save Lữ khách cũ. Bản lưu đã chết khôi phục tại spawn đầy HP; chết trong phiên có bảng hồi sinh. Tạm dừng Offline khi mở menu/ứng dụng vào nền; cửa sổ bản đồ không pause. Không lưu toàn bộ mob world.
- `src/client/visual.ts`: interface load/update/playAnimation/draw/destroy. `cutout-visual.ts` đã triển khai bộ phát thật; catalog ánh xạ action → clip ID độc lập tên file. Gameplay/input/camera/network không biết hình vẽ placeholder.
- `src/client/input.ts`: bàn phím, joystick pointer capture, release/cancel/lost capture, pinch tách vùng joystick; blur/background gửi dừng.
- `src/client/map.ts` và `camera.ts`: tải danh mục/map, camera theo nhân vật và giới hạn trong nền terrain để không lộ phần ngoài map.
- `src/client/main.ts`: vòng RAF duy nhất, DPR một lần, camera mượt độc lập nội suy remote, zoom có mức tối thiểu theo kích thước màn hình để luôn phủ kín nền map, UI và damage numbers. Chuyển phiên hủy input listeners/socket/visuals.

## Phạm vi và giới hạn

MVP một map, sáu quái tạm, không phải MMORPG hoàn chỉnh hoặc đã kiểm thử tải lớn. Chưa có nhiệm vụ, inventory, tài khoản, PvP, kinh tế, cửa hàng asset. Mob dùng steering + va chạm, chưa pathfinding nên có thể mắc sau cây. Online khôi phục guest/exploration qua token trên cùng trình duyệt; chưa có tài khoản để khôi phục token đã mất hoặc chuyển thiết bị. Chưa thử mạng latency cao/loss dài hạn hoặc thiết bị iOS/Android thật. Frontend Sites tĩnh không chạy tiến trình Node thường trú; backend cần host riêng, không có dịch vụ trả phí bắt buộc.

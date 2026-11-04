# Minimap, đồng hồ và khám phá — HUD v2

Đã đọc README.md và PROMPT-CODEX.md từ `map-ui-custom-v2.zip`. Sáu PNG nguyên byte ở `public/game-data/map-ui-v2/`; README/prompt gốc giữ cùng thư mục. Không xóa nền hoặc sửa alpha. Không thay map hiện tại bằng ảnh tham khảo.

## Sử dụng

Chọn **Chơi Offline**. Cụm góc phải gồm đồng hồ xanh bên trái, minimap đỏ bên phải, bảng giờ và dải tên lấy từ `project.name`. Marker là chân XY của nhân vật đang chơi, mũi tên là hướng nhìn; bản đồ luôn bắc ở trên. Đầu đại diện lấy từ rig/đầu/phụ kiện hiện dùng, cache theo variant ngoại hình.

Bấm lòng minimap/đồng hồ hoặc nhấn **M** để mở. **M/Escape/Đóng** đóng, cuộn hoặc **+/−** zoom, kéo/pinch để di chuyển, **Về vị trí tôi** và **Toàn map** để căn lại. Lần mở đầu fit toàn map đúng tỷ lệ, nền ngoài map là letterbox. Thế giới vẫn chạy khi xem bản đồ; joystick và đánh được nhả khi mở/đóng, input không xuyên panel. Menu cũ vẫn tạm dừng Offline như trước.

## Nguồn dữ liệu và lớp vẽ

- `src/client/map-view.ts`: MapBaseCache dùng chính `MapRenderer` của MJS hiện có để vẽ terrain, roads Bézier, cây/đá/vật thể, anchor/rotation/scale/layer gốc. Không vẽ actor, marker editor, collision hoặc spawn debug. Nền trung tính ban ngày; fog riêng, không lấy darkness của cảnh chơi. Cache theo mapId + revision, tối đa hai map, cạnh texture tối đa 1536px. Marker riêng mỗi frame; fog chỉ rebuild khi đổi, tối đa 10Hz.
- MapProjection chung cho nền/fog/marker, không nhân cell size vào world XY, không áp camera gameplay. Minimap crop clamp ở mép; marker không bị ép vào tâm sai vị trí. FullMapPanel dùng cùng composite và ExplorationStore.
- `src/client/map-hud.ts`: cấu hình lỗ đo theo pixel ảnh gốc. Xanh 799×914: tâm (397,437), bán kính (259,259). Đỏ 885×908: tâm (450,445), bán kính (294,271), lòng hơi oval. Clip chồng nhẹ dưới vòng viền để kín khe. Canvas z=1, khung PNG z=2, hitbox ellipse z=3; ảnh không bắt pointer. Toàn stage 1500×1180 scale thống nhất theo viewport và safe-area; không kéo méo từng ảnh. Chữ tối trên ruy băng sáng, tên dài ellipsis + title.
- `src/client/full-map.ts`: panel/pointer pan/pinch, không RAF riêng. `main.ts` giữ một RAF. DPR chỉ áp một lần cho mỗi canvas, tối đa 3.
- `map.ts` giữ `sourceProject` nguyên dữ liệu để hash revision và tạo phiên. Scene lighting được thay trong bản project hiển thị; thay giờ không đổi revision khám phá.

## Khám phá và danh tính

`src/shared/map-state.ts`: Uint8Array + lưu bitset hex có version và kiểm tra kích thước/scope. Phủ vùng chưa đi RGB(22,19,34), alpha 150/255, vùng đã đi alpha=0; làm mềm khi nội suy texture. Chỉ phủ bản đồ UI, không phủ cảnh chiến đấu. Không có marker quái/cửa/NPC hay monsterSpawns thiết kế.

`explorationConfig(project)` là điểm cấu hình theo world units: cell = 0.5×ô Studio, radius = 2×ô Studio (map hiện tại 64px/256px). Quét điểm trung gian giữa vị trí hợp lệ ở tốc độ chạy. Teleport có `teleportSeq`; thay epoch hoặc quãng nhảy bất hợp lý chỉ mở đích. Di chuyển sau teleport bắt đầu vệt mới.

Scope bắt buộc `characterId + worldId + mapId + mapRevision`. Revision là hash dữ liệu project gốc, thay map tạo mask mới; hiện chưa migration mask giữa revision. Đổi ngày đêm không đổi mask.

- Offline: UUID ổn định theo tên thử nghiệm trên trình duyệt này; đổi tên ở lobby là nhân vật thử nghiệm khác. LocalStorage khóa `darkin-frontier:character:v1:*`, `darkin-frontier:exploration:v1:*`, save game `darkin-frontier-mvp:offline:v1:<characterId>`. Không dùng khóa Studio. Lưu mỗi 2 giây, khi pagehide/background và khi đóng phiên. **Bắt đầu lại** chỉ xóa tiến trình của nhân vật Offline đang chọn. Đọc legacy save cũ cho Lữ khách để không mất tiến trình cũ.
- Online: server cấp characterId + resume token ngẫu nhiên, không tin tên để xác định quyền. Token được giữ local/sessionStorage theo URL server + tên; chỉ gửi lúc join. Hai tab cùng token đang hoạt động được cấp danh tính khác để không chiếm phiên của nhau. Danh tính và mask được lưu server; chỉ nhận vị trí actor đã qua collision/speed validation. Client chỉ nhận mask của chính mình, không gửi seen hoặc vị trí khám phá lên server. Reload/kết nối lại có token giữ danh tính và mask; vị trí/HP/mob không được restore như hệ tài khoản đầy đủ. Xóa bộ nhớ trình duyệt sẽ mất token; chưa có khôi phục tài khoản hoặc đồng bộ thiết bị.
- Server `src/server/guest-store.ts` lưu hash token, scope và mask vào `GAME_STATE_FILE` (mặc định `data/world-state-v1.json`), ghi atomic 5 giây/lần và shutdown. File không được commit hoặc đưa vào frontend. Tối đa 2048 guest lưu trên server MVP. Khi triển khai cần volume ghi được; sao lưu file này để giữ tiến độ. Mất điện có thể mất tối đa khoảng 5 giây gần nhất.

## Giờ thế giới

Trước tích hợp map chỉ có lighting authored cố định và `World.time`. Adapter clock bây giờ lấy thời gian mô phỏng này: `gameSeconds = clockBaseSeconds + world.time × CLOCK_RATE`. Mặc định 60 giây game/1 giây mô phỏng (ngày dài 24 phút thực). Khởi đầu từ giờ authored của map (23h), có lưu clock.

World snapshot gửi clock server cho Online; client nội suy tối đa 1 giây giữa snapshots, không lấy Date.now/giờ máy. Offline dùng cùng clock trong LocalGameSession và lưu lại. Cả chữ giờ, trời HUD, sun/moon và scene lighting cùng nguồn. Bình minh 5–7h, ngày 7–17:30h, hoàng hôn 17:30–19:30h, đêm 19:30–5h; gradient HUD chuyển liên tục. Scene terrain dùng bước 5 phút game để giới hạn cache palette của runtime, atmosphere vẫn cùng giờ đó. Không thêm buff, aggro hay drop theo đêm.

## Backend và kiểm thử

Sites là frontend tĩnh, không chạy Node/WebSocket thường trú. Offline hoạt động trên Sites, Online cần host Node riêng có HTTPS/WSS. Chạy local `npm ci && npm run build && PORT=3000 npm start`, mở hai trình duyệt HTTP localhost:3000 và nhập `ws://localhost:3000/ws`. Production HTTPS phải nhập WSS. Backend công khai chưa được triển khai.

Docker: `docker build -t darkin-frontier .`, rồi `docker run --rm -p 3000:3000 -e PORT=3000 -v darkin-data:/app/data darkin-frontier`. Volume giữ danh tính/khám phá/clock. Chưa chạy Docker thực trong môi trường này.

Các lệnh kiểm tra: `npm test`, `npm run build`; Node server port3000 cho `node tests/map-ui-browser.cjs`, `node tests/map-ui-online.cjs`, `node tests/browser.cjs`; Vite preview port4173 cho `node tests/map-ui-touch.cjs`, `node tests/offline-no-backend.cjs`; Vite dev5173 cho `node tests/map-ui-harness.cjs`. Browser scripts dùng Chromium/Playwright có sẵn tại `/opt/codex/cua_node`; máy khác chỉnh đường dẫn hoặc cài Playwright.

Map thật hiện tại không vuông (3072×2048), chưa có nước/cầu/warp. Game vẫn chỉ một map, chưa thêm chức năng chuyển vùng gameplay. Việc chuyển/chờ/quay lại map được kiểm bằng fixture adapter và scope, không giả là đã đi qua cửa chuyển vùng thật. Xem TEST-RESULTS.md về kiểm thử thực tế và giới hạn thiết bị/backend.

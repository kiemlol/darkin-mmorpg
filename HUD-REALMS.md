# HUD người chơi và dữ liệu cảnh giới

## Quy ước hiển thị

Nhân vật mới có `realmId=mortal`, `realmStageId=early`, hiển thị **Người phàm**. Theo ngoại lệ cuối cùng trong yêu cầu, người phàm không hiện bậc nhỏ; dữ liệu stage vẫn giữ riêng để không phá save/schema 20 tổ hợp. Các cảnh giới khác: bảng vàng dưới hai rãnh chỉ số là tên cảnh giới lớn; bảng nhỏ có sẵn dưới avatar chỉ là Sơ kỳ/Trung kỳ/Hậu kỳ/Viên mãn. Ví dụ `core_formation + middle` → Kết Đan Kỳ + Trung kỳ. Không dùng cấp, nghề hoặc tên hiển thị làm ID.

Registry dùng chung trong `src/shared/realms.ts`:

| realmId | Nhãn |
|---|---|
| mortal | Người phàm |
| qi_condensation | Ngưng Khí Kỳ |
| foundation_establishment | Trúc Cơ Kỳ |
| core_formation | Kết Đan Kỳ |
| nascent_soul | Nguyên Anh Kỳ |

| realmStageId | Nhãn |
|---|---|
| early | Sơ kỳ |
| middle | Trung kỳ |
| late | Hậu kỳ |
| perfection | Viên mãn |

Chưa có điều kiện đột phá, tăng chỉ số, tiêu hao, nút thăng bậc hoặc endpoint đổi cảnh giới. `World.setRealm` là thao tác nội bộ có validate và cập nhật cặp nguyên tử để logic server sau này gọi sau khi xác minh điều kiện/quyền. WebSocket không nhận lệnh này. Thay cảnh giới không thay tốc độ, HP, sát thương, rig, ngoại hình hoặc vị trí.

## Lưu và quyền quyết định

- Offline: cùng save nhân vật/characterId, giữ khóa ổn định `darkin-frontier-mvp:offline:v1:<characterId>`, payload nâng lên version2. Save thiếu trường nào chỉ thêm mặc định cho trường đó; giá trị hợp lệ giữ nguyên. Migration viết lại ngay một lần. Realm được đọc độc lập mapId nên vào map khác không làm mất cảnh giới. Save, pagehide, reload và respawn đều giữ cặp hiện tại.
- Online: `GuestStore` của server lưu cặp theo danh tính khách/token, file state payload version2; đọc tương thích version1. Join lấy realm từ profile server, bỏ qua realm do client gửi; snapshot là nguồn cho HUD của mọi client. Tick server ghi thay đổi nội bộ hợp lệ về profile và lưu atomic theo lịch. Reload/reconnect/khởi động lại Node giữ cặp. Không đưa save Offline lên Online. Profile server cũ được bổ sung trường thiếu khi nạp, flush migration trước khi mở cổng.
- Giá trị không thuộc registry được thay mặc định riêng cho trường lỗi; giữ trường còn lại nếu hợp lệ. Có cảnh báo trong **Menu → Trạm nghỉ**. Server cũng ghi cảnh báo migration theo ID, không ghi token. Snapshot Online có realm sai bị từ chối với trạng thái lỗi; không âm thầm coi là kết quả gameplay hợp lệ.
- Không có account đầy đủ hoặc chuyển token giữa thiết bị. Vẫn cần volume `/app/data` cho backend như README. Chưa có backend WSS công khai; Sites chỉ chạy frontend/Offline.

## Tài nguyên và tọa độ HUD

Dùng đúng **ảnh 3** và **ảnh 4**, không dùng ảnh 5 đã ghép. Bản gốc là JPEG RGB 1280×426 có nền trắng, không phải PNG alpha:

- `public/game-data/player-hud/player-frame.jpg`: nguyên byte ảnh 3.
- `public/game-data/player-hud/realm-plaque.jpg`: nguyên byte ảnh 4, lớp phủ riêng dưới hai rãnh.

`src/client/hud-art.ts` nạp/cached hai ảnh và tạo mask Canvas lúc hiển thị: flood chỉ vùng trắng liên thông với mép ảnh, cùng vùng trắng liên thông từ tâm lỗ avatar cho ảnh3. Không xóa toàn bộ trắng theo màu; hoa và highlight có viền ngăn vẫn giữ. Không crop/resize hoặc ghi đè ảnh nguồn. Đã kiểm pixel alpha ngoài, lỗ avatar, hoa trắng và thân vàng thực.

`src/client/player-hud.ts` định nghĩa các vùng theo pixel gốc: avatar (55,65,228,228), HP (371,133,816,36), MP (371,211,816,34); nhãn bậc nhỏ (96,309,152,40). Bảng vàng ảnh4 có tỷ lệ tự nhiên, đặt riêng trong thân dưới rãnh MP. Nhãn cảnh giới fit font có giới hạn theo chiều rộng thật, không cắt Nguyên Anh Kỳ; stage fit riêng cho Trung kỳ/Viên mãn.

Avatar dùng chính `CutoutCharacterVisual.portrait()` của đầu/trang bị hiện tại, cache theo variant key; tăng raster avatar lên192px để dùng trên DPR cao. Không tạo actor/world thứ hai. HUD đọc actor đang chạy, không đổi rig/điểm chân/animation, vẫn dùng RAF duy nhất của `main.ts`.

Tên phía trên HP, nghề/kiểu chiến đấu có vùng riêng và ellipsis/title khi dài. HP đỏ hiển thị current/max thật; ratio clamp0..1, max0/NaN không chia lỗi. Game **chưa có MP/Năng lượng**: hàng dưới không fill, ghi Chưa kích hoạt. Renderer hỗ trợ dữ liệu MP trong fixture/future adapter nhưng không tạo MP, skill hay tiêu hao mới trong gameplay.

## Bố cục và điều khiển

Đã bỏ logo DARKIN và DOM player-card cũ. `#top-hud` dùng grid 64.5%/35.5% sau safe-area/gap; thông tin trái, toàn cụm map/clock/bảng tên/giờ phải. Desktop giới hạn player520px, map210px; màn thấp giới hạn330px/145px và đặt +/- ngang cạnh menu để không chồng menu/đánh. Mobile360/390/430 chia theo chiều rộng thực. Cả stage ảnh/canvas/clip/text/hitbox cùng scale, không resize riêng vòng minimap. Bản đồ lớn/fog/clock/server logic giữ nguyên.

Tất cả trang trí/ảnh/nhãn pointer-events:none; hitbox minimap ellipse, menu, +/- và điều khiển game mới bắt pointer. Fixed layout hỗ trợ viewport-fit/safe-area, không gây scroll ngang. Chưa QA trên iPhone/Safari vật lý; Chromium touch emulation không thay thế hoàn toàn thiết bị thật.

## Kiểm tra

- `npm test`: registry/migration/save/20 cặp/server persistence + hồi quy hiện có.
- `node tests/realm-hud-browser.cjs`: build production/Node3000; 360/390/430/844×390/1440×900, không chồng HUD, menu/zoom/đánh, HP thật, avatar thay đầu, reload và bản đồ lớn. Screenshots `tests/hud-layout-*.png`.
- `node tests/realm-hud-harness.cjs`: Vite5173, kiểm 20 nhãn, tên/nghề dài, HP/MP fixture đầy/cạn/0/NaN, chết/hồi sinh, alpha thật và portrait cache. `tests/hud-realm-*.png`. Harness chỉ phục vụ dev, không nằm trong dist/Sites, không có nút thăng cảnh giới trong bản phát hành.
- `node tests/realm-online.cjs`: tự tạo file dữ liệu fixture/Node3001, hai browser WebSocket thật; profile server hợp lệ, guest mới, input/join giả realm, lệnh nâng realm bị từ chối, di chuyển/đánh nhìn thấy ở client kia, reload và restart/reconnect giữ cặp. Fixture/temp server được dọn sau test.

Xem TEST-RESULTS.md về kết quả từng lượt và giới hạn backend/mobile.

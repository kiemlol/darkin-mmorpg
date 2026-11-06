# Map7 / runtime Studio8 và phi kiếm mọi vũ khí

Map mới `spawn_map.map-bundle 7.json` được chép **nguyên byte** vào `public/game-data/maps/forest.map-bundle.json`, vẫn nạp qua `maps/index.json`. Runtime đính kèm tên `map-runtime 4.mjs` tự khai báo `MAP_RUNTIME_VERSION=8`; giữ nguyên tên format/class/API, không hạ version theo tên file. Bản nguyên byte nằm ở `maps/studio/map-runtime.mjs`; hash và nguồn ở `maps/studio/source-index.json`. Bundle chứa runtime.source giống file đó nhưng game **không eval/source-execute JSON**, chỉ import module MJS. Backup trước cập nhật: `backups/maps/before-map7/`.

Bản mới chỉ bổ sung 6 `assets[].occlusionMask`. 111 object, ID, ảnh/alpha, neo/scale/rotation/flip/layer/collider/walk, 3 roads cong, terrain, spawn, 8 vùng quái dự trữ và interaction của từng object đều nguyên. Chưa kích hoạt các vùng quái dự trữ; giữ sáu quái MVP như trước.

`maps/map-runtime.mjs` là facade mỏng giữ tương thích extension game:

- `actors` được chuyển vào lượt `entities` theo Y chân do runtime mới cung cấp. Actor dùng để occlusion/lighting chính là nhân vật mình đang điều khiển, chân XY giữ nguyên, không dùng tâm camera hoặc gốc ảnh thân. Chiều cao hình ảnh chỉ cung cấp vùng lấy mẫu mask; không đổi tọa độ chân/hitbox. Khi chưa có người chơi thì actor=null.
- Mask nhúng được giải mã/cache bằng API của bộ phát. Không crop ảnh, không dùng cả hình chữ nhật trong suốt làm tán cây. Object ground point, scale/rotation/flip và layer do runtime mới quyết định.
- Callback `setObjectActivity` của game vẫn áp dụng cho pointWalkable/canWalk/moveActor và DarkinMapPlayer.update: quặng cạn biến mất thì collider cũng tắt, hồi phục node vẫn chờ vùng chân trống. Không thay code xử lý phần thưởng bằng InteractionSimulator/MonsterPreview.
- Để không làm lệch gameplay đã có, facade vẫn cho game dùng reward=0 hoặc gather/custom chỉ có handler. Studio kiểm một validation view riêng với placeholder chỉ phục vụ kiểm cấu trúc; dữ liệu gốc trả về không bị sửa, không phát tiền placeholder. InteractionSystem tiếp tục kiểm registry resource và handler thật.

`SmoothMapRenderer` hiện kế thừa cơ chế blend cả lớp nền ngày/đêm của runtime8, thêm bộ đếm chẩn đoán. Chỉ cache endpoint ngày/đêm (terrain/road/overview), tái sử dụng Canvas ánh sáng. **Không clear cache theo giờ, phút, nấc nightness hoặc đồng bộ snapshot**. Ánh sáng nội suy bằng LightingTransition gốc; giờ scene/HUD vẫn cùng clock local hoặc server. Khi camera tới vùng mới hoặc map/dữ liệu thực đổi, renderer có thể tạo cache cần thiết như bình thường.

MapRevision bỏ qua đúng trường render-only `occlusionMask` khi hash. Vì map7 chỉ thêm mask, scope khám phá cũ vẫn dùng được; không chuyển dữ liệu khám phá giữa nhân vật hoặc giữa map khác. Thay đổi terrain/vật cản/vị trí/dữ liệu còn lại vẫn đổi revision. Save HP/ví/cảnh giới/trang bị không đổi schema hoặc reset.

## Bay bằng Tôn Hồn Phiên và vũ khí sau này

Đeo **Tôn Hồn Phiên** trong túi → nhấn **Phi kiếm** hoặc **F** khi đã rời giao tranh, còn sống và có khoảng trống phía trước. Dùng đúng lá cờ đang đeo: rời tay, bay một vòng, tăng 30%, nhân vật phát clip nhảy Studio rồi đứng chính giữa **toàn bộ hình ảnh vũ khí**, bay ở pose idle. Bóng nằm trên đất, vũ khí và chân nâng khoảng16 world units; điều khiển/collision/speed giống kiếm chắp vá. Nhấn F lần nữa để hạ. Đánh, bị đánh, chết, teleport, đổi đồ hoặc disconnect vẫn ngắt theo luật cũ. Khi hạ cờ, bắn linh hồn và neo idle/walk/run hoạt động như trước.

`catalog.swordFlight.allPublishedWeapons=true` áp dụng cho tất cả accessory đã phát hành thuộc category `weapon`, phù hợp rig và có cấu hình trang bị hợp lệ; backend kiểm sở hữu trong túi. Chưa cần thêm mỗi món vào allowlist riêng. Quy trình thêm file/registry/catalog/kiểm fit vẫn phải thực hiện, không tự hiểu một file bất kỳ thả vào thư mục. Kính, mũ, cánh không tự thành vũ khí.

`swordFlight.defaults` quy định sizeMultiplier1.3 và tipAngle=-π/2 (đầu ảnh hướng -Y). Nếu ảnh mới có hướng đầu khác hoặc kích thước logic khác, đăng ký override theo accessoryId trong `swordFlight.weapons[]`; không sửa movement/network/combat. Không tự crop vùng alpha hay thay neo Studio để làm nó vừa. Bộ hiển thị bay dùng kích thước/profile **idle đã ánh xạ bằng animationId**, cố định qua clip nhảy để tránh nhảy cỡ. Pivot bay nằm giữa full image; trung điểm hai bàn chân từ rig trùng tâm mặt vũ khí. Bóng theo đúng góc và kích thước vũ khí. Neo cầm tay gốc không bị chỉnh.

Renderer ẩn category weapon cả khi profile gắn socket back, tránh một vũ khí trên tay/lưng và một vũ khí bay bị vẽ trùng. Animator/texture cache hiện có tiếp tục dùng chung dữ liệu, mỗi người có con trỏ animation riêng.

Online welcome bổ sung `weaponFlightProtocol:1` bên cạnh `swordFlightProtocol:1`. Frontend thông báo cần nâng backend nếu server cũ chỉ cho kiếm chắp vá bay; không giả bay cờ phía client. Snapshot vẫn chỉ gửi weaponId/phase/time/heading; không truyền ảnh/pose/scale tùy client. Mọi quyết định điều kiện bay/di chuyển do server; không cho bay xuyên nước/tường hoặc nhận tốc độ do asset tự đặt.

## Kiểm tra và giới hạn

- `npm run build`, `npm test`, `npm run check:assets`: TypeScript, nguồn map/runtime hash, mask, gameplay, profile và dữ liệu flight.
- Vite5173 + `node tests/map7-harness.cjs`: 24 mask/fade cases thật trên ảnh ở scale/flip/rotation khác nhau; depth nhiều actor; camera; nguồn không sửa; 180 mẫu dawn kiểm cùng cache/Canvas và so pixel với runtime mới.
- Vite5173 + `node tests/sword-flight-harness.cjs`: cả hai rig × hai vũ khí × hướng/zoom/phase, hình ảnh vũ khí vẽ một lần, bóng/độ cao, trung điểm chân ở chính giữa full image; clip nhảy/idle gốc, không nhảy kích thước giữa clip, socket back không vẽ trùng.
- Static dist4173 + `node tests/map7-banner-browser.cjs`: Offline không backend, touch/F, orbit/jump/ride/landing, steering/flip/zoom, đánh/đổi đồ ngắt flight, save, mobile dọc/ngang và desktop.
- `FLIGHT_WEAPON_ID=attachment_1793960988158_2 SWORD_FLIGHT_CHECK=1 node tests/mining-online.cjs`: hai Chromium riêng dùng backend thật và map7, di chuyển bằng joystick qua kiểm tra server; nhìn nhau bay cờ, hạ, disconnect/reconnect; tiếp tục kiểm quặng/đua lock, wallet, collider, node cạn và restart server.
- Static4173 + `node tests/lighting-browser.cjs`: trace clock thật đứng yên qua bình minh; số texture nền/đường không tăng. GPU phần mềm của môi trường test không đại diện FPS trên điện thoại thật.

Chưa có backend WSS công khai. Node backend mới chạy cùng cách cũ (`npm run build`, `PORT=3000 npm start`, Dockerfile hiện có), Sites phục vụ Offline và giao diện cấu hình Online. Không công bố backend có sẵn nếu chưa triển khai WSS. Chưa kiểm Safari/iPhone/Android vật lý hay tải lớn. Vũ khí/rig ngoài catalog chỉ có nền tảng đăng ký; chưa được kiểm bằng asset thật chưa cung cấp.

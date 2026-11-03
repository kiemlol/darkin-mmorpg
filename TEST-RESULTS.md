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

## Bản sửa chuyển động / khôi phục Offline

Tái hiện trường hợp nhân vật chết, lưu HP=0, vào lại thì cả nhân vật lẫn quái đều đứng yên vì player vẫn chết và mob không có mục tiêu. Đây là thiếu sót khôi phục phiên/UI, không phải lỗi cần tắt va chạm map.

- `node tests/movement-regression.cjs`: PASS trên dist mới. Seed bản lưu HP=0, vào Offline có 100 HP, giữ số quái đã hạ; WASD và joystick làm tọa độ thật thay đổi; AI quái thay đổi tọa độ khi đuổi; menu dừng thời gian mô phỏng; chết mới trong phiên hiện bảng hồi sinh, bấm hồi sinh rồi joystick di chuyển được. Không có pageerror.
- Kiểm tra bản Sites cũ trực tiếp qua quyền service access: phiên mới vẫn di chuyển và quái đuổi được; sau chết, HP=0 làm player dừng và quái về nhà đứng yên.
- Không xóa khóa lưu người chơi/Studio hoặc đổi va chạm map.

## Map mới + cutout thật (2026-11-02)

- Map được thay bằng bundle commit f04460d, SHA-256 trùng nguồn mới; vẫn 111 objects/3 roads/night.
- `npm test`: 7/7 PASS, gồm format Studio/demo, alias, rig/clip lỗi, catalog/slot/path, allowlist ngoại hình và vật lý không đổi. `npm run build` bao gồm check-assets và TypeScript: PASS.
- `node tests/cutout-browser.cjs` trên dist: PASS bốn clip idle/walk/run/attack, không reset frame, flip trái/phải. Hai client Online thật nhìn thấy cutout của nhau và các action walk/run/attack; clock riêng; actor thứ hai không tạo thêm request ảnh; không pageerror/ảnh 404.
- Vite asset harness + `node tests/asset-browser.cjs`: PASS cache/rig dùng chung, player/time/attachmentTime riêng, one-shot attack và trở lại đi, giữ visual khi ID sai/ảnh thiếu/kênh rig sai; race tải không ghi đè; thay visual giữ nguyên actor; composition outfit + animation độc lập có đường ảnh theo resource (fixture dùng chính ảnh Traveler). Warning/404 của missing-fixture là cố ý trong test âm, không có trong game mặc định.
- `node tests/browser.cjs` và movement-regression: PASS gameplay, hai client, mobile dọc/ngang, joystick/pinch, hồi sinh/bản lưu chết. `node tests/protocol.cjs`: PASS.
- `node tests/offline-no-backend.cjs`: PASS khi Node game server tắt, chỉ file tĩnh dist tại 4173; có cutout thật, zero WebSocket, blur dừng di chuyển, đổi phiên.

Giới hạn vẫn giữ: backend Online chưa công khai; Online đã thử ở local. Chưa có cutout mob, hurt/death clip, nhân vật tám hướng, thiết bị vật lý hoặc tải lớn. Traveler không có wing/glasses/hat, module và kiểm tra dữ liệu được giữ nhưng chưa QA trực quan phụ kiện thật đó.

## Sửa rung chuyển động — 2026-11-03

Nguyên nhân được tái hiện trên dist: actor hiển thị trực tiếp vị trí tick 20Hz (đứng 2 khung hình rồi nhảy 7.75px khi đi), trong khi camera chạy mỗi frame. Screen-space foot giật lùi ở các frame giữa tick; đây là pipeline chung từ trước cutout. Camera lerp tới sample cuối frame còn làm độ trễ phụ thuộc thời lượng frame.

Bản sửa giữ mô phỏng/va chạm/combat 20Hz, thêm presentation riêng: nội suy Offline giữa hai tick; Online nội suy đoạn prediction, replay ack + offset hiệu chỉnh độc lập camera; remote dùng buffer theo server time thay vì reset nội suy mỗi lần nhận packet. Respawn/teleport không nội suy xuyên map; mẫu không đứng được bị loại. Mỗi frame Canvas xóa ở hệ pixel gốc rồi áp DPR một lần, không giữ vệt ảnh frame cũ. Camera tích phân chính xác mục tiêu tuyến tính, không giấu bước nhảy bằng tăng lerp. Interpolation thêm tối đa một tick 50ms vào vị trí hiển thị; kết quả gameplay vẫn tại tick thật.

- Trace Chromium trước sửa: sau warmup, 29 frames có 16 frame chân giật lùi; screen delta -4.38 đến +4.76px khi chỉ giữ đi xuống.
- Trace dist sau sửa: 26 frames, 0 giật lùi, 0 dừng giữa tick; screen delta khoảng 0 đến +0.075px. Online local trace 26 frames cũng 0 giật lùi, delta tối đa khoảng .058px. Đây là các lượt đo ngắn trên Chromium headless, không phải cam kết FPS/độ trễ cho mọi máy.
- `npm test`: 15/15 PASS. Thêm chuyển động render liên tục tại 30/60/144 FPS, camera với dt biến thiên, hiệu chỉnh prediction không nhảy tọa độ, buffer snapshot không tua lùi, collision/stop/respawn, prediction không phát lặp đoạn cuối khi mất input/socket.
- `node tests/jitter-browser.cjs` và `node tests/jitter-browser.cjs online`: PASS kiểm tra chân/camera từng RAF, một lần clear và một lần vẽ nhãn player mỗi frame.
- `node tests/browser.cjs`: PASS hai client, điều khiển mobile/pinch/resize, đóng phiên. `node tests/cutout-browser.cjs`: PASS bốn clip và hai player cutout. `node tests/movement-regression.cjs`: PASS khôi phục HP0, mob đuổi, menu pause và hồi sinh.

Chưa đo trên thiết bị vật lý, màn hình VRR hoặc mạng Internet có mất gói/latency cao kéo dài. Online công khai vẫn chưa triển khai.

## Tỷ lệ nhân vật, xác quái và mép map — 2026-11-03

Scale Traveler đổi .6 → .69 (+15%), giữ rig và radius 12. Xác quái mờ dần, tự bị loại khỏi snapshot sau 1.5 giây; mob nội bộ vẫn chờ hồi sinh sau 8 giây tại điểm hợp lệ. Cả LocalGameSession và server dùng cùng quy tắc này, không cần thao tác hồi sinh player.

Camera dừng trong terrain 0..cols*cell, 0..rows*cell; minimum zoom tăng tự động nếu viewport lớn hơn nền. Giới hạn di chuyển an toàn ở mép (trái/phải 44, trên 144, dưới 24 world units) giữ hình nhân vật trong terrain; map JSON và collision footprint gốc không bị sửa.

- `npm test`: 20/20 PASS, thêm corpse expiry với player sống/chết chưa hồi sinh, mob respawn, camera mọi mép/zoom ở mobile/desktop/4K và di chuyển dọc biên.
- `node tests/edges-browser.cjs`: PASS trên dist, 390×844 @3x và 844×390. Kiểm tra transform Canvas thực ở bốn góc viewport, cả bốn mép map, scale .69 và giới hạn thu nhỏ. Có screenshot tests/edge-*.png.
- `node tests/corpse-online.cjs`: PASS hai WebSocket client thật đánh quái bằng input; observer thấy xác biến mất rồi mob trở lại sau 8 giây, không gửi player respawn/reset.
- `node tests/cutout-browser.cjs` và `node tests/jitter-browser.cjs`: PASS, bốn animation, hai player thật và hồi quy rung chuyển động.

Mobile đã kiểm thử bằng Chromium cảm ứng giả lập; chưa kiểm thử trực tiếp Safari trên iPhone trong ảnh người dùng.

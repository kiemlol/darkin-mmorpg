# Bow1, kích thước nhân vật và điều khiển ngang

Nhân vật tăng thêm **8%** từ scale game .69 lên **.7452**, áp dụng cả Traveler và Shadow Knight. Đây là scale tổng thể trong catalog, không sửa kích thước PNG, joint, anchor hoặc fit phụ kiện Studio. Hitbox, tốc độ, HP, sát thương, tọa độ chân và save giữ nguyên. Kiếm/búa và phi kiếm đi cùng scale nhân vật; tỉ lệ tăng riêng 30% của phi kiếm giữ nguyên.

Zoom mặc định **110%**, khai báo trong `src/client/view-settings.ts`. Mỗi lần vào Offline/Online hoặc reload bắt đầu ở 1.1; wheel/pinch/+/- vẫn hoạt động, xoay màn hình không tự reset zoom đang dùng. Camera vẫn có giới hạn zoom tối thiểu để không lộ ngoài terrain ở viewport quá lớn. Không thay DPR/camera transform lần hai.

## Hoạt ảnh bắn cung

File upload nguyên byte: `public/game-data/animations/bow/bow1.animation-pack.json`.

- Format `darkin-animation-pack-v1`, version 1.
- SHA-256 `c30df422875bbb3746d8607c8773bdaceccb73faf366520c5b69a6d1a90eccf2`.
- ID giữ nguyên `nightcamp-animation-bow1-767a8744-v1`, tên `bow1`, kind attack, duration **.3 giây**, hit .15 và **10 keyframe**.
- Action `bow_shoot`, resource `bow-actions`, khai báo `catalog.actionPacks` cho hai rig cùng bộ kênh sáu phần. Build kiểm từng kênh/ID/rig trước phát hành.

Vào **Menu → Hoạt ảnh → Thử hoạt ảnh bắn cung** khi đứng trên đất, ngoài giao chiến và không đào. Phát ngay trên nhân vật hiện tại, một lần rồi trả idle. Không tạo nhân vật/world hoặc RAF riêng. Thử khi đang đi sẽ kết thúc khi nhận input di chuyển; đánh, bị đánh, đổi trang bị, chết hoặc lên phi kiếm cũng hủy preview.

**Chưa có phụ kiện cung, tên bay hoặc cơ chế sát thương tầm xa.** Kiếm/búa trên tay tạm ẩn qua binding `hideWeapon: true`, hiện lại khi xong; không giả ảnh cung hoặc sửa neo kiếm thành neo cung. `clip.hit` chỉ thuộc dữ liệu phát, không gọi combat hay gửi kết quả sát thương. Sau này đăng ký cung thật và profile theo animationId, rồi điều chỉnh binding hiển thị; combat bắn cung cần handler/server riêng theo yêu cầu tiếp theo.

Ảnh và spec bất biến vẫn cache chung; mỗi player có con trỏ thời gian riêng. Renderer dùng CutoutPlayer hiện có, giữ nguyên mọi kênh pose/clip gốc, không tạo ID khi tải/phát và không restart mỗi frame.

Offline và Online dùng cùng flow. Client gửi actionId/sequence; backend kiểm allowlist, rig, trạng thái sống/giao chiến/đào/phi kiếm và khoảng cách thời gian thử. Chỉ socket của chính phiên được tác động; duplicate không replay, không gửi ảnh/bundle/pose qua WS. Snapshot đồng bộ preview cho các client khác; schema được kiểm trước render. Không lưu preview vào save hoặc dùng nó để cấp damage/phần thưởng. Backend cũ thiếu capability sẽ báo cần cập nhật.

## Điều khiển ngang

CSS áp dụng khi landscape trên thiết bị cảm ứng hoặc cao tối đa 700px, gồm cả 1280×589 trong ảnh phản hồi. Inset trái/phải là **56–112px cộng safe area**, đáy 56–80px cộng safe area. Joystick 104px, nút đánh 86px; nút phi kiếm 82×52 nằm **bên trái nút đánh**, cách 20px. Tránh chồng hàng HUD/zoom ở màn hình thấp. Portrait giữ bố trí cũ. Pointer capture/cancel/thả ngoài vẫn dùng Input cũ, không thêm listener theo từng lần resize.

## Kiểm tra

`npm test`, `npm run build`; Vite 5173 cho `node tests/bow-harness.cjs`, dist tĩnh 4173 cho `node tests/bow-layout-browser.cjs`. Kiểm .3 giây một lần, pose thật/ID/flip ở cả hai rig, tạm ẩn/trả vũ khí, không gây damage; 8% scale và 110% zoom; 360/390/430 portrait, 844×390, 932×430, 1280×589, 568×320, tablet1024×768/1366×1024 và desktop, không chồng controls/menu/zoom hoặc tràn ngang, joystick thả ngoài, đánh, hạ kiếm và reload/save.

`node tests/bow-online.cjs` tự chạy backend local 3001 và hai Chromium process: nhìn thấy nhân vật bên kia phát bow1, animator riêng, duplicate/unknown/prototype action bị xử lý an toàn, HP/ví/attackSeq không đổi. Tiếp tục kiểm hồi quy đào/retry/spam/reconnect/restart.

CDP safe-area override không khả dụng trong Chromium này: đã kiểm CSS dùng `env(safe-area-inset-*)`, chưa kiểm notch trên điện thoại vật lý. Backend WSS công khai vẫn chưa triển khai; Sites phục vụ frontend/Offline, Online đã kiểm ở local. Kết quả cụ thể ở TEST-RESULTS.md.

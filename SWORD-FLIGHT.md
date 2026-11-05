# Phi kiếm

Bấm **Phi kiếm** phía trên nút đánh hoặc phím **F** để gọi/hạ kiếm. Cần đeo kiếm đã đăng ký, đứng ở vị trí hợp lệ, có khoảng trống phía trước và rời giao chiến. Không có phí, năng lượng hay chỉ số mới. Hiện vũ khí được phát hành để bay là **Kiếm chắp vá** đang đeo; không tạo thêm thanh kiếm giả.

Chuỗi tự động dùng chung Offline/server:

1. `orbit`: giấu kiếm trên tay, vẽ chính ảnh kiếm từ texture inventory cạnh nhân vật, bay đúng một vòng trong 1,2 giây.
2. `settle`: dừng ở điểm phía trước cách chân 32 world px, lớn dần tới 130% kích thước cầm tay trong 0,25 giây.
3. `jump`: tự phát clip Nhảy 0,8 giây, nhảy tới điểm đứng đã kiểm tra va chạm.
4. `riding`: idle trên kiếm; WASD/mũi tên/joystick điều khiển cùng actor XY hiện tại. Shift hoặc kéo joystick xa vẫn dùng tốc độ chạy cũ 225; thường 155. Không phát walk/run khi đang cưỡi.
5. `landing`: F/nút Hạ kiếm hạ thấp trong 0,25 giây, trả kiếm về tay và khôi phục điều khiển đi bộ.

Trong lúc gọi/lên/hạ kiếm, khóa di chuyển thường. Nhấn đánh sẽ rời phi kiếm rồi đánh theo cooldown/tầm/sát thương cũ; nhận sát thương, chết, đổi trang bị/ngoại hình, teleport hoặc rời phiên hủy phi kiếm. Muốn đào cần hạ kiếm; không tự thay búa trong khi đang cưỡi. Không có miễn nhiễm quái hay quyền bay xuyên cây/nước/vật cản. Cầu vẫn theo walk mask của map.

## Clip và tài nguyên

Nguyên file người dùng `animation-4516eb2d-4810-45de-9ded-c9e419ed157d.animation-pack.json` ở:

`public/game-data/animations/sword-flight/jump.animation-pack.json`

SHA-256: `3303010313e3b256c4d99d41bf59d3041e253acded38c6c13444f716eb631c5f`.

Format `darkin-animation-pack-v1`, version 1. ID giữ nguyên `animation-4516eb2d-4810-45de-9ded-c9e419ed157d`; tên clip “Nhảy”, dur 0,8 giây, 5 keyframe. File nguồn khai báo `kind: loop`: adapter đổi **chế độ phát trong spec** sang pose một lần khi boarding, không sửa file nguồn, ID, frame, duration hoặc kênh. Không dùng hit=.4 của clip để gây sát thương. Bốn clip cũ và clip đào giữ nguyên.

Resource `sword-flight-jump` và `catalog.swordFlight` quy định thời gian/độ cao/độ lớn, compatibleRigs và allowlist vũ khí. Hai rig hiện cùng quy ước kênh sáu phần đã kiểm tra; không tự coi mọi rig mới tương thích. `npm run check:assets` kiểm ID/clip/các kênh với từng rig. Thêm kiếm bay mới phải đăng ký accessoryId, gói phụ kiện và `swordFlight.weapons[]`, gồm hướng đầu kiếm `tipAngle` và hệ số scale; không suy diễn mọi phụ kiện cầm tay là kiếm.

## Hiển thị và hướng

`src/client/sword-flight-visual.ts` là lớp trình bày. Lấy **ảnh đã giải mã của món đang đeo** từ inventory của CutoutPlayer; không tải lại, không sửa spec/attachment dùng chung. Draw nhân vật với `weapon:false` chỉ khi đang bay, nên không có kiếm trùng trên tay. Toàn bộ ảnh/alpha được dùng, không crop ảnh hoặc đổi neo Studio cầm tay.

Kiếm dùng pivot riêng ở giữa ảnh cho chế độ bay, tăng 30% chỉ khi bay. Chân lấy từ `NC.rigJoints`, căn trung điểm hai chân lên giữa kiếm; không fit lại người hoặc thay parts/joints/scale .69. World XY là điểm trên mặt đất, chiều cao vẽ khoảng 16 px, bob dưới 1 px. Bóng được vẽ tại cùng XY trên đất, kiếm và chân ở phía trên; cùng camera, Y-sort và lượt ánh sáng map.

Rig được cung cấp chỉ có hướng trái/phải. Nhân vật flip về đầu kiếm; khi hướng đi gần dọc, kiếm có yaw chéo nhẹ về phía view đó để tránh biểu diễn giả một bộ ảnh trước/sau. Vận tốc XY vẫn đi đúng hướng input. Không xoay cả nhân vật như hình tròn. Hướng local dùng prediction có sẵn để kiếm/nhân vật đổi hướng cùng lúc; camera/networking không nhận thêm lần biến đổi.

## Thẩm quyền và lưu

`src/shared/sword-flight.ts` giữ kiểu/config và phép tính trình bày. World quản lý phase/elapsed, vị trí boarding, heading, weaponId và nonce của lệnh. Session chỉ gửi `{type: swordFlight, enabled, seq}`; server luôn dùng ID phiên của socket, tự chọn kiếm đang đeo từ allowlist, kiểm HP/combat/range trống/va chạm. Không nhận tọa độ bay, độ cao, scale, elapsed, pose, ảnh hoặc sát thương từ client. Retry/enable lặp không khởi động lại vòng bay; giới hạn payload/tần suất WebSocket cũ vẫn áp dụng. Snapshot gửi trạng thái gọn, mỗi animator tự phát riêng. Client kiểm schema snapshot trước khi renderer đọc phase/weapon; pack ảnh không bị clone lại mỗi frame/tick chỉ để kiểm điều kiện đeo kiếm.

Boarding thiếu input quá 350 ms bị hủy; đang cưỡi thiếu input thì dừng theo timeout movement cũ. Disconnect xóa actor, không để nhân vật tiếp tục bay. Mở map không pause server; menu/background vẫn dùng quy tắc pause Offline và gửi stop hiện có. Không thêm timer/RAF/world riêng. Khi đổi phiên, listener của Input và visual được dọn như cũ.

Phi kiếm là trạng thái tạm, không được khôi phục từ save/reconnect. Reload trở lại mặt đất tại vị trí hợp lệ đã lưu; ví/HP/cảnh giới/tiến độ vẫn giữ theo luật save hiện có. Không mang dữ liệu Offline vào Online.

## Kiểm thử và chạy

- `npm test`, `npm run build`.
- Vite 5173: `node tests/sword-flight-harness.cjs` kiểm ma trận/drawImage thực, chân giữa kiếm, shadow trên đất, flip/zoom, nguyên clip/parts, hai rig và clock độc lập.
- Dist tĩnh 4173: `node tests/sword-flight-browser.cjs` kiểm Offline không backend, vòng bay/nhảy/idle, nút cảm ứng/F, hướng/zoom, hạ kiếm/đánh/trang bị/save và các cỡ màn hình.
- `node tests/sword-flight-online.cjs` tự khởi động backend local 3001/state tạm với hai tiến trình Chromium: đi bằng input hợp lệ, cùng thấy vòng bay/clip nhảy/cưỡi/di chuyển/hạ, actor kia vẫn độc lập. Kế tiếp chạy hồi quy đào, retry/spam, disconnect/reconnect và restart lưu giao dịch.

Sites host frontend; backend WSS công khai vẫn chưa triển khai. Backend dự án chạy `npm run build && PORT=3000 npm start`, hoặc development `npm run dev` và `npm run server`. Trang HTTPS cần backend WSS. Chưa kiểm thiết bị điện thoại vật lý/tải lớn. Kết quả lượt chạy ở TEST-RESULTS.md.

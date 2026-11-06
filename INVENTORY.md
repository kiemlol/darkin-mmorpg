# Túi đồ và hình nhân vật

Vào game → **Menu → Nhân vật / Túi đồ**, hoặc phím **I**. Đóng bằng X/Escape/I. Màn rộng hiện chỉ số bên trái, nhân vật thật ở giữa và hành trang bên phải. Trên điện thoại dọc dùng ba nút Chỉ số/Nhân vật/Túi đồ hoặc vuốt ngang cùng khung; không thu chữ và ô xuống quá nhỏ. 8 ô trang bị nằm quanh nhân vật theo ảnh2.

## Khung giao diện mới

Bản cập nhật dùng nguyên ảnh mới: `frame-v2.jpg` (ảnh1,1280×448), `pagination-v2.jpg` (ảnh2), `categories-v2.jpg` (ảnh3). Năm nút Tất cả/Trang bị/Trang phục/Nguyên liệu/Tiền tệ dùng sprite nâu khi chưa chọn và vàng khi chọn, nằm trên túi. Mũi tên và bốn chấm ở dưới túi; hiện chỉ có trang1/1 nên mũi tên khóa, không tự mở thêm ô. Tám icon trang bị và hàng chỉ số/ô vật phẩm từ ảnh cũ được giữ và ghép quanh nhân vật như bố cục trước. `inventory-layout.ts` là nguồn tọa độ chung cho canvas, clip, chữ và hitbox; cụm danh mục dừng trước nút đóng gốc. Số ô/sức chứa hiển thị trong hàng thông tin để không đè viền vàng.

## Dữ liệu và thao tác

- Mặc định **4 ô dùng được**, mỗi chồng cùng itemId tối đa **10**. 12 ô tối chỉ là vị trí khóa, chưa có cơ chế mở rộng. Ba phụ kiện đã phát hành từ trước (kiếm chắp vá, kính vuông, kính tròn) được chuyển vào túi, mỗi loại1; không tạo vật phẩm mới theo mỗi lần mở túi/reload.
- Chọn ô để xem mô tả, Đeo/Tháo hoặc Chuyển ô. Chọn số lượng rồi ô đích: chuyển/split, gộp cùng loại đến10, đổi chỗ hai chồng khác loại nếu chuyển toàn bộ. Không đủ chỗ thì từ chối nguyên giao dịch, không mất phần dư. Món đang đeo vẫn nằm trong túi và có nhãn ĐEO; ô trang bị là view, không phải bản sao vật phẩm.
- Hàng chỉ số đọc HP, sát thương, tốc độ, tầm đánh và cảnh giới thật. Chọn hàng dùng ảnh vàng. **Điểm tiềm năng mặc định0, chưa có luật và nút cộng bị khóa**, theo quyết định người dùng. Không thêm nguồn điểm hay hiệu ứng chỉ số.
- Game chưa có MP: ghi Chưa kích hoạt. Linh thạch nằm ở nhóm Tiền tệ, đọc trực tiếp `wallet.spirit_stone`, không nhân đôi số dư thành vật phẩm.
- Chọn ô áo/găng/giày để chọn ngoại hình đã phát hành. Găng/giày hiện liền rig/trang phục, không có vật phẩm rời. Khiên/nhẫn/dây chuyền chưa có asset: hiện ô trống, không giả hiệu ứng.
- Kính gốc hiện thiếu cấu hình khớp hình học đầu Studio8 mặc định. Đeo vẫn bị từ chối có lý do, giữ hình cũ; không tự fit, sửa neo hoặc báo đã đeo thành công.

## Renderer và ảnh gốc

`src/client/inventory-preview.ts` dùng `AssetRegistry.acquire` và `CutoutPlayer.fork()` của game; mọi nhân vật/clips/phụ kiện dùng chính dữ liệu đang phát hành. Preview idle riêng, chia sẻ ảnh bất biến, không chia sẻ con trỏ animation; không tạo World/GameSession hoặc RAF khác. Nạp xong mới thay, generation guard chống tải cũ ghi đè; đóng túi giải phóng player/lease. Preview dùng ngoại hình/trang bị đã chọn, không đưa búa công cụ tạm/phi kiếm vào trạng thái sở hữu.

`public/game-data/inventory-ui/` chứa nguyên byte 3 JPG đính kèm. Bộ cũ: ảnh1 cung cấp 8 icon trang bị; ảnh2 chỉ đối chiếu bố cục; ảnh3 cung cấp trạng thái selected/idle của hàng chỉ số và ô vật phẩm. Khung/danh mục/phân trang nay lấy từ ba ảnh mới nêu trên. JPG không có alpha: `atlas.json` lưu crop và mask vector chỉ loại nền ngoài liên thông, giữ hoa/chi tiết sáng bên trong. `inventory-art.ts` vẽ trực tiếp ảnh gốc qua Path2D, không chạy chỉnh màu/cắt ảnh nhân vật. Có thể tái tạo atlas bằng `python3 scripts/inventory-atlas.py` (Pillow/numpy chỉ dùng khi phát triển; runtime không cần Python).

`inventory-ui.ts`/`inventory.css` quản lý lựa chọn, hitbox, thông báo, layout và DPR. Scale canvas/text/hitbox chung; canvas preview nằm trong cùng khung. Offline tạm dừng mô phỏng khi mở; Online tiếp tục tick và vẫn có thể nhận sát thương. Mở/đóng xóa input và nhả capture, không kẹt joystick/đánh; M không mở thêm panel bản đồ phía sau túi.

## Save và server

- Registry `public/game-data/items/catalog.json` → `src/shared/inventory.ts`: ID ổn định, catalog validation, add/move/merge rules. Muốn thêm item phải có định nghĩa và handler tương ứng; hiện registry chỉ có phụ kiện đã phát hành. Không tự hiểu mọi file ảnh.
- `character-profile.ts`: bag version1, potentialPoints, equipment/appearance persisted trong save/profile version3 hiện tại. Save cũ thiếu bag được migration một lần; giữ wallet/realm/khám phá/map ledger. Bag lỗi Offline được sao lưu trong inventoryRecovery và thông báo; bag lỗi server từ chối mở file để tránh âm thầm ghi đè dữ liệu hỏng.
- LocalGameSession và NetworkGameSession cùng dùng rules. Offline lưu ngay khi chuyển ô/thay đồ, cùng save nhân vật riêng. Online dùng `inventoryProtocol:1`, command `inventoryMove {from,to,quantity?,revision}`. Client không gửi state túi, giá trị điểm hoặc lệnh cấp item để server tin.
- Server dùng ID socket, kiểm tra sở hữu khi mặc, số lượng/ô/revision. Retry revision cũ bị từ chối; client không điều khiển túi người khác qua id tự gửi. `World.giveItem` là hook nội bộ đáng tin cho drops tương lai, **không có endpoint grant**.
- Profile guest ghi cùng kho backend (checkpoint5s và shutdown an toàn). Đã thử restart có shutdown; hard kill ngay trước checkpoint có thể mất thay đổi túi gần nhất. Mining wallet/ledger vẫn đi luồng commit atomic riêng vốn có.
- Sites vẫn phục vụ frontend Offline. **Chưa có backend WSS công khai**; Online mới được kiểm bằng backend Node của dự án, hai browser thật. Triển khai Docker/backend và nhập WSS riêng như README.

## Kiểm thử

`npm test` (85 test), `npm run build`; sau build chạy `python3 -m http.server 4173 --directory dist` rồi `QA_URL=http://localhost:4173 node tests/inventory-browser.cjs`. `node tests/inventory-touch.cjs` kiểm mobile tap/DPR3 và lỗi ảnh. Test Online tự mở backend3002: `node tests/inventory-online.cjs` (không chạy trùng một test khác dùng port3002). Ảnh thực `tests/inventory-{360x800,390x844,430x932,844x390,desktop,online}.png`.

Chưa có luật cộng điểm, mở rộng túi, vật phẩm tiêu hao/drop/shop, trang bị rời cho các ô chưa phát hành; không thêm chúng trong thay đổi UI này. Mobile kiểm bằng Chromium/DPR/cảm ứng giả lập, chưa xác nhận Safari/iPhone vật lý.

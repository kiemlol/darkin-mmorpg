# Túi Darkin và menu hành trình

## Một cửa sổ túi đồ

Gỡ giao diện Túi Càn Khôn/Hành trang mới khỏi các tab tu tiên. Nút 🎒 ngoài màn hình và phím I cùng mở cửa sổ Nhân vật & Túi đồ Darkin cũ. Trang bị, nguyên liệu, đan dược, phù và tiền được xem qua các nhóm có sẵn trong cửa sổ này. Chọn đan/phù để sử dụng, nguyên liệu để bán; trang bị vẫn đeo/tháo/chuyển ô bằng đường xử lý cũ. Có phân trang nếu nhóm Tất cả vượt 16 mục.

Nguồn số liệu giữ nguyên: trang bị dùng `actor.inventory`, nguyên liệu/đan phù đọc từ `cultivation.materials`, linh thạch từ ví. Không chuyển đổi hoặc cắt bỏ số lượng để vừa giới hạn chồng 10 món của trang bị; không thay định dạng save và không cấp lại vật phẩm. Đây là hợp nhất giao diện, không thay luật chứa trang bị hoặc kinh tế. Ô trống và địa chỉ ô thật của trang bị vẫn dùng cho thao tác chuyển/gộp.

## Dọc và ngang

Dùng chiều cao lớn hơn chiều rộng để chọn bố cục dọc, thay vì quyết định theo màn hình nhỏ hơn 700px. Dọc: cắt các vùng từ chính atlas Darkin rồi ghép thành nhân vật ở trên, lưới túi ở dưới. Hai mũi tên chuyển phần trên giữa Nhân vật và Chỉ số; phần túi phía dưới giữ vị trí. Các hitbox của ô đồ, trang bị và chỉ số được biến đổi bằng cùng bảng tọa độ dùng để ghép ảnh. Cuộn dọc khi chiều cao không đủ; không cần cuộn ngang để tìm phần túi.

Hình nhân vật vẫn dùng `InventoryPreview` và rig/trang bị đang mặc. Khi dọc, preview được ghép vào Canvas nguồn trước lúc cắt, để giữ đủ nhân vật và phụ kiện. Khi xoay ngang, trả lại khung 1140×448 và vị trí cũ; preview là lớp riêng như trước.

## Menu ba gạch

Chỉ còn các mục Tiên đồ, Tàng Kinh Các, Nhiệm vụ, Tông môn, Linh thú, Bách nghệ, Phường thị. Dãy nút tu tiên bên ngoài màn hình được đưa vào menu. Các mục cũ của menu và UI thử phụ kiện được gỡ. Đổi ngoại hình qua ô trang phục trong túi; lưu thế giới ngoại tuyến nằm trong Tiên đồ. Chọn mục tu tiên sẽ đóng menu trước khi mở cửa sổ chức năng.

## Kiểm tra

`npm test`: 162/162. Kiểm tra số lượng vật phẩm không đổi, phân trang/địa chỉ ô trang bị, dùng/bán theo nguồn dữ liệu hiện hữu, hình học hitbox của bố cục dọc, hướng màn hình, menu mới, không còn binding tới nút bị gỡ và bộ điều khiển trang bị không phụ thuộc DOM menu cũ. `npm run build` đạt, 604 tài nguyên offline.

`node scripts/audit-inventory-portrait.cjs` ghép atlas gốc bằng Canvas thật, xuất hai ảnh khung và audit ở `artifacts/inventory-portrait/`. Ảnh audit chỉ kiểm tra khung/cắt ghép; dòng “Vùng nhân vật động” đánh dấu vị trí preview, không phải ảnh chụp game đang chạy. Môi trường thiếu công cụ browser QA được hỗ trợ, nên chưa kiểm tra trực tiếp DOM/chạm/cuộn trên iPhone. Rig preview không đổi, nhưng cần người chơi xác nhận trên thiết bị thật.

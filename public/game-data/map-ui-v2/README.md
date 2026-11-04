# Bộ HUD bản đồ tùy chỉnh · v2

Gói này thay thế gói nightcamp-map-ui trước đó. Có đúng **6 PNG**:
4 ảnh mới do người dùng gửi và 2 ảnh mặt trời/mặt trăng trích từ game gốc.
Kèm PROMPT-CODEX.md để giao Codex tích hợp vào game mới.

## 1. File và vai trò

| File trong gói | Kích thước thật | Vai trò được quy ước |
| --- | --- | --- |
| khung_trai_AI_goc.png | 799 × 914 | Khung xanh băng của đồng hồ ngày/đêm, bên trái minimap |
| khung_phai_AI_goc.png | 885 × 908 | Khung đỏ lửa/gỗ/lá của minimap, bên phải |
| bang_ten_220x112.png | 220 × 112 | Bảng nhỏ màu xanh đặt chữ giờ bên dưới đồng hồ |
| dai_ruy_bang_420x164.png | 420 × 164 | Dải ruy băng đặt tên map bên dưới minimap |
| sky_moon.png | 120 × 135 | Mặt trăng chuyển động trong canvas đồng hồ |
| sky_sun.png | 120 × 119 | Mặt trời chuyển động trong canvas đồng hồ |

Ảnh được chép nguyên byte từ file gửi lên / file gốc; không resize, crop,
tăng nét, xóa nền hay đổi màu. Chỉ bỏ tiền tố đánh số của hệ thống đính kèm
khỏi tên file để dùng đúng tên người dùng đặt. Không giữ bốn PNG khung/bảng
cũ mm_frame.png, sky_frame.png, mm_banner.png, mm_plaque.png trong gói này.

Đã kiểm tra PNG RGBA: cả 6 file đều có alpha. Tâm và góc trên trái của hai
khung mới đều có alpha 0 (trong suốt), không phải mảng nền đen cần xóa.
Các vùng màu/glow có alpha bán trong suốt phải được giữ nguyên.
Nền đen khi xem file trong một số ứng dụng chỉ là nền trình xem ảnh.

## 2. Bố cục và thứ tự lớp

- Cả cụm nằm ở góc trên bên phải màn hình game. Khung xanh nhỏ bên trái,
  khung đỏ minimap lớn bên phải, theo bố cục tham khảo đã trao đổi.
- Dưới khung xanh là bang_ten_220x112.png và chữ giờ động, ví dụ 8:20 PM.
- Dưới khung đỏ là dai_ruy_bang_420x164.png và tên map động từ dữ liệu game.
- Trong lỗ khung xanh: canvas vẽ trời, sao/mây, mặt trời/mặt trăng.
- Trong lỗ khung đỏ: canvas minimap thật + fog khám phá + marker người chơi.
- Nội dung canvas nằm dưới ảnh khung; các chi tiết trăng trang trí, lửa,
  đá quý và mây trên ảnh khung luôn nằm phía trên. Trăng trang trí cố định
  không phải sky_moon.png chuyển động theo giờ.
- Tên map và giờ là chữ vẽ/HTML riêng, không được in cứng vào PNG.
- Giữ tỷ lệ ảnh. Không kéo hai khung khác tỷ lệ thành cùng một hình vuông;
  các kích thước trên là kích thước tài nguyên, không phải kích thước HUD bắt buộc.

## 3. Quan trọng: phải căn lại lỗ hiển thị

Đây là bộ khung mới, kích thước và khoảng trang trí khác bộ Night Camp cũ.
**Không dùng lại** các tỷ lệ canvas cũ như left 14.05%, top 20%, width 72.1%,
height 68.9% hoặc tỷ lệ của sky_frame.png cũ. Không chỉ đổi đường dẫn ảnh
trong CSS cũ rồi giữ nguyên canvas và hitbox.

Codex cần đo vùng lỗ bên trong từng PNG mới trên nền checkerboard, xác định
tâm/kích thước/clip phù hợp rồi lưu cấu hình riêng cho từng khung. Vì đá quý,
trăng hoặc lửa có thể nhô vào lòng khung, canvas cần nằm phía dưới các chi tiết
đó; không lấy toàn bộ vùng trong suốt ngoài ảnh làm lỗ bản đồ.

Khi đổi kích thước HUD, scale đồng bộ ảnh, canvas, clip, hitbox, bảng chữ và
offset theo cấu hình đã căn. Không nhân scale hai lần. Hitbox không bắt pointer
ở các vùng trong suốt rộng ngoài cụm. PNG trang trí đặt pointer-events: none.

## 4. Bản đồ và cơ chế khám phá

Các PNG chỉ là giao diện; không có sẵn map, vị trí nhân vật hay hoạt cảnh trời.
Map phải lấy từ map đang đứng trong game (map bundle đã tích hợp), gồm nền,
đường cong, nước và vật thể với đúng anchor/scale/rotation/layer.

Minimap và bản đồ lớn dùng chung base map, phép chiếu tọa độ và exploration
mask. Bấm minimap/đồng hồ hoặc nhấn M mở bản đồ lớn; marker người chơi cập
nhật từ vị trí thật trong game. Không dùng ảnh chụp tham khảo làm map cố định.

- Chưa khám phá: vẫn thấy map mờ, phủ tối RGB (22,19,34), alpha khoảng 150/255.
- Đã khám phá: bỏ lớp tối, giữ sáng cả khi người chơi đi xa; không chỉ có một
  vòng sáng chạy theo người chơi. Khám phá vẫn cập nhật khi panel bản đồ đóng.
- Tham khảo logic gốc: cellSize 100 world units, revealRadius 600 world units;
  cần đưa vào config để chỉnh theo tỷ lệ map game mới.
- Lưu theo nhân vật, worldId, mapId và mapRevision; quay lại/reload không mất.
- Fog này chỉ áp khi xem map/minimap, không tự che tối cảnh chiến đấu.
- Vùng ngoài hình chữ nhật map khi letterbox không phải vùng fog.

## 5. Ngày/đêm và game online

Dùng một WorldClock của game cho chữ giờ, cảnh trời và trạng thái ngày/đêm.
Online lấy giờ server, không lấy giờ máy từng người. Offline dùng clock local
theo quy tắc lưu của game. Đổi ngày/đêm không reset exploration mask.
Không tự sao chép buff/độ khó/drop ban đêm từ Night Camp.

## 6. Giao cho Codex

1. Gửi nguyên ZIP này cùng map bundle của game mới, hoặc giải nén cả thư mục.
2. Yêu cầu đọc README.md và thực hiện PROMPT-CODEX.md.
3. Bộ phát map/nhân vật và gameplay vẫn là bộ đang dùng trong game, không nằm
   trong ZIP giao diện này. Không thay thế các runtime bằng ảnh PNG.
4. Cần triển khai code tích hợp và kiểm thử; chỉ copy ảnh vào thư mục chưa đủ.

Nguồn 4 ảnh tùy chỉnh: file người dùng gửi trong cuộc trò chuyện.
Nguồn 2 ảnh sky: assets/ui/sky_moon.png và sky_sun.png trong client
Night Camp game-20261025-1758, repo linhphann66-maker/Night-camp.
Cơ chế map tham khảo minimap.js, mmreal.js và mapwin.js; game mới phải có
adapter riêng, không nạp nguyên client hoặc phụ thuộc các biến NC của game gốc.
Kiểm tra quyền sử dụng tài nguyên trước khi phát hành công khai/thương mại.

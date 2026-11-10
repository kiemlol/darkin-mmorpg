# Thanh Vân Cốc — nội dung và cơ chế

Đợt này mở rộng vòng chơi trên World có sẵn. Không thay renderer hay bộ 96 kỹ năng gốc.

- **Chính tuyến:** 9 nhiệm vụ nối tiếp tại Vân Nương, từ nhập đạo, học nghề, hái thuốc, săn yêu, chế tác, đột phá tới nhập tông, kết khế và hạ Sơn Quân. Phải nhận rồi trả ở NPC. Mục tiêu săn/hái/chế tác bắt đầu đếm từ lúc nhận; các mốc cảnh giới/nghề đã đạt vẫn được công nhận.
- **Ủy thác ngày:** 4 nhiệm vụ; tiến độ tính từ lần đăng nhập đầu tiên mỗi ngày UTC. Phần thưởng chỉ nhận một lần mỗi ngày. Ngày lùi không làm mới phần thưởng.
- **Thanh Vân Tông:** nhập môn từ Ngưng Khí; công lao mở cấp Ký danh, Ngoại môn (60), Nội môn (200), Chân truyền (500). Cống hiến dùng đổi vật phẩm; tổng công lao không giảm khi mua. Kim Cang Phù cần 60 tổng công lao, Trúc Cơ Đan cần 200. Cung phụng 3 yêu đan nhận 10 điểm, tối đa 20 lần; hoạt động ngày là nguồn tiếp tục.
- **Ngân Mao Hồ:** yêu cầu đã hạ 5 yêu thú, 35 linh thạch và 5 yêu đan. Theo chủ, hỗ trợ đánh trong giao chiến mỗi 2 giây, tầm 210 có kiểm tra vật cản. Không đánh khi chủ tử trận/ngự kiếm. Dùng 2 yêu đan nhận 10 điểm dưỡng thành, tối đa cấp 20.
- **Vân du:** gửi linh thú 3 phút, tốn 2 linh thảo; về nhận 3 huyền thiết, 2 yêu đan, 25 tu vi. Trong chuyến không hỗ trợ chiến đấu. Mốc thời gian lưu qua đóng game; nhận ở Linh Thú Sứ. Mỗi chuyến phải gửi riêng, không tự lặp để sinh tài nguyên.

## Điều khiển

Ba NPC đứng gần điểm xuất phát. Đến gần, chạm nút Đối thoại (hoặc E). Menu Nhiệm vụ, Tông môn và Linh thú cũng mở trực tiếp được; giao dịch cần NPC vẫn kiểm tra khoảng cách tại World. Nhấn ô nhiệm vụ bên trái để xem tiến độ. Giữ toàn bộ kỹ năng mở theo yêu cầu thử chiêu trước đó.

## Dữ liệu và online/offline

`cultivation.adventure` được lưu cùng profile nhân vật, đồng thời trong save thiết bị và GuestStore máy chủ. Save cũ tự có trạng thái chương mới, giữ tu vi, vật phẩm và kỹ năng cũ. Các lệnh mới đi qua đường `cultivate` hiện có và cùng một World trong cả hai chế độ. Giao dịch lỗi hoàn nguyên trạng thái và tiền. Tiến trình online và nhánh vân du offline tiếp tục được giữ riêng như cơ chế trước.

Sites là bản static: chơi offline trên thiết bị; muốn nhiều người phải chạy backend trong repo và cấu hình WSS. Đợt này không cung cấp máy chủ công cộng mới.

## Thay asset

`src/shared/content-assets.json` ánh xạ ID ngữ nghĩa (`npc.guide`, `npc.elder`, `npc.keeper`, `pet.silver_fox`) sang ảnh; cơ chế chỉ biết ID, không phụ thuộc tên file. Thay `src`, kích thước hiển thị, điểm neo; với sprite sheet khai báo `frameWidth`, `frameHeight`, `columns`, `frames`, `fps`, rồi build lại. Pet hiện dùng frame 0–1 lúc theo chủ, frame 3–4 lúc tấn công; muốn thay số frame/clip khác cần mở rộng metadata clip trước.

Đang tái sử dụng GIF NPC nữ tu và sheet Ngân Mao Hồ của Tu Tiên 2D; ba vai trò NPC dùng cùng hình với màu áo khác. Đây là asset tham chiếu được quản lý riêng, không tuyên bố hình nhân vật độc quyền. Nguồn và phạm vi xem `THIRD-PARTY-CULTIVATION.md`. Asset kỹ năng cũ vẫn ở bộ native, không chuyển sang ảnh đại diện hay thay renderer bằng tia sáng.

Chưa tích hợp toàn bộ Tu Tiên 2D: liên server, giao dịch người chơi, PvP tông chiến, các bản đồ/phó bản riêng, hôn nhân và toàn bộ hệ thống trang bị nguyên bản chưa thuộc đợt này.

## Kiểm tra đợt phát hành

`npm test`: 141/141 kiểm thử đạt, gồm WebSocket thật, ghi GuestStore xuống đĩa, nhiệm vụ tuần tự, UTC daily, hoàn nguyên giao dịch, đánh của linh thú và vân du qua lưu–tải. `npm run build` đạt, danh mục offline 600 tài nguyên. `node scripts/audit-adventure.cjs` kiểm tra ba màn chức năng và render thực 3 NPC + 1 linh thú bằng Node Canvas; ảnh ở `artifacts/adventure/settlement.png`. Đây là kiểm tra Canvas và logic, chưa phải kiểm tra trình duyệt/iPhone do môi trường hiện tại không có công cụ preview được hỗ trợ.

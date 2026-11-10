# Thanh Vân Tiên Đồ

Phát triển tiếp từ Darkin Frontier, giữ bản đồ Studio, nhân vật cutout, neo trang bị, túi trang bị, tương tác đào, phi kiếm, mô phỏng 20 Hz và server WebSocket gốc.

## Nội dung chơi

- 5 đạo phái: Kiếm, Pháp, Thể, Huyết, Linh. Tích hợp 96 kỹ năng gốc có chi phí, tầm, hồi chiêu, hệ số và tác dụng riêng; hiện mở tất cả để thử. 4 kỹ năng Studio cũ vẫn đăng ký trong registry, không tự cấp như demo.
- 3 nghề: Đan Sư (đan hồi HP/MP và đan đột phá), Khí Sư (cường hóa +10), Phù Sư (hộ thân, tăng tu vi).
- 17 nấc tu luyện từ phàm nhân tới Nguyên Anh Viên mãn. Tọa thiền, đột phá tiêu tu vi/linh thạch/đan tại đại cảnh giới. Nâng cấp tăng HP, MP, uy lực.
- 6 yêu thú và thủ lĩnh Sơn Quân, dùng sprite chuyển động thay placeholder; kinh nghiệm, vật liệu và linh thạch khi hạ quái. Thủ lĩnh hồi sau 120 giây, quái thường 18 giây. Khu xuất phát có bán kính an toàn.
- Mỗi lần đột phá nhận 3 điểm để tăng thể chất/lực công/thần thức. Phường thị mở rộng túi trang bị từ 4 tới 16 ô, giữ đồ đã có.
- 6 nhiệm vụ nhận thưởng một lần, vườn linh thảo với thu hái 3 giây, cửa hàng mua/bán, kho nguyên liệu và đan phù, chế tác giao dịch nguyên tử trong mô phỏng.
- Thiêu đốt, đóng băng, trói/choáng, hút máu, hồi phục, khiên và giảm sát thương. Dùng chung quy tắc tại server và offline.
- Bộ điều hợp chạy trực tiếp module JavaScript Tu Tiên: VFX, Pixel, Utils, SoCapFX, PhiLongFX, KimKiemFX, VanKiemFX, HuyetLiemFX, HuyetMauFX, HuyetNguyetFX, ThanhAnFX và Audio. VFX không quyết định sát thương.
- Giao diện Tiên đồ, Tàng Kinh Các, ủy thác, bách nghệ, phường thị, hành trang; phím C mở tiên đồ, 1–4 dùng bí pháp; giữ điều khiển cảm ứng gốc. Không cần xóa save cũ.

## Chạy

Yêu cầu Node.js 22+.

```sh
npm ci
npm run build
PORT=3000 npm start
```

Mở http://localhost:3000. Chọn **Bước vào tiên giới**: dùng `/ws` cùng origin hoặc địa chỉ WSS riêng trong Cổng kết nối. Server phải là bản cùng mã nguồn này. Reverse proxy công khai phải hỗ trợ HTTPS và WebSocket. Giữ thư mục `data/` bằng volume để lưu nhân vật, vị trí, HP, nghề, tu vi, kỹ năng, tài nguyên và giao dịch đào.

Phát triển: `npm run dev` và `npm run server`, nhập `ws://localhost:3000/ws` ở frontend Vite. Nếu đã có server khác chạy cổng đó, đặt biến `PORT`.

## Online, offline và đồng bộ

- Client khởi động được bằng mô phỏng cục bộ trong lúc chờ handshake. Chỉ chuyển online khi máy chủ xác nhận và gửi snapshot có nhân vật.
- Mất mạng/socket hoặc không có phản hồi: lấy snapshot online gần nhất làm điểm bắt đầu vân du, tiếp tục mô phỏng và lưu cục bộ. Có mạng lại: tự thử kết nối; xác thực lại bằng token để trở về đúng nhân vật online.
- Tiến trình **vân du offline được giữ riêng**, không tự nhập tiền/vật phẩm offline lên kinh tế online. Chọn **Tiếp tục vân du** để quay lại nhánh offline. Khi kết nối lại, nhân vật online tiếp tục theo máy chủ; không hợp nhất hai kho tài sản. Đây là quy tắc hiện thực, không phải đồng bộ đa thiết bị hay cơ chế chống gian lận cho tiến trình offline.
- Trong Menu → **Lưu thế giới để chơi khi mất mạng**, tải toàn bộ tài nguyên vào Cache Storage. Chỉ khi báo hoàn tất mới bảo đảm tài nguyên cần thiết đã lưu. Sau đó có thể reload/mở lại offline. Service worker cần HTTPS hoặc localhost. Bộ nhớ trình duyệt vẫn có thể bị hệ điều hành xóa.
- Save cũ giữ ID và trang bị. Cảnh giới được quy về tier tu luyện; tier là nguồn xác định tên cảnh giới trong save mới.

## Kiểm tra

`npm test`: giữ kiểm thử gốc, bổ sung kiểm tra chi phí/rollback, đột phá/migration, kỹ năng/MP/DOT/reward, nghề, vật phẩm, khóa cooldown, quest một lần và ID giao dịch không hợp lệ.

Thư mục `artifacts/` chứa ảnh kiểm tra desktop/mobile và hiệu ứng. Bài kiểm tra trình duyệt trong `tests/cultivation-*.cjs` dùng Playwright và Chromium, chạy với frontend 5173 và server QA 3001; các fixture chỉ ghi dữ liệu trong trình duyệt kiểm thử, không tạo API cấp vật phẩm trong sản phẩm.

## Giới hạn còn lại

Bản phát triển này chưa phải dịch vụ MMORPG đã vận hành thương mại. Chưa có tài khoản email/mật khẩu, PvP, giao dịch giữa người chơi, bang hội, nhiều bản đồ, chống gian lận cho server phân tán, đồng bộ tài sản offline lên online hay kiểm thử tải lớn. Danh tính online hiện là token khách của nền Darkin. Server Node vẫn cần host riêng nếu frontend được đặt trên Sites tĩnh. Chưa xác minh trên iPhone/iOS thật; kiểm tra mobile dùng viewport/touch Chromium.

## Bản sửa hiệu ứng & mở bí pháp

Bật đủ lớp vẽ `back/base/front` của module Tu Tiên, thêm đạn bay trước mốc trúng đòn và tải trước ảnh của các module được dùng để lần thi triển đầu không phải chờ ảnh. Toàn bộ 24 kỹ năng được mở trên nhân vật cũ/mới để thử; Tàng Kinh Các hiển thị cả kỹ năng khác phái và 4 bí pháp Darkin. Có nút nạp linh lực/xóa hồi chiêu để thử tiếp, không đổi ví/vật phẩm/cảnh giới. Nhân vật vẫn trả chi phí và hồi chiêu bình thường khi thi triển.

## Tích hợp trọn bộ hiệu ứng gốc (96 kỹ năng)

Thay bộ dựng thủ công bằng dispatcher `Skills.cast/update/draw` gốc và 348 tệp phụ thuộc gốc đóng thành một runtime. Chế độ ghost chỉ dựng hình; sát thương vẫn do World Darkin quyết định. Nạp đầy đủ `ASSET_TRIM`, ảnh vũ khí và atlas, dùng dịch vụ Assets gốc; xử lý riêng hình biến thân qua SpriteFactory/Player gốc. Camera được truyền đúng hệ tọa độ. Không dùng tia/vòng sáng chung để thay một kỹ năng không được ánh xạ.

Tàng Kinh Các hiện mở 96 định nghĩa kỹ năng gốc cùng 4 kỹ năng Darkin; có tìm theo tên/ID, hình tham khảo, nút chọn ô và khôi phục MP/hồi chiêu.

`npm run test:effects` chạy mô phỏng hiệu ứng gốc qua bộ điều hợp Darkin, xuất PNG và `artifacts/native-effects/audit.json`. Lần kiểm tra này: 96/96 có pixel được vẽ, không lỗi, không thiếu ảnh tham chiếu, không đổi HP/vị trí/trạng thái chết của mục tiêu trong mô phỏng ghost (Thiên Thư có thêm cache hình `_nhoThan` vào bản sao mục tiêu). 70 chiêu có lệnh vẽ ảnh/atlas, 26 chiêu là hình vẽ Canvas gốc. Kiểm tra này không thay thế việc chạy trên iPhone thật.

## Thanh Vân Cốc — mở rộng nội dung

Thêm chính tuyến 9 bước với NPC nhận/trả, 4 ủy thác UTC hằng ngày, tông môn/công lao/bảo khố, Ngân Mao Hồ hỗ trợ chiến đấu/nuôi dưỡng/vân du và icon nguyên liệu gốc. Chi tiết điều kiện, asset thay thế và phạm vi còn thiếu: `ADVENTURE-CONTENT.md`. Kiểm tra 141/141 và build đạt; WebSocket thực + lưu máy chủ được kiểm định; Canvas render NPC/linh thú đạt, chưa kiểm tra trình duyệt/iPhone trong môi trường này.

## Như Ý Định Hải

Thêm kỹ năng `nhu_y_dinh_hai` với gậy đỏ/vàng bay lên, hóa lớn, lao xuống mục tiêu; sát thương diện rộng, choáng, sóng va chạm và đất đá/bụi mờ dần. Kỹ năng mở sẵn ở đầu Bí pháp. Chi tiết timeline và điều kiện: `RUYI-STAFF.md`. Asset preview tạo từ renderer thực; bộ 96 hiệu ứng gốc giữ nguyên.

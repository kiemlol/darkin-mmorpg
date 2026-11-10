# Như Ý Định Hải

Kỹ năng mới lấy ý tưởng Như Ý Kim Cô Bổng của Tôn Ngộ Không. ID `nhu_y_dinh_hai`; mở sẵn cho nhân vật cũ và mới, hiện đầu danh sách Bí pháp, gắn vào bất kỳ ô 1–4. Không đổi các ô người chơi đã chọn.

Hoạt ảnh riêng bằng module Canvas `src/client/ruyi-staff-fx.ts`: gậy có thân đỏ và hai đầu vàng, hoa văn, vật liệu gradient; không dùng hiệu ứng tia sáng thay hình gậy. Mốc dùng chung tại `src/shared/ruyi-staff.ts`:

- 0–0,75s: tung gậy từ vị trí thi triển, bay vòng lên cao.
- 0,75–1,6s: gậy hóa lớn khi lơ lửng trên mục tiêu.
- 1,6–2,1s: vị trí rơi cố định, gậy lao xuống nhanh dần.
- 2,1s: va chạm; sát thương diện rộng ×4,5 uy lực, bán kính 150, choáng 1,5s. Trước va chạm không mất máu. Kiểm tra tầm và vật cản tại World; mục tiêu chạy ra khỏi vùng rơi có thể tránh chiêu.
- Sau va chạm: hố đất/vết nứt, sóng chấn động, 44 mảnh đá có quỹ đạo và bóng, 17 cụm bụi. Gậy cắm đất, mờ từ 3,5s và xóa hoàn toàn ở 5,4s.

38 linh lực, hồi chiêu 14s, tầm thi triển 360. Logic sát thương do World offline/máy chủ xử lý đúng một lần; module client chỉ vẽ. Tử trận hoặc dịch chuyển trước va chạm hủy sát thương. Hiệu ứng không chạy qua dispatcher kỹ năng Tu Tiên gốc và không sửa các file gốc.

Kiểm chứng: bốn kiểm thử riêng cho tài nguyên/hồi chiêu, sát thương đúng thời điểm/diện rộng, vị trí rơi/cơ hội tránh, tử trận/dịch chuyển, xóa hiệu ứng và adapter ở camera khác gốc tọa độ; audit Canvas sáu pha ở `artifacts/ruyi-staff/`, cùng preview trong Bí pháp. Môi trường thiếu công cụ browser QA được hỗ trợ nên chưa kiểm tra trực tiếp trên iPhone.

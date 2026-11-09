# Nguồn tham khảo và tài nguyên

Nền game: https://github.com/kiemlol/darkin-mmorpg (giữ các nguồn Studio và runtime có sẵn trong repo).

Các module `public/game-data/cultivation/modules/` và hình trong `public/assets/` được thu thập từ frontend công khai https://tutien2d.com/?choi trong phiên phân tích do người dùng yêu cầu. Giữ tên hash gốc, không mô tả đây là tài sản tự sáng tác hoặc suy diễn giấy phép từ khả năng tải công khai. File `public/game-data/cultivation/modules.json` ghi danh mục module; chỉ một phần module được bộ điều hợp nạp khi chơi. Không kết nối API, Supabase hoặc WebSocket của Tu Tiên gốc.

Các bảng nghề, cân bằng, hệ tiến trình, điều hợp và giao diện tu tiên mới nằm trong `src/shared/cultivation*` và `src/client/cultivation*`.

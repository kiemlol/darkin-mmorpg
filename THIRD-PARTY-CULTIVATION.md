# Nguồn tham khảo và tài nguyên

Nền game: https://github.com/kiemlol/darkin-mmorpg (giữ các nguồn Studio và runtime có sẵn trong repo).

Các module `public/game-data/cultivation/modules/` và hình trong `public/assets/` được thu thập từ frontend công khai https://tutien2d.com/?choi trong phiên phân tích do người dùng yêu cầu. Giữ tên hash gốc, không mô tả đây là tài sản tự sáng tác hoặc suy diễn giấy phép từ khả năng tải công khai. File `public/game-data/cultivation/modules.json` ghi danh mục module; chỉ một phần module được bộ điều hợp nạp khi chơi. Không kết nối API, Supabase hoặc WebSocket của Tu Tiên gốc.

Các bảng nghề, cân bằng, hệ tiến trình, điều hợp và giao diện tu tiên mới nằm trong `src/shared/cultivation*` và `src/client/cultivation*`.

Đợt mở rộng Thanh Vân Cốc dùng thêm `assets/sprites/npc/nu_tu_mieu_hoang_south.gif` và 8 PNG trong `assets/items/` từ cùng frontend gốc: `icon_herb_tay_ue`, `icon_stone_core`, `icon_yeu_dan_cap_1`, `icon_manh_giay`, `icon_tu_khi_dan`, `icon_dan_ngu_hanh`, `icon_phu_kim_giap`, `icon_phu_thanh_tam`. `ngan_mao_hong.png` đã có trong bộ quái được dùng làm linh thú. Các tham chiếu mới đi qua `src/shared/content-assets.json`; một số vai trò dùng lại ảnh và đổi màu khi hiển thị. Cơ chế mới là mã của dự án tại `adventure.ts`, `adventure-world.ts` và các module client tương ứng.

Hai sprite sheet U Đô mới là ảnh người dùng đính kèm trong hội thoại (tên gốc `1-Ảnh-1.jpg`, `2-Ảnh-2.jpg`), lưu nguyên byte ở `public/assets/sprites/fx/nether/portal.jpg` và `demon.jpg`. Đây là ảnh do người dùng cung cấp, không gán nguồn Tu Tiên 2D hay tuyên bố dự án tự vẽ. Sprite runtime xử lý nền trắng trong bộ nhớ khi tải; file gốc giữ nguyên. Metadata và kiểm tra hash ở `src/shared/nether-sprites.json` và `tests/nether-sprites.test.ts`.

# U Đô Lục Kỳ Trận

ID `u_do_luc_ky_tran`, mở sẵn cho mọi nhân vật; đứng đầu Bí pháp, gắn vào ô 1–4. 55 linh lực, hồi chiêu 26s, tầm 360, bán kính trận 165. Không thay các ô đã gắn của người chơi.

## Timeline

- 0–0,45s: sáu lá cờ có cán, vải, tua và phù văn hiện theo hình quạt trước nhân vật.
- 0,55s trở đi: mỗi cờ bắt đầu bay cách nhau 0,26s, cắm xuống một đỉnh của lục giác. Mỗi lá có quỹ đạo và chuyển động vải riêng.
- 1,8–2,4s: vẽ các vòng trận, lục mang và 24 phù văn. Tại 2,4s, World chốt danh sách yêu thú sống nằm trong bán kính trận, trong tầm và có đường nhìn từ người thi triển.
- 2,65–3,7s: vết nứt hình răng cưa mở phía trên trận; hai bàn tay có ngón và móng bám hai mép, kéo rộng vết nứt.
- 3,7–4,65s: đầu quỷ U Đô có sừng, giáp mặt, mắt sáng và nanh trồi ra; miệng mở dần.
- Từ 5,05s: bốn đợt, mỗi đợt 12 vong linh bay từ miệng xuống các mục tiêu bị bắt. Đợt cách nhau 0,65s, bay 0,6s. Các mốc sát thương là 5,65 / 6,30 / 6,95 / 7,60s. Mỗi mục tiêu hợp lệ nhận ×1,3 uy lực mỗi đợt, độc lập với số vong linh vẽ.
- 8,05s: ngừng giam giữ. Từ 8,1s toàn bộ cờ, trận, vết nứt, tay và đầu quỷ mờ dần; xóa hoàn toàn ở 9,6s.

## Authority và giới hạn

Mã client chỉ vẽ. `src/shared/nether-array-world.ts` quyết định danh sách bị bắt và bốn lần sát thương. Có thể thoát trước khi kết ấn; yêu thú đi vào sau khi danh sách đã chốt không bị bắt. Mỗi lần đánh kiểm tra lại mục tiêu còn sống, vị trí trong vòng, tầm và vật cản. Không đánh người chơi hoặc cảnh vật trang trí (game hiện không có hệ HP cho cảnh vật).

Giam giữ dùng `prisonUntil` riêng, không ghi đè choáng của kỹ năng khác. Caster chết hoặc dịch chuyển sẽ hủy các đợt tiếp theo, khóa di chuyển tự hết trong 0,12s; không để lại quái bị trói vĩnh viễn. Các kỹ năng chồng nhau giữ thời gian khóa dài nhất. Danh sách mục tiêu và số đợt nằm trong snapshot có kiểm tra định dạng. Hạ quái chỉ trả thưởng một lần.

Artwork được vẽ bằng module Canvas `src/client/nether-array-fx.ts`, không tải thêm ảnh ngoài và không thay file module Tu Tiên gốc. Xem ảnh tám pha, video thực từ renderer và audit trong `artifacts/nether-array/`. Preview trong Bí pháp được tạo từ cùng renderer.

## Kiểm tra

Năm kiểm thử riêng cho khóa vùng và bốn lần đánh, bỏ qua người chơi/mục tiêu vào muộn, tránh trước kết ấn, thưởng hạ quái, tử trận/dịch chuyển, giữ choáng khác, adapter/camera và xóa hiệu ứng, snapshot sai định dạng. Audit Node Canvas kiểm tra tám pha, xóa hết pixel ở 9,6s. Chưa kiểm tra trực tiếp trên iPhone hoặc trình duyệt vì môi trường không có công cụ preview được hỗ trợ.

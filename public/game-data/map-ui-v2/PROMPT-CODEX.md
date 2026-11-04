# Prompt v2 · HUD tùy chỉnh, đồng hồ và bản đồ khám phá

Hãy triển khai vào game MMORPG hiện tại, không chỉ dựng mockup. Tôi gửi kèm
gói giao diện v2 gồm 4 PNG tùy chỉnh của tôi, 2 PNG sky_moon/sky_sun gốc và
map bundle xuất từ Map Studio. Gói này thay thế bộ khung HUD cũ. Cần có cụm
minimap/đồng hồ và cửa sổ bản đồ: vùng đã khám phá sáng, chưa khám phá tối.
Đọc README.md trước khi tích hợp. Không dùng lại cấu hình lỗ canvas của bộ cũ.

## 1. Giữ nguyên game đang có

- Kiểm tra kiến trúc map loader, renderer, camera, input, nhân vật, clock,
  multiplayer/offline trước khi tích hợp; dùng adapter theo kiến trúc hiện tại.
- Không thay bản đồ bằng ảnh chụp tham khảo, không làm bản đồ giả với marker
  chạy theo animation có sẵn. Không sửa điểm spawn người chơi, quái, cửa,
  rig/animation, va chạm hoặc logic chiến đấu ngoài phần cần nối giao diện.
- Dùng map-runtime.mjs bản mới đang tích hợp; nếu cần vẽ base map, thêm adapter
  renderMapBase không kèm HUD, marker editor, vùng cản, spawn debug hoặc người chơi.
  Không nạp toàn bộ client Night Camp hay phụ thuộc biến toàn cục NC của game gốc.

## 2. Cụm HUD góc trên bên phải

- Dùng đúng tên và vai trò của 6 PNG trong gói, không lấy bộ khung gốc cũ:
  khung_phai_AI_goc.png (885×908) làm khung minimap đỏ lửa/gỗ/lá bên phải;
  dai_ruy_bang_420x164.png làm dải tên map bên dưới minimap.
- Bên trái minimap là đồng hồ bầu trời với khung_trai_AI_goc.png (799×914),
  khung xanh băng. Phía dưới dùng bang_ten_220x112.png làm nền chữ giờ
  (ví dụ 8:20 PM). Đây là quy ước bố cục của gói v2 dù tên file là "bảng tên".
- Trời vẽ động: ngày nền xanh, mặt trời, mây trôi nhẹ; đêm nền xanh đậm,
  mặt trăng và sao; bình minh/hoàng hôn chuyển màu mượt. Dùng sky_sun.png và
  sky_moon.png đúng tỷ lệ. Không coi trăng trang trí trên khung là mặt trăng động.
- Cả 6 PNG đã có alpha. Tâm và góc ngoài của hai khung mới trong suốt;
  không xóa màu đen hàng loạt, không chạy xóa nền lại, không flatten lên nền đen
  và không làm mất viền glow bán trong suốt. Chép nguyên ảnh được cung cấp.
- Đo lại vùng lỗ/tâm/kích thước clip của từng khung mới. Không dùng lại các
  phần trăm left/top/width/height của mm_frame.png hay sky_frame.png bộ cũ.
  Lưu cấu hình content window riêng cho mỗi ảnh; kiểm tra trên nền checkerboard.
- Canvas minimap/trời nằm dưới viền, clip đúng lòng khung. Các chi tiết trăng,
  lửa/đá quý nhô vào lòng khung vẫn phủ trên canvas. Không lấy phần trong suốt
  ngoài khung làm lỗ canvas hoặc thu toàn canvas thành một ô vuông mặc định.
- Giữ tỷ lệ tự nhiên của từng ảnh. Scale đồng bộ frame, canvas, clip, hitbox,
  bảng chữ và offset; không kéo khung 799×914 thành cùng tỷ lệ với 885×908.
- Hai bảng trang trí cũng đã có alpha và nội dung nền, không phải lỗ để đục
  trong suốt. Đặt chữ giờ/tên map trên vùng lòng bảng, tránh chi tiết trăng/lửa.
  Chữ trên ruy băng sáng cần màu tối/viền tương phản, không mặc định chữ trắng
  trên nền sáng. Tên map dài phải vừa khung, có rút gọn hoặc giảm cỡ chữ có giới hạn.
- Chữ tên map lấy từ map.name, không in cứng Trại Giữa Rừng. Đầu đại diện
  lấy từ nhân vật đang dùng, có cache và đổi lại khi đổi đầu/trang bị liên quan.
- Khung chỉ trang trí, không chặn pointer. Hitbox minimap và đồng hồ mở cửa sổ
  bản đồ; không để nút ẩn đè lên joystick, đánh hoặc menu. Hỗ trợ safe area,
  mobile dọc/ngang, desktop và DPR 1/2/3. Scale cả cụm nhất quán.

## 3. Bản đồ đúng theo map đang đứng

- Tạo base texture từ dữ liệu thật của map hiện tại: terrain, đường cong,
  nước, cây, đá, cầu và vật thể theo đúng anchor, scale, rotation, layer/Y.
- Dùng nền trung tính/ban ngày để nhìn rõ bản đồ như ảnh tham khảo. Fog khám
  phá là lớp riêng; không lấy độ tối của cảnh chơi ban đêm làm dữ liệu khám phá.
- Cache base theo mapId + revision; không render lại toàn map mỗi frame.
  Invalidate khi đổi map hoặc vật thể địa hình thay đổi. Giới hạn kích thước
  texture/VRAM, dùng chunk nếu map lớn. Có thể tham khảo tỷ lệ gốc 1px/5 world units.
- Minimap lấy vùng gần người chơi, bắc ở trên, không quay cả map theo nhân vật.
  Ở mép map vẫn đặt marker đúng theo cùng phép biến đổi crop, không ép marker
  vào tâm nếu camera minimap đã bị clamp.
- Vẽ marker người chơi ở tọa độ chân x/y thực tế trong cùng hệ tọa độ map,
  kèm mũi tên hướng nhìn. Đọc trạng thái từ game đang chạy; không nhân cỡ ô
  vào tọa độ world lần nữa và không áp camera của cảnh chơi hai lần.
- Vị trí marker cập nhật mượt theo render loop; nền minimap/fog có thể cập nhật
  5–10 Hz. Cập nhật khám phá dù cửa sổ bản đồ đang đóng.

## 4. Cửa sổ bản đồ khi bấm HUD hoặc nhấn M

- Mở bản đồ của đúng map hiện tại, có tên map, nút đóng, nút về vị trí người chơi,
  zoom +/- và kéo/chạm để pan. Escape hoặc M đóng, mobile có nút đóng rõ ràng.
- Ban đầu fit toàn map, giữ tỷ lệ, có letterbox nếu cần. Vùng ngoài map là
  nền cửa sổ, không phải vùng chưa khám phá. Zoom quanh con trỏ/pinch ổn định.
- Dùng cùng base texture, exploration state và phép chiếu world→map với minimap;
  không có hai bảng seen riêng. Marker người chơi vẫn cập nhật khi cửa sổ mở.
- Không pause server/world trong multiplayer. Chặn input xuyên từ UI xuống
  game, release pointer khi đóng, không làm kẹt joystick/phím hoặc chạy hai loop.
- Khi chuyển map, thay đúng dữ liệu, tên và trạng thái khám phá; bỏ response
  tải chậm của map cũ, không vẽ marker map cũ trên map mới.

## 5. Vùng đã khám phá sáng / chưa khám phá tối

- Tạo ExplorationStore dạng Uint8Array hoặc bitset: cols=ceil(worldWidth/cellSize),
  rows=ceil(worldHeight/cellSize). Ô đã đi vào vùng tầm nhìn đặt seen=1 và giữ
  nguyên khi đi xa; không chỉ tạo một vòng sáng luôn chạy theo người chơi.
- Tham số gốc để tham khảo: cellSize=100, revealRadius=600 world units (6 ô).
  Đưa vào config để chỉnh theo kích thước map/tầm nhìn, không hardcode pixel màn hình.
- Dùng vòng tròn quanh vị trí đã được game xác nhận. Khi di chuyển nhanh,
  quét các điểm trung gian theo quãng di chuyển để không bỏ hở vệt khám phá;
  teleport/chuyển map chỉ mở vùng đích, không mở cả đường thẳng xuyên thế giới.
- Ô chưa khám phá phủ màu RGB(22,19,34), alpha khoảng 150/255: vẫn thấy bản
  đồ mờ bên dưới. Ô đã khám phá bỏ lớp phủ. Làm mềm mép bằng nội suy/mask có cache;
  không đọc/ghi toàn bộ pixel full-size mỗi frame.
- Lưu theo characterId + worldId + mapId + mapRevision; offline dùng
  IndexedDB/localStorage có version và kiểm tra độ dài/giới hạn bộ nhớ.
  Online lưu bền phía server theo nhân vật, cập nhật từ vị trí hợp lệ; client
  có thể hiển thị dự đoán nhưng không tự khai mở map tùy ý cho server.
- Reload, đóng/mở cửa sổ và rời/quay lại map không mất tiến độ; nhân vật khác
  không tự nhận tiến độ của nhân vật trước. Map đổi revision phải có chính sách
  migration/reset rõ ràng, không đọc nhầm kích thước mask cũ.
- Cửa/NPC/marker theo luật khám phá; chưa thấy thì không lộ marker nhạy cảm.
  Nếu thêm marker quái/người khác, chỉ dùng dữ liệu server cho phép nhìn và
  vị trí hợp lệ; không vẽ toàn bộ điểm monsterSpawns thiết kế như quái thật.
- Đây chỉ là fog khi xem bản đồ/minimap. Không tự áp lớp fog lên cảnh chiến đấu,
  thay bán kính aggro, AI hoặc luật sáng/tối của thế giới.

## 6. Đồng hồ đồng nhất ngày/đêm

- Dùng clock có sẵn làm nguồn duy nhất cho giờ số, cảnh trời HUD và trạng thái
  ngày/đêm của game. Không lấy giờ máy người chơi thay cho giờ thế giới.
- Multiplayer lấy thời gian server, nội suy giữa snapshot; không tạo timer
  riêng cho từng người và không để đồng hồ nhảy khi mở bản đồ.
- Offline dùng clock local của phiên chơi, lưu tiến độ theo quy tắc game;
  tốc độ thời gian cấu hình được. Có thể tham khảo bình minh 5–7h, ngày 7–17:30,
  hoàng hôn 17:30–19:30, đêm 19:30–5h; ưu tiên chu kỳ game hiện tại nếu đã có.
- Không tự thêm buff/độ khó/drop theo đêm từ Night Camp. Đổi ngày/đêm không
  xóa exploration mask hoặc làm vùng đã khám phá trở thành chưa khám phá.

## 7. Kiến trúc và kiểm tra bàn giao

- Tách module WorldClock adapter, ExplorationStore, MapBaseCache,
  MapProjection, MinimapHUD, FullMapPanel; tên có thể đổi theo project.
  Minimap và full map chỉ đọc cùng game state, không tạo nhân vật/world thứ hai.
- Test spawn ban đầu, bốn mép/góc map, đi chéo, chạy nhanh, teleport, map không
  vuông, đổi kích thước/DPR, nhiều map/nhân vật, vào lại và reload.
- Test đi A→B rồi rời xa: A vẫn sáng; vùng chưa đi vẫn tối; đi tiếp khi panel
  đóng rồi mở lại vẫn cập nhật. Hai người có exploration riêng, clock thống nhất.
- Test ngày/đêm, thiếu/lỗi ảnh PNG, bản đồ tải chậm, đóng/mở nhiều lần,
  pinch/pan/zoom, joystick/đánh/menu không bị HUD nuốt thao tác, không leak canvas/RAF.
- Kiểm tra riêng trên nền sáng/tối/checkerboard: canvas khớp lỗ khung mới,
  không có hình chữ nhật đen, không lộ mép vuông, không hở khe giữa map và viền,
  chi tiết lửa/trăng vẫn nằm đúng lớp. Hai bảng chữ không bị crop hoặc kéo méo.
- Dùng đúng 6 PNG của gói v2, không tải lại bốn khung/bảng gốc cũ làm thay thế.
  Không đổi pixel/alpha của ảnh chỉ để ép khớp CSS cũ. Giữ nguồn/provenance
  trong tài liệu. Triển khai lên Sites của game mới để tôi test và báo rõ
  những phần đã kiểm tra / còn chưa nối backend.

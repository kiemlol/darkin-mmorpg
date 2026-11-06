# Giao tranh 1,5 giây và tự aim

`src/shared/combat.ts` khai báo `COMBAT_SECONDS = 1.5`, dùng chung World Offline và Node server. Chỉ `World.hit` với sát thương dương thực sự làm giảm HP mới đặt/gia hạn `combatUntil` cho người đánh và người nhận. Đánh hụt, ngoài tầm, bị vật cản chặn, quái đã chết, damage 0/không hợp lệ hoặc request bị cooldown từ chối không gia hạn giao tranh.

Quái đứng gần **không tự tạo hoặc giữ** trạng thái giao tranh. Đủ 1,5 giây mô phỏng kể từ sát thương cuối thì có thể gọi phi kiếm hoặc tương tác node hợp lệ. Hết thời gian vẫn có thể nhận đòn mới và bị vào giao tranh lại. Online quyết định trên server, snapshot 10Hz có thể thêm độ trễ hiển thị nhỏ; Offline pause/background theo luật hiện có.

Đánh hụt có hoạt ảnh/hồi chiêu cũ nhưng không khóa phi kiếm bằng cờ combat. Có thể gọi kiếm để ngắt động tác hụt; cooldown đòn đánh không được reset để tránh tăng tần suất đánh.

## Tự chọn hướng đánh

Khi người chơi bấm Đánh/Space (hoặc giữ theo nhịp hồi chiêu cũ), server tự chọn **quái còn sống gần nhất trong 76 đơn vị tọa độ chân**, có đường đánh không bị cản. Quái sau lưng cũng được chọn. Bỏ qua corpse, người chơi khác, quái ngoài tầm và quái sau collider; trường hợp đồng khoảng cách chọn theo ID ổn định. Không tự đi tới quái hoặc tự đánh khi không có input.

Server xoay `dir`/`attackDir` về mục tiêu trước khi tính đòn đánh, gửi ID mục tiêu và hướng cùng snapshot. Client chỉ biểu diễn bằng flip rig có sẵn, giữ hướng đòn đánh trong khi clip đang chạy để không lật qua lại theo input di chuyển. Không quay cả nhân vật như hình tròn hoặc giả bộ ảnh tám hướng.

Giữ nguyên range, cooldown .55s của người chơi, damage22, damage9 của quái, va chạm và luật nón đánh nhiều mục tiêu hiện có. Tự aim chỉ định hướng nón về mục tiêu gần nhất; các quái khác trong cùng nón/LOS vẫn nhận sát thương như trước. Không PvP. Không nhận targetId, damage, HP hoặc ID phiên khác do client tự khai để quyết định kết quả. LOS kiểm tra các đoạn cách tối đa 4px, kể cả collider mỏng.

## Ưu tiên nút Đánh/Đào

Nếu có quái đánh được trong tầm 76, nút vẫn ưu tiên Đánh thay vì tự đào cạnh quái. Đây là chọn hành động, không phải cờ giao tranh. Quái ở xa hơn 76 không khóa đào chỉ vì còn trong vòng 116 cũ. Server kiểm tra lại khi bắt đầu tương tác, nên snapshot cũ không lách được ưu tiên.

Nếu đang giữ Đánh và đi vào vùng node sẵn sàng sau khi hết combat, input ngừng các nhát hụt; cần thả và bấm lại để chủ ý bắt đầu đào. Không tự nhận thưởng hoặc tự bắt đầu một channel vì đang giữ nút.

## Kiểm thử

- `npm test`: mốc 1,499/1,5s, refresh khi trúng/nhận damage, miss/spam/wall/cooldown không refresh; auto aim sau lưng, corpse/player/range/wall/tie, nón đánh cũ; đào và phi kiếm sau timer ngay khi còn quái cách 85 đơn vị, ưu tiên nút trong tầm.
- `node tests/combat-browser.cjs` trên dist tĩnh 4173: giữ Space đánh hụt vẫn combatUntil=0 và lên kiếm được ngay; sau đó dùng quái thật có sẵn trên map, đứng sai hướng rồi tự aim gây damage22, rig flip theo attackDir, timer≤1,5s. Hai profile Offline riêng chỉ dùng cho QA, không thêm NPC/teleport/API test vào bản phát hành.
- `node tests/combat-online.cjs`: tự chạy Node local 3002/state tạm, hai Chromium process thật. Client kia thấy đúng hướng/clip/damage; giả mạo target/player/damage qua input không được server tin, không PvP, disconnect xóa actor. Không chỉnh vị trí/quái của server để dựng kết quả.
- `patchwork-harness.cjs`: drawImage/anchor/animation cũ, hướng aim giữ ổn định khi movement dir thay đổi; held Đánh → vùng node không tự đào, fresh press mới đào. `sword-flight-browser.cjs` đã đổi kỳ vọng hụt không combat; `mining-browser.cjs` kiểm hồi quy đầy đủ flow và hồi node 30s.

Giữ map, assets, scale .7452, zoom mặc định110, điều khiển ngang, bow preview và save. Sites chỉ host frontend/Offline; backend mới đã kiểm ở local, chưa có WSS công khai. Không tuyên bố kiểm trên điện thoại vật lý hoặc tải lớn. Kết quả lượt chạy ở TEST-RESULTS.md.

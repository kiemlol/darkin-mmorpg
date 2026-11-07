# Linh Hồn Thư — ô/phím 4

Offline: vào game và bấm ô4 hoặc phím4 khi có quái trong tầm. Ba skill cũ được giữ nguyên. Online cần server cấp quyền học/gắn `spirit_book` qua logic nội bộ; không có API tự học hoặc tin dữ liệu Offline.

## Dữ liệu gốc

- Clip người chơi: `public/game-data/animations/spirit-book/spell.animation-pack.json`, bản nguyên byte file đính kèm `animation-80c08418-b778-48a3-b874-714f5467d54a.animation-pack.json`. Format `darkin-animation-pack-v1`; ID `animation-80c08418-b778-48a3-b874-714f5467d54a`, tên **Phù phép**, duration0,8s. Không dùng clip.hit0,35 để gây sát thương. Không sửa rig, joints, kích thước hoặc animationId.
- `catalog.json`: resource `spirit-book-cast`, action `spirit_book_cast`, hideWeapon=true. Nạp qua actionPacks như các animation đã có, kiểm tương thích kênh trên hai rig hiện phát hành. Nhân vật giữ pose cuối trong lúc sách hoạt động; vũ khí đang mặc được ẩn tạm, không tháo khỏi inventory/profile. Kết thúc hoặc ngắt thì phục hồi động tác/trang bị thông thường.
- Hai JPG nguyên bản nằm trong `public/game-data/skills/spirit-book/source/{book,souls}.jpg`. Sách4×4=16 frame; linh hồn6×4=24 frame. Đây là ảnh người dùng, không phải ảnh giả thay Studio.
- `scripts/build-spirit-book.cjs` tạo texture PNG theo ô lưới cố định và gói `spirit-book.skill-pack.json` cho API SkillPlayer đang dùng. Đây là **adapter do game tạo**, không được trình bày như file Studio mới xuất. Vì JPG có nền trắng, công cụ chỉ flood vùng trắng nối với mép, xử lý viền matting sát ngoài; không xóa mọi pixel trắng, không crop/fit riêng từng frame, không vẽ lại ảnh. JPG gốc và SHA được giữ trong source-index.
- Chuẩn bị texture chỉ chạy lúc phát triển (Playwright/Chromium của môi trường test); frontend/server không cần các công cụ này. Gói đã có40 PNG nhúng để chơi. Cần cài Playwright và chỉnh đường dẫn Chromium phù hợp nếu chạy lại công cụ trên máy khác.

## Cơ chế

`combat.json.skills.spirit_book` khai báo damage3, range300 theo pack, cooldown6s, cost0 vì game chưa có MP. Đây là các giá trị mặc định của lần tích hợp, chưa có hệ thống cân bằng/nâng cấp mới.

- Sách đi theo tâm hai grip handF/handB lấy từ **NC.attachmentMatrix** của rig đang phát; cùng camera, zoom, foot-depth và ánh sáng map. Không gắn theo tọa độ màn hình hoặc tạo nhân vật/world/RAF khác.
- Native SkillPlayer phát sách mở từ đầu. Frame8 (0,8s) là mốc **phát đợt đầu**, không phải mốc damage. Đợt hai cách0,5s, mỗi đợt4 linh hồn. Sách giữ ở frame mở, chờ hai đợt/đạn còn lại kết thúc, rồi phát4 frame gấp cuối trong0,4s và biến mất.
- Mỗi đợt có2 đường vòng trên và2 dưới, độ lệch tối đa20 world units, không tách hai nhóm quá xa. Có lệch nhẹ thời gian bay giữa4 linh hồn để phân biệt khi hội tụ; tất cả cùng hướng mục tiêu đã chọn.
- `src/shared/skill-missiles.ts`: mô phỏng chung Offline/Online. Đường cong tính lại về vị trí **hiện tại** của quái, không chỉ điểm lúc cast. Server quét đường theo substep và kiểm collider/LOS, mục tiêu sống, map/epoch, owner, tuổi đạn; mỗi ID linh hồn chỉ hit3 một lần rồi bị xóa. Đủ8 trúng =24; không cộng24 ngay khi mở sách. Không PvP hoặc tự chuyển sang quái khác nếu mục tiêu chết.
- `SkillVisuals` dùng40 ảnh mới qua cache chung (tổng111 ảnh VFX). Mỗi cast có SkillPlayer riêng, mỗi đạn có thời gian/nguồn phát riêng. Đường bay nội suy giữa snapshot; marker hình ảnh không có quyền gây damage. Sách vẽ ngay sau thân trong lượt depth của chính actor, linh hồn là render-entity có Y chân, dưới cùng hệ camera/lighting. Không phát thêm loop update.
- Chết, rời map, disconnect, teleport, bắt đầu phi kiếm/đào, dùng skill khác hoặc đánh thường sẽ ngắt sách/đạn còn lại theo thao tác. Chỉ mất mục tiêu thì sách đóng sớm, không đổi mục tiêu để bù damage. Trúng đòn không cho miễn nhiễm; nhân vật vẫn nhận HP damage bình thường.
- Học/gắn ô, cooldown và seq do server kiểm. Mỗi đợt/đạn có ID ổn định theo cast+wave+index; retry không sinh thêm đạn. Snapshot chỉ có ID/tọa độ/tiến độ, không có base64/pose. Có giới hạn16 cast sách đồng thời trong MVP; không phải tuyên bố hỗ trợ hàng nghìn người.

## Kiểm tra

- `npm test`, `npm run build`.
- Vite5173: `node tests/spirit-book-harness.cjs` kiểm clip thật, tâm hai tay, ẩn vũ khí, frame/alpha, giữ pose, nội suy giữa snapshot và đóng/dọn.
- Dist4173 không backend: `node tests/spirit-book-browser.cjs`, kiểm nút4/phím4,8 hit3, mobile dọc/ngang, save cũ giữ3 skill/ví rồi thêm ô4, đổi phiên và reload.
- `node tests/spirit-book-online.cjs`: hai Chromium độc lập kết nối Node3002, A được học/B không học, đồng bộ8 đạn/hit, retry/owner/damage/cost giả, đóng/dọn và restart/reconnect giữ quyền.
- Chưa có backend WSS công khai; Sites phục vụ Offline và cấu hình kết nối backend riêng. Chưa kiểm thiết bị iPhone/Android vật lý hoặc độ trễ Internet cao. Dung lượng VFX nhúng làm frontend tăng; có cache dùng chung nhưng chưa stream/split các pack theo yêu cầu.

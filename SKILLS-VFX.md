# Skill & VFX — Cổ thần chỉ, ô2

Offline: vào game, bấm **ô skill thứ2** trong cung nút quanh Đánh hoặc phím **2**. Chỉ skill demo `skill_1` được học/gắn sẵn, không cấp tất cả skill trong registry. Nút đánh thường/Space và Phi kiếm/F giữ nguyên. Khi có quái còn sống trong300 world units và có LOS, server/local authority chọn quái gần nhất. Không có quái thì phát VFX về điểm trên đất phía trước, không gây sát thương cho người chơi.

Theo yêu cầu cập nhật: **100 damage**, một mục tiêu quái, mốc `hitAt=0.4s`; cooldown1s, cost0, VFX1.3s từ dữ liệu Studio. Damage100 nằm trong `public/game-data/skills/combat.json` do game quản lý, không thêm trường giả vào file Studio. Quái MVP60HP sẽ bị hạ bằng một lần trúng. Mốc hình ảnh của SkillPlayer không gọi damage/nhận thưởng; World tính giờ và re-check mục tiêu còn sống, range và LOS tại mốc0.4s rồi hit một lần. Target chạy xa, bị tường ngăn, chủ chết/teleport/rời map/disconnect không nhận damage không hợp lệ. Cast lên đất trống không tạo combat; damage thật vẫn dùng timer1.5s cũ. Không PvP, không tạo loot/tiền/MP mới.

## Nguồn và schema

- `public/game-data/skills/my_skills.skill-pack.json`: nguyên byte file đính kèm, **darkin-skill-pack-v1**, project **darkin-skill-project-v1**; không dùng darkin-character-skill-pack-v1.
- `public/game-data/skills/skill-runtime.mjs`: nguyên byte runtime v2 được cung cấp, import SkillPlayer/loadSkillImages. `source-index.json` lưu SHA256; check:assets kiểm cả hai nguồn và runtime.source trùng MJS. JSON runtime.source không được eval/thực thi.
- Pack không đính kèm README riêng. Đã đọc `usage` trong pack và toàn bộ schema/API trong runtime. `usage` trỏ effects/README.md nhưng file đó không có trong tài liệu gửi kèm; không đoán các API khác.
- ID giữ nguyên: `skill_1`; effect `vfx_384d3b81-aa30-4de6-9171-2ad5bfffc06b`; event `event_1`.
- Tên skill gốc vẫn “Kỹ năng mới”; nhãn UI “Cổ thần chỉ” lấy từ tên project qua manifest label, không đổi ID/dữ liệu xuất.
- Effect gồm15 PNG frame riêng, w/h314×314, anchor0.5/0.5, duration từng frame1/12s. Runtime chọn frame bằng thời gian chuẩn hóa trong event1.3s đúng API gốc, không tự lấy cả sprite sheet làm ảnh hoặc giả định mỗi tên clip là file.
- Offset giữ nguyên x=-8.095223563, y=-133.333369663, anchor target, follow=false, layer high, blend normal, scale1. Các lớp low/high/glow khác vẫn có hook trong renderer.

`src/shared/skills.ts` chứa registry: `register(pack)` validate rồi merge skill/effect theo ID. ID đã có được cập nhật, ID mới được thêm; không xóa các skill/effect khác. Update sai được từ chối trước khi thay project hợp lệ. Để phát hành pack khác: đặt pack/dependency đúng thư mục, cập nhật index và import/register pack trong shared registry theo thứ tự cập nhật mong muốn; chạy check/build/tests. Chỉ đặt file bất kỳ trong thư mục không tự đăng ký hay tự cấp quyền học. Dữ liệu khai báo được dùng chung cho Node và Offline.

## Vòng lặp / nhân vật

`SkillVisuals` nạp/giải mã PNG bằng **loadSkillImages** một lần, giữ ảnh bất biến chung. Mỗi cast có SkillPlayer riêng để không dùng chung cooldown/cursor giữa hai người; mỗi SkillPlayer update đúng một lần/RAF, ba lượt draw không update timeline. Cast trùng ID không phát lại. Low vẽ ở beforeEntities, high/glow ở afterEntities trước atmosphere của cùng renderer map/camera/DPR. Không có world/camera/RAF riêng cho skill. World XY đều là chân; casterRef cập nhật từ renderActor hiện tại, target ban đầu và các offset/motion giữ theo API runtime.

Sự kiện `cast` có trường `animation` gọi `CutoutCharacterVisual.castAnimation`: resolve qua action bindings hoặc tên clip thật, dùng animationId đã đăng ký. Clip này phát trên rig/parts/đồ đang mặc, không đổi thành preview của Studio. Thiếu clip thì hiện thông báo cụ thể và giữ nhân vật hợp lệ. Hết clip trả về action phù hợp; đổi map/kết thúc effect/cleanup hủy animation còn thuộc cast đó. Không restart clip mỗi render. Khi skin mới thiếu clip đang dùng, báo và thoát clip an toàn.

## Online, quyền học và lưu

Welcome `skillProtocol:1`; yêu cầu `castSkill` chỉ gồm mapId/slot/seq và targetId tùy chọn. Không nhận frame/pose/HP/damage/cost/learned do trình duyệt gửi. Snapshot chỉ gửi castId, skillId, caster/target, world XY, direction, time/epoch. Người khác tự phát cùng timeline/clip từ dữ liệu đã phát hành, không truyền base64 qua WebSocket.

Server kiểm: profile đã học và đã gắn ô; ID đăng ký; HP/chân hợp lệ; map instance; sequence chống retry; cooldown; target mob sống; tầm300 và LOS. Gói có cost0. Game chưa có MP: **mọi skill cost>0 bị từ chối rõ**, không cho dùng miễn phí hoặc tạo một nguồn năng lượng tùy ý. `readyAt` được lưu theo clock authority, giữ cooldown khi reconnect/restart. Client không thể tự học skill qua API.

Nhân vật Online mới mặc định **chưa học skill nào**, ô2 bị khóa. Không có nút cấp miễn phí hoặc route grant/learn. `World.learnSkill` là thao tác nội bộ cho server/game rule sau này, không phơi ra WebSocket; chưa xây tiến trình học skill. Test hai client dùng profile fixture server chỉ cho A học skill_1, B không học để kiểm quyền. Offline được gắn demo qua LocalGameSession và lưu riêng; không nhập profile/tiến trình Offline vào Online.

Profile lưu `skills: {version:1, learned:[], slots:[null,null,null,null], readyAt:{}}`; slot2 là index1. Save cũ bổ sung field, không reset HP/ví/cảnh giới/trang bị. Các ID học khác hợp lệ được giữ nguyên kể cả pack tạm không được phát hành. Không đổi schema hoặc khóa lưu của Studio. Registry/skill binding và learned state tách biệt.

## Chạy kiểm tra

- `npm run build`, `npm test`.
- Vite5173 + `node tests/skill-harness.cjs`:15 frame đúng thứ tự, rectangle/anchor/offset, camera/DPR một lần, mỗi frame update1 lần dù draw3 lớp; clip thực/missing clip, registry và map cleanup.
- Dist4173 + `node tests/skill-browser.cjs`: Offline không backend, nút2/phím2, damage100 tại quái thật, attackSeq không đổi, kill/ví/save, VFX kết thúc và cleanup; mobile dọc/ngang/desktop.
- `node tests/skill-online.cjs`: backend Node3002 thật, hai Chromium riêng, profileA học/B chưa học, remote clip/VFX,100damage duy nhất, cooldown/seq/owner/damage giả, effect end và restart/reconnect giữ profile. Test không thêm quyền học vào bản production.

Đổi map được kiểm bằng fixture vì game hiện chỉ phát hành một map; không tuyên bố đã kiểm cổng sang map thứ hai chưa có. Backend công khai WSS chưa được triển khai; Sites chạy Offline và cấu hình kết nối server riêng. Cần nâng backend từ repo mới để có skillProtocol1. Chưa kiểm Safari/iPhone/Android vật lý, độ trễ Internet lớn hoặc tải nhiều người. Gói ảnh nhúng làm tăng dung lượng tải frontend; ảnh dùng chung, không giải mã lại mỗi actor.

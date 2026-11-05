# Nhân vật thật và catalog tài nguyên

**Cập nhật 2026-11-05:** nhân vật mặc định lấy nguyên parts/joints/ảnh/headId/bodyId/mountState/mountSignatures từ `public/game-data/characters/studio/traveler-v8.cutout.json` (file `traveler.cutout 8.json`). Scale game vẫn .69. Bộ phát và bốn clip gameplay từ demo giữ nguyên; hoạt ảnh đào .8 giây giữ nguyên, riêng hình/transform búa lấy từ Studio 8 qua `tools[].attachmentResourceId`. Clip đứng cầm búa `my_walk` 1.1 giây trong file mới được giữ trong spec nhưng không tự thay đòn đào. Xem [STUDIO-ACCESSORIES.md](STUDIO-ACCESSORIES.md) về hai gói kính mới đang lệch headId/signature; chưa có cấu hình hợp lệ để đeo chúng lên đầu mới. Map và gameplay không đổi trong lần cập nhật này. Phần nguồn demo bên dưới mô tả nền animation/runtime lịch sử được giữ lại.

## Nguồn demo nền (lịch sử; map hiện tại xem MINING.md)

- Map: `kiemlol/Darkin` commit `f04460d307412fc225e73d7f8cd717b20a0c2657`. `public/game-data/maps/forest.map-bundle.json` nguyên byte từ `spawn_map.map-bundle.json`, SHA-256 `916e8b58f28c5331fbf26ee36298df59ee91d17048f91b4ac1a56f0e4c7719a6`. Không đổi terrain/neo/scale/rotation/flip/roads/lighting/collision. Runtime map vẫn bản v2 cùng extension multi-actor hiện có; upstream không đổi MJS trong lần cập nhật này.
- Character: `linhphann66-maker/Night-camp`, nhánh main, commit `f46acd71c93a075ea63d7e148c82b1f89f5f548e`, `dist/cutout-demo/traveler.character.json`.
- File dùng thực: `public/game-data/characters/traveler/traveler.character.json`; sáu ảnh `assets/rig_traveler_{head,torso,armF,armB,legF,legB}.png` và `assets/sword.png`. Không crop, fit lại hoặc sửa joints/anchor/offset.
- Demo gốc dùng `cutout-character-v1` (spec chứa đủ bốn clip). Đây không phải format export Studio. Adapter cũng đọc `nightcamp-cutout-v1` và `nightcamp-cutout-export-v1` bằng `.project` + `.clip`; không đổi các format gốc.
- Bộ phát gốc: `public/game-data/cutout-runtime/player.mjs`, cùng `bootstrap.js`, `avatar.js`, `model.mjs`, `attachments.mjs`, `wings.mjs` và `pets/runtime.mjs`, `pets/rig-authoring.mjs`. Toàn bộ cây runtime đi kèm được copy cục bộ để giữ dependency. Không dùng client/server game Night Camp.

## API và clip thật

`CutoutPlayer.load(spec, baseURL)` tải spec, `play(clipId,{restart})`, `update(dtSeconds)` trả true khi clip một lần hoàn thành, `draw(ctx,footX,footY,scale,{weapon})`, `face = -1|1`, `dispose()`.

| Gameplay | Clip ID trong demo | Thời lượng (giây) | Loại | Rate game |
|---|---|---:|---|---:|
| idle | idle | 3.2 | loop | 1 |
| walk | walk | 1 | walk (loop) | 1.24 |
| run | run | .65 | walk (loop) | .97826087 |
| attack | attack | .36 | attack, một lần | 1 |

Rate walk = tốc độ game 155 / tốc độ demo 125; run = 225/230. Đây là cấu hình biểu diễn, không thay tốc độ gameplay. Mobile kéo nhẹ joystick là walk, trên 75% là run; desktop giữ Shift. Clip ID không phải tên file. Catalog có alias `idel`, `atack`; adapter tìm key/clip.name rồi tạo alias trong bản sao bộ nhớ khi API cũ yêu cầu bốn slot, không sửa JSON gốc.

`attackSeq` server tăng khi chấp nhận một đòn, chỉ làm tín hiệu hình ảnh. Adapter chạy attack hết một lần rồi quay lại walk/run/idle; không restart từng frame. Không dùng callback hit của animation để tính sát thương. Demo chưa có hurt/death: giữ rig thật, giảm alpha khi hurt/dead; không báo là đã có clip hurt/death. Chỉ có hình nhìn 3/4 trái/phải, không giả tám hướng.

## Hiển thị, cache và trạng thái

`src/client/cutout-visual.ts` thực thi `CharacterVisual`. Tọa độ foot truyền thẳng vào bộ phát, không cộng camera hay DPR trong adapter. Draw chạy bên trong lượt Y-sort và trước map atmosphere. Body/weapon cũ không vẽ chồng lên cutout. Tên và HP là overlay trong world-space. Quái vẫn là hình tạm có chủ ý; mọi người chơi dùng cutout.

Các mở rộng tương thích API của player gốc: resolver đường ảnh theo resource (tham số thứ ba tùy chọn), cache promise ảnh theo URL (kể cả qua nhiều appearance) và `fork()` tạo state player độc lập từ spec/sprites/rig đã tải. Mỗi actor có pose, blend, time, attachmentTime, hitFired và face riêng. Prototype/spec và ảnh cache dùng chung; dispose instance không xóa sprite mà actor khác đang dùng. Prototype tồn tại theo vòng đời trang. Không có pose từng frame hoặc bundle/base64 qua WebSocket.

`src/client/assets.ts` tải và kiểm tra xong mới đổi visual, dùng generation token chống race; lỗi giữ visual hợp lệ và báo tại `#asset-status`. Lỗi lần đầu có cảnh báo rõ là đang dùng hình tạm. Gameplay state không bị sửa khi thay visual. Menu có lựa chọn ID appearance đã đăng ký (hiện một lựa chọn thật từ demo). Online gửi yêu cầu ID; server allowlist từ catalog, snapshot chứa appearanceId/attackSeq. Cần rebuild/restart cả client/server khi đổi catalog.

## Đăng ký thêm tài nguyên

Không có cơ chế hiểu file bất kỳ chỉ bằng cách chép vào thư mục. Quy trình là đặt file + phụ thuộc, khai báo manifest, kiểm tra, build rồi nạp qua ID.

1. Spec đầy đủ như demo: `npm run register:character -- ten-id /duong-dan/character.json`. Tool giữ JSON nguyên bản, copy ảnh `assets/` được tham chiếu, kiểm tra rig đã khai báo và bốn clip, thêm character/animation/appearance vào `public/game-data/catalog.json`. Không đọc rig mới một cách đoán mò.
2. Studio project/export nguyên gói: đặt file và ảnh tương đối dưới `characters/<id>/`; khai báo resource character có `path`, `rig`, `baseCharacter` trỏ đến character đầy đủ **cùng source rig**. Adapter nhận parts/attachments và clip nguyên gói, lấy clip còn thiếu từ base rõ ràng. Kênh pose thiếu trong clip Studio được bổ sung từ pose idle của base cùng rig, đúng luồng import demo, giữ nguyên giá trị authored đã có. Trong animation resource khai báo clip ID thực cần dùng (vd `idel`), không buộc tách JSON gốc. Một file chỉ chứa một clip không tự sinh được ba clip còn thiếu; nếu không có base tương thích sẽ báo lỗi.
3. Outfit: resource `type:"outfit"`, `rig`, `path` tới parts dictionary hoặc object `{parts:...}`, hoặc `source` + `embedded:"parts"` để dùng nguyên bundle. Appearance chọn `outfit` theo ID.
4. Animation: resource `type:"animation"`, `rig`, `path` tới clip dictionary, `{clips:...}`, project hoặc export có `.project.clip`; hoặc `source` + `embedded:"clips"`. Khai báo bảng `actions` gồm `clip`, `aliases`, `loop`, `rate`. Muốn thêm action mới (archery/magic) bổ sung binding + gameplay action tương ứng; không phải tên ảnh hay tên file. Bốn action cơ bản là bắt buộc cho MVP hiện tại.
5. Accessory: resource `type:"accessory"`, `rig`, `slot`, `path` tới attachment/list/`{attachments:[]}` hoặc `source` + `embedded:"attachments"`. Kiếm demo dùng `source` + `embedded:"weapon"`; có thể dùng weapon object độc lập chứa `spriteData`. Thêm ID vào appearance.accessories. Attachment dùng socket `head/face/handF/handB/back`, layer front/back, anchor/offset/rotation và wingRig nguyên dữ liệu. Không gắn bằng tọa độ màn hình. Attachments có sẵn trong character được giữ nguyên; accessory mới là bổ sung nên tránh ID trùng.
6. Chạy `npm run check:assets`, `npm test`, `npm run build`; chạy browser test rồi deploy. `check:assets` xác nhận spec cơ bản và đường ảnh; kiểm tra composition/giải mã/rig channels đầy đủ diễn ra trong AssetRegistry khi tải. Lỗi hiện rõ, không thay rig hợp lệ đang dùng.

Manifest version 1 phân biệt rigs, resources và appearances; defaults chỉ định appearance và animationSet. Rig contract gồm sourceRig, sáu parts, sockets và danh sách channels. Runtime gốc kiểm tra joints neck/pelvis/shoulder/hand/hip/foot và numeric keyframes. Parts thiếu joints, thiếu requiredChannels, kênh animation lạ, clip thiếu hoặc slot sai bị từ chối. Không có tự chuyển đổi rig; cần thêm adapter mapping tường minh cho một rig khác trước khi sử dụng.

Bộ validator demo hiện yêu cầu anchor attachment trong 0–1; game giữ nguyên quy tắc gốc, không tự clamp hay chuẩn hóa dữ liệu. Điểm fit mục tiêu/headFit giữ phạm vi gốc; wing rig được module gốc kiểm tra và phát. Kính vuông/tròn từ Studio đã được QA trực quan; chưa có pack cánh thật trong các file gửi lần này. Không tuyên bố đã thử mọi bundle Studio tương lai.

## Kiểm thử

- `npm test`: map/gameplay, alias/format, rig/clip hỏng, server allowlist và không đổi physical state.
- `node tests/cutout-browser.cjs`: cần Node server 3000; dist thật, bốn clip, face flip, hai client thật đều cutout, đồng bộ action remote, clock riêng, không request thêm ảnh cho actor thứ hai, không ảnh 404.
- `tests/asset-harness.html` chạy qua Vite 5173; chạy `node tests/asset-browser.cjs` (gọi `runAssetChecks()` trong browser): cache/clock/attachmentTime riêng, giữ tài nguyên khi ảnh thiếu/kênh sai, race, đổi visual không đổi actor, one-shot attack và dispose an toàn.
- `node tests/browser.cjs`, `node tests/movement-regression.cjs`: giữ các kiểm thử gameplay/mobile/phiên và bản lưu chết đã sửa.

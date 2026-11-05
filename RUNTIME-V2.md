# Cutout runtime v2 và animationId

Nguồn: `cutout-runtime.zip` người dùng cung cấp ngày 2026-11-05. Đã đọc README và cập nhật toàn bộ cây module trong `public/game-data/cutout-runtime/`, gồm player/model/avatar, animation-identity, accessory-runtime, mount-profiles, equipment và các module cánh/pet. README gốc và SHA-256 từng file ZIP ở `STUDIO-RUNTIME-README.md` / `studio-runtime-provenance.json`. Backup runtime/catalog trước cập nhật nằm ngoài public tại `backups/runtime/before-animation-id/`.

Game giữ nguyên map, bộ ảnh/parts/joints/headId/bodyId/mountSignatures Studio 8, scale .7452 (tăng 8% ở lần chỉnh giao diện/bow1), các clip/pose/duration/rate đã dùng, input, camera, combat, ví/save và multiplayer. Không chạy JSON `code`/`runtime.source`.

## ID đã cài đặt

Catalog `public/game-data/catalog.json` lưu `resources[].animationIds` và `actions[].animationId`. Các file clip cũ chưa có ID được migration **một lần khi triển khai**, ghi kết quả cố định vào catalog. Không sửa JSON asset gốc. Client chỉ chép ID đã đăng ký vào spec; không hash tên/frame, dùng thời gian hoặc random để tạo ID khi tải/phát. `CutoutPlayer.load` từ chối clip thiếu ID thay vì tạo ID mới; gói animation mới phải mang ID từ Studio.

| Clip/hành động | ID cố định |
|---|---|
| idle | `nightcamp-animation-idle-4cd85783-v1` |
| walk | `nightcamp-animation-walk-ee063896-v1` |
| run | `nightcamp-animation-run-908d1b98-v1` |
| attack | `nightcamp-animation-attack-d9129f6d-v1` |
| đào, my_walk .8 giây | `animation-legacy-cace91b5` |
| đứng/cầm búa Studio 8, my_walk 1.1 giây | `animation-legacy-7e71784c` |
| clip bổ sung Shadow Knight | `animation-legacy-7bb14443` |

Hai clip `my_walk` có ID riêng. Animation gốc được retarget hợp lệ sang Shadow Knight vẫn dùng cùng ID nguồn. Đổi tên hiển thị/alias không đổi ID; `CutoutCharacterVisual` phát bằng ID, giữ phase khi thay trang bị và chọn lại alias theo ID nếu tên alias đổi. Attack một lần và thời gian sát thương vẫn theo cơ chế cũ; ID/clip không có quyền quyết định gameplay.

`scripts/register-character.ts` gán/persist ID cho clip legacy tại bước đăng ký tài nguyên. Nếu file đã có `clip.id`, giữ nguyên. Không chạy lại migration để đổi ID khi đổi tên/sửa frame. `newAnimationId()` trong module gốc chỉ dành cho thao tác tạo animation mới có chủ ý của công cụ authoring; game không gọi hàm này.

## Neo theo animationId

Đọc cả `darkin-accessory-pack-v1` version 1 và 2. Version 2 dùng dữ liệu Studio, ví dụ cấu trúc:

```text
accessory.animationBase = transform mặc định
accessory.animationProfiles = [
  { animationId, transform },
  { animationId, target: "head" hoặc "body", targetId, signature, transform }
]
```

Transform giữ socket/layer/w/h/scale/x/y/rotation/anchor/headFit đúng dữ liệu xuất. Có cấu hình cho ID đang phát thì dùng cấu hình đó. Không có thì trở về animationBase, hoặc mount profile mặc định khớp đầu/thân; không giữ socket/offset của clip trước. Profile đầu/thân còn phải khớp ID và hình học thực. Hai gói kính hiện tại vẫn lệch ID đầu như STUDIO-ACCESSORIES.md; cập nhật runtime không tự sửa dữ liệu fit.

Player đưa **ID của clip thực sự đang phát** vào pose, kể cả khi one-shot attack đang phát trong lúc trạng thái di chuyển đã đổi. Renderer chọn transform riêng cho từng actor trong lượt world/Y-sort/lighting. `NC.resolveAttachment`, draw thật, kiểm tra vũ khí cầm tay và `NC.attachmentMatrix` dùng cùng quy tắc. Không sửa mảng transform dùng chung để đổi hành động; hai actor cùng một sprite inventory có thể dùng handF và handB độc lập.

Kiếm chắp vá hiện dùng animationProfiles thật cho idle/walk/run/attack; xem [PATCHWORK.md](PATCHWORK.md) về bốn pack và binding pack 4. Búa đá Studio 8 tiếp tục dùng neo mặc định. Kiểm thử cấu hình carry/shoot dùng fixture kỹ thuật với chính ảnh búa hiện có; không phát hành animation hoặc cơ chế bắn cung giả vào gameplay.

## Nạp gói qua API

`player.addAnimation(animationPack, {alias})` đọc `darkin-animation-pack-v1` version 1, kiểm `animationId === clip.id`, giữ nguyên ID. Alias là tên tra cứu, không phải tên file hoặc ID mới. Gói có cùng ID cập nhật các alias của clip đó; không ghi đè alias đang thuộc ID khác.

`await player.addAccessories(accessoryPack)` cập nhật ảnh, hợp nhất mountProfiles theo target/ID/signature và animationProfiles theo animationId/targetId. Chỉ cùng khóa mới bị thay; các cấu hình còn lại vẫn giữ. Món cùng loại được ẩn theo helper Studio. Nạp/giải mã và dựng candidate xong mới thay; giữ toàn bộ clips và thời gian/pose/face/wing clock **tại thời điểm hoàn tất tải**. Cả animation được thêm trong lúc tải cũng được giữ. Ảnh lỗi hoặc kết quả tải cũ không thay player hợp lệ.

Đây là API cho dữ liệu đã được game cho phép, không phải đường nhận pack/ảnh/code tùy ý từ WebSocket. Muốn bổ sung tài nguyên vào game phải đăng ký catalog, ID và kiểm tương thích rig như ASSETS.md; giao diện trang bị vẫn dùng allowlist server. Client Online nhận action/appearance/accessory/head/body IDs từ server, cùng catalog ánh xạ action sang ID animation; không truyền ảnh, profile hoặc pose từng frame.

## Các mở rộng game giữ lại trên runtime ZIP

- Resolver ảnh theo resource và cache giải mã ảnh dùng chung.
- `fork()` giữ state/time/pose riêng; sprite group có refcount, owner cập nhật/giải phóng không xóa texture actor khác còn dùng.
- Wing clock nhận giây thật độc lập rate walk/run.
- Thay trang bị theo transaction, copy-on-write để không sửa spec/inventory của actor khác; token chống kết quả tải cũ và dọn rig/texture đúng vòng đời.
- Load không tạo animationId; adapter dùng ID đã persist. Thiếu ID/clip ở luồng hiển thị báo lỗi, giữ visual hợp lệ hoặc dùng idle khi không thể phát action đó.
- Kiểm hình học thực ưu tiên hơn metadata cũ khi chọn profile animation đầu/thân.

`public/game-data/accessories/studio/accessory-runtime.mjs` là entrypoint tương thích, re-export bản v2 chính; client/server không dùng hai phiên bản bộ ghép khác nhau.

## Kiểm thử

`npm test`, `npm run build`; Vite 5173 rồi `node tests/runtime-v2-harness.cjs`. Harness kiểm drawImage/ma trận thực cho carry handF → shoot handB → run → idle, lật/zoom/anchor, ID không đổi qua reload, load từ chối ID thiếu và không gọi random; cập nhật riêng phụ kiện giữ ID/clip/time, profile merge, lỗi ảnh/race, hai actor chia sẻ inventory và dọn texture.

Production: `traveler-v8-browser.cjs`, `mining-browser.cjs` trên file tĩnh 4173; hai client thật và restart backend trong `mining-online.cjs`. Báo cáo lượt chạy nằm ở TEST-RESULTS.md. Sites chỉ phục vụ frontend; backend WSS công khai chưa triển khai. Chưa kiểm thiết bị điện thoại vật lý/tải lớn.

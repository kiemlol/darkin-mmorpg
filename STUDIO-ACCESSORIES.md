# Phụ kiện Studio trong game

**Bộ ghép/renderer v2:** đã cập nhật từ `cutout-runtime.zip`, hỗ trợ accessory-pack version 1/2 và neo theo animationId, có fallback neo mặc định. Hai entrypoint accessory-runtime của game cùng dùng một module v2. Xem [RUNTIME-V2.md](RUNTIME-V2.md); runtime mới không tự sửa ID đầu sai trong pack.

**Studio 8 — 2026-11-05:** nhân vật mặc định đã thay bằng `traveler.cutout 8.json`, headId `custom-head-2bca4fed` / signature `8480a2dc`, bodyId `custom-body-b4d78784` / `f9ceb4e9`. Hai gói kính mới đã thay nguyên byte, cùng accessoryId như cũ, nhưng cả hai chỉ có profile cho `custom-head-b01afa2d` / `224934f4`. Chúng không khớp đầu Studio 8 hoặc Shadow Knight hiện được phát hành. Game báo thiếu cấu hình và không đeo; không sửa ID/chữ ký hoặc mượn profile khác để giả thành công. Cần xuất lại kính từ đúng đầu Studio 8 để xác nhận khớp hình. Các profile cũ chỉ còn trong backup, không trộn vào gói mới.

Mở **Menu → Thử phụ kiện Studio**: chọn đầu, thân, **Kiếm chắp vá**, kính gọng vuông hoặc kính tròn, bấm **Đeo/Tháo**, rồi **Tiếp tục** để xem trên nhân vật trong map. Kiếm mới có đủ neo riêng bốn hành động, được đeo mặc định; chi tiết tại [PATCHWORK.md](PATCHWORK.md). Đổi đầu/thân riêng hoặc chọn ngoại hình Shadow Knight ở mục phía trên. Các lựa chọn chỉ thay hình ảnh, không đổi HP, chân, hitbox, tốc độ hoặc sát thương. Menu thử phụ kiện cuộn được trên mobile.

## Dữ liệu nguồn

Các file dưới đây được sao chép nguyên byte từ các tệp đã cung cấp:

- `public/game-data/characters/studio/traveler-v8.cutout.json`
- `public/game-data/characters/studio/shadow_knight.game-bundle.json`
- `public/game-data/accessories/studio/glasses_square.accessory-pack.json`
- `public/game-data/accessories/studio/glasses_round.accessory-pack.json`
- `public/game-data/accessories/studio/accessory-runtime.mjs`

Không chạy trường `bundle.code`. `studioProject` đọc project `nightcamp-cutout-v1` trực tiếp hoặc `.project` trong `nightcamp-cutout-export-v1`, giữ parts (kể cả elbow/knee), headId, bodyId, mountSignatures và mountState. Bốn clip idle/walk/run/attack đang chạy vẫn được giữ nguyên. Clip bổ sung trong từng file được giữ đúng tên/thời lượng, không tự gán thành đòn đánh hiện tại. Bộ ảnh/rig cũ và gói kính cũ được sao lưu ngoài public trong `backups/characters/before-traveler-v8/`.

Traveler Studio 8 dùng các ID mới ghi trên. Shadow Knight giữ headId `nightcamp-head-shadow_knight-v1`, bodyId `custom-body-e851fa74`. Hai rig dùng cùng sáu phần head/torso/armF/armB/legF/legB và cùng các kênh góc; catalog Shadow Knight khai báo rõ nguồn clip traveler, dùng nguyên góc pose, không chuyển đổi hay căn lại hình học. Scale tổng thể game giữ .69 như bản trước; ảnh/khớp/phụ kiện không được fit thêm. Mount registry chỉ giữ hình học kiểm fit, không nhúng lại ảnh trong JS/WebSocket; bộ phát nạp parts đầy đủ từ JSON gốc.

## Ghép, tải và vẽ

`src/shared/equipment.ts` import trực tiếp ba hàm `validateAccessoryPack`, `resolveAccessory`, `equipAccessory` từ MJS được gửi. Gói được kiểm tra và đăng ký theo accessoryId; trùng ID giữa các gói bị từ chối. Cùng loại dùng đúng quy tắc exclusive của `equipAccessory`: món cũ vẫn trong danh sách nhưng visible=false. Mũ/kính kiểm tra headId và chữ ký head, cánh kiểm tra bodyId và chữ ký torso. Không chọn profile của đầu/thân khác.

Server kiểm tra ID đầu/thân theo `mount-data.json` sinh từ hình học thật của bundle. Client kiểm tra lại **parts thật đang tải**: nếu file hình học thay đổi mà ID cũ còn giữ, không lấy chữ ký metadata cũ để lách kiểm tra. Thiếu profile thì attachment bị ẩn và lý do hiện ở giao diện. Thao tác đeo mới thất bại sẽ giữ món hợp lệ trước đó.

`AssetRegistry` dựng spec mới từ bundle, giải quyết các attachment, tải tất cả ảnh và sprite trong wingRig qua bộ phát hiện có. `CutoutCharacterVisual` chỉ đổi sang player mới sau khi tải thành công; giữ clip, time, pose, blend, face, trạng thái hit, attackSeq và attachmentTime tại **thời điểm swap**, không lấy trạng thái cũ lúc bắt đầu tải. Lượt tải cũ không ghi đè lượt mới.

Renderer thật vẫn lấy attachments từ `NC.ITEMS[player.equip.top].attachments`. Không chỉ đổi mảng spec. Phụ kiện được vẽ trong lượt world/Y-sort/lighting của nhân vật. Bộ phát dùng attachmentMatrix/socket gốc với nguyên w/h, scale, anchor, x/y, rotation, layer và headFit. Wing rig dùng cây xương và thứ tự lớp của runtime gốc, nằm sau nhân vật khi layer=back; attachmentTime tăng bằng giây thật, không tăng theo rate walk/run.

Ảnh được dùng chung theo URL/data URI với reference count. Animator mỗi người riêng. Khi player cuối cùng bỏ một variant, sprite registry, rig cache và reference ảnh của variant được giải phóng; ảnh còn người dùng không bị xóa. Một prototype mặc định được giữ warm theo vòng đời trang.

## Đồng bộ

Actor snapshot có headId, bodyId và danh sách `{accessoryId, visible}` cùng equipmentWarnings. Client gửi lệnh cosmetic của chính phiên, server kiểm tra ID, fit và loại trừ món cùng loại. Lệnh set chỉ gửi các ID đã phát hành, không nhận attachment transform do client tự khai. Không gửi ảnh base64, bundle, profile hay pose từng frame qua WebSocket. Player khác nạp cùng asset đã xuất bản và resolve bằng cùng runtime.

Offline và Online dùng chung helper. Ngoại hình thử hiện áp dụng trong phiên; save Offline vẫn lưu vị trí/HP/kill như trước, chưa lưu trang bị giữa lần tải trang. Online công khai chưa triển khai; hai client đã thử với backend Node của dự án tại local. Khi tự deploy backend, rebuild và restart để có cùng catalog/pack với frontend.

## Thay hoặc thêm gói

Đặt nguyên project/export tại đường dẫn đã khai báo trong catalog và mount registry; sinh metadata đầu/thân từ đúng file đó (w/h, joints, head, ID và chữ ký), không đổi JSON Studio. Búa và animation có thể đến từ hai resource khác nhau qua `tools[].attachmentResourceId` và `resourceId`. Khi thay kính, giữ accessoryId ổn định và thay file pack nguyên byte; chỉ đeo khi profile khớp cả ID lẫn chữ ký đầu. Khi đăng ký loại mới, bổ sung pack import trong shared/equipment.ts và đường dẫn manifest. Script `import-studio-accessories.ts` là importer lịch sử cho bộ năm file cũ, không dùng để tái tạo bộ ba file Studio 8 hiện tại.

Chạy `npm run check:assets`, `npm test`, `npm run build`; công cụ build kiểm tra chữ ký metadata trùng geometry của bundle. Luôn phát hành frontend/backend cùng tập ID. Chưa có tự chuyển rig không tương thích hoặc tự căn món thiếu profile.

## Kiểm chứng

- `node tests/accessories-browser.cjs` (server 3000) hoặc `node tests/traveler-v8-browser.cjs` (file tĩnh 4173): nhân vật mới/portrait, bốn clip/lật/zoom, hai kính bị từ chối đúng thiếu profile, giữ gameplay/save. Ảnh hiện tại `tests/traveler-v8-mobile.png`, `tests/traveler-v8-glasses-mismatch.png`. Ảnh kính khớp bản cũ chỉ là lịch sử, không chứng minh pack mới khớp.
- `node tests/accessories-online.cjs`: hai trình duyệt thật cùng thấy đầu/thân Studio 8, UI từ chối kính không phù hợp, đổi ngoại hình hợp lệ đồng bộ; snapshot không chứa ảnh/profile/pose.
- Chạy Vite 5173 rồi `node tests/accessories-harness.cjs`: kiểm parts thật, kính không hợp lệ thực sự ẩn trong renderer, lỗi giải mã ảnh giữ renderer cũ, giải phóng texture, wingRig fixture và clock riêng. `mining-visual-harness.cjs` kiểm ma trận **drawImage thực** với socket/điểm neo búa Studio 8 và camera/zoom/lật. Test positive kính cũ dùng cặp export/profile khớp trong backup, không phát hành lại fit cũ.
- Các file gửi lần này chỉ có hai gói kính. Cánh được kiểm thử bằng fixture kỹ thuật không được phát hành trong game, chưa có xác nhận khớp thị giác cho một pack cánh Studio thật. Chưa thử trực tiếp thiết bị iOS/Android thật.

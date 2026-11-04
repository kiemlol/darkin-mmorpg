# Phụ kiện Studio trong game

Mở **Menu → Thử phụ kiện Studio**: chọn đầu, thân, kính gọng vuông hoặc kính tròn, bấm **Đeo/Tháo**, rồi **Tiếp tục** để xem trên nhân vật trong map. Đổi đầu/thân riêng hoặc chọn ngoại hình Shadow Knight ở mục phía trên. Các lựa chọn chỉ thay hình ảnh, không đổi HP, chân, hitbox, tốc độ hoặc sát thương. Menu thử phụ kiện cuộn được trên mobile.

## Dữ liệu nguồn

Các file dưới đây được sao chép nguyên byte từ các tệp đã cung cấp:

- `public/game-data/characters/studio/traveler.game-bundle.json`
- `public/game-data/characters/studio/shadow_knight.game-bundle.json`
- `public/game-data/accessories/studio/glasses_square.accessory-pack.json`
- `public/game-data/accessories/studio/glasses_round.accessory-pack.json`
- `public/game-data/accessories/studio/accessory-runtime.mjs`

Không chạy trường `bundle.code`. Game đọc `bundle.project`, giữ parts (kể cả elbow/knee), headId, bodyId, mountSignatures và mountState. Bốn clip idle/walk/run/attack đang chạy vẫn được giữ nguyên. Clip bổ sung `Cú đá tử thần` trong bundle được giữ dưới đúng tên và thời lượng 1.3 giây, không tự gán thành đòn đánh hiện tại.

Traveler: headId `nightcamp-head-original-v1`, bodyId `custom-body-9f093436`. Shadow Knight: headId `nightcamp-head-shadow_knight-v1`, bodyId `custom-body-e851fa74`. Hai rig dùng cùng sáu phần head/torso/armF/armB/legF/legB và cùng các kênh góc; catalog Shadow Knight khai báo rõ nguồn clip traveler, dùng nguyên góc pose, không chuyển đổi hay căn lại hình học. Scale tổng thể game giữ .69 như bản trước; ảnh/khớp/phụ kiện không được fit thêm.

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

Chạy `node_modules/.bin/tsx scripts/import-studio-accessories.ts <thư-mục-file-đính-kèm>` để tái tạo đúng bản tích hợp này. Script sao chép nguyên file và sinh metadata nhẹ, không chỉnh JSON xuất từ Studio. Khi đăng ký loại mới, bổ sung pack import trong shared/equipment.ts và đường dẫn trong manifest, sinh lại mount metadata từ bundle tương ứng; không chỉ chép file tùy ý vào thư mục.

Chạy `npm run check:assets`, `npm test`, `npm run build`; công cụ build kiểm tra chữ ký metadata trùng geometry của bundle. Luôn phát hành frontend/backend cùng tập ID. Chưa có tự chuyển rig không tương thích hoặc tự căn món thiếu profile.

## Kiểm chứng

- `node tests/accessories-browser.cjs`: dist thật, kính được vẽ, thông số khớp nguyên profile, đứng/đi/chạy/đánh/lật, đổi kính cùng loại, head/body, tháo và không mất gameplay state. Ảnh: tests/glasses-square.png, tests/glasses-round-shadow.png.
- `node tests/accessories-online.cjs`: hai trình duyệt thật; player còn lại thấy đúng kính và đầu/thân, đổi nhanh và tháo; snapshot không chứa ảnh/profile/pose.
- Chạy Vite 5173 rồi `node tests/accessories-harness.cjs`: so ma trận và rectangle **drawImage thực** với socket và anchor Studio (sai số số học Canvas <.0001), giữ phase/pose khi đổi player, lỗi giải mã ảnh giữ renderer cũ, geometry sai thì ẩn món, giải phóng texture, toàn bộ ảnh cây wingRig và đồng hồ cánh riêng.
- Các file gửi lần này chỉ có hai gói kính. Cánh được kiểm thử bằng fixture kỹ thuật không được phát hành trong game, chưa có xác nhận khớp thị giác cho một pack cánh Studio thật. Chưa thử trực tiếp thiết bị iOS/Android thật.

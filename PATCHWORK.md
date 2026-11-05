# Kiếm chắp vá

ID phụ kiện duy nhất: `sw_patchwork`, tên **Kiếm chắp vá**, loại `weapon`, socket `handF`, layer `back`. Vũ khí mặc định trong `catalog.defaults.weaponId`; có thể chọn **Menu → Thử phụ kiện Studio → Kiếm chắp vá → Đeo/Tháo**. Đây là thay đổi ngoại hình, không thêm sát thương, tốc độ hoặc hitbox.

## Bốn nguồn Studio

Các file upload được giữ nguyên byte trong `public/game-data/accessories/studio/patchwork/`. `index.json` ghi tên upload, SHA-256 và ID profile cần lấy. Chúng cùng accessoryId/ảnh, nên phải hợp nhất thành một món, không đăng ký bốn bản sao.

| Hành động | File người dùng | Bản nguyên gốc trong dự án |
|---|---|---|
| idle | sw_patchwork.accessory-pack.json | idle.accessory-pack.json |
| walk | sw_patchwork.accessory-pack 2.json | walk.accessory-pack.json |
| run | sw_patchwork.accessory-pack 3.json | run.accessory-pack.json |
| attack | sw_patchwork.accessory-pack 4.json | attack.accessory-pack.json |

Các file là các lần xuất tích lũy: một file có nhiều profile, trong đó một số profile vẫn giữ giá trị cũ. Adapter chọn đúng profile của từng file theo bảng trên, không để thứ tự import ghi đè nhầm neo đi/chạy.

**Pack 4 có profile `nightcamp-animation-iaiS2-ad7cc353-v1`, trong khi clip attack game đang dùng có ID `nightcamp-animation-attack-d9129f6d-v1`.** Theo chỉ định pack 4 là neo attack, adapter sao chép nguyên transform đó vào một profile mang ID attack đã cài. Giữ cả profile iaiS2 gốc; không đổi ID, keyframe hoặc thời lượng clip game, không giả vờ đã nhập một animation iaiS2 chưa được cung cấp. Bảng đối chiếu cụ thể và nguyên transform nằm trong `bindings.json`.

Ảnh PNG nhúng, w/h, scale, anchor, x/y, rotation, socket và layer giữ đúng Studio. Không căn lại ảnh/neo. `animationBase` được giữ làm fallback khi clip không có profile.

## Đăng ký và dựng

`scripts/merge-patchwork.ts` kiểm SHA/format/ID/ảnh và dùng `mergeAccessoryProfiles` của runtime Studio để sinh `merged.accessory-pack.json` cùng format/version gốc. Catalog đăng ký resource `patchwork-sword`, allowlist chung đọc một item từ gói này. Client/server không nhận pack/transform từ mạng.

Sau khi thay file nguồn có chủ ý: cập nhật SHA và sourceAnimationId trong index, chạy `npm run merge:patchwork`, xem lại bindings, `npm test`, `npm run build`. Build chạy `--check`, báo lỗi khi nguồn/đầu ra không khớp. Không sinh ID lúc tải hoặc phát animation.

Online gửi cùng accessoryId/trạng thái hiện có; từng actor có animator riêng. Hai rig Traveler/Shadow Knight hiện cùng quy ước kênh/socket đã kiểm thử; điều này không có nghĩa mọi rig mới đều tương thích.

## Búa và tháo kiếm

Tool đào có ưu tiên hiển thị sau khi resolve trang bị: tạm ẩn kiếm, dùng nguyên búa/neo Studio 8 với clip đào cũ. Lựa chọn kiếm không bị thay; hết toolId thì kiếm tự hiện lại. Không vẽ hai vũ khí chồng nhau.

Khi tháo kiếm, tay trống; `hideLegacyWeapon` ngăn renderer tự vẽ lại kiếm demo cũ. Spec kiếm cũ vẫn được giữ cho hình học rig, và các spec bên ngoài không bật flag vẫn tương thích API cũ. Lựa chọn phụ kiện là thử nghiệm trong phiên, chưa có lưu trang bị lâu dài; reload dùng kiếm mặc định. HP/ví/cảnh giới/save hiện có không bị reset.

## Kiểm thử

- `npm test`: SHA nguồn, profile đúng từng file, binding pack 4, fallback, allowlist và không đổi gameplay.
- Vite 5173: `node tests/patchwork-harness.cjs` kiểm drawImage/ma trận thật trên hai rig, flip/zoom, đúng neo/layer, không kiếm demo, đổi búa/kiếm và giải phóng player.
- Bản build/file tĩnh 4173: `node tests/patchwork-browser.cjs` kiểm đủ bốn hành động, pixel ảnh thật, menu Đeo/Tháo và HP/ví không đổi, không cần backend.
- `node tests/patchwork-online.cjs`: tự chạy backend local 3001 với state tạm, hai Chromium process thật; joystick/di chuyển hợp lệ, client kia thấy đúng profile attack pack 4, cùng đổi búa/kiếm, khóa node/thưởng một lần, disconnect và restart/reconnect.

Kết quả lượt chạy ở TEST-RESULTS.md. Sites host frontend, chưa có backend WSS công khai. Chưa kiểm điện thoại vật lý. Kính mới vẫn thiếu profile đầu Studio 8 như báo cáo trước, không tự ghép sai.

# Tôn Hồn Phiên

Mở Menu → Nhân vật / Túi đồ (I), chọn **Tôn Hồn Phiên** ở ô thứ tư → **Đeo**. Hoặc dùng mục thử phụ kiện Studio trong Menu. Dùng nút Đánh/Space đang có. Aim tự chọn quái còn sống, gần nhất và có đường nhìn trong tầm; không tự chạy tới mục tiêu. Mỗi đòn phát một linh hồn từ mặt lá cờ, bay theo quái, gây sát thương một lần khi chạm rồi biến mất. Đánh hụt không tạo giao tranh. Giao tranh sau sát thương vẫn 1,5 giây. Không có PvP.

Bản phát hành bổ sung một món vào ô trống cho save/khách cũ, ghi dấu `contentGrants: ["soul_banner_release_v1"]` để không phát lại. Nếu túi đã đầy: giữ nguyên vật phẩm, báo thiếu chỗ; chừa ô rồi vào lại. Không thay vũ khí đang đeo tự động. Túi vẫn 4 ô, tối đa 10/chồng; không sinh nguồn tiền hay điểm chỉ số.

## Dữ liệu Studio giữ nguyên

`public/game-data/accessories/studio/soul-banner/source-{1,2,3}.accessory-pack.json` lưu nguyên ba file người dùng. Đây là bản xuất tích lũy: file 3 đã chứa đủ ba profile, nên `merged.accessory-pack.json` chính là bản sao byte của file 3. `index.json` lưu SHA256 và ID gốc. Không đổi kích thước, alpha, điểm neo, scale, góc, socket hoặc layer. Tên trong pack vẫn nguyên; game dùng nhãn UI “Tôn Hồn Phiên”.

- accessoryId: `attachment_1793960988158_2`.
- idle: `nightcamp-animation-idle-4cd85783-v1`, socket handB, layer back.
- walk: `nightcamp-animation-walk-ee063896-v1`, socket back, layer back.
- run: `nightcamp-animation-run-908d1b98-v1`, socket back, layer back.
- attack: dùng **chính idle**, cùng animationId và profile. Không reset idle mỗi render hoặc mỗi lần bắn. Các hoạt ảnh kiếm, đào, nhảy, cung cũ được giữ nguyên.
- Không có profile phù hợp thì bộ phát dùng animationBase đã xuất, không mượn neo clip khác.

Renderer vẫn dùng CutoutPlayer và accessory-runtime hiện có. Lá cờ và linh hồn nằm trong lượt vẽ theo Y chân của map, cùng camera và ánh sáng; không có Canvas/game loop/world thứ hai. `CharacterVisual.emissionPoint` cung cấp điểm thế giới từ ma trận phụ kiện/rig hiện tại (cả flip), không đưa rig vào gameplay. Điểm phát hiệu ứng ở phần mặt cờ UV [0.52,0.42], không sửa neo phụ kiện. Bộ ảnh bất biến được cache, animator riêng từng nhân vật. Kiểm tra thực tế cả traveler và shadow-knight đã phát hành, không tuyên bố tương thích mọi rig.

## Combat dùng chung Offline/Online

`public/game-data/weapons/combat.json` là cấu hình tin cậy do build/backend đọc. Thông số tạm: tầm aim/bắn 300 đơn vị thế giới (cận chiến 76), sát thương 22, hồi chiêu 0,8 giây, tốc độ linh hồn 420 đơn vị/giây, tuổi tối đa 1,8 giây, thời gian bay tối thiểu 0,24 giây. Không có truy đuổi ngoài 300 đơn vị tính từ điểm bắn và tổng quãng đường bay. Có kiểm tra vật cản theo đoạn để không xuyên tường ở FPS thấp. Mỗi linh hồn chỉ trúng một quái; mục tiêu chết thì tan, không tự chọn người chơi làm mục tiêu.

`src/shared/weapons.ts` chọn combat theo ID vũ khí đã phát hành, quyền sở hữu trong túi và rig hợp lệ; `World` quyết định aim, thời gian, đường bay, va chạm, HP và cooldown. Client chỉ gửi input/cosmetic ID, không gửi sát thương hoặc kết quả va chạm. Snapshot bổ sung ID linh hồn, owner/target, vị trí và thời gian; không truyền ảnh/bundle/pose. Có giới hạn số linh hồn/owner/toàn world. Đổi vũ khí, chết, teleport/rời map hoặc disconnect hủy các linh hồn của người đó. Linh hồn không là vật phẩm hay phần thưởng.

Online welcome thêm `rangedCombatProtocol:1`; frontend từ chối trang bị cờ với backend cũ chưa hỗ trợ. Cần triển khai lại Node backend cùng source. Các server cũ không được xem là đã có chức năng chỉ vì frontend hiển thị ảnh. Cờ không phải kiếm và chưa hỗ trợ phi kiếm; đổi lại kiếm chắp vá để dùng phi kiếm.

## Chạy và kiểm tra

```
npm install
npm run build
npm test
npm run start
```

PORT và GAME_STATE_FILE hoạt động như README. Backend phục vụ `dist` + WebSocket cùng origin. Backend đang được kiểm tra cục bộ; **chưa có WSS công khai**. Sites phục vụ Offline + màn chọn Online/cấu hình server, không tự chạy một tiến trình Node thường trú. Offline không cần backend; chưa tuyên bố chạy không Internet sau lần tải đầu.

- `npm run check:assets`: hash ba file, ảnh và profile tích lũy không đổi.
- `tests/soul-banner.test.ts`: aim/range/cooldown/LOS, delayed hit, single hit/no PvP, tuổi/quãng đường, mất target/death/teleport/disconnect/đổi đồ, low FPS, quyền sở hữu, migration một lần và túi đầy.
- Vite :5173 + `node tests/soul-harness.cjs`: kiểm tra **drawImage thật** theo hai rig, ba neo, idle attack không reset, flip/zoom và ma trận điểm phát từ mặt cờ.
- Static build :4173 + `node tests/soul-browser.cjs`: Offline không backend, đổi đồ, ảnh cờ thật, bắn/impact, save/reload và mobile.
- `node tests/soul-online.cjs`: tự chạy Node :3002 với save tạm, hai trình duyệt riêng, aim/hit đồng bộ, input giả target/damage/range không có thẩm quyền; disconnect, restart/reconnect và giữ trang bị.

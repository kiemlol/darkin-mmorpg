# Tương tác vật thể và đào Linh thạch

## Chơi

Chọn Offline hoặc kết nối backend Online. Đến gần tảng linh thạch có interaction được bật, dừng lại rồi bấm **Đào** trên nút đánh hiện có hoặc **Space**. Nhân vật tự cầm Búa đá, phát clip Studio, có tiến độ. Bấm lại để hủy; di chuyển, chết, teleport/rời map, giao chiến, mất focus hoặc mất input/kết nối hủy lượt chưa hoàn tất. Mỗi node một người đào; người khác yêu cầu cùng node nhận báo bận.

Combat được ưu tiên: trong 3 giây sau đánh/nhận đòn, hoặc có quái sống trong116 world units và thông đường, không tự chọn node để đào. Không có PvP mới. Khi node không còn sẵn sàng hoặc ra xa, nút trở về Đánh. Khi đã đủ thời gian và đang ghi giao dịch, nhãn Lưu… thể hiện điểm hoàn tất đã được chốt; không cấp phần thưởng trước khi ghi thành công.

Map này có10 node cùng ảnh nhưng ID riêng; cấu hình thật: **3 giây**, thưởng ngẫu nhiên nguyên **3–8 Linh thạch**, ẩn node rồi hồi sau **30 giây**. Không thưởng từng nhát hoặc khi mới bấm. Hồi0 có nghĩa node đã biến mất không hồi; node không deplete vẫn giữ ảnh/collider và tuân thủ cooldown. Nếu footprint sắp hồi đang có nhân vật/quái sống, hoãn phục hồi đến khi trống để tránh kẹt.

Ví trên HUD lấy đúng `actor.wallet.spirit_stone`. Đây là nguồn số dư duy nhất; không đồng thời tạo item tiền. Resource registry `src/shared/resources.ts` đăng ký `spirit_stone` = Linh thạch. Số dư nguyên an toàn, không âm, mặc định0. Không sửa giá shop, cảnh giới, phí đột phá, vàng hoặc kinh tế khác. Các số dư khác đã có trong wallet và trường save cũ được giữ, không quy đổi.

## Map nguyên gói / runtime

Nguồn: `spawn_map.map-bundle-6.json` đính kèm. `public/game-data/maps/forest.map-bundle.json` là bản **nguyên byte**, giữ format, mapId,111 objects,12 assets nhúng,3 roads Bézier, spawn mới, warps,8 monsterSpawns, lighting và interactions. Không tách hoặc dựng lại vật thể. Định nghĩa node bằng `mapId + objects[].id`; không dùng asset/image ID. Interaction thiếu hoặc enabled=false là trang trí.

Backup ở `backups/maps/forest-before-mining.map-bundle.json` và `map-runtime-before-mining.mjs`; không được đưa vào frontend public. Catalog map vẫn `public/game-data/maps/index.json`. Muốn rollback chỉ bundle, giữ runtime adapter tương thích và build/restart backend; không xóa file state/tiền. Những ID node cũ có lưu/tombstone vẫn giữ để tránh tạo lại chu kỳ khi cùng ID xuất hiện lại.

Bundle ghi runtime.version5 nhưng MJS trên GitHub tại thời điểm kiểm tra vẫn v2. **Không eval/import runtime.source trong JSON**. Dùng MJS hiện có + `src/shared/interactions.ts` (INTERACTION_ADAPTER_VERSION1) cho schema, handler, range/LOS và authoritative lifecycle; mở rộng MJS có kiểm soát cho active-object collision, hidden/shake render và metadata fadeBehind/groundShadow đang có trong map này. Format/class/API actor cũ giữ nguyên. Đây không phải tuyên bố đã thay bằng toàn bộ runtime v5 nguyên gốc.

Tám vùng monsterSpawns được giữ nguyên, chưa dùng MonsterSpawnController hoặc đổi thành quái mới. Sáu quái MVP/AI/combat cũ vẫn hoạt động theo map spawn mới. Mob home được chọn ngoài footprint tĩnh của node để không đứng chặn vĩnh viễn node hồi sau restart.

## Nguồn búa / hoạt ảnh

`public/game-data/animations/mining/traveler.cutout.json` là file nguyên byte được cung cấp, format `nightcamp-cutout-v1`, rig traveler. Clip thật **my_walk**, kind attack, dur **0.8 giây**, hit0.43,25 keyframes. Phụ kiện thật **hammer / Búa đá**, socket handF, layer back, scale0.9, w46.835/h93.1 và nguyên anchor/offset/rotation xuất từ Studio.

Catalog đăng ký resource `traveler-mining` và tool `mining_hammer`; gameplay/network không dùng tên file làm tên clip. Adapter lặp một bản sao clip trong lúc channel (kind loop của bộ phát), không đổi JSON gốc, không dùng hit0.43 để phát tiền hoặc sát thương. Không reset clip mỗi frame. Idle/walk/run/attack và clip bổ sung cũ vẫn giữ.

File đào có bodyId/signature mới khác nhân vật đang dùng. Adapter **giữ nguyên parts/joints/headId/bodyId hiện tại**, retarget các kênh góc sáu phần đã khai báo tương thích trong catalog cho Traveler/Shadow Knight; không thay thân hoặc tự fit kích thước. Búa có mountProfiles rỗng và gắn theo socket handF, không dùng profile đầu/thân của kính. Hình/transform búa nguyên dữ liệu, đi theo rig; kiếm cũ được bộ phát ẩn khi có vũ khí gắn tay. Không vẽ búa lên lớp màn hình riêng. Hai rig đã được kiểm ma trận drawImage thực, LR flip và camera/zoom áp một lần.

Ảnh/data cache dùng chung, mỗi actor có player/pose/time riêng. Chuyển tool về combat chọn clip hợp lệ nếu my_walk không còn trong spec. Rig/clip/ảnh lỗi có báo asset và giữ visual hợp lệ trước đó; không gọi clip không tồn tại. Thêm rig khác cần khai báo và kiểm tra channel convention/slot, không tự coi mọi rig tương thích.

## Mô phỏng, protocol và lưu

`World` sở hữu `InteractionSystem`, dùng chung Offline/server. Điểm local được đổi bằng objectWorld: flip X, rotation rồi scale và translate; không nhân cell/camera. Range từ chân, LOS bỏ riêng collider node mục tiêu và vẫn kiểm vật cản/nước khác. Kiểm foot hợp lệ, sống, combat, chu kỳ, handler, availability. Khi đứng đào khóa movement trước hoàn tất; input di chuyển/đánh hủy. Thiếu input quá350ms cũng hủy, không chờ TCP phát hiện mất mạng.

Client gửi `interact {mapId,objectId,cycle,requestId}` hoặc cancelInteraction. Cycle là optimistic guard phải khớp server, không là quyền cấp tiền. Server chọn reward bằng crypto RNG từ config map tin cậy, bỏ qua amount/wallet/actorId tự gửi. Snapshot có toolId/action, node state và wallet; không gửi ảnh/base64/pose. Join kiểm interactionProtocol1 và mapRevision; backend cũ phải cập nhật cùng mã. Nút hành động có latch theo lần nhấn, nên giữ nút không tự lặp farm sau khi hoàn tất. Quick tap được giữ đến sample input, vẫn giữ damage/cooldown do server kiểm tra.

State ready → mining → committing nội bộ → cooldown/depleted → ready. Transaction gồm UUID, instanceId, objectId, cycle, characterId, amount, completedAt và post-node state. Unique key `instanceId:objectId:cycle`, cộng thêm kiểm transactionId. Start retry không reset timer; cycle cũ không mở lượt mới. Không thay channel bằng node khác khi giao dịch cũ đang ghi.

- **Online:** map instance ổn định `darkin-frontier-v1:<mapId>` qua restart/revision. GuestStore serialize mọi writer/commit; kiểm ledger trước cộng; ghi wallet + node/cycle/respawnAt + ledger vào **cùng JSON snapshot** ở tmp, sync file, atomic rename, sync directory khi hỗ trợ. Chỉ sau đó patch state live và phát snapshot thành công. Flush định kỳ serialize lúc đến lượt để không ghi đè giao dịch mới bằng snapshot cũ. File `GAME_STATE_FILE` (mặc định `data/world-state-v1.json`) payload version3, đọc version1/2 và thêm ví mặc định. Shutdown dừng tick rồi chờ writer. Giao dịch đã commit giữ nguyên qua disconnect/restart; kênh chưa xong không được khôi phục. RespawnAt dùng thời điểm server thực khi hoàn tất, không lấy giờ máy client hoặc giờ ngày/đêm nhân hệ số60.
- **Reconnect:** cùng tab gửi resume bằng bearer token đã cấp; server tháo socket cũ của đúng token trước khi tạo actor mới. Socket cũ bị bỏ khỏi peer map, không thể điều khiển actor mới. Tab khác chưa có session token vẫn có chính sách guest riêng như trước. Wallet/cảnh giới/exploration được khôi phục; vị trí/HP Online vẫn về spawn theo MVP hiện có, không phải hệ tài khoản lưu toàn bộ thế giới.
- **Offline:** save theo characterId, payload version3, giữ khóa game cũ; wallet và interactionMaps/ledger của nhân vật được ghi một lần localStorage trước khi apply kết quả. Quota/lỗi lưu hủy giao dịch, không giả cộng tiền. Giữ các map books riêng, realm/stage/kills/HP và dữ liệu cũ. Save/tiền Offline không được gửi để Online tin. Đây là mô phỏng local của game, không chống sửa localStorage và không phải hệ tiền thật.

Không xóa object khỏi bundle; hidden state điều khiển cả ảnh/shadow và collision. Client prediction/interpolation dùng cùng active-object rule. Minimap/full map cache nền theo mapRevision + hidden IDs, dùng lại terrain renderer; chỉ rebuild khi visibility đổi, không khi rung/tiến độ đổi. Fog/clock/zoom/pan vẫn giữ, không reset exploration khi node hồi.

## Mở rộng / chạy

Thêm/chỉnh object interaction trong Studio rồi thay **toàn bundle** tại catalog; giữ ID ổn định cho cùng node, dùng ID mới cho node mới. Build và restart backend để frontend/server cùng revision. Nhân vật/tiền/cycle cũ không bị xóa khi đổi bundle; exploration theo chính sách revision của MAP-UI.md tạo mask riêng cho revision mới.

`interactionHandlers` là registry tin cậy theo actionId/type; handler trả mô tả reward hoặc null, không gọi grant/side effect trước commit. Gather/custom chưa đăng ký không được đoán thành tiền; fixture gather đã kiểm không tăng Linh thạch. Muốn tài nguyên khác phải đăng ký resource và handler có chủ ý, không chỉ đổi tên ảnh.

`npm ci && npm run build && PORT=3000 npm start`. Production Node phục vụ dist + /ws cùng origin; Sites HTTPS cần backend WSS riêng. Docker như README, mount `-v darkin-data:/app/data`; không thay/xóa volume khi cập nhật map. **Một authoritative process/map instance cho mỗi file state**; JSON ledger MVP chưa hỗ trợ nhiều máy, có giới hạn64MiB và100000 giao dịch/instance. Cần DB/khóa phân tán trước khi mở rộng. Không phải backend giao dịch tiền thật.

Backend WSS công khai chưa được triển khai. Sites vẫn vào Offline không cần backend; lần tải đầu cần Internet, chưa có PWA/cache offline hoàn toàn. Thiết bị vật lý, tải lớn và crash nguồn điện/ổ đĩa hỏng chưa được chứng nhận.

## Kiểm tra

`npm test` và `npm run build`. `tests/mining.test.ts` kiểm dữ liệu nguyên byte, schema/ID/transform, range/LOS, timer, cancel/combat/death/teleport/map/input, reward, locking/idempotency/durable restart, deplete/collider/respawn/0, wallet/realm migration, local quota và generic handler. `tests/mining-visual-harness.cjs` qua Vite5173 kiểm bộ phát/ảnh búa thật, geometry không đổi, clock riêng, LR/zoom/matrix.

`node tests/mining-browser.cjs` trên dist/Node3000: mobile thật qua Chromium touch, begin/cancel/one reward, reload và chờ đúng30 giây hồi; map panel zoom không reset. `tests/mining-online.cjs` tự khởi Node3001 với file fixture rồi chạy hai Chromium process độc lập: đi bằng joystick hợp lệ trên chính map mới, không gửi vị trí/teleport; kiểm race/busy/retry/coins/ledger/restart. Fixtures và socket instrumentation chỉ ở tests, không đưa vào dist/Sites. Chi tiết lượt đã chạy nằm trong TEST-RESULTS.md.

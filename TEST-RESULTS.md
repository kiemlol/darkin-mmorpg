# Thay asset Traveler Studio 8 — 2026-11-05

- Ba file mới được giữ nguyên byte. Nhân vật mặc định: `characters/studio/traveler-v8.cutout.json`, SHA-256 `57b0008d6e3f8bce078e1b18efe078ac7836f4f24d2f9c36269ca5b1c4fd45fc`. Kính tròn `bfdeae6e71be86f72269bb9927cc91e2e28f6ca293b3be9dc48382eab1102c4d`; kính vuông `81e3bc3e993f7dfab209fc665f5dafaa0e5e02af1eb3e9ea080d81b981386a68`. Bản cũ lưu ngoài public tại `backups/characters/before-traveler-v8/`.
- Đầu/thân/ảnh/joints/mountState/signatures lấy từ Studio 8; scale game vẫn .69, radius/tốc độ/combat/map không đổi. Bốn clip idle/walk/run/attack và clip đào .8 giây cũ được giữ. Búa/điểm neo mới lấy qua `tools[].attachmentResourceId`, không lấy nhầm anchor cũ. Clip mới 1.1 giây trong file là đứng/cầm búa, được giữ trong spec nhưng không thay chuyển động vung búa đào.
- **Dữ liệu kính chưa tương thích:** cả hai pack chỉ khai báo `custom-head-b01afa2d / 224934f4`, khác đầu mới `custom-head-2bca4fed / 8480a2dc`. Đã thay và đăng ký pack, nhưng chưa thể đeo/kiểm chứng khớp hình trên đầu mới. Game báo thiếu cấu hình, không sửa ID/signature, không mượn profile. Các test thành công với kính cũ được chuyển thành fixture lưu trữ, không được dùng để tuyên bố pack mới đã khớp.
- `npm test`: **50/50 PASS**; `npm run build`: **PASS**. Kiểm SHA file, format plain/wrapped, exact parts/joints/signatures, clip cũ không thay, điểm neo/góc búa mới, registry và từ chối sai profile; các kiểm thử gameplay/map/wallet/ledger/realm trước đó vẫn đạt.
- `traveler-v8-browser.cjs` trên dist tĩnh 4173: **PASS**, mobile 390×844 @3x, đầu/thân và avatar thật mới, idle/walk/run/attack một lần, flip/zoom/chân không lệch, không cầm búa khi chưa vào range, UI hai kính báo đúng lỗi, reload giữ HP/realm/stage/kill/wallet/gold. Không có WebSocket, pageerror hoặc request asset lỗi.
- `mining-visual-harness.cjs`: **PASS**, kiểm trực tiếp `player.spec.parts` bằng source Studio 8 và drawImage/ma trận rig: búa có nguyên w/h/anchor/rotation/scale/layer/socket, nhân vật giữ hình học khi chuyển tool, hai rig/animator độc lập và cache release/acquire cùng frame. `accessories-harness.cjs`: **PASS**, kính sai profile thực sự bị renderer ẩn, lỗi ảnh rollback, không thay gameplay; wing fixture vẫn tải đủ ảnh và có clock riêng. Đây là fixture wing, không phải cánh mới từ người dùng.
- `asset-browser.cjs`: **PASS** bốn clip, one-shot attack, flip, cache/animator độc lập, lỗi resource/ảnh/kênh và tải cũ không ghi đè lựa chọn mới. Warning/ảnh thiếu trong test âm là cố ý.
- `accessories-online.cjs`: **PASS** hai trình duyệt Online thật ở Node local 3000 cùng thấy headId/bodyId mới, menu từ chối hai kính thiếu fit, đổi ngoại hình hợp lệ đồng bộ và WebSocket chỉ mang ID/trạng thái, không ảnh/profile/pose.
- `mining-browser.cjs` trên bản đóng gói khi backend không chạy: **PASS**, đào/hủy/nhận một lần, búa mới với clip đào cũ, save/reload, chờ 30 giây hồi đá và full-map zoom/fog giữ nguyên. `mining-online.cjs`: **PASS** hai Chromium process thật trên backend Node local 3001, đi bằng input hợp lệ, khóa node/bận/retry/spam, cắt input/disconnect, restart/reconnect và giữ ví/cảnh giới/node/ledger. Không gửi tọa độ/tiền Offline để server tin.
- Ảnh thực tế đã xem: `tests/traveler-v8-mobile.png`, `tests/traveler-v8-glasses-mismatch.png`, `tests/mining-mobile-progress.png`.

Giới hạn: backend WSS công khai vẫn chưa có; Online kiểm ở local. Chưa thử thiết bị điện thoại vật lý hoặc tải lớn. Muốn kính mới đeo được cần profile được Studio xuất cho đúng đầu mới và chữ ký hình học của file Studio 8; chưa thể xác nhận hình kính khớp khi dữ liệu đó còn thiếu.

# Đào Linh thạch trên map mới — 2026-11-04 (lịch sử)

Môi trường thực: Linux/Node.js/Chromium; bản frontend `dist` đã đóng gói, backend dự án Node/WebSocket local. Không dùng NPC thay hai người chơi. Chi tiết thiết kế/chạy ở [MINING.md](MINING.md).

- Map upload được giữ nguyên byte: SHA-256 `8074ae3233809de6ab96ccf74958018e532d781ce61b8d9a1e704c169f1d4fe1`. Cutout đào nguyên byte: `7d06427bee5c873a15394a3ea276ab260b886c89132732550f7b9b9fab4f5024`. Backup map/runtime cũ trong `backups/maps/`. 111 objects, 10 node ID riêng cùng ảnh, 8 vùng monsterSpawns giữ nguyên/chưa kích hoạt; spawn mới (2076,831), 3 đường Bézier và lighting giữ lại.
- `npm test`: **47/47 PASS**. Bao gồm schema/ID trùng/node tắt, local point với flip/rotation/scale, range/LOS/vị trí chân, timer đủ thời gian, min=max/min..max, generic handler không đoán thành tiền, độc quyền node, retry/cycle/ledger, hủy khi move/input hết hạn/combat/death/teleport/map/disconnect. Collider ẩn/phục hồi, tránh actor khi hồi, respawn=0 và node không deplete. Pending commit không cho mở channel khác; lưu lỗi/quota không cộng ví. Ghi file atomic, flush xếp hàng, restart/thay bundle cùng map ID giữ node/tiền/realm/vàng cũ. Fixture map khác kiểm luật chuyển map; game hiện vẫn chỉ có một world/map thực.
- `npm run build`: **PASS**, TypeScript + kiểm asset/catalog + Vite. Import MJS tĩnh, không eval/thực thi runtime.source JSON. MJS GitHub còn v2; adapter triển khai tương tác/schema và trạng thái object cần dùng, không tuyên bố đã nạp toàn bộ runtime v5.
- `tests/mining-visual-harness.cjs` qua Vite: **PASS** clip thật `my_walk` 0.8 giây và Búa đá, cả Traveler/Shadow Knight, giữ nguyên parts/body/khớp/scale, nguyên geometry/anchor/socket/layer búa, animation độc lập, đổi hành động/flip/zoom/camera. Ma trận drawImage thực khớp rig, không chỉ kiểm file tải. Thêm hồi quy acquire/release cache cùng frame lúc người khác disconnect: không trả bộ phát đã dispose (lỗi này đã tái hiện trước sửa).
- `tests/mining-browser.cjs` trên production: **PASS**, mobile 390×844 @3x, tự cầm búa gần node, một nút Đánh/Đào/Hủy, hủy do di chuyển/blur, đủ 3 giây mới nhận đúng một lần, chân/body/realm/kills không đổi, ẩn node và trả kiếm, reload giữ ví/node, chờ **30 giây thực** hồi node, full-map zoom/fog không reset. Không có pageerror/request asset lỗi. Đã chạy lại cùng test tại `GAME_TEST_URL=http://localhost:4173` khi backend 3000 tắt: **PASS**.
- `tests/mining-online.cjs`: **PASS** hai tiến trình Chromium riêng, hai WebSocket thật tới backend mới trên 3001/file state tạm. Cả hai đi từ spawn mới tới node bằng joystick/input hợp lệ trên map thật, không gửi vị trí hoặc teleport. Kiểm node bận, retry/spam/fake amount không tăng thưởng; duy nhất một ledger và một ví tăng 3–8, cả hai thấy node ẩn. Cắt input rồi đóng socket thật trước đủ thời gian không có thưởng; thử lại giữ danh tính. Dừng/khởi động backend và reconnect giữ ví/vàng/cảnh giới/node/cycle, không nhập tiền Offline vào Online. Ảnh `tests/mining-online-progress.png`, `tests/mining-online-reward.png`.
- Hồi quy production **PASS**: `browser.cjs` (hai client di chuyển/đánh cùng quái, disconnect, joystick/cancel/pinch/mobile dọc-ngang); `realm-hud-browser.cjs` (360/390/430 px, ngang và desktop, avatar/HP/MP inactive/cảnh giới, không chồng HUD); `map-ui-browser.cjs` (cache/fog/reload/map panel); `map-ui-online.cjs` (clock server giống nhau dù giờ máy khác, mask riêng, map không pause, reconnect); `protocol.cjs` (input/payload/rate/identity). Các đường đi kiểm thử cũ đã chỉnh cho spawn/map mới, không nới luật gameplay.
- `jitter-browser.cjs` Offline và Online: **PASS**, lượt trace ngắn lần lượt 16/14 frame sau warmup, 0 giật lùi và 0 dừng giữa tick; không phải đo hiệu năng cho mọi máy. `accessories-harness.cjs`: **PASS** transform/anchor Studio, thay bộ phát giữ animation, lỗi ảnh rollback, re-resolve geometry, giải phóng texture và wing clock riêng.
- `offline-no-backend.cjs`: **PASS** chỉ file tĩnh 4173, Node 3000 đã tắt/health không kết nối, zero socket; cutout, blur dừng và đổi phiên hoạt động. `map-ui-touch.cjs`: **PASS** CDP touch thật, map pinch/pan/cancel, zoom thế giới tách biệt, joystick thả ngoài/cancel, dọn attack capture khi mở map, blur, mở/đóng lặp và báo thiếu PNG. Fixture Offline riêng đứng ngoài vùng quái để không nhầm bảng chết với lỗi điều khiển; chờ pointer event thực thay vì đọc trước khi Chromium dispatch. Ảnh trực quan thật đã xem: `tests/mining-mobile-progress.png` và `tests/mining-online-progress.png`.

Giới hạn: Sites chỉ host frontend; chưa có backend WSS công khai. Online đã kiểm ở local như trên. Chưa thử thiết bị iOS/Android vật lý, tải lớn, mất điện/ổ đĩa hỏng hoặc Docker chạy thật. Lưu JSON một writer/map instance, ledger tối đa 100.000 lượt/instance, không hỗ trợ nhiều máy ghi chung. Offline là mô phỏng local có thể bị sửa bộ nhớ; chưa có PWA/cache để cam kết hoàn toàn không Internet. Các vùng spawn quái mới chưa dùng theo yêu cầu; chuyển nhiều map thực và lưu HP/vị trí Online vẫn chưa triển khai.

# Lịch sử kiểm thử — 2026-11-02

Môi trường: Linux, Node.js, Chromium headless `/usr/bin/chromium`; frontend **dist production**, Node cùng origin port 3000. Không dùng NPC thay người chơi trong test multiplayer.

- `npm test`: 4/4 nhóm PASS. Bundle thật / 111 objects / 3 roads / nguồn ảnh nhúng / lighting night; roadGeometry giữ Bézier. Đường chéo cùng tốc độ, chia bước di chuyển chống xuyên vật cản, clamp dt. Quy tắc nước/cầu và ưu tiên blocked dùng fixture vì map thật không có nước/cầu. Footprint thật theo objectLocal/world. Attack range/cooldown, sequence trùng, validation, timeout, respawn và spawn quái hợp lệ.
- `npm run build`: PASS TypeScript + Vite, không thực thi JSON runtime.source.
- `node tests/protocol.cjs`: PASS với server local. JSON sai, magnitude bất thường, duplicate input, dữ liệu identity/HP giả không có thẩm quyền; ngừng input sau 300ms; giới hạn 50 msg/s và 2048 byte, server tiếp tục hoạt động sau oversized payload.
- `node tests/browser.cjs`: PASS trên bản đóng gói. Hai page Chromium thật kết nối WebSocket; thấy hai player, A di chuyển được quan sát từ B; đánh gây thay đổi mob chung; đóng A thì B thấy xóa player. Offline, menu, đổi phiên, wheel/button zoom; mobile 390×844 @3x và 844×390, joystick pointercancel, pinch qua CDP touch thật, không có pageerror. Ảnh kiểm tra nằm trong `tests/*.png`.
- `node tests/offline-no-backend.cjs`: PASS khi đã dừng Node server 3000, chỉ phục vụ file tĩnh dist tại 4173. Offline chơi được, zero WebSocket, blur dừng di chuyển, quay lại lobby và vào phiên mới được.
- Kiểm tra trực quan screenshots: map đêm, curves, neo ảnh, Y sorting cây/actor và ánh sáng trên actor; không áp DPR/camera hai lần.

## Chưa kiểm chứng / giới hạn

Chưa kiểm thử thiết bị vật lý iOS/Android, tải nhiều người, latency/loss cao, độ ổn định chạy hàng ngày, backend WSS công khai hoặc Docker image chạy thực. Không có cache/PWA để đảm bảo chơi hoàn toàn mất Internet. Chưa có map thật chứa nước/cầu/warp; fixtures chỉ chứng minh quy tắc va chạm, không thay thế QA trực quan trên map tương lai. Chưa có bộ phát cutout thật; interface và factory tách rời đã được TypeScript kiểm tra, chưa thử asset bundle tương lai. Mob chưa có pathfinding. Dự đoán và ack mới là MVP; cần đo và cải thiện dưới mạng xấu.

## Bản sửa chuyển động / khôi phục Offline

Tái hiện trường hợp nhân vật chết, lưu HP=0, vào lại thì cả nhân vật lẫn quái đều đứng yên vì player vẫn chết và mob không có mục tiêu. Đây là thiếu sót khôi phục phiên/UI, không phải lỗi cần tắt va chạm map.

- `node tests/movement-regression.cjs`: PASS trên dist mới. Seed bản lưu HP=0, vào Offline có 100 HP, giữ số quái đã hạ; WASD và joystick làm tọa độ thật thay đổi; AI quái thay đổi tọa độ khi đuổi; menu dừng thời gian mô phỏng; chết mới trong phiên hiện bảng hồi sinh, bấm hồi sinh rồi joystick di chuyển được. Không có pageerror.
- Kiểm tra bản Sites cũ trực tiếp qua quyền service access: phiên mới vẫn di chuyển và quái đuổi được; sau chết, HP=0 làm player dừng và quái về nhà đứng yên.
- Không xóa khóa lưu người chơi/Studio hoặc đổi va chạm map.

## Map mới + cutout thật (2026-11-02)

- Map được thay bằng bundle commit f04460d, SHA-256 trùng nguồn mới; vẫn 111 objects/3 roads/night.
- `npm test`: 7/7 PASS, gồm format Studio/demo, alias, rig/clip lỗi, catalog/slot/path, allowlist ngoại hình và vật lý không đổi. `npm run build` bao gồm check-assets và TypeScript: PASS.
- `node tests/cutout-browser.cjs` trên dist: PASS bốn clip idle/walk/run/attack, không reset frame, flip trái/phải. Hai client Online thật nhìn thấy cutout của nhau và các action walk/run/attack; clock riêng; actor thứ hai không tạo thêm request ảnh; không pageerror/ảnh 404.
- Vite asset harness + `node tests/asset-browser.cjs`: PASS cache/rig dùng chung, player/time/attachmentTime riêng, one-shot attack và trở lại đi, giữ visual khi ID sai/ảnh thiếu/kênh rig sai; race tải không ghi đè; thay visual giữ nguyên actor; composition outfit + animation độc lập có đường ảnh theo resource (fixture dùng chính ảnh Traveler). Warning/404 của missing-fixture là cố ý trong test âm, không có trong game mặc định.
- `node tests/browser.cjs` và movement-regression: PASS gameplay, hai client, mobile dọc/ngang, joystick/pinch, hồi sinh/bản lưu chết. `node tests/protocol.cjs`: PASS.
- `node tests/offline-no-backend.cjs`: PASS khi Node game server tắt, chỉ file tĩnh dist tại 4173; có cutout thật, zero WebSocket, blur dừng di chuyển, đổi phiên.

Giới hạn vẫn giữ: backend Online chưa công khai; Online đã thử ở local. Chưa có cutout mob, hurt/death clip, nhân vật tám hướng, thiết bị vật lý hoặc tải lớn. Traveler không có wing/glasses/hat, module và kiểm tra dữ liệu được giữ nhưng chưa QA trực quan phụ kiện thật đó.

## Sửa rung chuyển động — 2026-11-03

Nguyên nhân được tái hiện trên dist: actor hiển thị trực tiếp vị trí tick 20Hz (đứng 2 khung hình rồi nhảy 7.75px khi đi), trong khi camera chạy mỗi frame. Screen-space foot giật lùi ở các frame giữa tick; đây là pipeline chung từ trước cutout. Camera lerp tới sample cuối frame còn làm độ trễ phụ thuộc thời lượng frame.

Bản sửa giữ mô phỏng/va chạm/combat 20Hz, thêm presentation riêng: nội suy Offline giữa hai tick; Online nội suy đoạn prediction, replay ack + offset hiệu chỉnh độc lập camera; remote dùng buffer theo server time thay vì reset nội suy mỗi lần nhận packet. Respawn/teleport không nội suy xuyên map; mẫu không đứng được bị loại. Mỗi frame Canvas xóa ở hệ pixel gốc rồi áp DPR một lần, không giữ vệt ảnh frame cũ. Camera tích phân chính xác mục tiêu tuyến tính, không giấu bước nhảy bằng tăng lerp. Interpolation thêm tối đa một tick 50ms vào vị trí hiển thị; kết quả gameplay vẫn tại tick thật.

- Trace Chromium trước sửa: sau warmup, 29 frames có 16 frame chân giật lùi; screen delta -4.38 đến +4.76px khi chỉ giữ đi xuống.
- Trace dist sau sửa: 26 frames, 0 giật lùi, 0 dừng giữa tick; screen delta khoảng 0 đến +0.075px. Online local trace 26 frames cũng 0 giật lùi, delta tối đa khoảng .058px. Đây là các lượt đo ngắn trên Chromium headless, không phải cam kết FPS/độ trễ cho mọi máy.
- `npm test`: 15/15 PASS. Thêm chuyển động render liên tục tại 30/60/144 FPS, camera với dt biến thiên, hiệu chỉnh prediction không nhảy tọa độ, buffer snapshot không tua lùi, collision/stop/respawn, prediction không phát lặp đoạn cuối khi mất input/socket.
- `node tests/jitter-browser.cjs` và `node tests/jitter-browser.cjs online`: PASS kiểm tra chân/camera từng RAF, một lần clear và một lần vẽ nhãn player mỗi frame.
- `node tests/browser.cjs`: PASS hai client, điều khiển mobile/pinch/resize, đóng phiên. `node tests/cutout-browser.cjs`: PASS bốn clip và hai player cutout. `node tests/movement-regression.cjs`: PASS khôi phục HP0, mob đuổi, menu pause và hồi sinh.

Chưa đo trên thiết bị vật lý, màn hình VRR hoặc mạng Internet có mất gói/latency cao kéo dài. Online công khai vẫn chưa triển khai.

## Tỷ lệ nhân vật, xác quái và mép map — 2026-11-03

Scale Traveler đổi .6 → .69 (+15%), giữ rig và radius 12. Xác quái mờ dần, tự bị loại khỏi snapshot sau 1.5 giây; mob nội bộ vẫn chờ hồi sinh sau 8 giây tại điểm hợp lệ. Cả LocalGameSession và server dùng cùng quy tắc này, không cần thao tác hồi sinh player.

Camera dừng trong terrain 0..cols*cell, 0..rows*cell; minimum zoom tăng tự động nếu viewport lớn hơn nền. Giới hạn di chuyển an toàn ở mép (trái/phải 44, trên 144, dưới 24 world units) giữ hình nhân vật trong terrain; map JSON và collision footprint gốc không bị sửa.

- `npm test`: 20/20 PASS, thêm corpse expiry với player sống/chết chưa hồi sinh, mob respawn, camera mọi mép/zoom ở mobile/desktop/4K và di chuyển dọc biên.
- `node tests/edges-browser.cjs`: PASS trên dist, 390×844 @3x và 844×390. Kiểm tra transform Canvas thực ở bốn góc viewport, cả bốn mép map, scale .69 và giới hạn thu nhỏ. Có screenshot tests/edge-*.png.
- `node tests/corpse-online.cjs`: PASS hai WebSocket client thật đánh quái bằng input; observer thấy xác biến mất rồi mob trở lại sau 8 giây, không gửi player respawn/reset.
- `node tests/cutout-browser.cjs` và `node tests/jitter-browser.cjs`: PASS, bốn animation, hai player thật và hồi quy rung chuyển động.

Mobile đã kiểm thử bằng Chromium cảm ứng giả lập; chưa kiểm thử trực tiếp Safari trên iPhone trong ảnh người dùng.

## Studio accessory packs — 2026-11-04

- `npm test`: 25/25 PASS; thêm chữ ký thật Traveler/Shadow Knight, exact fit, exclusive category giữ món cũ, geometry/profile thiếu bị từ chối, kiểm tra lệnh cosmetic không đổi vị trí/HP/kill/hitbox/action.
- `node tests/accessories-browser.cjs` trên dist: PASS kính được renderer thật nạp và vẽ; transform khớp nguyên profile, idle/walk/run/attack và flip, đổi kính cùng loại, đổi head/body liên tiếp, tháo; không mất HP/position/progress khi đổi phụ kiện. Đã xem screenshots kính vuông Traveler và kính tròn Shadow Knight.
- `node tests/accessories-harness.cjs` qua Vite: PASS drawImage thật khớp ma trận socket và nguyên anchor/w/h (Canvas tolerance .0001), player mới giữ clip/time/pose/face; lỗi giải mã ảnh giữ player hợp lệ; geometry khác cùng ID bị ẩn/báo lý do; variant cũ giải phóng sprite/rig; wingRig fixture nạp đủ cây ảnh và đồng hồ riêng theo giây thật.
- `node tests/accessories-online.cjs`: PASS hai browser Online thật thấy cùng kính và mã đầu/thân, tháo và đổi nhanh; WebSocket không có base64, bundle, profile hay pose mỗi frame.
- Hồi quy `cutout-browser`, `browser`, `movement-regression`, `jitter-browser`: PASS. Giữ combat/map/mobile/camera/corpse và bản lưu chết đã sửa.
- `node tests/offline-accessories.cjs` và `offline-no-backend.cjs`: PASS khi Node game server tắt; kính vẫn nạp/vẽ qua file tĩnh, zero WebSocket. Harness tài nguyên cũ cũng đã qua lại sau tích hợp Studio.

Chỉ có hai gói kính thật được cung cấp. Cánh được kiểm tra bằng fixture kỹ thuật, chưa có pack cánh Studio thật để so khớp thị giác. Backend Online chưa công khai; các kiểm thử Online chạy Node server trong môi trường dự án. Thiết bị thật iOS/Android chưa kiểm thử.

## Minimap / đồng hồ / khám phá HUD v2 — 2026-11-04

Đọc toàn bộ README/PROMPT-CODEX trong ZIP trước triển khai. Kiểm tra SHA-256 của cả sáu PNG so với ZIP: giống nguyên byte; đủ RGBA và kích thước tự nhiên. Đã xem screenshots trên nền checkerboard, trắng, đen: canvas dưới viền, trăng/lửa trang trí trên canvas, không có hình chữ nhật đen, chữ nằm trong bảng. Đã xem desktop 1440×900, mobile dọc 390×844 DPR3 và ngang 844×390.

- `npm test`: **30/30 PASS**, gồm hồi quy map/va chạm/combat/animation/accessories/presentation và 5 nhóm mới: permanent mask, quét chạy nhanh, teleport không mở đường nối, bốn góc; save/reload/version/scope/đổi nhân vật-map-revision; map không vuông/projection/zoom; clock mô phỏng/chu kỳ; danh tính server, hai mask độc lập, lưu file/khởi động lại và flush đồng thời.
- `npm run build`: PASS TypeScript, asset validation và Vite production. Không đổi asset/rig/gameplay để tích hợp HUD.
- `node tests/map-ui-browser.cjs` trên dist/Node port3000: PASS nền map thật, tên `Map spawn` từ project, khám phá khi panel đóng, mở M/Escape, +/−/fit/center, thời gian world vẫn tiến khi mở, reload giữ characterId/seen, đổi tên tạo nhân vật riêng, mobile dọc/ngang và không pageerror.
- `node tests/map-ui-online.cjs` trên dist: PASS **hai browser client WebSocket thật** thấy cùng player di chuyển/đánh, mask A tăng khi chạy nhưng B không nhận mask A; clock snapshot cùng server ngay cả khi đổi Date.now máy B; panel không pause server, reload giữ guest ID và vùng đã mở.
- `node tests/map-ui-harness.cjs` qua Vite: PASS MapRenderer thật tạo base cache, pixel mask đúng `[22,19,34,150]`/seen alpha0, đổi giờ không rebuild nền/không reset mask, cursor zoom giữ world point; đổi map fixture A→B→A đổi nền/tên/mask, chờ mask mới không vẽ nền hoặc marker cũ, quay lại dùng cache. Hai nền build tổng cộng, không build mỗi frame. Screenshot riêng `map-ui-{checkerboard,white,black}.png`.
- `node tests/map-ui-touch.cjs` trên dist tĩnh4173: PASS CDP touch thật pinch/pan/cancel bản đồ, close trong khi giữ pointer, pinch bản đồ không đổi zoom cảnh chơi; pinch cảnh chơi ngoài HUD vẫn chạy; joystick thả ngoài/cancel, mở map khi giữ đánh nhả capture, blur, mở/đóng sáu lần vẫn một HUD/panel và một base build; chặn sky_sun.png có thông báo lỗi rõ, không làm sập game. Không mở WebSocket khi Offline.
- Hồi quy `node tests/browser.cjs`: PASS hai client thật, đánh cùng quái, disconnect, input và mobile. Tọa độ pinch trong test được chuyển xuống vùng cảnh trống (y410) vì vị trí y300 cũ nay nằm trên bảng thông tin HUD; không sửa input để xuyên UI.
- `node tests/jitter-browser.cjs`: PASS trace ngắn 23 frames sau warmup, không frame chân giật lùi/đứng giữa tick, mỗi frame một clear và một nhãn player; bước màn hình lớn nhất khoảng .046px trong lượt đo này.
- Đã tắt Node port3000 và xác nhận không truy cập /health được, sau đó chạy `offline-no-backend.cjs` và `map-ui-touch.cjs` trên dist tĩnh4173: PASS Offline thật không cần backend, zero WebSocket, HUD/map/khám phá vẫn hoạt động; blur và đổi phiên dọn input.

Giới hạn: hiện game vẫn chỉ một map thật, chưa có cửa chuyển vùng gameplay. Test chuyển/chờ/quay lại map là fixture adapter, không phải đi qua warp thật. Map hiện tại không có nước/cầu; renderer/quy tắc được giữ và fixture cũ vẫn qua, chưa có QA thị giác cho chúng trên map thật mới. Day/night được kiểm tại các giờ bằng adapter và unit, chưa ngồi theo dõi toàn bộ chu kỳ 24 phút. Online đã thử local Node, chưa có backend WSS công khai. Chưa kiểm thiết bị iOS/Android vật lý, tải lớn, mạng Internet mất gói hoặc Docker thực.

## HUD người chơi và cảnh giới — 2026-11-04

- Dùng nguyên byte ảnh3/ảnh4 JPEG RGB1280×426; so sánh `cmp` PASS. Ảnh5 chỉ dùng đối chiếu vị trí, không có trong tài nguyên game. Mask render chỉ xóa trắng liên thông nền ngoài/lỗ avatar; pixel hoa trắng vẫn alpha255, tâm avatar/nền ngoài alpha0, bảng vàng alpha255. Không xóa trắng hàng loạt. Avatar thật cache theo head/equipment variant, raster192px.
- `npm test`: **35/35 PASS**, thêm registry đúng thứ tự và 20 cặp; missing/invalid fields migration giữ trường hợp lệ; thao tác nội bộ cập nhật hai ID không đổi gameplay; chết/respawn/ngoại hình không reset; save Offline cũ nâng version2, cảnh giới giữ khi reload/đổi map; profile Online v1 migration và durable reopen.
- `npm run build`: PASS TypeScript/asset validation/Vite. Bản dist không chứa harness hay nút/lệnh nâng cảnh giới cho người chơi. Không thêm MP hoặc điều kiện/chi phí/tăng chỉ số theo cảnh giới.
- `node tests/realm-hud-harness.cjs` qua Vite: PASS 20 tổ hợp thực sự qua World→HUD, đủ tên lớn/nhỏ (mortal ẩn stage), tên/nghề dài có vùng riêng, HP/MP fixture đầy/cạn/clamp/zero/NaN, chết/hồi sinh, kiểm alpha pixel, avatar đổi đầu thật và cache. Đã phát hiện Nguyên Anh Kỳ quá chiều rộng ở lần đầu và sửa fit font có giới hạn; cả 20 cặp đã kiểm lại và vừa bảng. Screenshots `hud-realm-{mortal,qi_condensation,foundation_establishment,core_formation,nascent_soul}.png`.
- `node tests/realm-hud-browser.cjs` trên dist: PASS viewport **360×800,390×844,430×932 DPR3**, ngang844×390 và desktop1440×900; đo DOM xác nhận cụm trái/phải không chồng, name/profession/HP riêng, bảng cảnh giới trong thân dưới hai thanh, menu/zoom/đánh không đè nhau, không scroll ngang. Hitbox khớp cùng canvas sau scale. Avatar cập nhật khi đổi head thật, HP đọc snapshot hiện tại, reload giữ identity, map lớn vẫn mở/zoom/đóng. Không pageerror/asset404. Screenshots `tests/hud-layout-*.png`.
- Khi xem screenshot ngang phát hiện menu/zoom cũ chồng nhau; đã giới hạn HUD theo chiều cao và chuyển +/- ngang cạnh menu, kiểm lại rectangle/ảnh thực đã qua.
- `node tests/realm-online.cjs`: PASS **hai browser WebSocket thật** với Node fixture3001: A giữ Kết Đan Kỳ/Trung kỳ từ profile server; B profile v1 thiếu trường được migration Người phàm/early, stage ẩn; join/input tự khai Nguyên Anh/Viên mãn không được tin; message nâng realm bị từ chối. Remote thấy di chuyển/đánh cùng cặp đúng. Reload A, shutdown/restart backend và bấm reconnect giữ ID/cặp. Guest mới probe vẫn default mortal. File/temp server được dọn sau test. Ảnh `tests/hud-online-authoritative.png`.
- Hồi quy `tests/map-ui-browser.cjs`, `tests/map-ui-online.cjs`, `tests/browser.cjs`: PASS minimap thật, fog riêng/lưu/reload, clock server không theo Date.now thiết bị, bản đồ không pause, hai người chơi thật/di chuyển/combat chung/disconnect/mobile joystick/pinch. Test Space dùng giữ160ms để chắc chắn đi qua sample input20Hz, không thay đổi logic input/combat trong game.
- `node tests/jitter-browser.cjs`: PASS trace ngắn25 frame sau warmup, không giật lùi hoặc đứng giữa tick; một lần clear/vẽ nhãn mỗi frame. Bước chân màn hình tối đa khoảng .096px trong lượt này, không phải benchmark thiết bị thật.
- Tắt Node3000 và xác nhận /health không kết nối được, chạy `offline-no-backend.cjs` và `map-ui-touch.cjs` qua dist tĩnh4173: PASS Offline/HUD/map, zero WebSocket, blur/đổi phiên, map/game pinch tách biệt, cancel/thả ngoài joystick, nhả attack capture khi mở panel, đóng lặp không thêm HUD/loop. Test ảnh sky thiếu vẫn có cảnh báo rõ, gameplay không crash.

Game chưa có MP/Năng lượng: hàng2 ghi Chưa kích hoạt và không fill; các trường hợp MP đầy/cạn chỉ kiểm renderer bằng fixture. Tên kiểu chiến đấu hiện tại vẫn Lữ khách/Cận chiến, chưa có hệ nghề hoặc cấp. Người phàm giữ field stage trong schema nhưng ẩn bậc nhỏ theo ngoại lệ cuối của yêu cầu. Chưa có backend WSS công khai; các test Online chạy server dự án/local. Chưa QA Safari/iOS/Android vật lý, tải lớn hoặc mạng xấu. Cửa chuyển map gameplay vẫn chưa triển khai; không thêm trong thay đổi HUD này.

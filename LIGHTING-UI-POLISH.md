# Ánh sáng liên tục và UI không viền trắng

## Ánh sáng

Trước đây `main.ts` làm tròn giờ thành bước5 phút game (~5 giây thực). `MapRenderer.tile/roadTexture` dùng nightness trong cache key nên mỗi bước vừa đổi màu rõ vừa tạo lại noise ảnh. Bản này dùng nguyên giờ phân số từ `GameSession.clock()`; Offline/Online vẫn một clock có thẩm quyền như trước. Không dùng giờ máy để quyết định ánh sáng.

`SmoothMapRenderer` (`src/client/smooth-map-renderer.ts`) là adapter của chính `MapRenderer` Studio. Nó lưu hai bộ terrain ngày/đêm rồi blend bằng nightness liên tục. Road giữ đường Bézier/softness gốc, hai texture endpoint được cache và trộn lại bằng Canvas, không chạy lại noise theo giờ. Cache road blend ở1024 mức nightness, sai khác nhỏ hơn một đơn vị màu8-bit; tránh cấp phát CanvasPattern theo từng RAF. Ảnh terrain tải lên được giữ nguyên; actor/object/depth/collision/shadow/lighting đi cùng renderer gốc, không vẽ hai lần actor.

Runtime chỉ thêm hook `drawTerrain` và tái sử dụng kích thước light canvas khi viewport không đổi. API cũ, class/format, map bundle, đường cong, vị trí và collider giữ nguyên. Light buffer reset composite mode rõ ràng trước mỗi lần dùng. Không thay gameplay, time rate, AI, rewards, clock server, minimap hoặc fog.

## Viền ảnh

Các ảnh UI đính kèm là JPEG RGB có nền trắng và pixel antialias đã trộn trắng. Mask nhị phân cũ để lại quầng sáng. `ui-matte.ts` xử lý **một lần lúc nạp**: flood phần nền ngoài liên thông, dựng alpha mềm và khử màu trắng ở dải mép2px; các vùng trắng kín như hoa/điểm sáng vẫn nguyên. Inventory/HUD dùng canvas đã decode qua cache. Không sửa byte JPG gốc, không xử lý lại PNG minimap vốn đã trong suốt, không đổi ảnh/neo của nhân vật.

## Điều khiển / túi

Theo yêu cầu cập nhật cuối, **HUD avatar/tên/HP giữ nguyên kích thước/vị trí trước đợt sửa này**. Chỉ dọn matte ở ảnh HUD. Túi màn ngang lớn hơn nhờ dành ít khoảng trống dọc hơn; không phóng camera/nhân vật hoặc áp DPR hai lần.

Ở1280×589, joystick~176px (trái128px, dưới~36.5px), nút đánh~141px (phải96px, dưới~13px), gần ảnh tham khảo. CSS co giãn theo viewport/safe area. Màn ngang rất thấp dời menu/zoom xuống bên trái dưới HUD để tránh vùng kỹ năng, giữ hình học HUD nguyên.

`index.html`: `#skill-slot-1`..`#skill-slot-4` là4 ô trống, không focus/handler/network command. Nút `#sword-flight` đang hoạt động là ô thứ5. Các ô giữ kích thước đã dùng (44–62px, ~61.4px ở1280px), **không thu nhỏ**. Tất cả nằm trên cùng một đường tròn có tâm tại tâm Attack, góc chia đều: ngang -36/-72/-108/-144/-180°, cách viền Attack8px; dọc dùng cung -60..-210° để vừa màn hình. Phi kiếm ở cuối/thấp nhất. Không còn bố cục bậc thang hoặc hai hàng rời. Clip hình tròn cho vùng bấm Attack/Phi kiếm tránh góc hộp trong suốt ăn nhầm tap. Ô trống pointer-events:none, chưa có skill, MP, sát thương hay phím mới.

## Kiểm chứng và giới hạn

- `npm test`:85/85; `npm run build`: TypeScript/assets/Vite.
- `tests/polish-harness.cjs`: ảnh thật trên nền tối/xanh/trắng;18384 pixel alpha mềm,0 fringe trắng ở dải alpha nhìn thấy; hoa trắng/lỗ avatar qua harness HUD. Endpoint ngày/đêm khớp runtime gốc (max delta0).240 mẫu bình minh + hoàng hôn/overview không tạo lại tile/road noise; max pixel step2. Lượt đo: draw median~1.1ms, P95~2.1ms trong harness800×450, không phải benchmark điện thoại.
- `tests/lighting-browser.cjs` trên dist: hơn300 frame trong11 giây, world và HUD cùng clock; max hour step~.00222h thay vì .0833h cũ; tile/road builds không tăng. RAF median~33ms/P95~67ms ở Chromium phần mềm; không tuyên bố khóa60fps hoặc hết mọi nguyên nhân giật trên mọi máy.
- `tests/realm-hud-harness.cjs`:20 cặp cảnh giới, HP/MP fixture, chết/hồi sinh, ảnh alpha/hoa trắng, đổi head và portrait cache.
- `tests/inventory-browser.cjs`: dist Offline,4 ô, Đeo/Tháo/chuyển/đổi outfit/reload/realm/wallet, dọc360/390/430, ngang844 và desktop; không lỗi ảnh/page. Túi ngang lớn hơn và vẫn vừa viewport.
- `LAYOUT_ONLY=1 node tests/bow-layout-browser.cjs`: kiểm cung tròn chung tâm, khoảng cách đều, kích thước ô giữ nguyên, phi kiếm thấp nhất;4 ô không chạm joystick/menu/zoom/attack; nhiều viewport320–1024px cao; tap/hold/outside release, đánh/phi kiếm/hạ, túi ngang. HUD chính có geometry cũ. CDP safe-area không khả dụng ở môi trường này: CSS env được giữ, chưa kiểm trực tiếp notch/home bar iPhone.
- Online dùng backend Node của dự án với hai browser thật; bài combat Online kiểm giờ ánh sáng/HUD từ cùng server ngay cả khi một client sửa Date.now, cùng quái/attack/authority/disconnect.

Chưa có backend WSS công khai. Chưa QA Safari/iPhone/Android vật lý, GPU yếu hoặc mạng Internet mất gói; số FPS bên trên chỉ là phép đo ở môi trường kiểm thử này.

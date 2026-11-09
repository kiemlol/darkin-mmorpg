# Validation

- Production build, TypeScript, existing asset checks and offline manifest passed.
- Full test suite: 130 passed, 0 failed.
- Desktop/mobile Chromium: lobby, class/profession selection, save/reload and skill panels; no page errors.
- Original modules: Phi Long, Kim Quang Cự Kiếm, Huyết Liêm and Huyết Nguyệt exercised; live effect types observed.
- Two real browser clients observed shared server movement.
- Real WebSocket server: online join, fallback retaining class, reconnect to same identity; no page errors.
- Production service worker: cache full world, disconnect networking, reload and start local gameplay successfully.

These checks do not establish physical iOS testing, public backend hosting or production load capacity. Larger skill visual checks use a local save fixture, separate from normal gameplay progression.

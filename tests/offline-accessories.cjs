// Real published asset/rig and fit validation with no game backend.
process.env.GAME_TEST_URL ||= 'http://localhost:4173';
require('./traveler-v8-browser.cjs');

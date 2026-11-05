// Current Studio 8 packs intentionally lack a matching head profile; verify the real UI refuses them.
process.env.GAME_TEST_URL ||= 'http://localhost:3000';
require('./traveler-v8-browser.cjs');

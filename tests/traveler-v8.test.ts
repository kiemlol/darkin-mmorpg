import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {studioProject,studioSpec} from '../src/client/studio-adapter';
import {gameCatalog} from '../src/shared/catalog';import {defaultEquipment,characterMount,accessoryItems,resolveAccessory} from '../src/shared/equipment';
const path='public/game-data/characters/studio/traveler-v8.cutout.json',source=JSON.parse(readFileSync(path,'utf8'));
test('Studio 8 and both updated packs are exact published uploads, not rewritten exports',()=>{
 for(const [file,hash]of [[path,'57b0008d6e3f8bce078e1b18efe078ac7836f4f24d2f9c36269ca5b1c4fd45fc'],['public/game-data/accessories/studio/glasses_round.accessory-pack.json','bfdeae6e71be86f72269bb9927cc91e2e28f6ca293b3be9dc48382eab1102c4d'],['public/game-data/accessories/studio/glasses_square.accessory-pack.json','81e3bc3e993f7dfab209fc665f5dafaa0e5e02af1eb3e9ea080d81b981386a68']])assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash);
 const tool=gameCatalog.tools![0];assert.equal(gameCatalog.resources.find(r=>r.id==='traveler')!.studioBundle,gameCatalog.resources.find(r=>r.id===tool.attachmentResourceId)!.path);
 assert.notEqual(tool.resourceId,tool.attachmentResourceId);const mining=JSON.parse(readFileSync('public/game-data/'+gameCatalog.resources.find(r=>r.id===tool.resourceId)!.path,'utf8'));assert.equal(mining.clip.dur,.8);assert.equal(mining.clip.kind,'attack');
});
test('plain Studio project keeps new geometry/signatures and hammer; base gameplay clips are unchanged',()=>{
 const before=JSON.stringify(source),base=JSON.parse(readFileSync('public/game-data/characters/traveler/traveler.character.json','utf8')),merged=studioSpec(source,base);
 assert.equal(studioProject(source),source);assert.equal(studioProject({format:'nightcamp-cutout-export-v1',project:source}),source);assert.throws(()=>studioProject({format:'other',project:source}));
 assert.deepEqual(merged.parts,source.parts);assert.deepEqual(merged.mountState,source.mountState);assert.deepEqual(merged.mountSignatures,source.mountSignatures);
 for(const action of ['idle','walk','run','attack'])assert.deepEqual(merged.clips[action],base.clips[action]);
 const hammer=merged.attachments.find((a:any)=>a.accessoryId==='hammer');assert.equal(hammer.rotation,-1.7453292519943295);assert.deepEqual(hammer.anchor,[0.49666248910200506,0.7525803964483797]);assert.equal(hammer.scale,1);assert.equal(merged.clips.my_walk.dur,1.1);assert.equal(JSON.stringify(source),before);
});
test('new default head/body match Studio 8; supplied glasses mismatch is reported without remapping',()=>{
 const mount=characterMount(defaultEquipment('traveler-default'));assert.equal(mount.headId,source.headId);assert.equal(mount.bodyId,source.bodyId);assert.deepEqual(mount.mountSignatures,source.mountSignatures);
 for(const item of accessoryItems.filter(a=>a.category==='glasses')){assert.equal(item.mountProfiles[0].headId,'custom-head-b01afa2d');assert.equal(item.mountProfiles[0].signature,'224934f4');assert.throws(()=>resolveAccessory(item,mount),/custom-head-2bca4fed \(8480a2dc\)/)}
});

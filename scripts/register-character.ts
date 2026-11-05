// Supported automated registration for the demo's complete character spec.
// Studio single-clip exports use a catalog baseCharacter + explicit animation mapping; see ASSETS.md.
import {readFile,writeFile,cp,mkdir,access} from 'node:fs/promises';import {resolve,dirname} from 'node:path';import {adaptStudio} from '../src/client/studio-adapter';import {validateCatalog} from '../src/shared/catalog';
import {ensureAnimationId} from '../public/game-data/cutout-runtime/animation-identity.mjs';
const [id,input]=process.argv.slice(2);if(!id||!/^[a-z][a-z0-9_-]*$/.test(id)||!input)throw Error('Usage: npm run register:character -- id /path/to/character.json');
const path=resolve('public/game-data/catalog.json'),c=validateCatalog(JSON.parse(await readFile(path,'utf8')));if(c.resources.some(r=>r.id===id)||c.appearances.some(a=>a.id===id+'-default'))throw Error('ID đã tồn tại');
const spec=JSON.parse(await readFile(resolve(input),'utf8'));if(spec.format!=='cutout-character-v1')throw Error('CLI nhận spec đủ bốn clip; Studio project/export đăng ký cùng baseCharacter theo ASSETS.md');
const rig=c.rigs.find(r=>r.sourceRig===spec.rig);if(!rig)throw Error('Rig chưa đăng ký; cần khai báo tương thích trước');
const anim=c.resources.find(r=>r.id===c.defaults.animationSet)!,bindings=structuredClone(anim.actions!),identities=Object.fromEntries(Object.entries(spec.clips).map(([key,clip])=>[key,ensureAnimationId(structuredClone(clip),{sourceKey:id+':'+key})]));
for(const b of Object.values(bindings)){const key=[b.clip,...b.aliases||[]].find(key=>spec.clips[key]);if(!key)throw Error('Thiếu clip '+b.clip);b.animationId=identities[key]}
adaptStudio(spec,rig.sourceRig,bindings,undefined,identities);
const folder=resolve('public/game-data/characters',id);const sources=new Set<string>();const scan=(v:any)=>{if(v&&typeof v==='object')for(const [k,x]of Object.entries(v))if(k==='src'&&typeof x==='string'&&!x.startsWith('data:'))sources.add(x);else if(typeof x==='object')scan(x)};scan(spec);
for(const src of sources){if(!/^assets\/[\w./-]+$/.test(src)||src.includes('..'))throw Error('Path không hỗ trợ '+src);await access(resolve(dirname(input),src))}
await mkdir(folder,{recursive:true});await cp(resolve(input),resolve(folder,'character.json'));for(const src of sources){await mkdir(dirname(resolve(folder,src)),{recursive:true});await cp(resolve(dirname(input),src),resolve(folder,src))}
c.resources.push({id,type:'character',path:`characters/${id}/character.json`,rig:rig.id,animationIds:identities},{id:id+'-animations',type:'animation',source:id,embedded:'clips',rig:rig.id,actions:bindings});
c.appearances.push({id:id+'-default',name:id,character:id,rig:rig.id,accessories:[],animationSet:id+'-animations',scale:.6});validateCatalog(c);await writeFile(path,JSON.stringify(c,null,2)+'\n');console.log('Registered '+id+'; run npm run check:assets and rebuild client + server.');

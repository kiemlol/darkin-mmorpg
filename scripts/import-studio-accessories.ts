import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const input=process.argv[2];if(!input)throw Error('Pass supplied attachment directory');
const root=resolve('public/game-data');await mkdir(root+'/accessories/studio',{recursive:true});await mkdir(root+'/characters/studio',{recursive:true});
for(const [from,to]of [['1-glasses_square.accessory-pack.json','accessories/studio/glasses_square.accessory-pack.json'],['2-accessory-runtime.mjs','accessories/studio/accessory-runtime.mjs'],['3-traveler.game-bundle.json','characters/studio/traveler.game-bundle.json'],['4-glasses_round.accessory-pack.json','accessories/studio/glasses_round.accessory-pack.json'],['5-shadow_knight.game-bundle.json','characters/studio/shadow_knight.game-bundle.json']])await copyFile(resolve(input,from),resolve(root,to));
const packs=['glasses_square','glasses_round'].map(id=>({id,path:`accessories/studio/${id}.accessory-pack.json`}));
const characters=[];
for(const [id,name,appearanceId]of [['traveler','Traveler','traveler-default'],['shadow_knight','Shadow Knight','shadow-knight-default']]){
 const path=`characters/studio/${id}.game-bundle.json`,bundle=JSON.parse(await readFile(resolve(root,path),'utf8')),p=bundle.project;
 const geometry=(s:any)=>{const {src,...rest}=s;return rest};
 characters.push({id,name,appearanceId,path,rig:p.rig,headId:p.headId,bodyId:p.bodyId,mountSignatures:p.mountSignatures,parts:{head:geometry(p.parts.head),torso:geometry(p.parts.torso)},inventory:p.attachments.map((a:any)=>({accessoryId:a.accessoryId||a.id,visible:a.visible!==false}))});
}
await writeFile(root+'/accessories/studio/mount-data.json',JSON.stringify({version:1,packs,characters},null,2)+'\n');
const catalog=JSON.parse(await readFile(root+'/catalog.json','utf8'));
catalog.resources.find((r:any)=>r.id==='traveler').studioBundle=characters[0].path;
if(!catalog.rigs.some((r:any)=>r.id==='shadow-knight-rig')){
 catalog.rigs.push({...structuredClone(catalog.rigs[0]),id:'shadow-knight-rig',sourceRig:'shadow_knight'});
 catalog.resources.push({id:'shadow-knight',type:'character',path:'characters/traveler/traveler.character.json',studioBundle:characters[1].path,animationSourceRig:'traveler',rig:'shadow-knight-rig'},
 {id:'shadow-knight-actions',type:'animation',source:'shadow-knight',embedded:'clips',rig:'shadow-knight-rig',actions:structuredClone(catalog.resources.find((r:any)=>r.id==='traveler-actions').actions)});
 catalog.appearances.push({id:'shadow-knight-default',name:'Shadow Knight · Studio',character:'shadow-knight',accessories:[],animationSet:'shadow-knight-actions',rig:'shadow-knight-rig',scale:catalog.appearances[0].scale});
}
await writeFile(root+'/catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log('Imported exact Studio files and generated lightweight mount identities');

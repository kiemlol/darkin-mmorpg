import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';import {dirname} from 'node:path';import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {ExplorationStore,explorationConfig,scopeKey,mapRevision,WORLD_ID,type ExplorationRecord} from '../shared/map-state';
import {DEFAULT_REALM,normalizeRealm,type RealmState} from '../shared/realms';
type Guest=RealmState&{id:string;name:string;explorations:Record<string,ExplorationRecord>};
export class GuestStore{
 guests:Record<string,Guest>={};clockSeconds:number|null=null;dirty=false;private writing:Promise<void>=Promise.resolve();
 profileWarnings=new Map<string,string[]>();
 constructor(public file:string){}
 static async open(file:string){const s=new GuestStore(file);try{const raw=await readFile(file,'utf8');if(raw.length>64*1024*1024)throw Error('World state too large');const d=JSON.parse(raw);if(![1,2].includes(d.version)||!d.guests||typeof d.guests!=='object')throw Error('Invalid world state');s.guests=d.guests;for(const guest of Object.values(s.guests)){const profile=normalizeRealm(guest);Object.assign(guest,profile.state);if(profile.warnings.length){s.profileWarnings.set(guest.id,profile.warnings);console.warn('Guest realm migration:',guest.id,profile.warnings.join(' '))}if(profile.migrated)s.dirty=true}if(Number.isFinite(d.clockSeconds))s.clockSeconds=d.clockSeconds}catch(e:any){if(e.code!=='ENOENT')throw e}return s}
 identify(token:unknown,name:string,busy:(id:string)=>boolean){const valid=typeof token==='string'&&/^[a-f0-9]{64}$/.test(token),key=valid?createHash('sha256').update(token).digest('hex'):'';let guest=this.guests[key];let resumeToken=valid?token as string:'';
  if(!guest||busy(guest.id)){if(Object.keys(this.guests).length>=2048)throw Error('Guest storage full');resumeToken=randomBytes(32).toString('hex');const k=createHash('sha256').update(resumeToken).digest('hex');guest={...DEFAULT_REALM,id:randomUUID(),name,explorations:{}};this.guests[k]=guest}
  guest.name=name;this.dirty=true;return{guest,resumeToken,warnings:this.profileWarnings.get(guest.id)||[]};
 }
 exploration(guest:Guest,p:any){const cfg=explorationConfig(p),scope={characterId:guest.id,worldId:WORLD_ID,mapId:p.id,mapRevision:mapRevision(p)},store=new ExplorationStore(p.cols*p.cell,p.rows*p.cell,cfg.cellSize,cfg.radius,scope),key=scopeKey(scope);if(guest.explorations[key])store.restore(guest.explorations[key]);return store}
 capture(guest:Guest,store:ExplorationStore){guest.explorations[scopeKey(store.scope)]=store.record();this.dirty=true}
 captureCharacter(guest:Guest,state:RealmState){const normalized=normalizeRealm(state);if(normalized.warnings.length)throw Error('Invalid authoritative realm');if(guest.realmId!==normalized.state.realmId||guest.realmStageId!==normalized.state.realmStageId){Object.assign(guest,normalized.state);this.dirty=true}}
 flush(clockSeconds:number){this.clockSeconds=clockSeconds;const json=JSON.stringify({version:2,clockSeconds,guests:this.guests});return this.writing=this.writing.catch(()=>{}).then(async()=>{await mkdir(dirname(this.file),{recursive:true});await writeFile(this.file+'.tmp',json);await rename(this.file+'.tmp',this.file);this.dirty=false})}
}

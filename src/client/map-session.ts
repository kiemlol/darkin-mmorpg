import {ExplorationStore,explorationConfig,mapRevision,WORLD_ID,scopeKey,type ExplorationScope} from '../shared/map-state';
export const EXPLORE_PREFIX='darkin-frontier:exploration:v1:';
export function offlineCharacter(name:string){const key='darkin-frontier:character:v1:'+encodeURIComponent(name.trim());try{const id=localStorage.getItem(key);if(id&&/^offline-[a-zA-Z0-9-]+$/.test(id))return id;const next='offline-'+crypto.randomUUID();localStorage.setItem(key,next);return next}catch{return 'offline-ephemeral-'+crypto.randomUUID()}}
export function createExploration(p:any,characterId:string,worldId=WORLD_ID,revision=mapRevision(p)){const cfg=explorationConfig(p);return new ExplorationStore(p.cols*p.cell,p.rows*p.cell,cfg.cellSize,cfg.radius,{characterId,worldId,mapId:p.id,mapRevision:revision})}
export function loadExploration(store:ExplorationStore){try{store.restore(JSON.parse(localStorage.getItem(EXPLORE_PREFIX+scopeKey(store.scope))||'null'))}catch{}}
export function saveExploration(store:ExplorationStore){try{localStorage.setItem(EXPLORE_PREFIX+scopeKey(store.scope),JSON.stringify(store.record()))}catch{}}

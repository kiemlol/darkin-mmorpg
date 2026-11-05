import bow from '../../public/game-data/animations/bow/bow1.animation-pack.json';
import {readAnimationPack} from '../../public/game-data/cutout-runtime/animation-identity.mjs';
import {gameCatalog} from './catalog';
// Published, immutable packs only. Preview events never invoke combat callbacks.
export const previewClips:Record<string,ReturnType<typeof readAnimationPack>>={bow_shoot:readAnimationPack(bow)};
export type AnimationPreview={actionId:string;sequence:number;elapsed:number};
export function previewDefinition(actionId:string,appearanceId:string){
 if(!Object.hasOwn(previewClips,actionId))return null;
 const appearance=gameCatalog.appearances.find(a=>a.id===appearanceId),clip=previewClips[actionId];
 if(!appearance||!clip)return null;
 const pack=gameCatalog.actionPacks?.find(p=>p.compatibleRigs.includes(appearance.rig)&&gameCatalog.resources.find(r=>r.id===p.resourceId)?.actions?.[actionId]?.animationId===clip.id);
 return pack?clip:null;
}
export function validAnimationPreview(p:any):p is AnimationPreview{return !!p&&typeof p.actionId==='string'&&Object.hasOwn(previewClips,p.actionId)&&Number.isSafeInteger(p.sequence)&&p.sequence>=0&&p.sequence<1e12&&Number.isFinite(p.elapsed)&&p.elapsed>=0&&p.elapsed<=previewClips[p.actionId].dur}

// Stable save/network IDs. Labels are presentation, never identifiers or file names.
export const REALMS = [
 {id:'mortal',name:'Người phàm'},
 {id:'qi_condensation',name:'Ngưng Khí Kỳ'},
 {id:'foundation_establishment',name:'Trúc Cơ Kỳ'},
 {id:'core_formation',name:'Kết Đan Kỳ'},
 {id:'nascent_soul',name:'Nguyên Anh Kỳ'},
] as const;
export const REALM_STAGES = [
 {id:'early',name:'Sơ kỳ'}, {id:'middle',name:'Trung kỳ'},
 {id:'late',name:'Hậu kỳ'}, {id:'perfection',name:'Viên mãn'},
] as const;
export type RealmId=typeof REALMS[number]['id'];
export type RealmStageId=typeof REALM_STAGES[number]['id'];
export type RealmState={realmId:RealmId;realmStageId:RealmStageId};
export const DEFAULT_REALM:Readonly<RealmState>=Object.freeze({realmId:'mortal',realmStageId:'early'});
export function isRealmId(v:unknown):v is RealmId{return REALMS.some(r=>r.id===v)}
export function isRealmStageId(v:unknown):v is RealmStageId{return REALM_STAGES.some(r=>r.id===v)}
export function validRealmState(v:any):v is RealmState{return !!v&&isRealmId(v.realmId)&&isRealmStageId(v.realmStageId)}
export function normalizeRealm(v:any){
 const warnings:string[]=[];
 if(v?.realmId!==undefined&&!isRealmId(v.realmId))warnings.push('Cảnh giới không hợp lệ: đã dùng Người phàm.');
 if(v?.realmStageId!==undefined&&!isRealmStageId(v.realmStageId))warnings.push('Bậc cảnh giới không hợp lệ: đã dùng Sơ kỳ.');
 const state:RealmState={realmId:isRealmId(v?.realmId)?v.realmId:DEFAULT_REALM.realmId,realmStageId:isRealmStageId(v?.realmStageId)?v.realmStageId:DEFAULT_REALM.realmStageId};
 return{state,warnings,migrated:state.realmId!==v?.realmId||state.realmStageId!==v?.realmStageId};
}
export function realmLabels(state:RealmState){return{realm:REALMS.find(r=>r.id===state.realmId)?.name||'Cảnh giới không hợp lệ',stage:state.realmId==='mortal'?'':REALM_STAGES.find(r=>r.id===state.realmStageId)?.name||'Bậc không hợp lệ'}}

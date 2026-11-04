export const RESOURCES=Object.freeze({spirit_stone:{id:'spirit_stone',name:'Linh thạch',kind:'currency'}});
export type Wallet=Record<string,number>&{spirit_stone:number};
export function normalizeWallet(value:unknown){const wallet:Wallet={spirit_stone:0},warnings:string[]=[];if(value&&typeof value==='object'&&!Array.isArray(value))for(const [id,n]of Object.entries(value)){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||['__proto__','prototype','constructor'].includes(id))continue;if(Number.isSafeInteger(n)&&(n as number)>=0)wallet[id]=n as number;else warnings.push('Số dư '+id+' không hợp lệ; đã dùng 0.')}
 return{wallet,warnings};}
export function addReward(wallet:Wallet,id:string,amount:number):Wallet{if(!Object.hasOwn(RESOURCES,id)||!Number.isSafeInteger(amount)||amount<0)throw Error('Tài nguyên/phần thưởng không hợp lệ');const next=structuredClone(wallet);const n=(next[id]||0)+amount;if(!Number.isSafeInteger(n))throw Error('Ví vượt giới hạn số nguyên');next[id]=n;return next}

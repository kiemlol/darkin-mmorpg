// All art, Canvas draws and DOM hitboxes use the same source-image coordinates.
export const INVENTORY_LAYOUT={
 origin:{x:70,y:0},width:1140,height:448,
 preview:{x:445,y:55,width:380,height:320},
 stats:{x:171,y:133,width:218,step:35,height:35},
 gear:{left:464,right:748,y:94,step:71,size:58},
 slots:{x:866,y:120,stepX:70,stepY:64,size:60},
 categories:{x:850,y:64,step:50,width:50},
 pager:{left:911,right:1076,y:390,width:25,dotX:957,dotStep:26,dotSize:14},
} as const;
export const CATEGORY_SPRITES=[['tabBagIdle','tabBagActive'],['tabEquipmentIdle','tabEquipmentActive'],['tabOutfitIdle','tabOutfitActive'],['tabMaterialIdle','tabMaterialActive'],['tabCurrencyIdle','tabCurrencyActive']] as const;

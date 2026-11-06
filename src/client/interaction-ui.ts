import {combatWeapon} from '../shared/weapons';
import type {Actor,Intent} from '../shared/world';import type {GameSession} from './session';
export class InteractionUI{
 combatTap=false;
 root=document.createElement('section');label=document.createElement('p');track=document.createElement('div');fill=document.createElement('i');icon=document.createElement('span');buttonLabel=document.createElement('small');held=false;miningPress=false;message='';age=0;
 constructor(private button:HTMLElement){this.root.id='mining-panel';this.root.hidden=true;this.root.setAttribute('role','status');this.track.className='mining-track';this.track.append(this.fill);this.root.append(this.label,this.track);document.body.append(this.root);this.icon.textContent='⚔';this.buttonLabel.textContent='ĐÁNH';this.button.replaceChildren(this.icon,this.buttonLabel)}
 intent(session:GameSession,actor:Actor|undefined,raw:Omit<Intent,'seq'>,queuedPress=false,beforeInteract:()=>void=()=>{}){const pressed=queuedPress||raw.attack&&!this.held;this.held=raw.attack;if(!raw.attack)this.miningPress=false;
  if(pressed){const channel=session.snapshot.nodes?.find(n=>n.ownerId===session.id&&(n.status==='mining'||n.status==='committing'));const target=actor?.interactionTarget;if(channel){this.miningPress=true;if(channel.status!=='committing')session.cancelInteraction()}else if(target){this.miningPress=true;if(Math.hypot(raw.dx,raw.dy)>.01)session.interactionMessage='Hãy dừng lại để đào';else{beforeInteract();session.interact({mapId:session.exploration!.scope.mapId,objectId:target.objectId,cycle:target.cycle,requestId:crypto.randomUUID()})}}}
  if(pressed&&!this.miningPress)this.combatTap=true;return{...raw,attack:(raw.attack||this.combatTap)&&!this.miningPress&&!actor?.interactionTarget};
 }
 update(session:GameSession|null,actor:Actor|null,dt:number){if(!session||!actor){this.root.hidden=true;return}const node=session.snapshot.nodes?.find(n=>n.ownerId===session.id&&(n.status==='mining'||n.status==='committing')),target=actor.interactionTarget,isMine=target?.type==='mine'&&target.actionId==='mine_spirit_stone',mode=node?'mining':target?'mine':'attack';this.button.dataset.action=mode;this.icon.textContent=mode==='attack'?(combatWeapon(actor).kind==='soul'?'✦':'⚔'):isMine?'⛏':'✋';this.buttonLabel.textContent=node?.status==='committing'?'LƯU…':node?'HỦY':target?(isMine?'ĐÀO':'TƯƠNG TÁC'):'ĐÁNH';this.button.setAttribute('aria-label',node?.status==='committing'?'Đang lưu phần thưởng':node?'Hủy đào':target?.label||'Đánh');
  if(session.interactionMessage!==this.message){this.message=session.interactionMessage;this.age=0}else this.age+=dt;
  if(node){const duration=node.durationSeconds||1,elapsed=Math.max(0,session.snapshot.time-(node.startedAt||0)),ratio=node.status==='committing'?1:Math.min(1,elapsed/duration);this.label.textContent=node.status==='committing'?'Đang lưu giao dịch…':`${isMine?'Đang đào linh thạch':target?.label||'Đang tương tác'} · ${Math.min(duration,elapsed).toFixed(1)}/${duration}s`;this.fill.style.width=ratio*100+'%';this.track.hidden=false;this.root.hidden=false}
  else{this.track.hidden=true;this.label.textContent=this.message&&this.age<4?this.message:target?target.label+' · Space / Đào':'';this.root.hidden=!this.label.textContent}
 }
 reset(){this.release();this.root.hidden=true;this.message='';this.age=0;this.button.dataset.action='attack';this.icon.textContent='⚔';this.buttonLabel.textContent='ĐÁNH'}
 release(){this.held=false;this.miningPress=false;this.combatTap=false}
 sent(){this.combatTap=false}
}

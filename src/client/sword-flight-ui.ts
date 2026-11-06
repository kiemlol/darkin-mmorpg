import type {Actor} from '../shared/world';
import type {GameSession} from './session';
import {equippedFlightWeapon} from '../shared/sword-flight';

export class SwordFlightUI{
 notice=document.createElement('p');lastMessage='';messageAge=0;
 constructor(private button:HTMLButtonElement){this.notice.id='flight-notice';this.notice.hidden=true;this.notice.setAttribute('role','status');document.body.append(this.notice)}
 toggle(session:GameSession,actor:Actor|undefined){if(actor)session.setSwordFlight(!actor.swordFlight)}
 update(session:GameSession|null,actor:Actor|null,dt:number){
  const f=actor?.swordFlight,available=!!actor&&actor.hp>0&&!!equippedFlightWeapon(actor),connected=session?.status==='Offline'||session?.status==='Online';
  this.button.disabled=!available||!connected;this.button.setAttribute('aria-pressed',String(!!f));this.button.title=available?'F · Gọi / hạ phi kiếm':'Cần đeo vũ khí tương thích';this.button.dataset.phase=f?.phase||'ground';
  const label=f?.phase==='riding'?'HẠ KIẾM':f?.phase==='orbit'?'GỌI KIẾM':f?.phase==='settle'?'LÊN KIẾM':f?.phase==='jump'?'ĐANG NHẢY':f?.phase==='landing'?'ĐANG HẠ':'PHI KIẾM';
  if(this.button.dataset.label!==label){this.button.dataset.label=label;this.button.innerHTML='<span aria-hidden="true">✦</span><small>'+label+'</small>'}this.button.setAttribute('aria-label',f?'Hạ phi kiếm':'Bật phi kiếm');
  const message=session?.flightMessage||'';if(message!==this.lastMessage){this.lastMessage=message;this.messageAge=0}this.messageAge+=dt;this.notice.textContent=message;this.notice.hidden=!session||!message||this.messageAge>5;
 }
 reset(){this.lastMessage='';this.messageAge=0;this.notice.hidden=true}
}

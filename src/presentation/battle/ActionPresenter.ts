import Phaser from 'phaser';
import type { BattleCard } from '../../core/cards/BattleCards';
import type { VisualActor } from './ClashPresenter';
import{playHeroinePose}from'./HeroinePose';

export class ActionPresenter {
  constructor(private scene: Phaser.Scene, private players: Map<string, VisualActor>, private enemies: Map<string, VisualActor>, private combatLayer: Phaser.GameObjects.Container) {}

  // 打擊 helper：hit-stop（暫停 timeScale）與全螢幕白閃。
  // kind: quick 40ms / normal 70ms / heavy 110ms / break 140ms。
  private impactFreeze(kind:'quick'|'normal'|'heavy'|'break'|'clash',flash=true){
    const ms=kind==='quick'?40:kind==='normal'?70:kind==='heavy'?110:kind==='clash'?90:140;
    const flashAlpha=kind==='quick'?.28:kind==='normal'?.4:kind==='heavy'?.55:kind==='clash'?.42:.7;
    if(flash){const w=this.scene.cameras.main.width,h=this.scene.cameras.main.height;
      const overlay=this.scene.add.rectangle(w/2,h/2,w,h,0xffffff,flashAlpha).setDepth(200).setScrollFactor(0);
      this.combatLayer.add(overlay);
      this.scene.tweens.add({targets:overlay,alpha:0,duration:Math.max(90,ms+40),ease:'Cubic.easeOut',onComplete:()=>overlay.destroy()})}
    this.scene.time.timeScale=kind==='break'?.08:kind==='heavy'?.12:kind==='clash'?.18:.25;
    return this.realWait(ms).finally(()=>{this.scene.time.timeScale=1})
  }

  // 音效 helper：以 detune / volume / 疊播分級表現不同攻擊的重量感。
  private playImpact(kind:'quick'|'normal'|'heavy'|'break'|'clash'|'death'){
    const cfg={quick:{d:300,v:.72},normal:{d:0,v:.85},heavy:{d:-400,v:1},break:{d:-700,v:1},clash:{d:-200,v:.82},death:{d:-500,v:.92}}[kind];
    this.scene.sound.play('sword-impact',{volume:cfg.v,detune:cfg.d});
    if(kind==='break')this.scene.time.delayedCall(48,()=>this.scene.sound.play('sword-impact',{volume:.72,detune:-620}));
    if(kind==='clash')this.scene.time.delayedCall(28,()=>this.scene.sound.play('sword-impact',{volume:.55,rate:.55}));
    if(kind==='heavy')this.scene.time.delayedCall(60,()=>this.scene.sound.play('sword-impact',{volume:.5,detune:-800,rate:.65}));
  }

  // 攻擊者發動前，把鏡頭拉近目標；被 attack / cancel 呼叫。
  private focusCamera(x:number,y:number,zoom=1.24,dur=180){
    this.scene.cameras.main.pan(x,y,dur,'Sine.easeInOut');
    this.scene.cameras.main.zoomTo(zoom,dur,'Sine.easeInOut');
  }

  // 依卡型分級 shake：break/heavy 最重、quick 最輕。
  private impactShake(kind:'quick'|'normal'|'heavy'|'break'){
    const cfg={quick:{d:80,a:.008},normal:{d:130,a:.012},heavy:{d:200,a:.018},break:{d:240,a:.022}}[kind];
    this.scene.cameras.main.shake(cfg.d,cfg.a);
  }

  // 受擊 sprite 紅閃：破符或大於 0 傷害才觸發，避免每次 balance damage 都閃。
  private hitFlash(sprite:Phaser.GameObjects.Sprite|undefined){
    if(!sprite)return;const prev=sprite.tintTopLeft??0xffffff;sprite.setTint(0xff5060);
    this.scene.time.delayedCall(110,()=>{if(prev===0xffffff)sprite.clearTint();else sprite.setTint(prev)});
  }

  private techniquePalette(actorId:string){
    if(actorId==='PB')return{main:0xe6c56f,edge:0xfff0b0,trail:0x7d5db7};
    if(actorId==='PC')return{main:0x9f8cff,edge:0xe9e3ff,trail:0x4b3b7e};
    return{main:0x9fe8ff,edge:0xffffff,trail:0x4b9ab5};
  }

  private spawnAfterimage(actor:VisualActor,direction:number,color:number,offset:number,alpha:number){
    const sprite=actor.sprite;if(!sprite)return;
    const ghost=this.scene.add.sprite(actor.root.x-direction*offset,actor.root.y+(sprite.y??0),sprite.texture.key,sprite.frame.name)
      .setDepth(82).setAlpha(alpha).setTint(color).setFlipX(sprite.flipX).setAngle(sprite.angle);
    ghost.setDisplaySize(sprite.displayWidth,sprite.displayHeight);this.combatLayer.add(ghost);
    this.scene.tweens.add({targets:ghost,x:ghost.x-direction*18,alpha:0,duration:170+offset,ease:'Cubic.easeOut',onComplete:()=>ghost.destroy()});
  }

  private techniqueWindup(actorId:string,actor:VisualActor,direction:number,cardId?:string){
    if(!actor.sprite||!['PB','PC'].includes(actorId))return;
    const palette=this.techniquePalette(actorId);
    if(actorId==='PC'){
      this.spawnAfterimage(actor,direction,palette.main,16,.34);this.spawnAfterimage(actor,direction,palette.trail,32,.22);this.spawnAfterimage(actor,direction,palette.edge,48,.12);
      const streak=this.scene.add.rectangle(actor.root.x-direction*34,actor.root.y-5,94,2,palette.edge,.72).setDepth(85);this.combatLayer.add(streak);
      this.scene.tweens.add({targets:streak,x:streak.x+direction*70,scaleX:1.7,alpha:0,duration:120,ease:'Cubic.easeIn',onComplete:()=>streak.destroy()});
    }else{
      const reach=cardId==='heavy'?180:150;
      const g=this.scene.add.graphics().setDepth(85);g.lineStyle(5,palette.main,.42).lineBetween(actor.root.x,actor.root.y-20,actor.root.x+direction*reach,actor.root.y-32);g.lineStyle(2,palette.edge,.82).lineBetween(actor.root.x+direction*12,actor.root.y-18,actor.root.x+direction*reach,actor.root.y-32);this.combatLayer.add(g);
      this.scene.tweens.add({targets:g,alpha:0,duration:190,ease:'Quad.easeOut',onComplete:()=>g.destroy()});
    }
  }

  private techniqueImpact(actorId:string,x:number,y:number,direction:number,cardId?:string){
    if(!['PB','PC'].includes(actorId))return;
    const p=this.techniquePalette(actorId);
    if(actorId==='PB'){
      const scale=cardId==='heavy'?1.32:cardId==='break'?1.18:1.05;this.lineSlash(x,y,direction<0,scale,p.main);const sweep=this.scene.add.rectangle(x-direction*20,y+28,190*scale,6,p.edge,.76).setRotation(direction>0?-.28:.28).setDepth(107);this.combatLayer.add(sweep);this.scene.tweens.add({targets:sweep,scaleX:1.3,alpha:0,duration:180,onComplete:()=>sweep.destroy()});
    }else{
      const lengths=cardId==='heavy'?[128,112]:[104,92];
      lengths.forEach((length,i)=>{const cut=this.scene.add.rectangle(x,y-6,length,i?3:7,i?p.edge:p.main,i?.96:.82).setRotation((i?-.78:.72)*direction).setDepth(110+i);this.combatLayer.add(cut);this.scene.tweens.add({targets:cut,scaleX:1.28,alpha:0,duration:145+i*35,ease:'Cubic.easeOut',onComplete:()=>cut.destroy()})});
      for(let i=0;i<4;i++){const needle=this.scene.add.rectangle(x-direction*(18+i*5),y-32+i*18,34,2,p.edge,.65).setRotation((-.15+i*.12)*direction).setDepth(109);this.combatLayer.add(needle);this.scene.tweens.add({targets:needle,x:needle.x+direction*(72+i*12),alpha:0,duration:150+i*20,onComplete:()=>needle.destroy()})}
    }
  }

  // 供 BootScene 從外部觸發（例如 onImpact callback 內），因為 damage() 在 BootScene 裡。
  triggerHitFlash(sprite:Phaser.GameObjects.Sprite|undefined){this.hitFlash(sprite)}
  private move(o: Phaser.GameObjects.Container, x: number, y: number, d = 210, ease = 'Quad.easeInOut') { return new Promise<void>((r) => this.scene.tweens.add({ targets: o, x, y, duration: d, ease, onComplete: () => r() })); }
  private wait(ms: number) { return new Promise<void>((r) => this.scene.time.delayedCall(ms, r)); }
  private realWait(ms:number){return new Promise<void>((resolve)=>globalThis.setTimeout(resolve,ms));}
  // Contact-anchored slash families. ArcSlash is a blade trail, never a projectile; LineSlash is the oversized screen-cut language.
  private slash(x:number,y:number,flipX:boolean,scale=1,color=0xf7fbff){const dir=flipX?-1:1,g=this.scene.add.graphics().setDepth(104).setPosition(x,y),start=dir>0?-2.45:-.7,end=dir>0?.55:2.45,r=112*scale;g.lineStyle(22*scale,color,.12).beginPath().arc(0,0,r,start,end,dir<0).strokePath();g.lineStyle(7*scale,color,.78).beginPath().arc(0,0,r,start,end,dir<0).strokePath();g.lineStyle(Math.max(2,3.5*scale),0xffffff,.98).beginPath().arc(0,0,r-4*scale,start+.05*dir,end-.05*dir,dir<0).strokePath();this.combatLayer.add(g);g.setScale(.72);this.scene.tweens.add({targets:g,scale:1.12,alpha:0,duration:175,ease:'Cubic.easeOut',onComplete:()=>g.destroy()});const flash=this.scene.add.circle(x,y,16*scale,0xffffff,.88).setDepth(106);this.combatLayer.add(flash);this.scene.tweens.add({targets:flash,scale:2.4,alpha:0,duration:125,onComplete:()=>flash.destroy()})}
  private lineSlash(x:number,y:number,flipX:boolean,scale=1,color=0xffe0a8){const dir=flipX?-1:1,angles=[-.18,.12,-.52],lengths=[330,260,210];angles.forEach((a,i)=>{const line=this.scene.add.rectangle(x-dir*(i*12),y+(i-1)*13,lengths[i]!*scale,i===0?9:4,i===0?0xffffff:color,i===0?.98:.8).setRotation(a*dir).setDepth(108+i).setScale(.28,1);this.combatLayer.add(line);this.scene.tweens.add({targets:line,scaleX:1.08,alpha:0,duration:155+i*34,ease:'Cubic.easeOut',onComplete:()=>line.destroy()})});const core=this.scene.add.circle(x,y,20*scale,0xffffff,.9).setDepth(112);this.combatLayer.add(core);this.scene.tweens.add({targets:core,scale:2.8,alpha:0,duration:140,onComplete:()=>core.destroy()})}
  private cardImpact(x:number,y:number,definitionId?:string,flip=false){const burstLines=(color:number,count:number,reach:number)=>{for(let i=0;i<count;i++){const a=-1.15+i*(2.3/Math.max(1,count-1)),ray=this.scene.add.rectangle(x,y,reach,3,color,.86).setOrigin(0,.5).setRotation(a).setDepth(106);this.combatLayer.add(ray);this.scene.tweens.add({targets:ray,scaleX:1.35,alpha:0,duration:180+i*8,ease:'Cubic.easeOut',onComplete:()=>ray.destroy()})}};if(definitionId==='break'){this.lineSlash(x,y,flip,1.18,0xffd36b);burstLines(0xffd36b,9,92);const crack=this.scene.add.rectangle(x,y+22,190,7,0xffc85c,.8).setDepth(105);this.combatLayer.add(crack);this.scene.tweens.add({targets:crack,scaleX:1.45,alpha:0,duration:240,onComplete:()=>crack.destroy()})}else if(definitionId==='delay'){const bars=[-34,0,34].map((dy,i)=>this.scene.add.rectangle(x-(flip?-1:1)*18,y+dy,150-i*18,5,0x9cecff,.82).setDepth(104+i));this.combatLayer.add(bars);bars.forEach((b,i)=>this.scene.tweens.add({targets:b,x:b.x+(flip?-1:1)*42,scaleX:.35,alpha:0,delay:i*24,duration:250,onComplete:()=>b.destroy()}))}else if(definitionId==='heavy'){this.lineSlash(x,y,flip,1.38,0xffd8a0);burstLines(0xffd8a0,11,112);const shock=this.scene.add.rectangle(x,y+38,230,9,0xffd8a0,.72).setDepth(101);this.combatLayer.add(shock);this.scene.tweens.add({targets:shock,scaleX:1.55,scaleY:.25,alpha:0,duration:300,onComplete:()=>shock.destroy()})}else if(definitionId==='quick'){this.slash(x-8,y-8,flip,.92,0x9fe8ff);this.scene.time.delayedCall(42,()=>this.slash(x+12,y+10,!flip,.82,0x67cfff))}else if(definitionId==='guard'){const shield=this.scene.add.ellipse(x,y,118,146,0x7dd9ff,.10).setStrokeStyle(7,0xc6f4ff,.95).setDepth(101);this.combatLayer.add(shield);this.scene.tweens.add({targets:shield,scale:.72,alpha:0,duration:330,onComplete:()=>shield.destroy()})}else if(definitionId==='cover'){const intercept=this.scene.add.triangle(x,y-20,0,76,44,0,88,76,0x8eeeff,.72).setStrokeStyle(4,0xe6fbff,.95).setDepth(102);this.combatLayer.add(intercept);this.scene.tweens.add({targets:intercept,y:y-64,scale:1.22,alpha:0,duration:280,onComplete:()=>intercept.destroy()})}else if(definitionId==='relay'){this.slash(x,y,flip,1.05,0xffd56f);const handoff=this.scene.add.rectangle(x-(flip?-1:1)*80,y+28,180,5,0xffd56f,.82).setDepth(103);this.combatLayer.add(handoff);this.scene.tweens.add({targets:handoff,x:handoff.x+(flip?-1:1)*95,scaleX:1.35,alpha:0,duration:220,onComplete:()=>handoff.destroy()})}else if(definitionId==='cycle'){for(let i=0;i<3;i++){const ring=this.scene.add.ellipse(x,y,72+i*22,42+i*12,0x8fe6c0,.05).setStrokeStyle(3,0xb9ffe3,.86-i*.16).setDepth(101+i);this.combatLayer.add(ring);this.scene.tweens.add({targets:ring,scale:1.55,alpha:0,delay:i*45,duration:360,onComplete:()=>ring.destroy()})}}}
  private resetCamera() { this.scene.cameras.main.pan(640, 360, 250, 'Sine.easeInOut'); this.scene.cameras.main.zoomTo(1, 250, 'Sine.easeInOut'); }

  async attack(actorId: string, targetId: string, card: { name: string; clashPower: number; definitionId?: string }, enemy = false, mode: 'normal' | 'flank' = 'normal', returnToSlot = true, onImpact?: () => boolean) {
    const attacker = (enemy ? this.enemies : this.players).get(actorId)!;
    const target = (enemy ? this.players : this.enemies).get(targetId)!;
    const direction = attacker.root.x < target.root.x ? 1 : -1;
    // 卡片資訊往上抬到 -132 避免蓋到怪物母版尺寸的頭部；若 y 太靠近上邊界則吸回 40。
    const badgeY = Math.max(40, attacker.root.y - 132);
    const isChikage=!enemy&&actorId==='PB',isOboro=!enemy&&actorId==='PC';
    const techniqueColor=isChikage?'#5b4520':isOboro?'#33245c':enemy?'#713142':'#155268';
    const badge = this.scene.add.text(attacker.root.x, badgeY, `${card.name}\n威力 ${card.clashPower}`, { fontFamily: (isChikage||isOboro)?'serif':'sans-serif', fontSize: (isChikage||isOboro)?'18px':'16px', fontStyle: 'bold', align: 'center', color: '#fff', stroke:(isChikage||isOboro)?'#0a0810':undefined,strokeThickness:(isChikage||isOboro)?4:0, backgroundColor: techniqueColor, padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(70).setAlpha((isChikage||isOboro) ? .15 : 1);
    if(isChikage||isOboro)this.scene.tweens.add({targets:badge,alpha:1,y:badgeY-8,duration:120,ease:'Back.easeOut'});
    const anticipation=isChikage?128:isOboro?58:100;
    const dashDuration=isChikage?168:isOboro?92:150;
    const retreat=isChikage?54:isOboro?30:42;
    await this.move(attacker.root, attacker.root.x - direction * retreat, attacker.root.y, anticipation, 'Quad.easeOut');
    this.techniqueWindup(actorId,attacker,direction,card.definitionId);
    this.scene.sound.play('sword-swish', { volume: isOboro ? .82 : isChikage ? .74 : .7, rate: isOboro ? 1.18 : isChikage ? .9 : 1 });
    const baseContact=isChikage?78:isOboro?44:58;
    const contactX = mode === 'flank' ? target.root.x + direction * Math.max(54,baseContact) : target.root.x - direction * baseContact;
    playHeroinePose(attacker.sprite,'strike');
    if(isChikage&&attacker.sprite)this.scene.tweens.add({targets:attacker.sprite,angle:direction*6,duration:dashDuration,ease:'Cubic.easeIn'});
    if(isOboro&&attacker.sprite)this.scene.tweens.add({targets:attacker.sprite,angle:-direction*8,duration:dashDuration,ease:'Expo.easeIn'});
    if(isOboro){this.spawnAfterimage(attacker,direction,0x9988ff,20,.28);this.spawnAfterimage(attacker,direction,0x5e4a98,42,.18)}
    await this.move(attacker.root, contactX, target.root.y, dashDuration, isOboro?'Expo.easeIn':'Cubic.easeIn');
    if (mode === 'flank') badge.setText(`${card.name}\n側襲`);
    // 斬擊方向：flipX 由攻擊者→目標方向決定（direction>0 = 攻擊者在左，揮向右需 flipX=true）；
    // 不再用 enemy 旗標硬綁，避免玩家改站左邊後斬擊方向反了。
    // 依卡型決定打擊重量：heavy/break 有 hit-stop + 白閃 + 大 shake，quick 較輕。
    const impactKind:'quick'|'normal'|'heavy'|'break'=card.definitionId==='heavy'?'heavy':card.definitionId==='break'?'break':card.definitionId==='quick'?'quick':'normal';
    this.techniqueImpact(actorId,target.root.x,target.root.y-5,direction,card.definitionId);
    this.cardImpact(target.root.x,target.root.y-5,card.definitionId,direction < 0);
    this.playImpact(impactKind);
    this.impactShake(impactKind);
    this.hitFlash(target.sprite);
    if(impactKind!=='quick')await this.impactFreeze(impactKind);
    await this.move(target.root, target.root.x + direction * (impactKind==='heavy'||impactKind==='break'?46:30), target.root.y, 70, 'Quad.easeOut');
    const defeated=onImpact?.()??false;
    if(defeated){
      await Promise.all([
        this.move(target.root,target.root.x+direction*18,target.root.y+24,150,'Quad.easeIn'),
        new Promise<void>(resolve=>this.scene.tweens.add({targets:target.root,angle:direction*72,alpha:.5,duration:150,ease:'Quad.easeIn',onComplete:()=>resolve()})),
      ])
    }else if (returnToSlot) {
      await this.move(target.root, target.x, target.y, 130, 'Back.easeOut');
      target.root.setAngle(0);
    } else {
      target.root.setAngle(direction * 9);
    }
    await this.wait(90); badge.destroy();
    if (returnToSlot) await this.move(attacker.root, attacker.x, attacker.y, isOboro?150:isChikage?265:240,isOboro?'Cubic.easeOut':'Quad.easeInOut');
    if(attacker.sprite)attacker.sprite.setAngle(0);playHeroinePose(attacker.sprite,'idle');if(!defeated)playHeroinePose(target.sprite,'idle');
    if(defeated)this.resetCamera()
  }

  async relay(sourceId: string, allyId: string, targetId: string, enemy = false, onImpact?: () => boolean) {
    const source = (enemy?this.enemies:this.players).get(sourceId)!;
    const ally = (enemy?this.enemies:this.players).get(allyId)!;
    const target = (enemy?this.players:this.enemies).get(targetId)!;
    const direction = source.root.x < target.root.x ? 1 : -1;
    const contactX = target.root.x - direction * 62;
    source.root.setDepth(56);ally.root.setDepth(57);target.root.setDepth(55);
    if (Math.abs(source.root.x - contactX) > 90) await this.move(source.root, contactX, target.root.y, 110, 'Cubic.easeIn');
    await Promise.all([
      this.move(source.root, source.x, source.y, 180, 'Quad.easeOut'),
      this.move(ally.root, contactX, target.root.y, 180, 'Cubic.easeIn'),
    ]);
    const handoff=this.scene.add.rectangle((source.root.x+ally.root.x)/2,target.root.y-14,96,3,0xffd56f,.85).setDepth(103).setRotation(-.12*direction);this.combatLayer.add(handoff);this.cardImpact(target.root.x,target.root.y-8,'relay',direction<0);this.scene.tweens.add({targets:handoff,scaleX:1.45,alpha:0,duration:220,onComplete:()=>handoff.destroy()});
    // The target keeps the first hit's recoil pose until this second blade lands.
    await this.wait(55);
    this.scene.sound.play('sword-swish', { volume: .78 });
    playHeroinePose(ally.sprite,'strike');
    // 斬擊方向：flipX 由攻擊者→目標方向決定（direction>0 = 攻擊者在左，揮向右需 flipX=true）；
    // 不再用 enemy 旗標硬綁，避免玩家改站左邊後斬擊方向反了。
    this.slash(target.root.x, target.root.y - 5, direction < 0);
    // 繼刀＝補刀，一律走 heavy 級的打擊反饋。
    this.playImpact('heavy');
    this.impactShake('heavy');
    this.hitFlash(target.sprite);
    await this.impactFreeze('heavy');
    await this.move(target.root, target.root.x + direction * 52, target.root.y, 85, 'Quad.easeOut');
    const defeated = onImpact?.() ?? false;
    if (defeated) {
      await Promise.all([
        this.move(target.root, target.root.x + direction * 18, target.root.y + 24, 150, 'Quad.easeIn'),
        new Promise<void>((resolve) => this.scene.tweens.add({ targets: target.root, angle: direction * 72, alpha: .5, duration: 150, ease: 'Quad.easeIn', onComplete: () => resolve() })),
      ]);
    } else {
      await this.move(target.root, target.x, target.y, 165, 'Back.easeOut');
      target.root.setAngle(0);
    }
    await this.wait(80);
    await this.move(ally.root, ally.x, ally.y, 230, 'Quad.easeInOut');
    playHeroinePose(source.sprite,'idle');playHeroinePose(ally.sprite,'idle');if(!defeated)playHeroinePose(target.sprite,'idle');
    source.root.setDepth(0); ally.root.setDepth(0); target.root.setDepth(0);
    this.resetCamera();
  }

  async dualRelay(playerSourceId:string,playerAllyId:string,enemySourceId:string,enemyAllyId:string,onEnemyImpact?:()=>boolean,onPlayerImpact?:()=>boolean){
    const ps=this.players.get(playerSourceId)!,pa=this.players.get(playerAllyId)!,es=this.enemies.get(enemySourceId)!,ea=this.enemies.get(enemyAllyId)!;
    const y=Phaser.Math.Clamp((ps.root.y+es.root.y)/2,205,345);
    await Promise.all([
      this.move(pa.root,674,y+22,180,'Cubic.easeIn'),this.move(ea.root,606,y-22,180,'Cubic.easeIn'),
      this.move(ps.root,690,y-22,150,'Quad.easeOut'),this.move(es.root,590,y+22,150,'Quad.easeOut'),
    ]);
    playHeroinePose(ps.sprite,'strike');playHeroinePose(pa.sprite,'strike');this.scene.sound.play('sword-swish',{volume:.85});this.slash(640,y-10,false);this.slash(640,y-10,true);
    this.playImpact('heavy');this.impactShake('break');this.hitFlash(ea.sprite);this.hitFlash(es.sprite);
    await this.impactFreeze('heavy');
    const enemyDefeated=onEnemyImpact?.()??false;
    const playerDefeated=onPlayerImpact?.()??false;
    await Promise.all([
      this.move(pa.root,pa.root.x+36,pa.root.y,80,'Back.easeOut'),this.move(ps.root,ps.root.x+26,ps.root.y,80,'Back.easeOut'),
      this.move(ea.root,ea.root.x-36,ea.root.y,80,'Back.easeOut'),this.move(es.root,es.root.x-26,es.root.y,80,'Back.easeOut'),
    ]);
    const returns=[this.move(pa.root,pa.x,pa.y,230),this.move(ea.root,ea.x,ea.y,230)];
    if(playerDefeated)returns.push(Promise.all([
      this.move(ps.root,ps.root.x+18,ps.root.y+24,150,'Quad.easeIn'),
      new Promise<void>(resolve=>this.scene.tweens.add({targets:ps.root,angle:72,alpha:.5,duration:150,ease:'Quad.easeIn',onComplete:()=>resolve()})),
    ]).then(()=>undefined));else returns.push(this.move(ps.root,ps.x,ps.y,230));
    if(enemyDefeated)returns.push(Promise.all([
      this.move(es.root,es.root.x-18,es.root.y+24,150,'Quad.easeIn'),
      new Promise<void>(resolve=>this.scene.tweens.add({targets:es.root,angle:-72,alpha:.5,duration:150,ease:'Quad.easeIn',onComplete:()=>resolve()})),
    ]).then(()=>undefined));else returns.push(this.move(es.root,es.x,es.y,230));
    await Promise.all(returns);if(!playerDefeated)playHeroinePose(ps.sprite,'idle');playHeroinePose(pa.sprite,'idle');this.resetCamera();
  }

  async cancel(actorId: string, enemy = false) {
    const actor = (enemy ? this.enemies : this.players).get(actorId)!;
    // 崩勢是最戲劇的鏡頭：拉近＋壓 timeScale＋vignette，破除舊 code 只 shake 幾下就過去的平淡感。
    this.focusCamera(actor.root.x,actor.root.y,1.38,220);
    const w=this.scene.cameras.main.width,h=this.scene.cameras.main.height;
    const vignette=this.scene.add.rectangle(w/2,h/2,w,h,0x120409,.55).setDepth(180).setScrollFactor(0);
    this.combatLayer.add(vignette);
    this.scene.tweens.add({targets:vignette,alpha:0,duration:640,ease:'Cubic.easeOut',onComplete:()=>vignette.destroy()});
    const label = this.scene.add.text(actor.root.x, Math.max(48, actor.root.y - 130), '崩勢\n殺意斷絕', { fontFamily: 'serif', fontSize: '21px', fontStyle: 'bold', align: 'center', color: '#fff', stroke:'#3a0713', strokeThickness:5, backgroundColor: '#8b2034', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(190).setScale(1.55);
    this.scene.tweens.add({targets:label,scale:1,duration:220,ease:'Back.easeOut'});
    const ring = this.scene.add.circle(actor.root.x, actor.root.y, 38, 0xff274d, .2).setStrokeStyle(5, 0xff637b).setDepth(80);
    this.scene.tweens.add({ targets: actor.root, x: actor.root.x + 9, duration: 40, yoyo: true, repeat: 6 });
    this.scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 420 });
    // 崩勢音效：低頻疊播模擬「架勢斷開」的空音。
    this.playImpact('break');
    this.scene.time.timeScale=.22;
    await this.realWait(180);
    this.scene.time.timeScale=1;
    await this.wait(300); label.destroy(); ring.destroy(); actor.root.x = actor.x;
    this.resetCamera();
  }

  async support(actorId: string, targetId: string, card: BattleCard) {
    const actor = this.players.get(actorId)!; const target = this.players.get(targetId)!;
    const badge = this.scene.add.text(actor.root.x, Math.max(40, actor.root.y - 132), card.name, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', align: 'center', color: '#fff', backgroundColor: '#376d59', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(70);
    if(actorId!==targetId)await this.move(actor.root, target.root.x - 75, target.root.y, 190, 'Back.easeOut');
    if(card.definitionId==='guard')this.cardImpact(target.root.x,target.root.y-12,'guard');
    else if(card.definitionId==='cover')this.cardImpact(target.root.x,target.root.y-12,'cover');
    else if(card.definitionId==='cycle')this.cardImpact(target.root.x,target.root.y-12,'cycle');
    this.scene.tweens.add({ targets: target.root, scale: 1.12, duration: 160, yoyo: true });
    await this.wait(260); badge.destroy(); if(actorId!==targetId)await this.move(actor.root, actor.x, actor.y);
  }
}

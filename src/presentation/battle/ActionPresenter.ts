import Phaser from 'phaser';
import type { BattleCard } from '../../core/cards/BattleCards';
import type { VisualActor } from './ClashPresenter';
import{playHeroinePose}from'./HeroinePose';

export class ActionPresenter {
  private cancelPresented=new Set<string>();
  constructor(private scene: Phaser.Scene, private players: Map<string, VisualActor>, private enemies: Map<string, VisualActor>, private combatLayer: Phaser.GameObjects.Container) {}

  private impactFreeze(kind:'quick'|'normal'|'heavy'|'break'|'clash',flash=true){
    const ms=kind==='quick'?68:kind==='normal'?88:kind==='heavy'?132:kind==='clash'?118:152;
    const flashAlpha=kind==='quick'?.28:kind==='normal'?.4:kind==='heavy'?.55:kind==='clash'?.42:.7;
    if(flash){const w=this.scene.cameras.main.width,h=this.scene.cameras.main.height;
      const overlay=this.scene.add.rectangle(w/2,h/2,w,h,0xffffff,flashAlpha).setDepth(200).setScrollFactor(0);
      this.combatLayer.add(overlay);
      this.scene.tweens.add({targets:overlay,alpha:0,duration:Math.max(90,ms+40),ease:'Cubic.easeOut',onComplete:()=>overlay.destroy()})}
    this.scene.time.timeScale=kind==='break'?.06:kind==='heavy'?.09:kind==='clash'?.12:kind==='quick'?.34:.2;
    return this.realWait(ms).finally(()=>{this.scene.time.timeScale=1})
  }

  private playImpact(kind:'quick'|'normal'|'heavy'|'break'|'clash'|'death'){
    const cfg={quick:{d:300,v:.72},normal:{d:0,v:.85},heavy:{d:-400,v:1},break:{d:-700,v:1},clash:{d:-200,v:.82},death:{d:-500,v:.92}}[kind];
    this.scene.sound.play('sword-impact',{volume:cfg.v,detune:cfg.d});
    if(kind==='break')this.scene.time.delayedCall(48,()=>this.scene.sound.play('sword-impact',{volume:.72,detune:-620}));
    if(kind==='clash')this.scene.time.delayedCall(28,()=>this.scene.sound.play('sword-impact',{volume:.55,rate:.55}));
    if(kind==='heavy')this.scene.time.delayedCall(60,()=>this.scene.sound.play('sword-impact',{volume:.5,detune:-800,rate:.65}));
  }

  private focusCamera(x:number,y:number,zoom=1.24,dur=180){
    this.scene.cameras.main.pan(x,y,dur,'Sine.easeInOut');
    this.scene.cameras.main.zoomTo(zoom,dur,'Sine.easeInOut');
  }

  private impactShake(kind:'quick'|'normal'|'heavy'|'break'){
    const cfg={quick:{d:92,a:.009},normal:{d:145,a:.014},heavy:{d:225,a:.023},break:{d:270,a:.028}}[kind];
    this.scene.cameras.main.shake(cfg.d,cfg.a);
  }

  // P11.4: neutral contact flash. Never recolour actor textures red.
  private hitFlash(sprite:Phaser.GameObjects.Sprite|undefined){
    if(!sprite)return;
    const prevAlpha=sprite.alpha;
    sprite.setAlpha(Math.min(prevAlpha,.62));
    this.scene.tweens.add({targets:sprite,alpha:prevAlpha,duration:110,ease:'Quad.easeOut'});
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

  triggerHitFlash(sprite:Phaser.GameObjects.Sprite|undefined){this.hitFlash(sprite)}
  private move(o: Phaser.GameObjects.Container, x: number, y: number, d = 210, ease = 'Quad.easeInOut') { return new Promise<void>((r) => this.scene.tweens.add({ targets: o, x, y, duration: d, ease, onComplete: () => r() })); }
  private wait(ms: number) { return new Promise<void>((r) => this.scene.time.delayedCall(ms, r)); }
  private realWait(ms:number){return new Promise<void>((resolve)=>globalThis.setTimeout(resolve,ms));}
  private spawnFxImage(key:string,x:number,y:number,depth:number,opts?:{scale?:number;rotation?:number;tint?:number;alpha?:number;flipX?:boolean;blendMode?:Phaser.BlendModes|string}){
    if(!this.scene.textures.exists(key))return;
    const img=this.scene.add.image(x,y,key).setDepth(depth).setAlpha(opts?.alpha??1).setScale(opts?.scale??1).setRotation(opts?.rotation??0).setFlipX(Boolean(opts?.flipX));
    if(typeof opts?.tint==='number')img.setTint(opts.tint);
    if(opts?.blendMode)img.setBlendMode(opts.blendMode);
    this.combatLayer.add(img);
    return img;
  }
  private impactBackdrop(kind:'quick'|'normal'|'heavy'|'break'|'clash',x:number,y:number){
    if(kind==='quick')return;
    const w=this.scene.cameras.main.width,h=this.scene.cameras.main.height;
    const alpha=kind==='normal'?.12:kind==='heavy'?.2:kind==='clash'?.16:.28;
    const overlay=this.scene.add.rectangle(w/2,h/2,w,h,0x020611,alpha).setDepth(98).setScrollFactor(0);
    this.combatLayer.add(overlay);
    const bloom=this.spawnFxImage('fx-p9-impact-bloom',x,y,118,{scale:kind==='break'?1.9:kind==='heavy'?1.55:1.22,alpha:kind==='break'?.9:.72,tint:kind==='break'?0xffd37f:0xffffff,blendMode:Phaser.BlendModes.ADD});
    if(bloom)this.scene.tweens.add({targets:bloom,scale:(bloom.scaleX||1)*(kind==='break'?1.42:1.26),alpha:0,duration:kind==='break'?220:180,ease:'Cubic.easeOut',onComplete:()=>bloom.destroy()});
    this.scene.tweens.add({targets:overlay,alpha:0,duration:kind==='break'?220:180,ease:'Quad.easeOut',onComplete:()=>overlay.destroy()});
  }
  private debrisBurst(x:number,y:number,color:number,direction:number,count=10,spread=84){
    for(let i=0;i<count;i++){
      const dy=(i-(count-1)/2)*(spread/Math.max(1,count-1));
      const shard=this.scene.add.rectangle(x,y,Phaser.Math.Between(16,34),Phaser.Math.Between(2,5),i%3===0?0xffffff:color,.9).setDepth(115).setRotation((-.6+Math.random()*1.2)+(direction>0?0:-Math.PI));
      this.combatLayer.add(shard);
      this.scene.tweens.add({targets:shard,x:x+direction*Phaser.Math.Between(70,170),y:y+dy,angle:shard.angle+direction*(.2+Math.random()*.55),alpha:0,scaleX:.45,scaleY:.72,duration:150+Math.random()*70,ease:'Cubic.easeOut',onComplete:()=>shard.destroy()});
    }
  }
  private slash(x:number,y:number,flipX:boolean,scale=1,color=0xf7fbff){
    const dir=flipX?-1:1;
    const generated=['fx-p9a-arc-slash-1','fx-p9a-arc-slash-2'];
    generated.forEach((key,i)=>this.scene.time.delayedCall(i*34,()=>{
      const img=this.spawnFxImage(key,x+dir*(i?24:-12),y+(i?8:-8),108+i,{scale:(.44+i*.08)*scale,alpha:i?.72:.94,tint:color,flipX:dir<0,blendMode:Phaser.BlendModes.ADD});
      if(img)this.scene.tweens.add({targets:img,scale:(img.scaleX||1)*(i?1.12:1.2),alpha:0,duration:i?205:165,ease:'Expo.easeOut',onComplete:()=>img.destroy()});
    }));
    ['fx-p9-arc-slash-2','fx-p9-arc-slash-3'].forEach((key,i)=>this.scene.time.delayedCall(20+i*20,()=>{
      const img=this.spawnFxImage(key,x+dir*i*10,y+i*2,111+i,{scale:(.78+i*.08)*scale,alpha:.7-i*.18,tint:color,flipX:dir<0,blendMode:Phaser.BlendModes.ADD});
      if(img)this.scene.tweens.add({targets:img,scale:(img.scaleX||1)*1.12,alpha:0,duration:150+i*18,ease:'Expo.easeOut',onComplete:()=>img.destroy()});
    }));
    const flash=this.scene.add.circle(x,y,26*scale,0xffffff,.94).setDepth(116);this.combatLayer.add(flash);
    this.scene.tweens.add({targets:flash,scale:4.3,alpha:0,duration:135,ease:'Cubic.easeOut',onComplete:()=>flash.destroy()});
  }
  private lineSlash(x:number,y:number,flipX:boolean,scale=1,color=0xffe0a8){
    const dir=flipX?-1:1;
    ['fx-p9a-line-slash-1','fx-p9a-line-slash-2'].forEach((key,i)=>this.scene.time.delayedCall(i*30,()=>{
      const img=this.spawnFxImage(key,x+dir*(i?26:-18),y+(i?10:-8),109+i,{scale:(.42+i*.05)*scale,alpha:i?.72:.96,tint:i===0?0xffffff:color,flipX:dir<0,rotation:(dir>0?-.08:.08),blendMode:Phaser.BlendModes.ADD});
      if(img)this.scene.tweens.add({targets:img,scaleX:(img.scaleX||1)*(i?1.14:1.24),alpha:0,duration:i?190:150,ease:'Expo.easeOut',onComplete:()=>img.destroy()});
    }));
    ['fx-p9-line-slash-2','fx-p9-line-slash-3'].forEach((key,i)=>this.scene.time.delayedCall(18+i*18,()=>{
      const img=this.spawnFxImage(key,x+dir*i*18,y-i*4,113+i,{scale:(.9+i*.07)*scale,alpha:.66-i*.16,tint:color,flipX:dir<0,rotation:(dir>0?-.08:.08),blendMode:Phaser.BlendModes.ADD});
      if(img)this.scene.tweens.add({targets:img,scaleX:(img.scaleX||1)*1.12,alpha:0,duration:142+i*20,ease:'Expo.easeOut',onComplete:()=>img.destroy()});
    }));
    const core=this.scene.add.circle(x,y,30*scale,0xffffff,.98).setDepth(118);this.combatLayer.add(core);
    this.scene.tweens.add({targets:core,scale:4.4,alpha:0,duration:125,ease:'Cubic.easeOut',onComplete:()=>core.destroy()});
  }
  private impactCameraPunch(kind:'quick'|'normal'|'heavy'|'break',x:number,y:number){
    const zoom=kind==='quick'?1.03:kind==='normal'?1.055:kind==='heavy'?1.095:1.13;
    const inMs=kind==='quick'?42:56;
    const outMs=kind==='quick'?110:kind==='normal'?140:kind==='heavy'?170:195;
    this.scene.cameras.main.pan(x,y,inMs,'Quad.easeOut');
    this.scene.cameras.main.zoomTo(zoom,inMs,'Quad.easeOut');
    this.scene.time.delayedCall(inMs+26,()=>{this.scene.cameras.main.pan(640,360,outMs,'Sine.easeOut');this.scene.cameras.main.zoomTo(1,outMs,'Sine.easeOut')});
  }
  private cardImpact(x:number,y:number,definitionId?:string,flip=false){
    const dir=flip?-1:1;
    const burstLines=(color:number,count:number,reach:number)=>{for(let i=0;i<count;i++){const a=-1.18+i*(2.36/Math.max(1,count-1)),ray=this.scene.add.rectangle(x,y,reach,3,color,.86).setOrigin(0,.5).setRotation(a).setDepth(106);this.combatLayer.add(ray);this.scene.tweens.add({targets:ray,scaleX:1.42,alpha:0,duration:180+i*10,ease:'Cubic.easeOut',onComplete:()=>ray.destroy()})}};
    if(definitionId==='break'){
      this.impactBackdrop('break',x,y);this.lineSlash(x,y,flip,1.62,0xffd36b);this.slash(x-dir*24,y-14,flip,1.12,0xfff0a8);burstLines(0xffd36b,13,124);this.debrisBurst(x,y,0xffc85c,dir,15,110);
      const crack=this.scene.add.rectangle(x,y+24,260,10,0xffc85c,.86).setDepth(105);this.combatLayer.add(crack);this.scene.tweens.add({targets:crack,scaleX:1.75,scaleY:.3,alpha:0,duration:280,ease:'Expo.easeOut',onComplete:()=>crack.destroy()});
    }else if(definitionId==='delay'){
      this.impactBackdrop('normal',x,y);const bars=[-34,0,34].map((dy,i)=>this.scene.add.rectangle(x-dir*26,y+dy,190-i*24,7,0x9cecff,.88).setDepth(104+i));this.combatLayer.add(bars);bars.forEach((b,i)=>this.scene.tweens.add({targets:b,x:b.x+dir*64,scaleX:.3,alpha:0,delay:i*18,duration:230,onComplete:()=>b.destroy()}));this.debrisBurst(x,y,0xbcefff,dir,8,70);
    }else if(definitionId==='heavy'){
      this.impactBackdrop('heavy',x,y);this.lineSlash(x,y,flip,1.84,0xffd8a0);burstLines(0xffd8a0,15,136);this.debrisBurst(x,y,0xffd8a0,dir,18,126);
      const shock=this.scene.add.rectangle(x,y+42,320,12,0xffd8a0,.76).setDepth(101);this.combatLayer.add(shock);this.scene.tweens.add({targets:shock,scaleX:1.8,scaleY:.22,alpha:0,duration:300,ease:'Expo.easeOut',onComplete:()=>shock.destroy()});
    }else if(definitionId==='quick'){
      this.slash(x-14,y-10,flip,1.18,0x9fe8ff);this.scene.time.delayedCall(34,()=>this.slash(x+14,y+8,!flip,1.04,0x67cfff));this.debrisBurst(x,y,0x7fdfff,dir,6,56);
    }else if(definitionId==='guard'){
      const shield=this.scene.add.ellipse(x,y,142,174,0x7dd9ff,.12).setStrokeStyle(8,0xc6f4ff,.95).setDepth(101);this.combatLayer.add(shield);this.scene.tweens.add({targets:shield,scale:.68,alpha:0,duration:350,onComplete:()=>shield.destroy()});
    }else if(definitionId==='cover'){
      const intercept=this.scene.add.triangle(x,y-24,0,86,50,0,100,86,0x8eeeff,.74).setStrokeStyle(5,0xe6fbff,.95).setDepth(102);this.combatLayer.add(intercept);this.scene.tweens.add({targets:intercept,y:y-74,scale:1.28,alpha:0,duration:280,onComplete:()=>intercept.destroy()});
    }else if(definitionId==='relay'){
      this.impactBackdrop('heavy',x,y);this.slash(x,y,flip,1.28,0xffd56f);this.lineSlash(x+dir*18,y-8,flip,1.08,0xffe2a0);this.debrisBurst(x,y,0xffd56f,dir,10,92);
      const handoff=this.scene.add.rectangle(x-dir*96,y+28,220,6,0xffd56f,.84).setDepth(103);this.combatLayer.add(handoff);this.scene.tweens.add({targets:handoff,x:handoff.x+dir*110,scaleX:1.42,alpha:0,duration:220,onComplete:()=>handoff.destroy()});
    }else if(definitionId==='cycle'){
      for(let i=0;i<3;i++){const ring=this.scene.add.ellipse(x,y,78+i*24,46+i*14,0x8fe6c0,.05).setStrokeStyle(4,0xb9ffe3,.88-i*.16).setDepth(101+i);this.combatLayer.add(ring);this.scene.tweens.add({targets:ring,scale:1.65,alpha:0,delay:i*45,duration:360,onComplete:()=>ring.destroy()})}
    }else{
      this.impactBackdrop('normal',x,y);this.slash(x,y,flip,1.08,0xf7fbff);this.debrisBurst(x,y,0xd8f2ff,dir,8,68);
    }
  }
  private resetCamera() { this.scene.cameras.main.pan(640, 360, 250, 'Sine.easeInOut'); this.scene.cameras.main.zoomTo(1, 250, 'Sine.easeInOut'); }

  async attack(actorId: string, targetId: string, card: { name: string; clashPower: number; definitionId?: string }, enemy = false, mode: 'normal' | 'flank' = 'normal', returnToSlot = true, onImpact?: () => boolean) {
    const attacker = (enemy ? this.enemies : this.players).get(actorId)!;
    const target = (enemy ? this.players : this.enemies).get(targetId)!;
    const direction = attacker.root.x < target.root.x ? 1 : -1;
    const badgeY = Math.max(40, attacker.root.y - 132);
    const isChikage=!enemy&&actorId==='PB',isOboro=!enemy&&actorId==='PC';
    const techniqueColor=isChikage?'#5b4520':isOboro?'#33245c':enemy?'#713142':'#155268';
    const badge = this.scene.add.text(attacker.root.x, badgeY, `${card.name}\n威力 ${card.clashPower}`, { fontFamily: (isChikage||isOboro)?'serif':'sans-serif', fontSize: (isChikage||isOboro)?'18px':'16px', fontStyle: 'bold', align: 'center', color: '#fff', stroke:(isChikage||isOboro)?'#0a0810':undefined,strokeThickness:(isChikage||isOboro)?4:0, backgroundColor: techniqueColor, padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(70).setAlpha((isChikage||isOboro) ? .15 : 1);
    if(isChikage||isOboro)this.scene.tweens.add({targets:badge,alpha:1,y:badgeY-8,duration:120,ease:'Back.easeOut'});
    const anticipation=isChikage?128:isOboro?58:100;
    const dashDuration=isChikage?168:isOboro?92:150;
    const retreat=isChikage?54:isOboro?30:42;
    playHeroinePose(attacker.sprite,'ready');
    await this.move(attacker.root, attacker.root.x - direction * retreat, attacker.root.y, anticipation, 'Quad.easeOut');
    this.techniqueWindup(actorId,attacker,direction,card.definitionId);
    this.scene.sound.play('sword-swish', { volume: isOboro ? .82 : isChikage ? .74 : .7, rate: isOboro ? 1.18 : isChikage ? .9 : 1 });
    const baseContact=isChikage?78:isOboro?44:58;
    const contactX = mode === 'flank' ? target.root.x + direction * Math.max(54,baseContact) : target.root.x - direction * baseContact;
    playHeroinePose(attacker.sprite,'strike','a');
    if(isChikage&&attacker.sprite)this.scene.tweens.add({targets:attacker.sprite,angle:direction*6,duration:dashDuration,ease:'Cubic.easeIn'});
    if(isOboro&&attacker.sprite)this.scene.tweens.add({targets:attacker.sprite,angle:-direction*8,duration:dashDuration,ease:'Expo.easeIn'});
    if(isOboro){this.spawnAfterimage(attacker,direction,0x9988ff,20,.28);this.spawnAfterimage(attacker,direction,0x5e4a98,42,.18)}
    await this.move(attacker.root, contactX, target.root.y, dashDuration, isOboro?'Expo.easeIn':'Cubic.easeIn');
    playHeroinePose(attacker.sprite,'strike','b');
    if (mode === 'flank') badge.setText(`${card.name}\n側襲`);
    const impactKind:'quick'|'normal'|'heavy'|'break'=card.definitionId==='heavy'?'heavy':card.definitionId==='break'?'break':card.definitionId==='quick'?'quick':'normal';
    this.techniqueImpact(actorId,target.root.x,target.root.y-5,direction,card.definitionId);
    this.cardImpact(target.root.x,target.root.y-5,card.definitionId,direction < 0);
    this.playImpact(impactKind);
    this.impactShake(impactKind);
    this.impactCameraPunch(impactKind,target.root.x,target.root.y-8);
    playHeroinePose(target.sprite,'hit','a');
    this.hitFlash(target.sprite);
    if(impactKind!=='quick')await this.impactFreeze(impactKind);
    await this.move(target.root, target.root.x + direction * (impactKind==='heavy'||impactKind==='break'?56:34), target.root.y, impactKind==='quick'?62:78, 'Quad.easeOut');
    playHeroinePose(target.sprite,'hit','b');
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
    await this.wait(55);
    this.scene.sound.play('sword-swish', { volume: .78 });
    playHeroinePose(ally.sprite,'ready');
    await this.wait(38);
    playHeroinePose(ally.sprite,'strike','a');
    await this.wait(42);
    playHeroinePose(ally.sprite,'strike','b');
    this.slash(target.root.x, target.root.y - 5, direction < 0,1.12);
    this.playImpact('heavy');
    this.impactShake('heavy');
    this.impactCameraPunch('heavy',target.root.x,target.root.y-8);
    playHeroinePose(target.sprite,'hit','a');
    this.hitFlash(target.sprite);
    await this.impactFreeze('heavy');
    await this.move(target.root, target.root.x + direction * 58, target.root.y, 90, 'Quad.easeOut');
    playHeroinePose(target.sprite,'hit','b');
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
    playHeroinePose(ps.sprite,'ready');playHeroinePose(pa.sprite,'ready');await this.wait(38);playHeroinePose(ps.sprite,'strike','a');playHeroinePose(pa.sprite,'strike','a');this.scene.sound.play('sword-swish',{volume:.85});await this.wait(36);playHeroinePose(ps.sprite,'strike','b');playHeroinePose(pa.sprite,'strike','b');this.slash(640,y-10,false,1.1);this.slash(640,y-10,true,1.1);
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
    const key=`${enemy?'E':'P'}:${actorId}`;
    if(this.cancelPresented.has(key))return;
    const actor = (enemy ? this.enemies : this.players).get(actorId);
    if(!actor)return;
    // Scene-level dedupe: one collapse prompt per actor even if two resolution paths race.
    const existing=this.scene.children.list.find(child=>child instanceof Phaser.GameObjects.Text&&child.getData('collapsePromptActor')===key);
    if(existing)return;
    this.cancelPresented.add(key);
    this.focusCamera(actor.root.x,actor.root.y,1.38,220);
    const w=this.scene.cameras.main.width,h=this.scene.cameras.main.height;
    const vignette=this.scene.add.rectangle(w/2,h/2,w,h,0x120409,.55).setDepth(180).setScrollFactor(0);
    this.combatLayer.add(vignette);
    this.scene.tweens.add({targets:vignette,alpha:0,duration:640,ease:'Cubic.easeOut',onComplete:()=>vignette.destroy()});
    const label = this.scene.add.text(actor.root.x, Math.max(48, actor.root.y - 130), '崩勢\n殺意斷絕', { fontFamily: 'serif', fontSize: '21px', fontStyle: 'bold', align: 'center', color: '#fff', stroke:'#3a0713', strokeThickness:5, backgroundColor: '#8b2034', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(190).setScale(1.55).setData('collapsePromptActor',key);
    this.combatLayer.add(label);
    this.scene.tweens.add({targets:label,scale:1,duration:220,ease:'Back.easeOut'});
    const ring = this.scene.add.circle(actor.root.x, actor.root.y, 38, 0xff274d, .2).setStrokeStyle(5, 0xff637b).setDepth(80);
    this.combatLayer.add(ring);
    this.scene.tweens.add({ targets: actor.root, x: actor.root.x + 9, duration: 40, yoyo: true, repeat: 6 });
    this.scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 420 });
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

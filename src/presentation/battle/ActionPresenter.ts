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
    return new Promise<void>(r=>this.scene.time.delayedCall(ms,()=>{this.scene.time.timeScale=1;r()}))
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

  // 供 BootScene 從外部觸發（例如 onImpact callback 內），因為 damage() 在 BootScene 裡。
  triggerHitFlash(sprite:Phaser.GameObjects.Sprite|undefined){this.hitFlash(sprite)}
  private move(o: Phaser.GameObjects.Container, x: number, y: number, d = 210, ease = 'Quad.easeInOut') { return new Promise<void>((r) => this.scene.tweens.add({ targets: o, x, y, duration: d, ease, onComplete: () => r() })); }
  private wait(ms: number) { return new Promise<void>((r) => this.scene.time.delayedCall(ms, r)); }
  private slash(x: number, y: number, flipX: boolean) { const fx = this.scene.add.sprite(x, y, 'slash-cc0').setDepth(100).setScale(.56).setFlipX(flipX).setAlpha(0); this.combatLayer.add(fx); fx.play('slash-cc0'); this.scene.tweens.add({ targets: fx, alpha: 1, duration: 55, yoyo: true, hold: 115, onComplete: () => fx.destroy() }); }
  private bladeArc(x:number,y:number,color:number=0xffe8b0,flip=false){const g=this.scene.add.graphics().setDepth(103);g.lineStyle(10,color,.88);g.beginPath();g.arc(x,y,48,flip?Math.PI*.12:Math.PI*.88,flip?Math.PI*.88:Math.PI*1.88,false);g.strokePath();g.lineStyle(3,0xffffff,.98);g.beginPath();g.arc(x,y,48,flip?Math.PI*.2:Math.PI*.96,flip?Math.PI*.8:Math.PI*1.84,false);g.strokePath();this.combatLayer.add(g);const flash=this.scene.add.circle(x,y,10,0xffffff,.95).setDepth(104);this.combatLayer.add(flash);this.scene.tweens.add({targets:[g,flash],alpha:0,scale:1.5,duration:180,ease:'Cubic.easeOut',onComplete:()=>{g.destroy();flash.destroy()}});for(let i=0;i<6;i++){const shard=this.scene.add.rectangle(x,y,16,3,0xffffff,.9).setDepth(104).setRotation((i-3)*.45);this.combatLayer.add(shard);this.scene.tweens.add({targets:shard,x:x+(i-3)*18,y:y+(i%2?1:-1)*(18+i*5),alpha:0,duration:180,onComplete:()=>shard.destroy()})}}
  private cardImpact(x:number,y:number,definitionId?:string){
    if(definitionId==='break'){for(let i=0;i<5;i++){const shard=this.scene.add.rectangle(x,y,14+i*2,3,0xffd36b,1).setRotation(-.8+i*.35).setDepth(102);this.combatLayer.add(shard);this.scene.tweens.add({targets:shard,x:x-42+i*21,y:y-30+(i%2)*34,angle:70-i*25,alpha:0,duration:290,onComplete:()=>shard.destroy()})}}
    else if(definitionId==='delay'){const ring=this.scene.add.ellipse(x,y,52,84,0x6fb8d5,.08).setStrokeStyle(3,0x9cecff,.9).setDepth(101);this.combatLayer.add(ring);this.scene.tweens.add({targets:ring,scaleX:1.7,scaleY:.65,alpha:0,duration:330,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()})}
    else if(definitionId==='heavy'){this.bladeArc(x,y,0xffd8a0);const shock=this.scene.add.rectangle(x,y+28,124,5,0xffd8a0,.8).setDepth(101);this.combatLayer.add(shock);this.scene.tweens.add({targets:shock,scaleX:1.8,alpha:0,duration:260,onComplete:()=>shock.destroy()})}
    else if(definitionId==='quick'){this.bladeArc(x,y,0x9fe8ff);this.bladeArc(x+10,y-8,0x67cfff,true)}
    else if(definitionId==='guard'){const shield=this.scene.add.ellipse(x,y,72,92,0x7dd9ff,.12).setStrokeStyle(4,0xc6f4ff,.95).setDepth(101);this.combatLayer.add(shield);this.scene.tweens.add({targets:shield,scale:.72,alpha:0,duration:300,onComplete:()=>shield.destroy()})}
    else if(definitionId==='cover'){const intercept=this.scene.add.triangle(x,y-18,0,44,24,0,48,44,0x8eeeff,.85).setDepth(102);this.combatLayer.add(intercept);this.scene.tweens.add({targets:intercept,y:y-48,alpha:0,duration:240,onComplete:()=>intercept.destroy()})}
    else if(definitionId==='cycle'){const ring=this.scene.add.circle(x,y,28,0x8fe6c0,.14).setStrokeStyle(3,0xb9ffe3,.9).setDepth(101);this.combatLayer.add(ring);this.scene.tweens.add({targets:ring,scale:1.6,alpha:0,duration:320,onComplete:()=>ring.destroy()})}
  }
  private resetCamera() { this.scene.cameras.main.pan(640, 360, 250, 'Sine.easeInOut'); this.scene.cameras.main.zoomTo(1, 250, 'Sine.easeInOut'); }

  async attack(actorId: string, targetId: string, card: { name: string; clashPower: number; definitionId?: string }, enemy = false, mode: 'normal' | 'flank' = 'normal', returnToSlot = true, onImpact?: () => boolean) {
    const attacker = (enemy ? this.enemies : this.players).get(actorId)!;
    const target = (enemy ? this.players : this.enemies).get(targetId)!;
    const direction = attacker.root.x < target.root.x ? 1 : -1;
    // 卡片資訊往上抬到 -132 避免蓋到怪物母版尺寸的頭部；若 y 太靠近上邊界則吸回 40。
    const badgeY = Math.max(40, attacker.root.y - 132);
    const badge = this.scene.add.text(attacker.root.x, badgeY, `${card.name}\n威力 ${card.clashPower}`, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', align: 'center', color: '#fff', backgroundColor: enemy ? '#713142' : '#155268', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(70);
    await this.move(attacker.root, attacker.root.x - direction * 42, attacker.root.y, 100, 'Quad.easeOut');
    this.scene.sound.play('sword-swish', { volume: .7 });
    const contactX = mode === 'flank' ? target.root.x + direction * 62 : target.root.x - direction * 58;
    playHeroinePose(attacker.sprite,'strike');
    await this.move(attacker.root, contactX, target.root.y, 150, 'Cubic.easeIn');
    if (mode === 'flank') badge.setText(`${card.name}\n側襲`);
    // 斬擊方向：flipX 由攻擊者→目標方向決定（direction>0 = 攻擊者在左，揮向右需 flipX=true）；
    // 不再用 enemy 旗標硬綁，避免玩家改站左邊後斬擊方向反了。
    // 依卡型決定打擊重量：heavy/break 有 hit-stop + 白閃 + 大 shake，quick 較輕。
    const impactKind:'quick'|'normal'|'heavy'|'break'=card.definitionId==='heavy'?'heavy':card.definitionId==='break'?'break':card.definitionId==='quick'?'quick':'normal';
    // 更正：classic-slash-sheet 的 crescent 朝向與先前假設相反——base 為左向揮擊，
    // flipX=true 才是「揮向左」。因此攻擊者在**右邊**（direction<0）才要 flipX=true。
    // 玩家在左攻擊右 → direction=+1 → flipX=false；敵人在右攻擊左 → direction=-1 → flipX=true。
    this.slash(target.root.x, target.root.y - 5, direction < 0);
    this.cardImpact(target.root.x,target.root.y-5,card.definitionId);
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
    if (returnToSlot) await this.move(attacker.root, attacker.x, attacker.y, 240);
    playHeroinePose(attacker.sprite,'idle');if(!defeated)playHeroinePose(target.sprite,'idle');
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
    const handoff=this.scene.add.rectangle((source.root.x+ally.root.x)/2,target.root.y-14,96,3,0xffd56f,.85).setDepth(103).setRotation(-.12*direction);this.combatLayer.add(handoff);this.bladeArc(target.root.x,target.root.y-8,0xffd56f,direction<0);this.scene.tweens.add({targets:handoff,scaleX:1.45,alpha:0,duration:220,onComplete:()=>handoff.destroy()});
    // The target keeps the first hit's recoil pose until this second blade lands.
    await this.wait(55);
    this.scene.sound.play('sword-swish', { volume: .78 });
    playHeroinePose(ally.sprite,'strike');
    // 斬擊方向：flipX 由攻擊者→目標方向決定（direction>0 = 攻擊者在左，揮向右需 flipX=true）；
    // 不再用 enemy 旗標硬綁，避免玩家改站左邊後斬擊方向反了。
    // 更正：classic-slash-sheet 的 crescent 朝向與先前假設相反——base 為左向揮擊，
    // flipX=true 才是「揮向左」。因此攻擊者在**右邊**（direction<0）才要 flipX=true。
    // 玩家在左攻擊右 → direction=+1 → flipX=false；敵人在右攻擊左 → direction=-1 → flipX=true。
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
    await this.wait(180);
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

import Phaser from 'phaser';
import type { ClashPair,EnemyArchetype } from '../../core/battle/BattleTypes';
import{CombatResultFxPresenter}from'./CombatResultFxPresenter';
import{playHeroinePose}from'./HeroinePose';

export interface VisualActor {
  root: Phaser.GameObjects.Container;
  x: number;
  y: number;
  sprite?: Phaser.GameObjects.Sprite;
  archetype?: EnemyArchetype;
}

export class ClashPresenter {
  private resultFx:CombatResultFxPresenter;
  constructor(
    private scene: Phaser.Scene,
    private players: Map<string, VisualActor>,
    private enemies: Map<string, VisualActor>,
    private combatLayer: Phaser.GameObjects.Container,
  ) {this.resultFx=new CombatResultFxPresenter(scene,combatLayer)}

  private move(target: Phaser.GameObjects.Container, x: number, y: number, duration = 220, ease = 'Quad.easeInOut') {
    return new Promise<void>((resolve) => this.scene.tweens.add({ targets: target, x, y, duration, ease, onComplete: () => resolve() }));
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => this.scene.time.delayedCall(ms, resolve));
  }

  private realWait(ms:number){
    return new Promise<void>((resolve)=>globalThis.setTimeout(resolve,ms));
  }

  private createClashLock(player:VisualActor,enemy:VisualActor,x:number,y:number){
    const lock=this.scene.add.container().setDepth(96);
    const playerLine=this.scene.add.graphics();
    playerLine.lineStyle(7,0x56ddea,.11).lineBetween(player.root.x+26,player.root.y,x,y);
    playerLine.lineStyle(2,0xcafcff,.88).lineBetween(player.root.x+26,player.root.y,x,y);
    const enemyLine=this.scene.add.graphics();
    enemyLine.lineStyle(8,0x7f1830,.16).lineBetween(enemy.root.x-26,enemy.root.y,x,y);
    enemyLine.lineStyle(2,0xff5a73,.9).lineBetween(enemy.root.x-26,enemy.root.y,x,y);
    const ring=this.scene.add.circle(x,y,15,0xffd66d,.06).setStrokeStyle(2,0xffe8a0,.92);
    const core=this.scene.add.circle(x,y,3,0xffffff,.98);
    lock.add([playerLine,enemyLine,ring,core]);
    this.combatLayer.add(lock);
    this.scene.tweens.add({targets:ring,scale:1.75,alpha:0,duration:440,repeat:-1,ease:'Cubic.easeOut'});
    this.scene.tweens.add({targets:core,scale:1.55,alpha:.3,duration:220,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.scene.tweens.add({targets:[playerLine,enemyLine],alpha:{from:.55,to:1},duration:190,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    return lock
  }

  private impactCross(x:number,y:number,color=0xfff1ba){
    const cross=this.spawnFxImage('fx-p9-clash-cross',x,y,114,{scale:.78,alpha:.98,tint:color,blendMode:Phaser.BlendModes.ADD});
    const a=this.scene.add.rectangle(x,y,146,8,color,.94).setRotation(-.66).setDepth(112);
    const b=this.scene.add.rectangle(x,y,122,5,0xffffff,.98).setRotation(.72).setDepth(113);
    const core=this.scene.add.circle(x,y,20,0xffffff,.9).setDepth(114);
    this.combatLayer.add([a,b,core]);
    this.scene.tweens.add({targets:[a,b],scaleX:1.7,alpha:0,duration:180,ease:'Cubic.easeOut'});
    if(cross)this.scene.tweens.add({targets:cross,scale:1.18,alpha:0,duration:170,ease:'Cubic.easeOut',onComplete:()=>cross.destroy()});
    this.scene.tweens.add({targets:core,scale:2.5,alpha:0,duration:150,ease:'Quad.easeOut',onComplete:()=>{a.destroy();b.destroy();core.destroy()}})
  }

  private sound(key: string, volume: number) {
    this.scene.sound.play(key, { volume });
  }

  private playImpact(kind:'clash'|'heavy'|'break'|'death'){
    const cfg={clash:{d:-200,v:.82},heavy:{d:-400,v:1},break:{d:-700,v:1},death:{d:-500,v:.92}}[kind];
    this.scene.sound.play('sword-impact',{volume:cfg.v,detune:cfg.d});
    if(kind==='clash')this.scene.time.delayedCall(28,()=>this.scene.sound.play('sword-impact',{volume:.55,rate:.55}));
    if(kind==='heavy')this.scene.time.delayedCall(60,()=>this.scene.sound.play('sword-impact',{volume:.5,detune:-800,rate:.65}));
    if(kind==='break')this.scene.time.delayedCall(48,()=>this.scene.sound.play('sword-impact',{volume:.72,detune:-620}));
  }

  private async impactFreeze(kind:'clash'|'heavy'|'break'){
    const ms=kind==='clash'?120:kind==='heavy'?132:152;
    const flashAlpha=kind==='clash'?.42:kind==='heavy'?.55:.7;
    const w=this.scene.cameras.main.width,h=this.scene.cameras.main.height;
    const overlay=this.scene.add.rectangle(w/2,h/2,w,h,0xffffff,flashAlpha).setDepth(200).setScrollFactor(0);
    this.combatLayer.add(overlay);
    this.scene.tweens.add({targets:overlay,alpha:0,duration:Math.max(90,ms+40),ease:'Cubic.easeOut',onComplete:()=>overlay.destroy()});
    this.scene.time.timeScale=kind==='break'?.06:kind==='heavy'?.09:.12;
    await this.realWait(ms);
    this.scene.time.timeScale=1;
  }

  private hitFlash(sprite?:Phaser.GameObjects.Sprite){
    if(!sprite)return;const prevAlpha=sprite.alpha;sprite.setAlpha(Math.min(prevAlpha,.62));
    this.scene.tweens.add({targets:sprite,alpha:prevAlpha,duration:110,ease:'Quad.easeOut'});
  }

  private spawnFxImage(key:string,x:number,y:number,depth:number,opts?:{scale?:number;rotation?:number;tint?:number;alpha?:number;flipX?:boolean;blendMode?:Phaser.BlendModes|string}){
    if(!this.scene.textures.exists(key))return;
    const img=this.scene.add.image(x,y,key).setDepth(depth).setAlpha(opts?.alpha??1).setScale(opts?.scale??1).setRotation(opts?.rotation??0).setFlipX(Boolean(opts?.flipX));
    if(typeof opts?.tint==='number')img.setTint(opts.tint);
    if(opts?.blendMode)img.setBlendMode(opts.blendMode);
    this.combatLayer.add(img);
    return img;
  }
  private impactBackdrop(kind:'clash'|'heavy'|'break',x:number,y:number){
    const w=this.scene.cameras.main.width,h=this.scene.cameras.main.height;
    const alpha=kind==='clash'?.16:kind==='heavy'?.22:.28;
    const overlay=this.scene.add.rectangle(w/2,h/2,w,h,0x020611,alpha).setDepth(97).setScrollFactor(0);
    this.combatLayer.add(overlay);
    const bloom=this.spawnFxImage('fx-p9-impact-bloom',x,y,118,{scale:kind==='break'?1.95:kind==='heavy'?1.55:1.3,alpha:kind==='break'?.95:.8,tint:kind==='break'?0xffd681:0xffffff,blendMode:Phaser.BlendModes.ADD});
    if(bloom)this.scene.tweens.add({targets:bloom,scale:(bloom.scaleX||1)*(kind==='break'?1.38:1.24),alpha:0,duration:kind==='break'?220:180,ease:'Cubic.easeOut',onComplete:()=>bloom.destroy()});
    this.scene.tweens.add({targets:overlay,alpha:0,duration:kind==='break'?220:180,ease:'Quad.easeOut',onComplete:()=>overlay.destroy()});
  }
  private slash(x:number,y:number,flipX:boolean,scale=1,color=0xffffff){
    const dir=flipX?-1:1;
    ['fx-p9a-arc-slash-1','fx-p9a-arc-slash-2'].forEach((key,i)=>this.scene.time.delayedCall(i*28,()=>{
      const img=this.spawnFxImage(key,x+dir*(i?18:-8),y+(i?7:-7),108+i,{scale:(.4+i*.06)*scale,alpha:i?.7:.92,tint:color,flipX:dir<0,blendMode:Phaser.BlendModes.ADD});
      if(img)this.scene.tweens.add({targets:img,scale:(img.scaleX||1)*1.16,alpha:0,duration:155+i*30,ease:'Expo.easeOut',onComplete:()=>img.destroy()});
    }));
    const edge=this.spawnFxImage('fx-p9-arc-slash-3',x,y,112,{scale:.82*scale,alpha:.62,tint:color,flipX:dir<0,blendMode:Phaser.BlendModes.ADD});
    if(edge)this.scene.tweens.add({targets:edge,scale:(edge.scaleX||1)*1.1,alpha:0,duration:165,ease:'Expo.easeOut',onComplete:()=>edge.destroy()});
  }
  private lineSlash(x:number,y:number,flipX:boolean,scale=1,color=0xffe0a8){
    const dir=flipX?-1:1;
    ['fx-p9-line-slash-1','fx-p9-line-slash-2','fx-p9-line-slash-3'].forEach((key,i)=>{
      this.scene.time.delayedCall(i*14,()=>{
        const line=this.spawnFxImage(key,x+dir*i*16,y-i*3,113+i,{scale:(.72+i*.06)*scale,alpha:.94-i*.16,tint:i===0?0xffffff:color,flipX:dir<0,rotation:(dir>0?-.08:.08),blendMode:Phaser.BlendModes.ADD});
        if(line)this.scene.tweens.add({targets:line,scaleX:(line.scaleX||1)*1.1,alpha:0,duration:126+i*18,ease:'Expo.easeOut',onComplete:()=>line.destroy()});
      });
    });
    const core=this.scene.add.circle(x,y,24*scale,0xffffff,.96).setDepth(118);this.combatLayer.add(core);
    this.scene.tweens.add({targets:core,scale:3.6,alpha:0,duration:120,ease:'Cubic.easeOut',onComplete:()=>core.destroy()});
  }

  private enemySlash(x:number,y:number,flipX:boolean,scale=1,color=0xff86a9){
    const dir=flipX?-1:1;
    ['fx-p10-enemy-arc-slash-1','fx-p10-enemy-arc-slash-2'].forEach((key,i)=>this.scene.time.delayedCall(i*24,()=>{
      const img=this.spawnFxImage(key,x+dir*(i?18:-10),y+(i?8:-7),109+i,{scale:(.72+i*.08)*scale,alpha:i?.74:.96,tint:color,flipX:dir<0,blendMode:Phaser.BlendModes.ADD});
      if(img)this.scene.tweens.add({targets:img,scale:(img.scaleX||1)*1.14,alpha:0,duration:162+i*26,ease:'Expo.easeOut',onComplete:()=>img.destroy()});
    }));
  }
  private enemySignatureSlash(actor:VisualActor,x:number,y:number,flip=false,scale=1){
    const archetype=actor.archetype;if(!archetype)return;
    const key=`fx-p11-enemy-${archetype}`;if(!this.scene.textures.exists(key))return;
    const img=this.spawnFxImage(key,x,y,111,{scale:.42*scale,alpha:.9,flipX:flip,blendMode:Phaser.BlendModes.ADD});
    if(img)this.scene.tweens.add({targets:img,scale:(img.scaleX||1)*1.12,alpha:0,duration:210,ease:'Expo.easeOut',onComplete:()=>img.destroy()});
  }
  private bladeCut(x:number,y:number,flip=false,color=0xfff3c4,enemySide=false){
    const dir=flip?-1:1;
    if(enemySide)this.enemySlash(x,y,flip,1.12,color);else this.slash(x,y,flip,1.12,color);
    (enemySide ? ['fx-p10-enemy-line-slash-1','fx-p10-enemy-line-slash-2'] : ['fx-p9-line-slash-1','fx-p9-line-slash-2','fx-p9-line-slash-3']).forEach((key,i)=>{
      this.scene.time.delayedCall(i*14,()=>{
        const line=this.spawnFxImage(key,x+dir*i*16,y-i*3,113+i,{scale:.7+i*.06,alpha:.92-i*.16,tint:i===0?0xffffff:color,flipX:dir<0,rotation:(dir>0?-.08:.08),blendMode:Phaser.BlendModes.ADD});
        if(line)this.scene.tweens.add({targets:line,scaleX:(line.scaleX||1)*1.08,alpha:0,duration:126+i*18,ease:'Expo.easeOut',onComplete:()=>line.destroy()});
      });
    });
    for(let i=0;i<10;i++){const shard=this.scene.add.rectangle(x,y,26,3,i%2?0xffffff:color,.92).setDepth(114).setRotation((i-5)*.34);this.combatLayer.add(shard);this.scene.tweens.add({targets:shard,x:x+dir*(28+i*9),y:y+(i%2?1:-1)*(26+i*4),alpha:0,duration:180+i*4,onComplete:()=>shard.destroy()})}
  }
  private playerTechniqueAccent(actorId:string,x:number,y:number,flip:boolean){
    if(actorId==='PB'){
      this.lineSlash(x,y,flip,1.22,0xe6c56f);
    }else if(actorId==='PC'){
      for(let i=0;i<2;i++){const cut=this.scene.add.rectangle(x,y-8,132-i*22,i?3:8,i?0xffffff:0x9f8cff,.92).setRotation((i?-.78:.72)*(flip?-1:1)).setDepth(116+i);this.combatLayer.add(cut);this.scene.tweens.add({targets:cut,scaleX:1.3,alpha:0,duration:150+i*35,onComplete:()=>cut.destroy()})}
    }
  }

  private focusCamera(x: number, y: number, zoom = 1.14, duration = 190) {
    this.scene.cameras.main.pan(x, y, duration, 'Sine.easeInOut');
    this.scene.cameras.main.zoomTo(zoom, duration, 'Sine.easeInOut');
  }

  private resetCamera() {
    this.scene.cameras.main.pan(640, 360, 250, 'Sine.easeInOut');
    this.scene.cameras.main.zoomTo(1, 250, 'Sine.easeInOut');
  }

  private burst(x: number, y: number, color: number, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const shard = this.scene.add.rectangle(x, y, 18, 4, color, 1).setRotation(angle).setDepth(105); this.combatLayer.add(shard);
      this.scene.tweens.add({ targets: shard, x: x + Math.cos(angle) * 75, y: y + Math.sin(angle) * 48, alpha: 0, scaleX: .25, duration: 260, ease: 'Quad.easeOut', onComplete: () => shard.destroy() });
    }
  }

  private async weaponStagger(actor:VisualActor,direction:number){
    const x=actor.root.x,y=actor.root.y-10;
    const guard=this.scene.add.ellipse(x,y,54,82,0xffffff,.04).setStrokeStyle(3,0xd9edf2,.9).setDepth(98);this.combatLayer.add(guard);
    this.scene.tweens.add({targets:guard,scaleX:1.45,scaleY:.72,alpha:0,duration:230,ease:'Cubic.easeOut',onComplete:()=>guard.destroy()});
    for(let i=0;i<5;i++){
      const shard=this.scene.add.rectangle(x,y-18+i*9,13,3,0xd9edf2,1).setRotation(-.7+i*.3).setDepth(102);this.combatLayer.add(shard);
      this.scene.tweens.add({targets:shard,x:x+direction*(34+i*7),y:y-34+i*17,angle:direction*55,alpha:0,duration:260,onComplete:()=>shard.destroy()})
    }
    await Promise.all([
      this.move(actor.root,actor.root.x+direction*24,actor.root.y,85,'Back.easeOut'),
      new Promise<void>(resolve=>this.scene.tweens.add({targets:actor.root,angle:direction*7,duration:85,ease:'Back.easeOut',onComplete:()=>resolve()})),
    ]);
    await this.wait(150)
  }

  private async recoil(actor: VisualActor, direction: number) {
    const start = actor.root.x;
    await this.move(actor.root, start + direction * 34, actor.root.y, 75, 'Quad.easeOut');
    await this.move(actor.root, start, actor.root.y, 130, 'Back.easeOut');
  }

  async play(clash: ClashPair, holdForRelay = false, onFollowThrough?: () => boolean) {
    const player = this.players.get(clash.player.actorId)!;
    const enemy = this.enemies.get(clash.enemy.actorId)!;
    const protectedActor = this.players.get(clash.enemy.enemySkill!.targetId);
    const clashY = clash.source === 'intercept' && protectedActor
      ? Phaser.Math.Clamp(protectedActor.root.y, 190, 458)
      : Phaser.Math.Clamp((player.root.y + enemy.root.y) / 2, 190, 458);
    const clashX = clash.source === 'intercept' && protectedActor
      ? Phaser.Math.Clamp(protectedActor.root.x + 150, 380, 520)
      : 640;
    const playerEntryX = clashX - 80;
    const enemyEntryX = clashX + 80;
    player.root.setDepth(55);
    enemy.root.setDepth(55);
    this.focusCamera((player.root.x + enemy.root.x) / 2, (player.root.y + enemy.root.y) / 2, 1.08);
    const clashLock=this.createClashLock(player,enemy,clashX,clashY);
    await this.realWait(105);

    if (clash.source === 'intercept' && protectedActor) {
      const intentTrail=this.scene.add.graphics().setDepth(48);
      intentTrail.lineStyle(8,0x7b1830,.16).lineBetween(enemy.root.x-35,enemy.root.y,protectedActor.root.x+30,protectedActor.root.y);
      intentTrail.lineStyle(2,0xff526b,.72).lineBetween(enemy.root.x-35,enemy.root.y,protectedActor.root.x+30,protectedActor.root.y);
      this.combatLayer.add(intentTrail);
      protectedActor.root.setAlpha(.62);
      this.focusCamera(clashX,clashY,1.08);
      this.sound('sword-swish',.48);
      if(enemy.sprite)this.scene.tweens.add({targets:enemy.sprite,angle:-9,duration:150,ease:'Cubic.easeIn'});
      if(player.sprite)this.scene.tweens.add({targets:player.sprite,angle:-7,duration:130,ease:'Back.easeOut'});
      await Promise.all([
        this.move(enemy.root,enemyEntryX,clashY,300,'Cubic.easeIn'),
        this.move(player.root,playerEntryX,clashY,210,'Back.easeOut'),
      ]);
      this.burst(playerEntryX+16,clashY+12,0x62ddff,8);
      this.scene.cameras.main.shake(75,.004);
      this.scene.tweens.add({targets:intentTrail,alpha:0,duration:120,onComplete:()=>intentTrail.destroy()});
      protectedActor.root.setAlpha(1);
    } else {
      await Promise.all([
        this.move(player.root,playerEntryX,clashY,280),
        this.move(enemy.root,enemyEntryX,clashY,280),
      ])
    }
    this.focusCamera(clashX, clashY, 1.24);

    const cardY = Math.max(60, clashY - 160);
    const playerCard = this.scene.add.text(clashX-108, cardY, `${clash.player.card.name}\n威力 ${clash.playerPower}`, {
      fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', align: 'center', color: '#dffaff', backgroundColor: '#155268', padding: { x: 18, y: 10 },
    }).setOrigin(.5).setDepth(70).setAlpha(0).setScale(.86);
    this.combatLayer.add(playerCard);
    const enemyCard = this.scene.add.text(clashX+108, cardY, `${clash.enemy.enemySkill!.name}\n威力 ${clash.enemyPower}`, {
      fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', align: 'center', color: '#fff0f2', backgroundColor: '#713142', padding: { x: 18, y: 10 },
    }).setOrigin(.5).setDepth(70).setAlpha(0).setScale(.86);
    this.combatLayer.add(enemyCard);

    this.scene.tweens.add({ targets: [playerCard, enemyCard], alpha: 1, scale: 1, duration: 170, ease: 'Back.easeOut' });
    await this.wait(420);
    this.sound('sword-swish', .55);
    playHeroinePose(player.sprite,'ready');
    await this.wait(36);
    playHeroinePose(player.sprite,'strike','a');
    await Promise.all([this.move(player.root, clashX-16, clashY, 135, 'Cubic.easeIn'), this.move(enemy.root, clashX+16, clashY, 135, 'Cubic.easeIn')]);
    playHeroinePose(player.sprite,'strike','b');
    clashLock.destroy();
    this.impactBackdrop('clash',clashX,clashY-13);
    this.playImpact('clash');
    if(player.sprite)player.sprite.setAngle(0);
    if(enemy.sprite)enemy.sprite.setAngle(0);
    const playerFlip=player.root.x>enemy.root.x;
    this.playerTechniqueAccent(clash.player.actorId,clashX,clashY-13,playerFlip);
    if(!['PB','PC'].includes(clash.player.actorId))this.bladeCut(clashX,clashY-13,playerFlip,0xfff3c4,false);
    this.enemySignatureSlash(enemy,clashX,clashY-13,!playerFlip,1.05);
    this.bladeCut(clashX,clashY-13,!playerFlip,0xff91b1,true);
    this.impactCross(clashX,clashY-13);
    this.burst(clashX, clashY - 13, 0xffed9c, 12);
    this.scene.cameras.main.shake(160, .014);
    await this.impactFreeze('clash');

    this.scene.tweens.add({ targets: [playerCard, enemyCard], alpha: 0, y: cardY - 14, duration: 110, ease: 'Quad.easeIn' });
    await this.wait(120);
    playerCard.destroy();
    enemyCard.destroy();
    const result = this.scene.add.text(clashX, clashY - 55, clash.winner === 'tie' ? '相殺' : '破招', {
      fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#fff5b8', backgroundColor: '#050912ee', padding: { x: 16, y: 7 },
    }).setOrigin(.5).setDepth(90).setAlpha(0).setScale(.9);
    this.combatLayer.add(result);
    this.scene.tweens.add({ targets: result, alpha: 1, scale: 1, duration: 120, ease: 'Back.easeOut' });
    await this.wait(clash.winner==='tie'?260:120);
    result.destroy();
    if (clash.winner !== 'tie') {
      const playerWon = clash.winner === 'player';
      const winner = playerWon ? player : enemy;
      const loser = playerWon ? enemy : player;
      const direction = playerWon ? 1 : -1;
      await this.weaponStagger(loser,direction);
      this.resultFx.playBreak(loser,direction);
      this.scene.tweens.add({targets:loser.root,alpha:.32,duration:55,yoyo:true,repeat:2});
      this.burst(loser.root.x, loser.root.y, 0xff4f70, 14);
      const windupX = winner.root.x - direction * 45;
      await this.move(winner.root, windupX, winner.root.y, 100, 'Quad.easeOut');
      this.sound('sword-swish', .72);
      playHeroinePose(winner.sprite,'ready');
      await this.wait(38);
      playHeroinePose(winner.sprite,'strike','a');
      this.focusCamera(loser.root.x, loser.root.y, 1.42);
      await this.move(winner.root, loser.root.x - direction * 48, loser.root.y, 125, 'Cubic.easeIn');
      playHeroinePose(winner.sprite,'strike','b');
      if(playerWon)this.playerTechniqueAccent(clash.player.actorId,loser.root.x,loser.root.y-5,!playerWon);
      this.slash(loser.root.x, loser.root.y - 5, !playerWon);
      if(!playerWon)this.enemySignatureSlash(enemy,loser.root.x,loser.root.y-5,!playerWon,1.12);
      this.bladeCut(loser.root.x,loser.root.y-5,!playerWon,playerWon?0x9fe8ff:0xff7487);
      this.burst(loser.root.x, loser.root.y - 5, playerWon ? 0x67e8ff : 0xff6b78, 16);
      this.impactBackdrop('break',loser.root.x,loser.root.y-5);
      this.playImpact('break');
      this.scene.cameras.main.shake(240, .022);
      playHeroinePose(loser.sprite,'hit','a');
      this.hitFlash(loser.sprite);
      await this.impactFreeze('break');
      playHeroinePose(loser.sprite,'hit','b');
      const defeated=onFollowThrough?.()??false;
      if(defeated&&!holdForRelay){
        await Promise.all([
          this.move(loser.root,loser.root.x+direction*18,loser.root.y+24,150,'Quad.easeIn'),
          new Promise<void>(resolve=>this.scene.tweens.add({targets:loser.root,angle:direction*72,alpha:.5,duration:150,ease:'Quad.easeIn',onComplete:()=>resolve()})),
          this.move(winner.root,winner.x,winner.y,230,'Quad.easeOut'),
        ]);
        this.resetCamera();winner.root.setDepth(0);loser.root.setDepth(0);return
      }
      if (holdForRelay) {
        await this.move(loser.root, loser.root.x + direction * 34, loser.root.y, 85, 'Quad.easeOut');
        loser.root.setAngle(direction * 9);
        await this.wait(90);
        return;
      }
      await this.recoil(loser, direction);
      loser.root.setAngle(0);
      await this.wait(90);
    } else {
      this.focusCamera(clashX, clashY, 1.32);
      this.scene.tweens.add({targets:[player.root,enemy.root],x:'+=5',yoyo:true,repeat:3,duration:55,ease:'Sine.easeInOut'});
      this.bladeCut(clashX-6, clashY-8, false, 0xffd989);
      this.bladeCut(clashX+6, clashY-8, true, 0xffffff);
      this.burst(clashX, clashY - 13, 0xffffff, 22);
      this.scene.time.timeScale = .18;
      await this.realWait(220);
      this.scene.time.timeScale = 1;
      this.impactBackdrop('clash',clashX,clashY-13);
      this.playImpact('clash');
      this.scene.cameras.main.shake(140, .012);
      await Promise.all([
        this.move(player.root, player.root.x - 34, player.root.y, 110, 'Back.easeOut'),
        this.move(enemy.root, enemy.root.x + 34, enemy.root.y, 110, 'Back.easeOut'),
      ]);
      if (holdForRelay) return;
    }

    await Promise.all([this.move(player.root, player.x, player.y, 260), this.move(enemy.root, enemy.x, enemy.y, 260)]);
    playHeroinePose(player.sprite,'idle');playHeroinePose(enemy.sprite,'idle');
    this.resetCamera();
    player.root.setDepth(0); enemy.root.setDepth(0);
  }

  async release(clash: ClashPair) {
    const player=this.players.get(clash.player.actorId)!;
    const enemy=this.enemies.get(clash.enemy.actorId)!;
    await Promise.all([this.move(player.root,player.x,player.y,230,'Quad.easeOut'),this.move(enemy.root,enemy.x,enemy.y,230,'Quad.easeOut')]);
    this.resetCamera();player.root.setDepth(0);enemy.root.setDepth(0)
  }
}

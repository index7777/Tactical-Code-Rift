import Phaser from 'phaser';
import type { ClashPair } from '../../core/battle/BattleTypes';
import{CombatResultFxPresenter}from'./CombatResultFxPresenter';
import{playHeroinePose}from'./HeroinePose';

export interface VisualActor {
  root: Phaser.GameObjects.Container;
  x: number;
  y: number;
  sprite?: Phaser.GameObjects.Sprite;
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

  // Hit-stop should be crisp even while the scene is slowed.
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
    const a=this.scene.add.rectangle(x,y,122,7,color,.94).setRotation(-.66).setDepth(112);
    const b=this.scene.add.rectangle(x,y,100,4,0xffffff,.98).setRotation(.72).setDepth(113);
    const core=this.scene.add.circle(x,y,18,0xffffff,.88).setDepth(114);
    this.combatLayer.add([a,b,core]);
    this.scene.tweens.add({targets:[a,b],scaleX:1.55,alpha:0,duration:180,ease:'Cubic.easeOut'});
    this.scene.tweens.add({targets:core,scale:2.3,alpha:0,duration:150,ease:'Quad.easeOut',onComplete:()=>{a.destroy();b.destroy();core.destroy()}})
  }

  private sound(key: string, volume: number) {
    this.scene.sound.play(key, { volume });
  }

  // 打擊音效分級 helper（與 ActionPresenter 同語意，但獨立實作避免跨檔耦合）。
  private playImpact(kind:'clash'|'heavy'|'break'|'death'){
    const cfg={clash:{d:-200,v:.82},heavy:{d:-400,v:1},break:{d:-700,v:1},death:{d:-500,v:.92}}[kind];
    this.scene.sound.play('sword-impact',{volume:cfg.v,detune:cfg.d});
    if(kind==='clash')this.scene.time.delayedCall(28,()=>this.scene.sound.play('sword-impact',{volume:.55,rate:.55}));
    if(kind==='heavy')this.scene.time.delayedCall(60,()=>this.scene.sound.play('sword-impact',{volume:.5,detune:-800,rate:.65}));
    if(kind==='break')this.scene.time.delayedCall(48,()=>this.scene.sound.play('sword-impact',{volume:.72,detune:-620}));
  }

  // hit-stop + 全螢幕白閃。回傳 Promise 供 await。
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
    if(!sprite)return;const prev=sprite.tintTopLeft??0xffffff;sprite.setTint(0xff5060);
    this.scene.time.delayedCall(110,()=>{if(prev===0xffffff)sprite.clearTint();else sprite.setTint(prev)});
  }

  private slash(x:number,y:number,flipX:boolean,scale=1,color=0xffffff){const dir=flipX?-1:1,angle=-.62*dir;const glow=this.scene.add.rectangle(x,y,290*scale,32*scale,color,.16).setRotation(angle).setDepth(110).setScale(.18,1.35),core=this.scene.add.rectangle(x,y,290*scale,8*scale,0xffffff,.99).setRotation(angle).setDepth(112).setScale(.14,1);this.combatLayer.add([glow,core]);this.scene.tweens.add({targets:glow,scaleX:1.2,scaleY:.7,alpha:0,duration:150,ease:'Expo.easeOut',onComplete:()=>glow.destroy()});this.scene.tweens.add({targets:core,scaleX:1.08,alpha:0,duration:128,ease:'Expo.easeOut',onComplete:()=>core.destroy()})}
  private bladeCut(x:number,y:number,flip=false,color=0xfff3c4){this.slash(x,y,flip,1.08,color);for(let i=0;i<8;i++){const shard=this.scene.add.rectangle(x,y,24,3,i%2?0xffffff:color,.9).setDepth(114).setRotation((i-4)*.38);this.combatLayer.add(shard);this.scene.tweens.add({targets:shard,x:x+(i-4)*28,y:y+(i%2?1:-1)*(30+i*4),alpha:0,duration:190,onComplete:()=>shard.destroy()})}}
  private playerTechniqueAccent(actorId:string,x:number,y:number,flip:boolean){
    if(actorId==='PB'){
      this.slash(x,y,flip,1.25,0xe6c56f);
    }else if(actorId==='PC'){
      for(let i=0;i<2;i++){const cut=this.scene.add.rectangle(x,y-8,116-i*18,i?3:7,i?0xffffff:0x9f8cff,.9).setRotation((i?-.78:.72)*(flip?-1:1)).setDepth(116+i);this.combatLayer.add(cut);this.scene.tweens.add({targets:cut,scaleX:1.28,alpha:0,duration:150+i*35,onComplete:()=>cut.destroy()})}
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
    // A cover intercept happens on the hostile route immediately before the
    // protected actor. Only a direct face-to-face clash uses centre stage.
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
    // 交鋒瞬間 zoom 拉更近，離開遠景平的觀感。
    this.focusCamera(clashX, clashY, 1.24);

    // 卡片位置上移到 clashY-160，避開母版尺寸的角色頭部；y 座標若過低（角色貼近上邊界）自動吸回螢幕內。
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
    this.playImpact('clash');
    if(player.sprite)player.sprite.setAngle(0);
    if(enemy.sprite)enemy.sprite.setAngle(0);
    // 交鋒瞬間：玩家在左揮向右（flipX=true），敵人在右揮向左（flipX=false）；同時渲染兩道刀光呈現對砍。
    // 舊 code 只畫 flipX=false 一道（假設敵人在左）——玩家改站左後看起來像玩家用敵刀砍過去。
    const playerFlip=player.root.x>enemy.root.x;
    this.playerTechniqueAccent(clash.player.actorId,clashX,clashY-13,playerFlip);
    this.slash(clashX, clashY - 13, true);
    this.bladeCut(clashX,clashY-13,true,0xfff3c4);
    this.slash(clashX, clashY - 13, false);
    this.bladeCut(clashX,clashY-13,false,0xffffff);
    this.impactCross(clashX,clashY-13);
    this.burst(clashX, clashY - 13, 0xffed9c, 12);
    this.scene.cameras.main.shake(160, .014);
    // 拚刀時 hit-stop + 全螢幕白閃；tie 分支後續會再加鎖刀動畫延長節奏。
    await this.impactFreeze('clash');

    // Skill cards are a reveal phase, not a persistent result HUD. Retire the
    // same instances at impact so they cannot be read as a second card pair.
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
      // 破招追擊：勝方發動 windup 前把鏡頭拉到 loser 身上放大 1.42，讓補刀有必殺鏡頭感。
      this.focusCamera(loser.root.x, loser.root.y, 1.42);
      await this.move(winner.root, loser.root.x - direction * 48, loser.root.y, 125, 'Cubic.easeIn');
      // 破招追擊：勝方在左（playerWon）→ 揮向右，flipX=true；勝方在右（enemy 勝）→ flipX=false。
      // 舊 !playerWon 假設 winner 在右，玩家改站左後方向反了。
      // 更正：base slash 為左向揮擊，勝方在**右**才需 flipX=true。
      // playerWon → 勝方=player 在左 → flipX=false；enemy 贏 → 勝方在右 → flipX=true。
      playHeroinePose(winner.sprite,'strike','b');
      if(playerWon)this.playerTechniqueAccent(clash.player.actorId,loser.root.x,loser.root.y-5,!playerWon);
      this.slash(loser.root.x, loser.root.y - 5, !playerWon);
      this.bladeCut(loser.root.x,loser.root.y-5,!playerWon,playerWon?0x9fe8ff:0xff7487);
      this.burst(loser.root.x, loser.root.y - 5, playerWon ? 0x67e8ff : 0xff6b78, 16);
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
      // 相殺（tie）重做：不再是「burst 一下就分開」，而是「兩人卡住 400ms，鎖刀微振、鏡頭壓進、慢動作，然後彈開」。
      this.focusCamera(clashX, clashY, 1.32, 160);
      // 鎖刀微抖：雙方 root 高頻震動 3 拍，模擬刀鋒卡住彼此的張力。
      this.scene.tweens.add({targets:[player.root,enemy.root],x:'+=5',yoyo:true,repeat:3,duration:55,ease:'Sine.easeInOut'});
      // 額外雙 bladeCut 反向疊，強化「兩把刀鎖住」的視覺。
      this.bladeCut(clashX-6, clashY-8, false, 0xffd989);
      this.bladeCut(clashX+6, clashY-8, true, 0xffffff);
      this.burst(clashX, clashY - 13, 0xffffff, 22);
      // 慢動作 220ms 讓玩家真的看到刀鋒鎖在一起。
      this.scene.time.timeScale = .18;
      await this.realWait(220);
      this.scene.time.timeScale = 1;
      // 兩人彈開之前補一次 impact 音（低頻疊播）與 shake，做為分離瞬間的收音。
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

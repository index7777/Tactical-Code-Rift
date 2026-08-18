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

  private sound(key: string, volume: number) {
    this.scene.sound.play(key, { volume });
  }

  private slash(x: number, y: number, flipX: boolean) {
    const fx = this.scene.add.image(x, y, 'slash-fx').setDepth(100).setScale(.25).setFlipX(flipX).setAlpha(0); this.combatLayer.add(fx);
    this.scene.tweens.add({ targets: fx, alpha: 1, scale: .72, angle: flipX ? -12 : 12, duration: 80, yoyo: true, hold: 55, onComplete: () => fx.destroy() });
  }
  private bladeCut(x:number,y:number,flip=false,color=0xfff3c4){const g=this.scene.add.graphics().setDepth(104);g.lineStyle(12,color,.9);g.beginPath();g.arc(x,y,52,flip?Math.PI*.12:Math.PI*.88,flip?Math.PI*.88:Math.PI*1.88,false);g.strokePath();g.lineStyle(3,0xffffff,.98);g.beginPath();g.arc(x,y,52,flip?Math.PI*.18:Math.PI*.94,flip?Math.PI*.78:Math.PI*1.82,false);g.strokePath();this.combatLayer.add(g);const flash=this.scene.add.circle(x,y,13,0xffffff,.95).setDepth(105);this.combatLayer.add(flash);this.scene.tweens.add({targets:[g,flash],alpha:0,scale:1.5,duration:160,ease:'Cubic.easeOut',onComplete:()=>{g.destroy();flash.destroy()}});for(let i=0;i<8;i++){const shard=this.scene.add.rectangle(x,y,18,3,0xffffff,.85).setDepth(105).setRotation((i-4)*.38);this.combatLayer.add(shard);this.scene.tweens.add({targets:shard,x:x+(i-4)*22,y:y+(i%2?1:-1)*(22+i*4),alpha:0,duration:190,onComplete:()=>shard.destroy()})}}

  private focusCamera(x: number, y: number, zoom = 1.14) {
    this.scene.cameras.main.pan(x, y, 190, 'Sine.easeInOut');
    this.scene.cameras.main.zoomTo(zoom, 190, 'Sine.easeInOut');
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
    this.focusCamera(clashX, clashY, 1.16);

    const playerCard = this.scene.add.text(clashX-100, clashY - 112, `${clash.player.card.name}\n威力 ${clash.playerPower}`, {
      fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', align: 'center', color: '#dffaff', backgroundColor: '#155268', padding: { x: 18, y: 10 },
    }).setOrigin(.5).setDepth(70).setAlpha(0).setScale(.86);
    this.combatLayer.add(playerCard);
    const enemyCard = this.scene.add.text(clashX+100, clashY - 112, `${clash.enemy.enemySkill!.name}\n威力 ${clash.enemyPower}`, {
      fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', align: 'center', color: '#fff0f2', backgroundColor: '#713142', padding: { x: 18, y: 10 },
    }).setOrigin(.5).setDepth(70).setAlpha(0).setScale(.86);
    this.combatLayer.add(enemyCard);

    this.scene.tweens.add({ targets: [playerCard, enemyCard], alpha: 1, scale: 1, duration: 170, ease: 'Back.easeOut' });
    await this.wait(420);
    this.sound('sword-swish', .55);
    playHeroinePose(player.sprite,'strike');
    await Promise.all([this.move(player.root, clashX-16, clashY, 135, 'Cubic.easeIn'), this.move(enemy.root, clashX+16, clashY, 135, 'Cubic.easeIn')]);
    this.sound('sword-impact', .72);
    if(player.sprite)player.sprite.setAngle(0);
    if(enemy.sprite)enemy.sprite.setAngle(0);
    this.slash(clashX, clashY - 13, false);
    this.bladeCut(clashX,clashY-13,false,0xfff3c4);
    if (clash.winner === 'tie') this.slash(clashX, clashY - 13, true);
    if (clash.winner === 'tie') this.bladeCut(clashX,clashY-13,true,0xffffff);
    this.burst(clashX, clashY - 13, 0xffed9c, 12);
    this.scene.cameras.main.shake(130, .011);
    this.scene.time.timeScale = .35;
    await this.wait(55);
    this.scene.time.timeScale = 1;

    // Skill cards are a reveal phase, not a persistent result HUD. Retire the
    // same instances at impact so they cannot be read as a second card pair.
    this.scene.tweens.add({ targets: [playerCard, enemyCard], alpha: 0, y: clashY - 126, duration: 110, ease: 'Quad.easeIn' });
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
      playHeroinePose(winner.sprite,'strike');
      await this.move(winner.root, loser.root.x - direction * 48, loser.root.y, 125, 'Cubic.easeIn');
      this.slash(loser.root.x, loser.root.y - 5, !playerWon);
      this.bladeCut(loser.root.x,loser.root.y-5,!playerWon,playerWon?0x9fe8ff:0xff7487);
      this.burst(loser.root.x, loser.root.y - 5, playerWon ? 0x67e8ff : 0xff6b78, 16);
      this.sound('sword-impact', .9);
      this.scene.cameras.main.shake(170, .014);
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
      this.burst(clashX, clashY - 13, 0xffffff, 18);
      await Promise.all([
        this.move(player.root, player.root.x - 28, player.root.y, 80, 'Back.easeOut'),
        this.move(enemy.root, enemy.root.x + 28, enemy.root.y, 80, 'Back.easeOut'),
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

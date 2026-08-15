import Phaser from 'phaser';
import type { BattleCard } from '../../core/cards/BattleCards';
import type { VisualActor } from './ClashPresenter';
import{playHeroinePose}from'./HeroinePose';

export class ActionPresenter {
  constructor(private scene: Phaser.Scene, private players: Map<string, VisualActor>, private enemies: Map<string, VisualActor>, private combatLayer: Phaser.GameObjects.Container) {}
  private move(o: Phaser.GameObjects.Container, x: number, y: number, d = 210, ease = 'Quad.easeInOut') { return new Promise<void>((r) => this.scene.tweens.add({ targets: o, x, y, duration: d, ease, onComplete: () => r() })); }
  private wait(ms: number) { return new Promise<void>((r) => this.scene.time.delayedCall(ms, r)); }
  private slash(x: number, y: number, flipX: boolean) { const fx = this.scene.add.image(x, y, 'slash-fx').setDepth(100).setScale(.25).setFlipX(flipX).setAlpha(0); this.combatLayer.add(fx); this.scene.tweens.add({ targets: fx, alpha: 1, scale: .68, duration: 80, yoyo: true, hold: 55, onComplete: () => fx.destroy() }); }
  private cardImpact(x:number,y:number,definitionId?:string){
    if(definitionId==='break'){for(let i=0;i<5;i++){const shard=this.scene.add.rectangle(x,y,14+i*2,3,0xffd36b,1).setRotation(-.8+i*.35).setDepth(102);this.combatLayer.add(shard);this.scene.tweens.add({targets:shard,x:x-42+i*21,y:y-30+(i%2)*34,angle:70-i*25,alpha:0,duration:290,onComplete:()=>shard.destroy()})}}
    else if(definitionId==='delay'){const ring=this.scene.add.ellipse(x,y,52,84,0x6fb8d5,.08).setStrokeStyle(3,0x9cecff,.9).setDepth(101);this.combatLayer.add(ring);this.scene.tweens.add({targets:ring,scaleX:1.7,scaleY:.65,alpha:0,duration:330,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()})}
    else if(definitionId==='heavy'){const shock=this.scene.add.rectangle(x,y+28,124,5,0xffd8a0,.8).setDepth(101);this.combatLayer.add(shock);this.scene.tweens.add({targets:shock,scaleX:1.8,alpha:0,duration:260,onComplete:()=>shock.destroy()})}
  }
  private resetCamera() { this.scene.cameras.main.pan(640, 360, 250, 'Sine.easeInOut'); this.scene.cameras.main.zoomTo(1, 250, 'Sine.easeInOut'); }

  async attack(actorId: string, targetId: string, card: { name: string; clashPower: number; definitionId?: string }, enemy = false, mode: 'normal' | 'flank' = 'normal', returnToSlot = true, onImpact?: () => boolean) {
    const attacker = (enemy ? this.enemies : this.players).get(actorId)!;
    const target = (enemy ? this.players : this.enemies).get(targetId)!;
    const direction = attacker.root.x < target.root.x ? 1 : -1;
    const badge = this.scene.add.text(attacker.root.x, attacker.root.y - 90, `${card.name}\n威力 ${card.clashPower}`, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', align: 'center', color: '#fff', backgroundColor: enemy ? '#713142' : '#155268', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(70);
    await this.move(attacker.root, attacker.root.x - direction * 42, attacker.root.y, 100, 'Quad.easeOut');
    this.scene.sound.play('sword-swish', { volume: .7 });
    const contactX = mode === 'flank' ? target.root.x + direction * 62 : target.root.x - direction * 58;
    playHeroinePose(attacker.sprite,'strike');
    await this.move(attacker.root, contactX, target.root.y, 150, 'Cubic.easeIn');
    if (mode === 'flank') badge.setText(`${card.name}\n側襲`);
    this.slash(target.root.x, target.root.y - 5, enemy);
    this.cardImpact(target.root.x,target.root.y-5,card.definitionId);
    this.scene.sound.play('sword-impact', { volume: .82 });
    this.scene.cameras.main.shake(130, .01);
    await this.move(target.root, target.root.x + direction * 30, target.root.y, 70, 'Quad.easeOut');
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
    const handoff=this.scene.add.rectangle((source.root.x+ally.root.x)/2,target.root.y-14,96,3,0xffd56f,.85).setDepth(103).setRotation(-.12*direction);this.combatLayer.add(handoff);this.scene.tweens.add({targets:handoff,scaleX:1.45,alpha:0,duration:220,onComplete:()=>handoff.destroy()});
    // The target keeps the first hit's recoil pose until this second blade lands.
    await this.wait(55);
    this.scene.sound.play('sword-swish', { volume: .78 });
    playHeroinePose(ally.sprite,'strike');
    this.slash(target.root.x, target.root.y - 5, enemy);
    this.scene.sound.play('sword-impact', { volume: .9 });
    this.scene.cameras.main.shake(150, .013);
    await this.move(target.root, target.root.x + direction * 42, target.root.y, 85, 'Quad.easeOut');
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
    this.scene.sound.play('sword-impact',{volume:1});this.scene.cameras.main.shake(190,.017);
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
    const label = this.scene.add.text(actor.root.x, actor.root.y - 88, '崩勢\n殺意斷絕', { fontFamily: 'serif', fontSize: '17px', fontStyle: 'bold', align: 'center', color: '#fff', backgroundColor: '#8b2034', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(90);
    const ring = this.scene.add.circle(actor.root.x, actor.root.y, 38, 0xff274d, .15).setStrokeStyle(4, 0xff637b).setDepth(80);
    this.scene.tweens.add({ targets: actor.root, x: actor.root.x + 7, duration: 45, yoyo: true, repeat: 4 });
    this.scene.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 360 });
    this.scene.sound.play('sword-impact', { volume: .55 });
    await this.wait(420); label.destroy(); ring.destroy(); actor.root.x = actor.x;
  }

  async support(actorId: string, targetId: string, card: BattleCard) {
    const actor = this.players.get(actorId)!; const target = this.players.get(targetId)!;
    const badge = this.scene.add.text(actor.root.x, actor.root.y - 90, card.name, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', align: 'center', color: '#fff', backgroundColor: '#376d59', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(70);
    if(actorId!==targetId)await this.move(actor.root, target.root.x - 75, target.root.y, 190, 'Back.easeOut');
    this.scene.tweens.add({ targets: target.root, scale: 1.12, duration: 160, yoyo: true });
    await this.wait(260); badge.destroy(); if(actorId!==targetId)await this.move(actor.root, actor.x, actor.y);
  }
}

import Phaser from 'phaser';
import type { ClashPair } from '../../core/battle/BattleTypes';

export interface VisualActor { root: Phaser.GameObjects.Container; x: number; y: number }

export class ClashPresenter {
  constructor(private scene: Phaser.Scene, private players: Map<string, VisualActor>, private enemies: Map<string, VisualActor>) {}
  private move(o: Phaser.GameObjects.Container,x:number,y:number,d=220){return new Promise<void>(r=>this.scene.tweens.add({targets:o,x,y,duration:d,ease:'Quad.easeInOut',onComplete:()=>r()}))}
  private wait(ms:number){return new Promise<void>(r=>this.scene.time.delayedCall(ms,r))}
  async play(c:ClashPair){
    const p=this.players.get(c.player.actorId)!,e=this.enemies.get(c.enemy.actorId)!;
    const dim=this.scene.add.rectangle(640,230,1280,390,0x020611,.5).setDepth(40);
    p.root.setDepth(50);e.root.setDepth(50);
    const pair=this.scene.add.text(640,82,`${c.player.actorId}  ↔  ${c.enemy.actorId}`,{fontFamily:'sans-serif',fontSize:'17px',fontStyle:'bold',color:'#fff',backgroundColor:'#050912dd',padding:{x:14,y:6}}).setOrigin(.5).setDepth(80);
    await Promise.all([this.move(p.root,720,235,260),this.move(e.root,560,235,260)]);
    const pc=this.scene.add.text(740,120,`${c.player.card.name}\n威力 ${c.playerPower}`,{fontFamily:'sans-serif',fontSize:'19px',fontStyle:'bold',align:'center',color:'#dffaff',backgroundColor:'#155268',padding:{x:18,y:10}}).setOrigin(.5).setDepth(70);
    const ec=this.scene.add.text(540,120,`${c.enemy.enemySkill!.name}\n威力 ${c.enemyPower}`,{fontFamily:'sans-serif',fontSize:'19px',fontStyle:'bold',align:'center',color:'#fff0f2',backgroundColor:'#713142',padding:{x:18,y:10}}).setOrigin(.5).setDepth(70);
    await this.wait(260);
    await Promise.all([this.move(p.root,660,235,150),this.move(e.root,620,235,150)]);
    const impact=this.scene.add.star(640,220,8,12,34,0xfff0a6,1).setDepth(90);
    this.scene.cameras.main.shake(120,.009);this.scene.time.timeScale=.25;await this.wait(70);this.scene.time.timeScale=1;
    pc.setAlpha(c.winner==='enemy'?.3:1);ec.setAlpha(c.winner==='player'?.3:1);
    const result=this.scene.add.text(640,180,c.winner==='tie'?'平手｜雙方行動取消':c.winner==='player'?`${c.enemy.actorId} 行動取消`:`${c.player.actorId} 行動取消`,{fontFamily:'sans-serif',fontSize:'18px',fontStyle:'bold',color:'#fff5b8',backgroundColor:'#050912ee',padding:{x:16,y:7}}).setOrigin(.5).setDepth(90);
    await this.wait(300);impact.destroy();
    if(c.winner!=='tie'){
      const winner=c.winner==='player'?p:e,loser=c.winner==='player'?e:p;
      const follow=this.scene.add.text(640,265,'勝方追擊',{fontFamily:'sans-serif',fontSize:'16px',fontStyle:'bold',color:'#ffe38c'}).setOrigin(.5).setDepth(90);
      await this.move(winner.root,loser.root.x+(c.winner==='player'?55:-55),loser.root.y,180);
      const hit=this.scene.add.star(loser.root.x,loser.root.y,6,8,27,0xffffff,1).setDepth(90);this.scene.cameras.main.shake(100,.007);await this.wait(190);hit.destroy();follow.destroy();
    }
    pc.destroy();ec.destroy();result.destroy();pair.destroy();
    await Promise.all([this.move(p.root,p.x,p.y,240),this.move(e.root,e.x,e.y,240)]);
    p.root.setDepth(0);e.root.setDepth(0);dim.destroy();
  }
}

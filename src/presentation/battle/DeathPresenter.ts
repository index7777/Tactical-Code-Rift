import Phaser from 'phaser';
import type { VisualActor } from './ClashPresenter';

// Death poses stay on the shared horizontal side-view rig. Heavy and relay
// only alter impact timing/FX; flank never creates a directional death asset.
export type DeathStyle='normal'|'heavy'|'relay';

export class DeathPresenter {
  constructor(private scene:Phaser.Scene,private combatLayer:Phaser.GameObjects.Container){}

  play(actor:VisualActor,enemy:boolean,style:DeathStyle='normal'){
    // Death owns the actor from this point onward. Idle/bobbing animation must
    // not continue underneath the collapse pose.
    if(actor.sprite){actor.sprite.anims.stop();this.scene.tweens.killTweensOf(actor.sprite);actor.sprite.setAngle(0)}
    const color=enemy?0xff536f:0x8eeeff,scale=style==='heavy'?1.7:style==='relay'?1.45:1.2;
    const life=this.scene.add.rectangle(actor.root.x,actor.root.y+42,84,4,color,.95).setDepth(110);this.combatLayer.add(life);
    this.scene.tweens.add({targets:life,scaleX:.02,alpha:0,duration:style==='heavy'?480:330,ease:'Cubic.easeIn',onComplete:()=>life.destroy()});
    const ring=this.scene.add.ellipse(actor.root.x,actor.root.y,82,30,color,.16).setStrokeStyle(style==='heavy'?5:3,color,.9).setDepth(108);this.combatLayer.add(ring);
    this.scene.tweens.add({targets:ring,scale,alpha:0,duration:style==='heavy'?520:360,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()});
    for(let i=0;i<(style==='heavy'?14:9);i++){
      const shard=this.scene.add.rectangle(actor.root.x,actor.root.y-8,12,3,color,.9).setDepth(109).setRotation(i*.7);this.combatLayer.add(shard);
      this.scene.tweens.add({targets:shard,x:actor.root.x+(i%2?1:-1)*(28+i*4),y:actor.root.y-28+(i%5)*14,alpha:0,angle:90,duration:320+i*12,onComplete:()=>shard.destroy()})
    }
    this.scene.sound.play('sword-impact',{volume:style==='heavy'?1:.75});
  }
}

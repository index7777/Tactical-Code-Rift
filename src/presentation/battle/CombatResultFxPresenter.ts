import Phaser from'phaser';
import type{VisualActor}from'./ClashPresenter';
import type{MonsterRuleCue}from'../../core/battle/MonsterRules';

export class CombatResultFxPresenter{
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container){}

  playBreak(actor:VisualActor,direction:number){
    const x=actor.root.x,y=actor.root.y-8;
    const arc=this.scene.add.ellipse(x,y,58,88,0xdbe7ed,.06).setStrokeStyle(3,0xeaf7ff,.92).setDepth(104);this.layer.add(arc);
    this.scene.tweens.add({targets:arc,scaleX:1.55,scaleY:.7,alpha:0,duration:240,ease:'Cubic.easeOut',onComplete:()=>arc.destroy()});
    for(let i=0;i<6;i++){const shard=this.scene.add.rectangle(x,y-22+i*8,15,3,0xe6f4f7,1).setRotation(-.8+i*.28).setDepth(105);this.layer.add(shard);this.scene.tweens.add({targets:shard,x:x+direction*(34+i*8),y:y-38+i*15,alpha:0,angle:direction*70,duration:250+i*12,onComplete:()=>shard.destroy()})}
  }

  playCollapse(actor:VisualActor){
    const x=actor.root.x,y=actor.root.y+42;
    const line=this.scene.add.rectangle(x,y,112,3,0xffd56f,.9).setDepth(106);this.layer.add(line);
    this.scene.tweens.add({targets:line,scaleX:1.8,alpha:0,duration:420,ease:'Cubic.easeOut',onComplete:()=>line.destroy()});
    for(let i=0;i<5;i++){const mark=this.scene.add.circle(x-40+i*20,y,5,i===4?0xff536c:0xe1b856,1).setStrokeStyle(2,0xffe7a3,.9).setDepth(107);this.layer.add(mark);this.scene.tweens.add({targets:mark,x:x-64+i*32,y:y-28-(i%2)*18,scale:2.1,alpha:0,delay:i*38,duration:320,ease:'Back.easeOut',onComplete:()=>mark.destroy()})}
    this.scene.cameras.main.shake(210,.012);
  }

  playMonsterRule(actor:VisualActor,cue:MonsterRuleCue){
    const x=actor.root.x,y=actor.root.y-28,label=cue==='afterimage'?'殘影':cue==='stone-guard'?'厚甲':'咒返',color=cue==='afterimage'?0x9cecff:cue==='stone-guard'?0xe4bd72:0xc99cff;
    const ring=this.scene.add.ellipse(x,y+24,cue==='afterimage'?48:68,cue==='afterimage'?92:70,color,.06).setStrokeStyle(cue==='stone-guard'?5:3,color,.9).setDepth(108),text=this.scene.add.text(x,y-42,label,{fontFamily:'serif',fontSize:'15px',fontStyle:'bold',color:'#fff',backgroundColor:'#15121ddd',padding:{x:8,y:3}}).setOrigin(.5).setDepth(109);this.layer.add([ring,text]);
    if(cue==='afterimage')this.scene.tweens.add({targets:actor.root,x:actor.root.x-12,duration:45,yoyo:true,repeat:2});
    this.scene.tweens.add({targets:ring,scaleX:1.65,scaleY:.72,alpha:0,duration:360,onComplete:()=>ring.destroy()});this.scene.tweens.add({targets:text,y:text.y-18,alpha:0,delay:120,duration:380,onComplete:()=>text.destroy()})
  }
}

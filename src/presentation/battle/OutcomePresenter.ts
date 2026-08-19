import Phaser from 'phaser';
import{outcomeButtonLayout}from'./OutcomeLayout';

export class OutcomePresenter {
  constructor(private scene:Phaser.Scene,private hudLayer:Phaser.GameObjects.Container){}

  async show(result:'victory'|'defeat',actions:{onRetry:()=>void;onContinue?:()=>void}){
    const victory=result==='victory',layout=outcomeButtonLayout(result);this.scene.cameras.main.stopFollow();this.scene.cameras.main.centerOn(640,360);this.scene.cameras.main.setZoom(1);
    const overlay=this.scene.add.rectangle(640,360,1280,720,0x050812,.48).setDepth(180).setAlpha(0).setScrollFactor(0);
    const title=this.scene.add.text(640,302,victory?'戰鬥勝利':'全隊斷命',{fontFamily:'serif',fontSize:'42px',fontStyle:'bold',color:victory?'#ffe6a1':'#ff91a4',stroke:'#080b12',strokeThickness:7}).setOrigin(.5).setDepth(181).setAlpha(0).setScale(.8);
    title.setScrollFactor(0);const buttons:Phaser.GameObjects.GameObject[]=[];
    if(!victory&&layout.retry){const retry=this.scene.add.text(layout.retry.x,layout.retry.y,'再戰',{fixedWidth:240,align:'center',fontFamily:'sans-serif',fontSize:'21px',color:'#fff',backgroundColor:'#713141',padding:{y:16}}).setOrigin(.5).setDepth(181).setAlpha(0).setScrollFactor(0).setInteractive({useHandCursor:true});retry.on('pointerdown',actions.onRetry);buttons.push(retry)}
    if(victory&&actions.onContinue&&layout.continue){const next=this.scene.add.text(layout.continue.x,layout.continue.y,'繼續旅程',{fixedWidth:240,align:'center',fontFamily:'sans-serif',fontSize:'21px',color:'#fff',backgroundColor:'#285c67',padding:{y:16}}).setOrigin(.5).setDepth(181).setAlpha(0).setScrollFactor(0).setInteractive({useHandCursor:true});next.on('pointerdown',actions.onContinue);buttons.push(next)}
    this.hudLayer.add([overlay,title,...buttons]);
    this.scene.cameras.main.shake(victory?110:220,victory ? 0.006 : 0.012);
    await new Promise<void>(resolve=>this.scene.tweens.add({targets:overlay,alpha:1,duration:280,onComplete:()=>resolve()}));
    this.scene.tweens.add({targets:[title,...buttons],alpha:1,scale:1,duration:260,ease:'Back.easeOut'})
  }
}

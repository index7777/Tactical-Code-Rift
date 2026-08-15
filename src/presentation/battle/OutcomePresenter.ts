import Phaser from 'phaser';

export class OutcomePresenter {
  constructor(private scene:Phaser.Scene,private hudLayer:Phaser.GameObjects.Container){}

  async show(result:'victory'|'defeat',onRetry:()=>void){
    const victory=result==='victory',overlay=this.scene.add.rectangle(640,360,1280,720,0x050812,.48).setDepth(180).setAlpha(0);
    const title=this.scene.add.text(640,302,victory?'戰鬥勝利':'全隊斷命',{fontFamily:'serif',fontSize:'42px',fontStyle:'bold',color:victory?'#ffe6a1':'#ff91a4',stroke:'#080b12',strokeThickness:7}).setOrigin(.5).setDepth(181).setAlpha(0).setScale(.8);
    const retry=this.scene.add.text(640,382,'再戰',{fixedWidth:170,align:'center',fontFamily:'sans-serif',fontSize:'18px',color:'#fff',backgroundColor:victory?'#285c67':'#713141',padding:{y:12}}).setOrigin(.5).setDepth(181).setAlpha(0).setInteractive({useHandCursor:true});retry.on('pointerdown',onRetry);
    this.hudLayer.add([overlay,title,retry]);
    this.scene.cameras.main.shake(victory?110:220,victory ? 0.006 : 0.012);
    await new Promise<void>(resolve=>this.scene.tweens.add({targets:overlay,alpha:1,duration:280,onComplete:()=>resolve()}));
    this.scene.tweens.add({targets:[title,retry],alpha:1,scale:1,duration:260,ease:'Back.easeOut'})
  }
}

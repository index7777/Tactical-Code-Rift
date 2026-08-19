import Phaser from 'phaser';

export interface FighterHudState {alive:boolean;hp:number;maxHp?:number;shield:number;tempShield?:number;balance:number;exposed:boolean;broken:boolean}
export interface FighterHudView {root:Phaser.GameObjects.Container;hpFill:Phaser.GameObjects.Rectangle;hpEcho:Phaser.GameObjects.Rectangle;shieldFill:Phaser.GameObjects.Rectangle;balanceMarks:Phaser.GameObjects.Arc[];state:Phaser.GameObjects.Text}
export function fighterHudStatus(state:Pick<FighterHudState,'alive'|'broken'|'exposed'>):string{if(!state.alive)return '';return state.broken?'崩勢':state.exposed?'破綻':''}

export class FighterHudPresenter{
  constructor(private scene:Phaser.Scene){}
  create():FighterHudView{
    const root=this.scene.add.container(0,54);
    // P11.1: HUD should read as combat telemetry, not a second floating window.
    const plate=this.scene.add.rectangle(0,1,66,29,0x03080c,.66).setStrokeStyle(1,0x7d929a,.18);
    const hpBack=this.scene.add.rectangle(-27,-8,54,5,0x1a1015,.96).setOrigin(0,.5);
    const hpEcho=this.scene.add.rectangle(-27,-8,54,5,0xf0dfe1,.68).setOrigin(0,.5);
    const hpFill=this.scene.add.rectangle(-27,-8,54,5,0xd94c61).setOrigin(0,.5);
    // Shield is an attached secondary layer, deliberately thinner than HP.
    const shieldBack=this.scene.add.rectangle(-27,-1,54,2.5,0x102a32,.8).setOrigin(0,.5);
    const shieldFill=this.scene.add.rectangle(-27,-1,0,2.5,0x8de8ee,.94).setOrigin(0,.5);
    const balanceMarks=Array.from({length:5},(_,index)=>this.scene.add.rectangle(-20+index*10,8,6,4,0xd8ae4b,1).setStrokeStyle(1,0x5d451b,.58));
    const state=this.scene.add.text(0,-108,'',{fontFamily:'serif',fontSize:'11px',fontStyle:'bold',color:'#fff6df',backgroundColor:'#7e2033',padding:{x:7,y:2}}).setOrigin(.5).setVisible(false);
    root.add([plate,hpBack,hpEcho,hpFill,shieldBack,shieldFill,...balanceMarks,state]);
    return{root,hpFill,hpEcho,shieldFill,balanceMarks,state}
  }
  refresh(view:FighterHudView,state:FighterHudState,animate=true){
    view.root.setVisible(state.alive);if(!state.alive){view.state.setVisible(false);view.balanceMarks.forEach(m=>m.setVisible(false));view.hpFill.width=0;view.hpEcho.width=0;view.shieldFill.width=0;return}
    const targetWidth=58*Phaser.Math.Clamp(state.hp,0,state.maxHp??100)/(state.maxHp??100);this.scene.tweens.killTweensOf(view.hpEcho);view.hpFill.width=targetWidth;
    if(animate&&view.hpEcho.width>targetWidth)this.scene.tweens.add({targets:view.hpEcho,width:targetWidth,delay:90,duration:260,ease:'Quad.easeIn'});else view.hpEcho.width=targetWidth;
    const totalShield=state.shield+(state.tempShield??0),shieldRatio=Phaser.Math.Clamp(totalShield/24,0,1);
    view.shieldFill.width=58*shieldRatio;
    view.shieldFill.setFillStyle((state.tempShield??0)>0?0xbff7ff:0x76dce7,(state.tempShield??0)>0?.96:.86);
    const stanceCount=Math.min(5,Math.ceil(state.balance/2));view.balanceMarks.forEach((mark,index)=>{const active=index<stanceCount;mark.setFillStyle(active?(state.balance<=3?0xff6478:0xd8ae4b):0x2d281d,active?1:.22);mark.setScale(state.balance<=3&&active?1.16:1)});
    const status=fighterHudStatus(state);view.state.setText(status).setBackgroundColor(state.broken?'#8f1f32':'#64304f').setVisible(Boolean(status))
  }
}

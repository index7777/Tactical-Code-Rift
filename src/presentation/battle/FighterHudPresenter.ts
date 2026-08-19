import Phaser from 'phaser';

export interface FighterHudState {alive:boolean;hp:number;maxHp?:number;shield:number;tempShield?:number;balance:number;exposed:boolean;broken:boolean}
export interface FighterHudView {root:Phaser.GameObjects.Container;hpFill:Phaser.GameObjects.Rectangle;hpEcho:Phaser.GameObjects.Rectangle;shieldMarks:Phaser.GameObjects.Rectangle[];balanceMarks:Phaser.GameObjects.Arc[];state:Phaser.GameObjects.Text}
export function fighterHudStatus(state:Pick<FighterHudState,'alive'|'broken'|'exposed'>):string{if(!state.alive)return '';return state.broken?'崩勢':state.exposed?'破綻':''}

export class FighterHudPresenter{
  constructor(private scene:Phaser.Scene){}
  create():FighterHudView{
    const root=this.scene.add.container(0,55);
    const plate=this.scene.add.rectangle(0,2,72,31,0x05090e,.70).setStrokeStyle(1,0x78909a,.28);
    const hpBack=this.scene.add.rectangle(-29,-7,58,5,0x1b1116,.98).setOrigin(0,.5);
    const hpEcho=this.scene.add.rectangle(-29,-7,58,5,0xe8d5d8,.72).setOrigin(0,.5);
    const hpFill=this.scene.add.rectangle(-29,-7,58,5,0xd94c61).setOrigin(0,.5);
    const shieldMarks=Array.from({length:4},(_,index)=>this.scene.add.rectangle(-18+index*11,3,7,8,0x8de8ee,.92).setStrokeStyle(1,0xd9ffff,.62));
    const balanceMarks=Array.from({length:5},(_,index)=>this.scene.add.circle(-17+index*11,13,3.2,0xd8ae4b,1).setStrokeStyle(1,0x5d451b,.75));
    const state=this.scene.add.text(0,-112,'',{fontFamily:'serif',fontSize:'12px',fontStyle:'bold',color:'#fff6df',backgroundColor:'#7e2033',padding:{x:8,y:2}}).setOrigin(.5).setVisible(false);
    root.add([plate,hpBack,hpEcho,hpFill,...shieldMarks,...balanceMarks,state]);
    return{root,hpFill,hpEcho,shieldMarks,balanceMarks,state}
  }
  refresh(view:FighterHudView,state:FighterHudState,animate=true){
    view.root.setVisible(state.alive);if(!state.alive){view.state.setVisible(false);view.shieldMarks.forEach(m=>m.setVisible(false));view.balanceMarks.forEach(m=>m.setVisible(false));view.hpFill.width=0;view.hpEcho.width=0;return}
    const targetWidth=58*Phaser.Math.Clamp(state.hp,0,state.maxHp??100)/(state.maxHp??100);this.scene.tweens.killTweensOf(view.hpEcho);view.hpFill.width=targetWidth;
    if(animate&&view.hpEcho.width>targetWidth)this.scene.tweens.add({targets:view.hpEcho,width:targetWidth,delay:90,duration:260,ease:'Quad.easeIn'});else view.hpEcho.width=targetWidth;
    const totalShield=state.shield+(state.tempShield??0),shieldCount=Math.min(4,Math.ceil(totalShield/5)),permanentCount=Math.min(4,Math.ceil(state.shield/5));
    view.shieldMarks.forEach((mark,index)=>{const visible=index<shieldCount;mark.setVisible(visible);if(visible){const temporary=index>=permanentCount;mark.setFillStyle(temporary?0xc6f4ff:0x8de8ee,temporary ? .72 : .92)}});
    const stanceCount=Math.min(5,Math.ceil(state.balance/2));view.balanceMarks.forEach((mark,index)=>{const active=index<stanceCount;mark.setFillStyle(active?(state.balance<=3?0xff6478:0xd8ae4b):0x2d281d,active?1:.22);mark.setScale(state.balance<=3&&active?1.16:1)});
    const status=fighterHudStatus(state);view.state.setText(status).setBackgroundColor(state.broken?'#8f1f32':'#64304f').setVisible(Boolean(status))
  }
}

import Phaser from 'phaser';
import type{BattlefieldMode}from'./BattlefieldMode';

export class BattlefieldPresenter{
  constructor(private scene:Phaser.Scene,private world:Phaser.GameObjects.Container){}

  build(mode:BattlefieldMode){
    const root=this.scene.add.container().setData('battlefield',true);
    const add=(...items:Phaser.GameObjects.GameObject[])=>{root.add(items);return items};
    add(
      this.scene.add.tileSprite(640,290,1280,520,'bg-sky').setTint(mode==='rooftop'?0x202d42:mode==='wayside'?0x313241:0x172936),
      this.scene.add.tileSprite(640,305,1280,520,'bg-mountains-1').setTint(mode==='exploration'?0x24382e:0x594653).setAlpha(.64),
      this.scene.add.tileSprite(640,326,1280,520,'bg-mountains-2').setTint(0x213039).setAlpha(.78),
    );
    if(mode==='rooftop')this.rooftop(root);
    else if(mode==='wayside')this.wayside(root);
    else this.exploration(root);
    add(this.scene.add.rectangle(640,630,1280,180,0x07101b,.98));
    this.world.add(root);return root;
  }

  private rooftop(root:Phaser.GameObjects.Container){
    root.add(this.scene.add.circle(1015,190,54,0xb9c7d5,.18).setStrokeStyle(2,0xdbe5ed,.22));
    root.add(this.scene.add.rectangle(640,497,1280,18,0x17151b,.98).setStrokeStyle(3,0x73505a,.62));
    root.add(this.scene.add.triangle(640,512,0,0,1280,0,1160,64,0x0e1219,1).setOrigin(.5,0));
    for(let x=90;x<1280;x+=185){
      root.add(this.scene.add.line(0,0,x,500,x+72,556,0x5c404a,.55).setOrigin(0));
      root.add(this.scene.add.rectangle(x,484,54,9,0x302630,.92).setStrokeStyle(1,0x86616b,.5));
    }
    root.add(this.scene.add.rectangle(640,505,1280,4,0xa56c75,.55));
  }

  private wayside(root:Phaser.GameObjects.Container){
    root.add(this.scene.add.tileSprite(640,350,1280,420,'bg-trees').setTint(0x121a1d).setAlpha(.78));
    // The train is distant context, not the combat room or central focal object.
    const train=this.scene.add.container(920,205).setAlpha(.44);
    train.add(this.scene.add.rectangle(0,0,430,58,0x171419,.95).setStrokeStyle(2,0x75424a,.7));
    for(let x=-170;x<=170;x+=85)train.add(this.scene.add.rectangle(x,-3,48,24,0x594354,.55));
    train.add(this.scene.add.rectangle(0,31,470,7,0x8a4d54,.6));root.add(train);
    root.add(this.scene.add.rectangle(640,494,1280,24,0x181619,.98));
    root.add(this.scene.add.rectangle(640,510,1280,5,0x91705b,.75));
    root.add(this.scene.add.rectangle(640,525,1280,4,0x4d3936,.9));
    for(let x=25;x<1280;x+=82)root.add(this.scene.add.rectangle(x,530,52,7,0x332725,.9));
  }

  private exploration(root:Phaser.GameObjects.Container){
    root.add(this.scene.add.tileSprite(640,350,1280,430,'bg-trees').setTint(0x101b19).setAlpha(.9));
    const torii=this.scene.add.container(650,248).setAlpha(.34);
    torii.add([this.scene.add.rectangle(-92,116,20,235,0x2d1820,.95),this.scene.add.rectangle(92,116,20,235,0x2d1820,.95),this.scene.add.rectangle(0,6,255,20,0x3d2028,.96),this.scene.add.rectangle(0,-12,292,12,0x542932,.9)]);root.add(torii);
    root.add(this.scene.add.ellipse(640,487,1280,94,0x0c1718,.97));
    for(let x=60;x<1280;x+=130)root.add(this.scene.add.circle(x,485+(x%3)*5,18+(x%4)*5,0x17231d,.9));
    root.add(this.scene.add.rectangle(640,510,1280,4,0x4f3738,.55));
  }
}

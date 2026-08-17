import Phaser from 'phaser';
import type{BattlefieldMode}from'./BattlefieldMode';

export class BattlefieldPresenter{
  constructor(private scene:Phaser.Scene,private world:Phaser.GameObjects.Container){}

  build(mode:BattlefieldMode){
    const root=this.scene.add.container().setData('battlefield',true);
    const add=(...items:Phaser.GameObjects.GameObject[])=>{root.add(items);return items};
    if(mode==='rooftop')add(this.scene.add.image(640,360,'bg-world01-rooftop-candidate').setDisplaySize(1280,720));
    else{
      add(
        this.scene.add.tileSprite(640,290,1280,520,'bg-sky').setTint(mode==='wayside'?0x313241:0x172936),
        this.scene.add.tileSprite(640,305,1280,520,'bg-mountains-1').setTint(mode==='exploration'?0x24382e:0x594653).setAlpha(.64),
        this.scene.add.tileSprite(640,326,1280,520,'bg-mountains-2').setTint(0x213039).setAlpha(.78),
      );
      if(mode==='wayside')this.wayside(root);else this.exploration(root);
    }
    add(this.scene.add.rectangle(640,630,1280,180,0x07101b,.98));
    this.world.add(root);return root;
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

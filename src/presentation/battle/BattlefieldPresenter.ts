import Phaser from 'phaser';
import type{BattlefieldMode}from'./BattlefieldMode';

/** Presentation-only battlefield treatment. Keep gameplay geometry out of here. */
export class BattlefieldPresenter{
  constructor(private scene:Phaser.Scene,private world:Phaser.GameObjects.Container){}

  build(mode:BattlefieldMode){
    const root=this.scene.add.container().setData('battlefield',true);
    const add=(...items:Phaser.GameObjects.GameObject[])=>{root.add(items);return items};
    if(mode==='rooftop'){
      add(this.scene.add.image(640,360,'bg-world01-rooftop-candidate').setDisplaySize(1280,720).setTint(0xd7e2e5));
    }else{
      add(
        this.scene.add.tileSprite(640,290,1280,520,'bg-sky').setTint(mode==='wayside'?0x252b34:0x172b31),
        this.scene.add.tileSprite(640,305,1280,520,'bg-mountains-1').setTint(mode==='exploration'?0x24352e:0x4b4149).setAlpha(.52),
        this.scene.add.tileSprite(640,326,1280,520,'bg-mountains-2').setTint(0x1c2a31).setAlpha(.68),
      );
      if(mode==='wayside')this.wayside(root);else this.exploration(root);
    }

    // Combat readability pass: a restrained ground band, center-stage haze and edge vignette.
    // These are intentionally broad shapes: the background must support sprites, intent lines and FX.
    add(this.scene.add.rectangle(640,505,1280,3,0x8d7567,.34));
    add(this.scene.add.rectangle(640,571,1280,132,0x071018,.88));
    add(this.scene.add.ellipse(640,405,610,310,0x8fb1b5,.035));
    add(this.scene.add.rectangle(640,630,1280,180,0x050a11,.985));
    add(this.scene.add.rectangle(640,544,1280,2,0x4d6770,.32));
    add(this.scene.add.rectangle(14,300,28,600,0x020407,.30),this.scene.add.rectangle(1266,300,28,600,0x020407,.30));
    this.world.add(root);return root;
  }

  private wayside(root:Phaser.GameObjects.Container){
    root.add(this.scene.add.tileSprite(640,350,1280,420,'bg-trees').setTint(0x11191c).setAlpha(.68));
    const train=this.scene.add.container(930,210).setAlpha(.25);
    train.add(this.scene.add.rectangle(0,0,430,58,0x171419,.95).setStrokeStyle(1,0x75424a,.45));
    for(let x=-170;x<=170;x+=85)train.add(this.scene.add.rectangle(x,-3,48,24,0x594354,.38));
    train.add(this.scene.add.rectangle(0,31,470,7,0x8a4d54,.42));root.add(train);
    root.add(this.scene.add.rectangle(640,494,1280,24,0x141416,.96));
    root.add(this.scene.add.rectangle(640,510,1280,4,0x765f53,.52));
    root.add(this.scene.add.rectangle(640,525,1280,4,0x403331,.75));
    for(let x=25;x<1280;x+=82)root.add(this.scene.add.rectangle(x,530,52,7,0x2d2523,.72));
  }

  private exploration(root:Phaser.GameObjects.Container){
    root.add(this.scene.add.tileSprite(640,350,1280,430,'bg-trees').setTint(0x101918).setAlpha(.78));
    const torii=this.scene.add.container(650,248).setAlpha(.22);
    torii.add([this.scene.add.rectangle(-92,116,20,235,0x2d1820,.95),this.scene.add.rectangle(92,116,20,235,0x2d1820,.95),this.scene.add.rectangle(0,6,255,20,0x3d2028,.96),this.scene.add.rectangle(0,-12,292,12,0x542932,.9)]);root.add(torii);
    root.add(this.scene.add.ellipse(640,487,1280,94,0x0c1617,.95));
    for(let x=60;x<1280;x+=130)root.add(this.scene.add.circle(x,485+(x%3)*5,18+(x%4)*5,0x17211d,.72));
    root.add(this.scene.add.rectangle(640,510,1280,4,0x4f3738,.42));
  }
}

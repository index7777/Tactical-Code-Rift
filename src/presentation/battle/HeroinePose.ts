import type Phaser from'phaser';

export type HeroinePose='idle'|'ready'|'strike'|'down';

export function playHeroinePose(sprite:Phaser.GameObjects.Sprite|undefined,pose:HeroinePose):void{
  if(!sprite?.getData('heroine'))return;
  const poseLocked=Boolean(sprite.getData('poseLocked'));
  if(!poseLocked)sprite.play(`heroine-${pose}`);
  const source=sprite.texture.getSourceImage()as{width:number;height:number};
  // The down drawing is naturally much wider and shorter. Keeping it at the
  // standing display height would enlarge the body during death.
  const height=Number(sprite.getData('heroHeight'))*(pose==='down'&&!poseLocked?0.52:1);
  if(height>0&&source.width>0&&source.height>0)sprite.setDisplaySize(Math.round(height*source.width/source.height),height)
}

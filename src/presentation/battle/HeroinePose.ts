import type Phaser from'phaser';

export type HeroinePose='idle'|'ready'|'strike'|'down';

/**
 * Keeps the important silhouette readable after the 1280x720 canvas is fitted
 * into a small landscape viewport. These are display pixels, not source-art
 * pixels; the master texture remains the single source of truth.
 */
export function heroineDisplayHeight(playerCount:number):number{
  return playerCount<=1?160:playerCount===2?138:playerCount===3?122:108;
}

export function playHeroinePose(sprite:Phaser.GameObjects.Sprite|undefined,pose:HeroinePose):void{
  if(!sprite?.getData('heroine'))return;
  const poseLocked=Boolean(sprite.getData('poseLocked'));
  const prefix=sprite.getData('poseAssetPrefix') as string|undefined;
  if(poseLocked&&prefix){
    const poseSprite=sprite as Phaser.GameObjects.Sprite&{setTexture?: (key:string)=>unknown};
    poseSprite.setTexture?.(pose==='idle'?`${prefix}-idle`:`${prefix}-${pose}`);
  }else if(!poseLocked)sprite.play(`heroine-${pose}`);
  const source=sprite.texture.getSourceImage()as{width:number;height:number};
  // The down drawing is naturally much wider and shorter. Keeping it at the
  // standing display height would enlarge the body during death.
  const isDown=pose==='down';
  const height=Number(sprite.getData('heroHeight'))*(isDown?0.52:1);
  if(height>0&&source.width>0&&source.height>0)sprite.setDisplaySize(Math.round(height*source.width/source.height),height);
  const baseY=Number(sprite.getData('heroBaseY')??-8);
  const baseHeight=Number(sprite.getData('heroHeight'));
  const runtimePosition=sprite as Phaser.GameObjects.Sprite&{setY?: (y:number)=>unknown};
  runtimePosition.setY?.(baseY+(isDown?Math.max(0,(baseHeight-height)/2):0));
  // PB/PC currently share their approved-pending Master texture for all
  // poses.  Keep the low-cost runtime pose readable without fabricating a
  // second drawing: a short fall angle plus a muted tint communicates Down.
  if(poseLocked){
    const runtimeSprite=sprite as Phaser.GameObjects.Sprite&{setAngle?: (angle:number)=>unknown;setTint?: (tint:number)=>unknown};
    runtimeSprite.setAngle?.(isDown?78:0);
    runtimeSprite.setTint?.(isDown?0x8d7888:0xffffff);
  }
}

import type Phaser from'phaser';

export type HeroinePose='idle'|'ready'|'strike'|'hit'|'down';
export type HeroineFrameVariant='a'|'b';

/**
 * Display height on the 1280x720 combat canvas. The source art stays high-res;
 * only the runtime presentation is normalized here.
 */
export function heroineDisplayHeight(playerCount:number):number{
  return playerCount<=1?160:playerCount===2?138:playerCount===3?122:108;
}

function stopIdleLoop(sprite:Phaser.GameObjects.Sprite){
  const timer=sprite.getData('heroineIdleTimer') as Phaser.Time.TimerEvent|undefined;
  timer?.remove(false);
  sprite.setData('heroineIdleTimer',undefined);
}

function poseTextureKey(prefix:string,pose:HeroinePose,variant:HeroineFrameVariant):string{
  if(pose==='idle')return `${prefix}-idle-${variant}`;
  if(pose==='strike')return `${prefix}-attack-${variant}`;
  if(pose==='hit')return `${prefix}-hit-${variant}`;
  return `${prefix}-${pose}`;
}

function applyTexture(sprite:Phaser.GameObjects.Sprite,prefix:string,pose:HeroinePose,variant:HeroineFrameVariant){
  const key=poseTextureKey(prefix,pose,variant);
  if(sprite.scene?.textures.exists(key))sprite.setTexture(key);
  else{
    // Fallback keeps older projects compatible if a new pose frame is missing.
    const fallback=pose==='strike'?`${prefix}-attack`:pose==='hit'?`${prefix}-hit`:`${prefix}-${pose}`;
    if(sprite.scene?.textures.exists(fallback))sprite.setTexture(fallback);
  }
}

function normalizePoseSize(sprite:Phaser.GameObjects.Sprite,pose:HeroinePose){
  const source=sprite.texture.getSourceImage()as{width:number;height:number};
  const baseHeight=Number(sprite.getData('heroHeight'));
  const isDown=pose==='down';
  const dedicated=Boolean(sprite.getData('poseLocked'));
  const height=baseHeight*(isDown?(dedicated?0.9:0.52):1);
  if(height>0&&source.width>0&&source.height>0)sprite.setDisplaySize(Math.round(height*source.width/source.height),height);
  const baseY=Number(sprite.getData('heroBaseY')??-8);
  sprite.setY(baseY+(isDown?Math.max(0,(baseHeight-height)/2):0));
  if(dedicated){
    sprite.setAngle(0);
    sprite.setTint(isDown?0xb9aab4:0xffffff);
  }
}

function startIdleLoop(sprite:Phaser.GameObjects.Sprite,prefix:string){
  stopIdleLoop(sprite);
  let frame:HeroineFrameVariant='a';
  applyTexture(sprite,prefix,'idle',frame);
  normalizePoseSize(sprite,'idle');
  const timer=sprite.scene.time.addEvent({
    delay:620,
    loop:true,
    callback:()=>{
      if(!sprite.active){timer.remove(false);return}
      frame=frame==='a'?'b':'a';
      applyTexture(sprite,prefix,'idle',frame);
      normalizePoseSize(sprite,'idle');
    },
  });
  sprite.setData('heroineIdleTimer',timer);
}

/**
 * Shared runtime pose switcher. Dedicated Character Masters use real texture
 * frames; legacy sprites keep their animation fallback.
 */
export function playHeroinePose(sprite:Phaser.GameObjects.Sprite|undefined,pose:HeroinePose,variant:HeroineFrameVariant='a'):void{
  if(!sprite?.getData('heroine'))return;
  stopIdleLoop(sprite);
  const rawPrefix=sprite.getData('poseAssetPrefix');
  const prefix=typeof rawPrefix==='string'?rawPrefix:undefined;
  if(prefix){
    if(pose==='idle')startIdleLoop(sprite,prefix);
    else{
      applyTexture(sprite,prefix,pose,variant);
      normalizePoseSize(sprite,pose);
    }
    return;
  }
  if(Boolean(sprite.getData('poseLocked'))){normalizePoseSize(sprite,pose);return;}
  if(pose==='hit'){
    sprite.play('heroine-ready');
    normalizePoseSize(sprite,'ready');
    return;
  }
  sprite.play(`heroine-${pose}`);
  normalizePoseSize(sprite,pose);
}

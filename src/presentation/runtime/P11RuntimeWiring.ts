import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { ActionPresenter } from '../battle/ActionPresenter';
import { ClashPresenter, type VisualActor } from '../battle/ClashPresenter';
import { storyEncounter } from '../../core/route/EncounterCatalog';
import { dealEnemySkillsForArchetypes } from '../../core/battle/EnemySkills';
import type { EnemyArchetype } from '../../core/battle/BattleTypes';

// Transitional P11.4 wiring layer. BootScene is still a large scene monolith, so
// these hooks keep integration changes isolated until the scene is split into
// dedicated encounter / hand / timeline presenters.
const runtimeKey='__p11_4_runtime_wiring_installed__';
const runtimeGlobal=globalThis as typeof globalThis&Record<string,unknown>;

const enemyFxIds:EnemyArchetype[]=[
  'wet-corpse','lantern-child','mountain-hound','wayfarer-umbrella',
  'noose-ghost','lost-monk','rain-warrior','rain-boss',
];

function roleSpeed(role:EnemyArchetype){
  if(role==='swift'||role==='lantern-child'||role==='mountain-hound')return Phaser.Math.Between(7,9);
  if(role==='crusher'||role==='wayfarer-umbrella'||role==='rain-warrior'||role==='rain-boss')return Phaser.Math.Between(3,5);
  return Phaser.Math.Between(5,7);
}

function addFxImage(ctx:any,key:string,x:number,y:number,opts?:{scale?:number;alpha?:number;flipX?:boolean;rotation?:number}){
  if(!ctx.scene?.textures?.exists(key))return undefined;
  const image=ctx.scene.add.image(x,y,key)
    .setDepth(114)
    .setAlpha(opts?.alpha??1)
    .setScale(opts?.scale??1)
    .setFlipX(Boolean(opts?.flipX))
    .setRotation(opts?.rotation??0)
    .setBlendMode(Phaser.BlendModes.ADD);
  ctx.combatLayer?.add(image);
  return image;
}

function enemySignature(ctx:any,actor:VisualActor|undefined,x:number,y:number,flip=false,scale=1){
  const role=(actor as VisualActor&{archetype?:EnemyArchetype}|undefined)?.archetype;
  if(!role)return;
  const image=addFxImage(ctx,`fx-p11-enemy-${role}`,x,y,{scale:.46*scale,alpha:.96,flipX:flip});
  if(image)ctx.scene.tweens.add({targets:image,scale:(image.scaleX||1)*1.14,alpha:0,duration:220,ease:'Expo.easeOut',onComplete:()=>image.destroy()});
}

function enemyArc(ctx:any,x:number,y:number,flip=false,scale=1){
  const dir=flip?-1:1;
  ['fx-p10-enemy-arc-slash-1','fx-p10-enemy-arc-slash-2'].forEach((key,i)=>ctx.scene.time.delayedCall(i*24,()=>{
    const image=addFxImage(ctx,key,x+dir*(i?16:-10),y+(i?8:-6),{scale:(.74+i*.08)*scale,alpha:i?.72:.94,flipX:flip});
    if(image)ctx.scene.tweens.add({targets:image,scale:(image.scaleX||1)*1.12,alpha:0,duration:160+i*24,ease:'Expo.easeOut',onComplete:()=>image.destroy()});
  }));
}

function patchBootScene(){
  const proto=BootScene.prototype as any;

  const originalInit=proto.init;
  proto.init=function(data?:{battlefield?:string;journeyNodeId?:string;pc?:number;ec?:number}){
    originalInit.call(this,data);
    const encounter=storyEncounter(this.journeyNodeId);
    if(encounter){
      if(!data?.battlefield)this.requestedBattlefield=encounter.battlefield;
      if(typeof data?.ec!=='number')this.ec=encounter.enemies.length;
    }
  };

  const originalPreload=proto.preload;
  proto.preload=function(){
    originalPreload.call(this);
    for(const id of enemyFxIds)this.load.image(`fx-p11-enemy-${id}`,`assets/battle/fx/enemy/p11-${id}-slash.svg`);
    for(const family of ['attack','defense','support','tactics'])this.load.image(`card-frame-${family}`,`assets/battle/cards/frames/${family}.svg`);
  };

  // Make EncounterCatalog the final authority after legacy rebuild data has
  // created the scene. This keeps proof/debug query modes untouched.
  const originalRebuild=proto.rebuild;
  proto.rebuild=function(){
    originalRebuild.call(this);
    const params=new URLSearchParams(window.location.search);
    const proof=params.has('monster-proof')||params.has('death-proof')||params.has('relay-proof')||params.has('result-proof')||params.has('outcome-proof');
    const encounter=proof?undefined:storyEncounter(this.journeyNodeId);
    if(!encounter||!this.enemies?.size)return;

    const targetIds=[...this.players.entries()].filter(([,actor]:any)=>actor.alive).map(([id]:[string,unknown])=>id);
    if(!targetIds.length)return;
    const skills=dealEnemySkillsForArchetypes(encounter.enemies);
    const enemyEntries=[...this.enemies.entries()] as [string,any][];
    enemyEntries.forEach(([actorId,actor],index)=>{
      const role=encounter.enemies[index];if(!role)return;
      actor.archetype=role;
      const key=`monster-${role}`;
      if(actor.sprite&&this.textures.exists(key)){
        actor.sprite.anims?.stop();actor.sprite.setTexture(key).clearTint();
        const source=actor.sprite.texture.getSourceImage() as {width:number;height:number};
        const targetHeight=role==='rain-warrior'||role==='rain-boss'?114:100;
        if(source.width>0&&source.height>0)actor.sprite.setDisplaySize(Math.round(targetHeight*source.width/source.height),targetHeight);
      }
      const node=this.timeline.find((item:any)=>item.team==='enemy'&&item.actorId===actorId);
      const skill=skills[index];
      if(node&&skill){node.speed=roleSpeed(role);node.initiative=undefined;node.enemySkill={id:`${actorId}-skill-r${this.round}`, ...skill,targetId:Phaser.Math.RND.pick(targetIds)}}
    });
    this.timeline.sort((a:any,b:any)=>b.speed-a.speed||(a.team==='player'?-1:1)).forEach((node:any,index:number)=>node.order=index);
    this.renderTimeline();this.renderEnemyIntents();
  };

  // Replace the left current-actor rectangle with the requested diamond crop.
  const originalTimeline=proto.renderTimeline;
  proto.renderTimeline=function(){
    originalTimeline.call(this);
    const layer=this.timelineLayer as Phaser.GameObjects.Container|undefined;if(!layer)return;
    for(const item of [...layer.list] as any[]){
      const x=Number(item.x),y=Number(item.y);
      if(Number.isFinite(x)&&Number.isFinite(y)&&x<170&&y<86)item.destroy();
    }
    const current=this.currentPlanner?.()??this.timeline?.[0];if(!current)return;
    const actor=(current.team==='player'?this.players:this.enemies)?.get(current.actorId);
    const teamColor=current.team==='player'?0x8fefff:0xff8298;
    const base=this.portraitBaseForNode?.(current)??'';
    const portraitKey=base?`portrait-${base}-current`:'';
    const diamond=this.add.polygon(42,42,[0,-35,35,0,0,35,-35,0],0x02070b,1).setStrokeStyle(3,teamColor,.98);
    layer.add(diamond);
    if(portraitKey&&this.textures.exists(portraitKey)){
      const maskShape=this.add.graphics().fillStyle(0xffffff,1).fillPoints([
        new Phaser.Math.Vector2(42,7),new Phaser.Math.Vector2(77,42),new Phaser.Math.Vector2(42,77),new Phaser.Math.Vector2(7,42),
      ],true).setVisible(false);
      const portrait=this.add.image(42,42,portraitKey).setDisplaySize(70,70).setMask(maskShape.createGeometryMask());
      layer.add([maskShape,portrait]);
      layer.add(this.add.polygon(42,42,[0,-35,35,0,0,35,-35,0],0xffffff,0).setStrokeStyle(2,teamColor,1));
    }
    const displayName=this.actorDisplayName?.(current.team,current.actorId,actor?.archetype)??current.actorId;
    layer.add(this.add.text(104,27,'行動',{fontFamily:'sans-serif',fontSize:'9px',fontStyle:'bold',color:'#e8c978'}).setOrigin(.5));
    layer.add(this.add.text(104,45,displayName,{fontFamily:'serif',fontSize:'15px',fontStyle:'bold',color:'#fff'}).setOrigin(.5));
    layer.add(this.add.text(104,64,`時序 ${current.initiative??current.speed}`,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:current.team==='player'?'#9eefff':'#ff9aac'}).setOrigin(.5));
  };

  // Overlay the formal P11.4 card-frame family without changing card mechanics.
  const originalHand=proto.renderHand;
  proto.renderHand=function(){
    originalHand.call(this);
    const layer=this.handLayer as Phaser.GameObjects.Container|undefined;if(!layer)return;
    const assigned=new Set([...this.commands.values()].filter(Boolean).map((command:any)=>command.card.instanceId));
    const cards=this.deck.hand.filter((card:any)=>!assigned.has(card.instanceId)).slice(0,this.visibleHandCount);
    const cardContainers=([...layer.list] as any[]).filter(item=>item instanceof Phaser.GameObjects.Container&&item.y>600&&item.list?.some((child:any)=>child instanceof Phaser.GameObjects.Rectangle&&Math.round(child.width)===120&&Math.round(child.height)===150)).sort((a,b)=>a.x-b.x);
    cardContainers.forEach((container:any,index:number)=>{
      if(container.getData('p11CardFrame'))return;
      const card=cards[index];if(!card)return;
      const family=card.intent==='defense'?'defense':card.intent==='support'?'support':card.intent==='disruption'?'tactics':'attack';
      const key=`card-frame-${family}`;if(!this.textures.exists(key))return;
      const invalid=this.cardInvalidReason?.(card);
      const skin=this.add.image(0,0,key).setDisplaySize(120,150).setAlpha(invalid?.4:.88);
      container.addAt(skin,Math.min(1,container.length));container.setData('p11CardFrame',true);
    });
  };
}

function patchBattleLog(){
  const textProto=Phaser.GameObjects.Text.prototype as any;
  if(textProto.__p11SetTextPatched)return;
  const original=textProto.setText;
  textProto.setText=function(value:string|string[]){
    if(typeof value==='string'){
      const match=value.match(/^P[A-D] → E[A-D](?:｜追擊 (\d+))?(?:｜(側襲))?$/);
      if(match)value=[match[1]?`追擊 ${match[1]}`:'',match[2]??''].filter(Boolean).join('｜');
      else if(/^P[A-D] 跳過｜/.test(value))value=value.replace(/^P[A-D] 跳過｜/,'跳過｜');
    }
    return original.call(this,value)
  };
  textProto.__p11SetTextPatched=true;
}

function patchActionPresenter(){
  const proto=ActionPresenter.prototype as any;
  const originalAttack=proto.attack;
  proto.attack=async function(...args:any[]){
    const enemy=Boolean(args[3]);this.__p11EnemyActor=enemy?this.enemies?.get(args[0]):undefined;
    try{return await originalAttack.apply(this,args)}finally{this.__p11EnemyActor=undefined}
  };
  const originalRelay=proto.relay;
  proto.relay=async function(...args:any[]){
    const enemy=Boolean(args[3]);this.__p11EnemyActor=enemy?this.enemies?.get(args[0]):undefined;
    try{return await originalRelay.apply(this,args)}finally{this.__p11EnemyActor=undefined}
  };
  const originalSlash=proto.slash;
  proto.slash=function(x:number,y:number,flip=false,scale=1,color?:number){
    if(this.__p11EnemyActor){enemyArc(this,x,y,flip,scale);return}
    return originalSlash.call(this,x,y,flip,scale,color)
  };
  const originalCardImpact=proto.cardImpact;
  proto.cardImpact=function(x:number,y:number,definitionId?:string,flip=false,...rest:any[]){
    if(this.__p11EnemyActor){
      enemySignature(this,this.__p11EnemyActor,x,y,flip,definitionId==='heavy'||definitionId==='break'?1.18:1);
      enemyArc(this,x,y,flip,definitionId==='heavy'||definitionId==='break'?1.25:1.05);
      const core=this.scene.add.circle(x,y,24,0xfff2f6,.92).setDepth(118);this.combatLayer.add(core);
      this.scene.tweens.add({targets:core,scale:3.8,alpha:0,duration:130,ease:'Cubic.easeOut',onComplete:()=>core.destroy()});
      return
    }
    return originalCardImpact.call(this,x,y,definitionId,flip,...rest)
  };
}

function patchClashPresenter(){
  const proto=ClashPresenter.prototype as any;
  const originalPlay=proto.play;
  proto.play=async function(clash:any,...rest:any[]){
    const enemy=this.enemies?.get(clash.enemy.actorId) as VisualActor|undefined;
    const protectedActor=this.players?.get(clash.enemy.enemySkill?.targetId);
    const clashY=clash.source==='intercept'&&protectedActor?Phaser.Math.Clamp(protectedActor.root.y,190,458):Phaser.Math.Clamp((this.players.get(clash.player.actorId).root.y+enemy!.root.y)/2,190,458);
    const clashX=clash.source==='intercept'&&protectedActor?Phaser.Math.Clamp(protectedActor.root.x+150,380,520):640;
    const timer=this.scene.time.delayedCall(910,()=>enemySignature(this,enemy,clashX,clashY-13,false,1.08));
    try{return await originalPlay.call(this,clash,...rest)}finally{if(!timer.hasDispatched)timer.remove(false)}
  };
}

if(!runtimeGlobal[runtimeKey]){
  runtimeGlobal[runtimeKey]=true;
  patchBootScene();
  patchBattleLog();
  patchActionPresenter();
  patchClashPresenter();
}

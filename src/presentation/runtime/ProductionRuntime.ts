import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';

const legacyParams=[
  'battle','scene','draw-proof','result-proof','multi-cover-proof','card-proof',
  'monster-proof','boss-proof','death-proof','outcome-proof','relay-proof','journey',
];

function scrubLegacyQuery(){
  const url=new URL(window.location.href);
  let changed=false;
  for(const key of legacyParams)if(url.searchParams.has(key)){url.searchParams.delete(key);changed=true}
  if(changed)history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`)
}

function removeLegacyBattleControls(scene:any){
  const labels=new Set(['重新開始','P−','P+','E−','E+']);
  for(const item of [...(scene.hudLayer?.list??[])]){
    if(item instanceof Phaser.GameObjects.Text&&labels.has(item.text))item.destroy()
  }
  scene.input?.keyboard?.off('keydown-Q');
  scene.input?.keyboard?.off('keydown-W');
  scene.input?.keyboard?.off('keydown-A');
  scene.input?.keyboard?.off('keydown-S');
  scene.input?.keyboard?.off('keydown-T');
  if(scene.phase?.text?.includes('開發工具'))scene.phase.setText('')
}

function installProductionStatus(scene:any){
  const status=scene.status as Phaser.GameObjects.Text|undefined;
  if(!status||status.getData('productionStatus'))return;
  const original=status.setText.bind(status);
  status.setData('productionStatus',true);
  status.setText=((value:string|string[])=>{
    if(typeof value==='string'){
      const pursuit=value.match(/^P[A-D] → E[A-D](?:｜追擊 (\d+))?(?:｜(側襲))?$/);
      if(pursuit)value=[pursuit[1]?`追擊 ${pursuit[1]}`:'',pursuit[2]??''].filter(Boolean).join('｜');
      else if(/^P[A-D] 跳過｜/.test(value))value=value.replace(/^P[A-D] 跳過｜/,'跳過｜');
      else if(value.includes('開發工具'))value='';
    }
    return original(value)
  }) as typeof status.setText;
}

const proto=BootScene.prototype as any;
const originalInit=proto.init;
proto.init=function(data?:{battlefield?:string;journeyNodeId?:string}){
  originalInit.call(this,{battlefield:data?.battlefield,journeyNodeId:data?.journeyNodeId})
};

// Keep the legacy red-hit rejection local to battle actors instead of
// monkey-patching Phaser.Sprite globally. This can be deleted once BootScene's
// old damage path is split out and the deprecated tint call is removed there.
const originalAddActor=proto.addActor;
proto.addActor=function(f:any){
  originalAddActor.call(this,f);
  const actor=(f.team==='player'?this.players:this.enemies)?.get(f.id);
  const sprite=actor?.sprite as (Phaser.GameObjects.Sprite&{__productionTintGuard?:boolean})|undefined;
  if(!sprite||sprite.__productionTintGuard)return;
  sprite.__productionTintGuard=true;
  const originalSetTint=sprite.setTint.bind(sprite);
  sprite.setTint=((...colors:number[])=>{
    if(colors[0]===0xff5060)return sprite;
    return originalSetTint(...colors)
  }) as typeof sprite.setTint
};

const originalCreate=proto.create;
proto.create=function(){
  originalCreate.call(this);
  removeLegacyBattleControls(this);
  installProductionStatus(this)
};

// The old update loop only existed for the T-key developer palette.
proto.update=function(){};
if(typeof proto.setDevTools==='function')proto.setDevTools=function(){};

scrubLegacyQuery();

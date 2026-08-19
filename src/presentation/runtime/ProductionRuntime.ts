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

const proto=BootScene.prototype as any;
const originalInit=proto.init;
proto.init=function(data?:{battlefield?:string;journeyNodeId?:string}){
  originalInit.call(this,{battlefield:data?.battlefield,journeyNodeId:data?.journeyNodeId})
};

const originalCreate=proto.create;
proto.create=function(){
  originalCreate.call(this);
  removeLegacyBattleControls(this)
};

proto.update=function(){};
if(typeof proto.setDevTools==='function')proto.setDevTools=function(){};

scrubLegacyQuery();

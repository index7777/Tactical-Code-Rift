import Phaser from 'phaser';
import './styles.css';
import './input-lock.css';
import { BootScene } from './presentation/scenes/BootScene';
import{JourneyScene}from'./presentation/scenes/JourneyScene';

// P11.4 compatibility guard: old battle code still contains a deprecated
// full-sprite damage tint (0xff5060). Presentation now owns hit feedback via
// neutral alpha/contact flashes, so reject that one legacy tint globally until
// the large BootScene damage path is split out of the scene monolith.
const spritePrototype=Phaser.GameObjects.Sprite.prototype as unknown as{setTint:(...colors:number[])=>Phaser.GameObjects.Sprite};
const originalSpriteSetTint=spritePrototype.setTint;
spritePrototype.setTint=function(...colors:number[]){
  if(colors[0]===0xff5060)return this as unknown as Phaser.GameObjects.Sprite;
  return originalSpriteSetTint.apply(this,colors)
};

for(const eventName of ['contextmenu','dragstart','selectstart'] as const){
  document.addEventListener(eventName,(event)=>event.preventDefault(),{capture:true});
}
const config: Phaser.Types.Core.GameConfig={type:Phaser.AUTO,parent:'game',backgroundColor:'#090c18',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1280,height:720},input:{activePointers:3},scene:[BootScene,JourneyScene]};
new Phaser.Game(config);

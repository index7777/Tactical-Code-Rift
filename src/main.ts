import Phaser from 'phaser';
import './styles.css';
import './input-lock.css';
import { BootScene } from './presentation/scenes/BootScene';
import{JourneyScene}from'./presentation/scenes/JourneyScene';
for(const eventName of ['contextmenu','dragstart','selectstart'] as const){
  document.addEventListener(eventName,(event)=>event.preventDefault(),{capture:true});
}
const config: Phaser.Types.Core.GameConfig={type:Phaser.AUTO,parent:'game',backgroundColor:'#090c18',render:{antialias:true,pixelArt:false,roundPixels:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1280,height:720},input:{activePointers:3},scene:[BootScene,JourneyScene]};
new Phaser.Game(config);

import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './presentation/scenes/BootScene';
const config: Phaser.Types.Core.GameConfig={type:Phaser.AUTO,parent:'game',backgroundColor:'#090c18',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:1280,height:720},input:{activePointers:3},scene:[BootScene]};
new Phaser.Game(config);

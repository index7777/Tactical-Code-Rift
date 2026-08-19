import Phaser from'phaser';
import{availableStoryNodes,createJourneyState,moveJourney,type JourneyState,type StoryNodeType}from'../../core/route/RouteGenerator';
import{JOURNEY_MUSIC_FADE_IN_MS,JOURNEY_MUSIC_FADE_OUT_MS,journeyLoopFadeDelayMs}from'../../core/audio/JourneyMusicPolicy';

const labels:Record<StoryNodeType,string>={departure:'出發',battle:'迎擊',event:'事件',exploration:'探索',companion:'伙伴',elite:'精英',boss:'王'};
const colors:Record<StoryNodeType,number>={departure:0x477889,battle:0x963d50,event:0x74578c,exploration:0x367360,companion:0x3b7896,elite:0xb56a34,boss:0x8e263c};

export class JourneyScene extends Phaser.Scene{
  private journeyMusic?:Phaser.Sound.BaseSound;private loopTimer?:Phaser.Time.TimerEvent;private leavingMap=false;
  constructor(){super('JourneyScene')}
  preload(){this.load.audio('journey-world-01','assets/music/world-01/zone1-train-bgm.mp3');this.load.image('journey-bg-world01','assets/journey/world01/route-bg-rainfall-ridgeline.svg');this.load.image('journey-train-token','assets/journey/world01/train-token-topdown.svg')}
  create(){
    this.startJourneyMusic();
    const state=(this.registry.get('journey-state')as JourneyState|undefined)??createJourneyState();this.registry.set('journey-state',state);
    this.add.image(640,360,'journey-bg-world01').setDisplaySize(1280,720).setAlpha(.72);this.add.rectangle(640,360,1280,720,0x07101a,.22);this.add.circle(1060,145,78,0xb8c5d6,.12).setStrokeStyle(2,0xdde8ef,.16);
    for(let i=0;i<5;i++)this.add.ellipse(220+i*245,540+(i%2)*28,420,145,0x13252a,.78);
    this.add.text(52,42,'妖異鐵道',{fontFamily:'serif',fontSize:'30px',fontStyle:'bold',color:'#f2dfc0'});
    this.add.text(52,82,'沿因果軌道前往終點',{fontFamily:'sans-serif',fontSize:'14px',color:'#84abb4'});
    const available=new Set(availableStoryNodes(state).map(n=>n.id)),visited=new Set(state.visitedIds);
    const pos=(column:number,lane:number)=>({x:125+column*205,y:245+lane*118});
    for(const node of state.route.nodes)for(const nextId of node.nextIds){const next=state.route.nodes.find(n=>n.id===nextId)!;const a=pos(node.column,node.lane),b=pos(next.column,next.lane);this.add.line(0,0,a.x,a.y,b.x,b.y,visited.has(node.id)?0x547d83:0x273e47,visited.has(node.id)?.82:.45).setOrigin(0).setLineWidth(visited.has(node.id)?4:2)}
    for(const node of state.route.nodes){const p=pos(node.column,node.lane),active=available.has(node.id),done=visited.has(node.id),ring=this.add.circle(p.x,p.y,active?34:28,colors[node.type],done?1:active?.92:.42).setStrokeStyle(active?4:2,active?0xffe4a0:0x78909a,active?1:.45);const label=this.add.text(p.x,p.y,labels[node.type],{fontFamily:'sans-serif',fontSize:active?'15px':'13px',fontStyle:'bold',color:active?'#fff5dc':'#b1bec2'}).setOrigin(.5);if(active){ring.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.selectNode(state,node.id,p.x,p.y));label.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.selectNode(state,node.id,p.x,p.y))}}
    const current=state.route.nodes.find(n=>n.id===state.currentNodeId)!,cp=pos(current.column,current.lane);this.add.image(cp.x,cp.y+58,'journey-train-token').setDisplaySize(116,35).setData('train',true);
    this.add.text(640,655,available.size?'選擇下一段因果軌道':'主線終點尚待 Boss 實作',{fontFamily:'sans-serif',fontSize:'16px',color:'#d9c8ae'}).setOrigin(.5)
  }
  private selectNode(state:JourneyState,nodeId:string,x:number,y:number){
    const next=moveJourney(state,nodeId);this.registry.set('journey-state',next);const node=next.route.nodes.find(n=>n.id===nodeId)!,train=this.children.list.find(o=>o.getData('train'))as Phaser.GameObjects.Image;
    this.input.enabled=false;this.tweens.add({targets:train,x,y:y+58,duration:720,ease:'Sine.easeInOut',onComplete:()=>{
      if(node.type==='battle'||node.type==='elite'||node.type==='boss'){const veil=this.add.rectangle(640,360,1280,720,node.type==='boss'?0x26080d:0x061016,0).setDepth(200),label=this.add.text(640,360,node.type==='boss'?'終點・雨暮驛':node.type==='elite'?'精英遭遇':'戰鬥開始',{fontFamily:'serif',fontSize:node.type==='boss'?'34px':'26px',fontStyle:'bold',color:'#fff1d6'}).setOrigin(.5).setDepth(201).setAlpha(0);this.tweens.add({targets:veil,alpha:.92,duration:360});this.tweens.add({targets:label,alpha:1,duration:260});this.time.delayedCall(420,()=>this.leaveJourneyMusic(()=>this.scene.start('BootScene',{journeyNodeId:node.id,battlefield:node.type==='elite'?'wayside':'rooftop'})))}
      else{this.input.enabled=true;this.add.text(640,610,`${labels[node.type]}節點已記錄｜內容於角色與 Boss 完成後補入`,{fontFamily:'sans-serif',fontSize:'16px',color:'#ccecf0',backgroundColor:'#102a32dd',padding:{x:16,y:8}}).setOrigin(.5);this.time.delayedCall(850,()=>this.scene.restart())}
    }})
  }
  private startJourneyMusic(){
    this.leavingMap=false;this.journeyMusic=this.sound.get('journey-world-01')??this.sound.add('journey-world-01',{loop:false,volume:0});
    if(!this.journeyMusic.isPlaying)this.journeyMusic.play({loop:false,volume:0});this.fadeJourneyMusic(.34,JOURNEY_MUSIC_FADE_IN_MS);this.scheduleJourneyLoop();
    this.game.events.off(Phaser.Core.Events.BLUR,this.onGameBlur,this);this.game.events.off(Phaser.Core.Events.FOCUS,this.onGameFocus,this);this.game.events.on(Phaser.Core.Events.BLUR,this.onGameBlur,this);this.game.events.on(Phaser.Core.Events.FOCUS,this.onGameFocus,this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.loopTimer?.remove(false);this.game.events.off(Phaser.Core.Events.BLUR,this.onGameBlur,this);this.game.events.off(Phaser.Core.Events.FOCUS,this.onGameFocus,this)})
  }
  private scheduleJourneyLoop(){
    this.loopTimer?.remove(false);if(!this.journeyMusic||this.leavingMap)return;const seek=(this.journeyMusic as Phaser.Sound.WebAudioSound|Phaser.Sound.HTML5AudioSound).seek,delay=journeyLoopFadeDelayMs(this.journeyMusic.duration,seek);
    if(delay===null){this.loopTimer=this.time.delayedCall(250,()=>this.scheduleJourneyLoop());return}
    this.loopTimer=this.time.delayedCall(delay,()=>{if(!this.journeyMusic||this.leavingMap)return;this.fadeJourneyMusic(0,JOURNEY_MUSIC_FADE_OUT_MS);this.loopTimer=this.time.delayedCall(JOURNEY_MUSIC_FADE_OUT_MS,()=>{if(!this.journeyMusic||this.leavingMap)return;this.journeyMusic.stop();this.journeyMusic.play({loop:false,volume:0});this.fadeJourneyMusic(.34,JOURNEY_MUSIC_FADE_IN_MS);this.scheduleJourneyLoop()})})
  }
  private fadeJourneyMusic(volume:number,duration:number){if(!this.journeyMusic)return;this.tweens.killTweensOf(this.journeyMusic);this.tweens.add({targets:this.journeyMusic,volume,duration,ease:'Sine.easeInOut'})}
  private leaveJourneyMusic(onComplete:()=>void){this.leavingMap=true;this.loopTimer?.remove(false);this.fadeJourneyMusic(0,650);this.time.delayedCall(650,()=>{this.journeyMusic?.stop();onComplete()})}
  private onGameBlur(){this.fadeJourneyMusic(0,450)}
  private onGameFocus(){if(!this.leavingMap)this.fadeJourneyMusic(.34,650)}
}

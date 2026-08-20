import Phaser from'phaser';
import{availableStoryNodes,createJourneyState,moveJourney,type JourneyState,type StoryNodeType,type StoryRouteNode}from'../../core/route/RouteGenerator';
import{storyEncounter}from'../../core/route/EncounterCatalog';
import{JOURNEY_MUSIC_FADE_IN_MS,JOURNEY_MUSIC_FADE_OUT_MS,journeyLoopFadeDelayMs}from'../../core/audio/JourneyMusicPolicy';

const labels:Record<StoryNodeType,string>={departure:'出發',battle:'迎擊',event:'事件',exploration:'探索',companion:'伙伴',elite:'精英',boss:'王'};
const routeAssetRoot='assets/journey/route-map-ui-v1';
const splitAssetRoot='assets/journey/route-map-runtime-v1';
const routeBackground='assets/journey/world01/area01-route-bg-runtime-trial-v2.png';
const nodeIcons:Record<StoryNodeType,string>={departure:'start',battle:'battle',event:'event',exploration:'rest',companion:'reward',elite:'elite',boss:'boss'};
const enemyNames:Record<string,string>={
  'wet-corpse':'濡骸','lantern-child':'提燈童','mountain-hound':'山犬','wayfarer-umbrella':'辻傘','noose-ghost':'縊鬼','lost-monk':'迷途僧','rain-warrior':'雨夜武者','rain-boss':'站守',
};
const routeCopy:Record<StoryNodeType,string>={
  departure:'列車自人界駛入雨暮山線。',
  battle:'前方殺生線正在收束。',
  event:'沿線傳來異常動靜，旅途可能因此改變。',
  exploration:'離車探索雨暮山道，尋找線索與補給。',
  companion:'有人正在前方等待黃泉列車。',
  elite:'前方有強烈殺意盤踞。',
  boss:'終點站的氣息正從雨幕深處逼近。',
};

export class JourneyScene extends Phaser.Scene{
  private journeyMusic?:Phaser.Sound.BaseSound;private loopTimer?:Phaser.Time.TimerEvent;private leavingMap=false;
  private previewTitle?:Phaser.GameObjects.Text;private previewBody?:Phaser.GameObjects.Text;private previewAccent?:Phaser.GameObjects.Rectangle;
  constructor(){super('JourneyScene')}
  preload(){
    this.load.audio('journey-world-01','assets/music/world-01/zone1-train-bgm.mp3');
    this.load.image('journey-bg-world01',routeBackground);
    this.load.image('journey-train-token','assets/journey/world01/train-token-topdown.svg');
    for(const name of ['normal','current','cleared','locked','elite','boss'])this.load.image(`route-node-frame-${name}`,`${splitAssetRoot}/node-frame/node-frame-${name}.png`);
    for(const name of ['start','battle','elite','boss','event','rest','reward'])this.load.image(`route-icon-${name}`,`${splitAssetRoot}/node-icon/icon-${name}.png`);
    for(const name of ['current-halo','available-pulse','cleared-ring','elite-aura','boss-aura'])this.load.image(`route-node-fx-${name}`,`${splitAssetRoot}/node-fx/fx-${name}.png`);
    for(const name of ['texture','glow','dot-normal','dot-current','dot-danger','particles-light','particles-danger'])this.load.image(`route-conn-${name}`,`${splitAssetRoot}/connection-primitives/conn-${name}.png`);
    for(const name of ['section-panel-frame-medium','section-panel-frame-wide','header-divider-line','info-accent-bar','corner-accent'])this.load.image(`route-frame-${name}`,`${routeAssetRoot}/frames/${name}.png`);
  }
  create(){
    this.startJourneyMusic();
    const state=(this.registry.get('journey-state')as JourneyState|undefined)??createJourneyState();this.registry.set('journey-state',state);
    this.add.image(640,360,'journey-bg-world01').setDisplaySize(1280,720);
    this.add.rectangle(640,360,1280,720,0x03080f,.2);
    this.add.rectangle(640,55,1280,110,0x03080d,.82).setStrokeStyle(1,0x8aa5ad,.15);
    this.add.rectangle(640,655,1280,130,0x02070b,.88).setStrokeStyle(1,0x7c969f,.2);
    this.add.image(640,107,'route-frame-header-divider-line').setDisplaySize(1092,12).setAlpha(.72);
    this.add.image(22,22,'route-frame-corner-accent').setDisplaySize(44,46).setOrigin(0).setAlpha(.72);
    this.add.text(48,28,'第一區・雨暮山線',{fontFamily:'serif',fontSize:'28px',fontStyle:'bold',color:'#f3e2c4'});
    this.add.text(50,66,'黃泉列車｜雨夜山道',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#8fb7bf'});
    this.add.text(1232,35,'路線進行',{fontFamily:'sans-serif',fontSize:'11px',fontStyle:'bold',color:'#c8d9dc'}).setOrigin(1,0);
    this.add.text(1232,58,`${Math.max(0,state.visitedIds.length-1)} / ${state.route.nodes.length-1}`,{fontFamily:'monospace',fontSize:'17px',fontStyle:'bold',color:'#e4c982'}).setOrigin(1,0);

    const available=new Set(availableStoryNodes(state).map(n=>n.id)),visited=new Set(state.visitedIds);
    const pos=(column:number,lane:number)=>({x:135+column*205,y:220+lane*122});
    for(const node of state.route.nodes)for(const nextId of node.nextIds){
      const next=state.route.nodes.find(n=>n.id===nextId)!;const a=pos(node.column,node.lane),b=pos(next.column,next.lane),travelled=visited.has(node.id)&&visited.has(next.id),open=available.has(next.id);
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),rotation=Math.atan2(dy,dx),danger=next.type==='elite'||next.type==='boss';
      const tint=danger?0xd6525d:travelled?0xd7e4e7:open?0xe8c571:0x527482;
      this.add.image((a.x+b.x)/2,(a.y+b.y)/2,'route-conn-glow').setDisplaySize(length+12,open?12:8).setRotation(rotation).setTint(tint).setAlpha(open?.72:travelled?.48:.24);
      this.add.image((a.x+b.x)/2,(a.y+b.y)/2,'route-conn-texture').setDisplaySize(length+8,4).setRotation(rotation).setTint(tint).setAlpha(travelled?.9:open?.84:.52);
      const dotKey=danger?'danger':open?'current':'normal';
      this.add.image((a.x+b.x)/2,(a.y+b.y)/2,`route-conn-dot-${dotKey}`).setDisplaySize(open?12:8,open?12:8).setAlpha(open?.8:.4);
      if(open)this.add.image((a.x+b.x)/2,(a.y+b.y)/2,`route-conn-particles-${danger?'danger':'light'}`).setDisplaySize(Math.min(92,length*.42),32).setRotation(rotation).setAlpha(.46);
    }

    this.buildPreviewPanel();
    const current=state.route.nodes.find(n=>n.id===state.currentNodeId)!;
    this.showNodePreview(current);
    for(const node of state.route.nodes){
      const p=pos(node.column,node.lane),active=available.has(node.id),done=visited.has(node.id),isCurrent=node.id===state.currentNodeId;
      const c=this.add.container(p.x,p.y);
      const frameKey=node.type==='boss'?'boss':node.type==='elite'?'elite':isCurrent?'current':done?'cleared':active?'normal':'locked';
      const stateFx=isCurrent?'current-halo':active?'available-pulse':done?'cleared-ring':undefined;
      const auraFx=node.type==='boss'?'boss-aura':node.type==='elite'?'elite-aura':undefined;
      const aura=auraFx?this.add.image(0,0,`route-node-fx-${auraFx}`).setDisplaySize(active||isCurrent?82:68,active||isCurrent?82:68).setAlpha(active||isCurrent?.72:.34):undefined;
      const halo=stateFx?this.add.image(0,0,`route-node-fx-${stateFx}`).setDisplaySize(active||isCurrent?74:62,active||isCurrent?74:62).setAlpha(active||isCurrent?.82:.5):undefined;
      const diamond=this.add.image(0,0,`route-node-frame-${frameKey}`).setDisplaySize(active||isCurrent?58:50,active||isCurrent?58:50);
      const glyph=this.add.text(0,0,node.type==='boss'?'終':node.type==='elite'?'武':node.type==='departure'?'始':'斬',{fontFamily:'serif',fontSize:active?'12px':'10px',fontStyle:'bold',color:active?'#fff0cf':done?'#c6e6e9':'#82949b'}).setOrigin(.5);
      const caption=this.add.text(0,29,labels[node.type],{fontFamily:'sans-serif',fontSize:'10px',fontStyle:'bold',color:active?'#fff0d3':done?'#bcd3d6':'#71848b'}).setOrigin(.5);
      const icon=this.add.image(0,0,`route-icon-${nodeIcons[node.type]}`).setDisplaySize(active?27:22,active?27:22).setAlpha(active?1:done?.9:.48);
      glyph.setVisible(false);c.add([...(aura?[aura]:[]),...(halo?[halo]:[]),diamond,icon,glyph,caption]);
      if(active){
        if(halo)this.tweens.add({targets:halo,scale:1.18,alpha:.24,duration:1200,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        const hit=this.add.circle(0,0,34,0xffffff,.001).setInteractive({useHandCursor:true});c.add(hit);
        hit.on('pointerover',()=>{c.setScale(1.08);this.showNodePreview(node)}).on('pointerout',()=>c.setScale(1)).on('pointerdown',()=>this.selectNode(state,node.id,p.x,p.y));
      }else{
        c.setAlpha(done?1:.72);c.setInteractive(new Phaser.Geom.Circle(0,0,28),Phaser.Geom.Circle.Contains).on('pointerover',()=>this.showNodePreview(node));
      }
    }
    const cp=pos(current.column,current.lane);this.add.image(cp.x,cp.y+54,'journey-train-token').setDisplaySize(112,34).setData('train',true).setDepth(20);
    this.add.text(48,624,'黃泉列車',{fontFamily:'serif',fontSize:'14px',fontStyle:'bold',color:'#e3d2b5'});
    this.add.text(48,648,available.size?'選擇下一段軌道；滑過節點可查看敵群。':'本區路線已抵達終點。',{fontFamily:'sans-serif',fontSize:'11px',color:'#92acb3'});
  }
  private buildPreviewPanel(){
    const x=860,y=600,w=370,h=92;this.add.image(x+w/2,y+h/2,'route-frame-section-panel-frame-medium').setDisplaySize(w,h).setAlpha(.96);
    this.previewAccent=this.add.rectangle(x+4,y+h/2,4,h-12,0x77b9c4,.9);
    this.previewTitle=this.add.text(x+18,y+12,'',{fontFamily:'serif',fontSize:'14px',fontStyle:'bold',color:'#f3e4c8'});
    this.previewBody=this.add.text(x+18,y+38,'',{fontFamily:'sans-serif',fontSize:'10px',color:'#b9cdd1',lineSpacing:4,wordWrap:{width:w-36}});
  }
  private showNodePreview(node:StoryRouteNode){
    const encounter=storyEncounter(node.id),accent=node.type==='boss'?0xc64c5a:node.type==='elite'?0xd09b54:0x77b9c4;
    this.previewAccent?.setFillStyle(accent,.95);
    this.previewTitle?.setText(encounter?.title??labels[node.type]);
    if(encounter){
      const enemies=encounter.enemies.map(id=>enemyNames[id]??id).join('・');
      this.previewBody?.setText(`敵群　${enemies}\n場景　${encounter.battlefield==='rooftop'?'列車車頂':encounter.battlefield==='wayside'?'沿線停靠':'離車山道'}`)
    }else this.previewBody?.setText(routeCopy[node.type]);
  }
  private selectNode(state:JourneyState,nodeId:string,x:number,y:number){
    const next=moveJourney(state,nodeId);this.registry.set('journey-state',next);const node=next.route.nodes.find(n=>n.id===nodeId)!,train=this.children.list.find(o=>o.getData('train'))as Phaser.GameObjects.Image;
    this.input.enabled=false;this.tweens.add({targets:train,x,y:y+54,duration:720,ease:'Sine.easeInOut',onComplete:()=>{
      const encounter=storyEncounter(node.id);
      if(encounter){const veil=this.add.rectangle(640,360,1280,720,node.type==='boss'?0x26080d:0x061016,0).setDepth(200),label=this.add.text(640,348,encounter.title,{fontFamily:'serif',fontSize:node.type==='boss'?'34px':'26px',fontStyle:'bold',color:'#fff1d6'}).setOrigin(.5).setDepth(201).setAlpha(0),sub=this.add.text(640,390,encounter.enemies.map(id=>enemyNames[id]??id).join('・'),{fontFamily:'sans-serif',fontSize:'12px',color:'#a9c9cf'}).setOrigin(.5).setDepth(201).setAlpha(0);this.tweens.add({targets:veil,alpha:.92,duration:360});this.tweens.add({targets:[label,sub],alpha:1,duration:260});this.time.delayedCall(420,()=>this.leaveJourneyMusic(()=>this.scene.start('BootScene',{journeyNodeId:node.id,battlefield:encounter.battlefield}))) }
      else{this.input.enabled=true;this.time.delayedCall(300,()=>this.scene.restart())}
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

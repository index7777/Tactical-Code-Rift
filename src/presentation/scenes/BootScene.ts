import Phaser from'phaser';import{createTeamDeckState,refillHand,commitPlayedCards,type BattleCard,type TeamDeckState}from'../../core/cards/BattleCards';import{applyPlannedInitiative,buildRoundTimeline}from'../../core/battle/RoundPlanner';import{resolveBattleBeats}from'../../core/battle/ClashResolver';import{dealEnemySkillsForArchetypes}from'../../core/battle/EnemySkills';import type{ActionNode,EnemyArchetype,Fighter,PlayerCommand}from'../../core/battle/BattleTypes';import{standbyPosition}from'../battle/BattleLayout';import{ClashPresenter,type VisualActor}from'../battle/ClashPresenter';import{ActionPresenter}from'../battle/ActionPresenter';
import{FighterHudPresenter,type FighterHudView}from'../battle/FighterHudPresenter';import{IntentLayerController}from'../battle/IntentLayerController';
import{resolveDamage}from'../../core/battle/VitalResolver';
import{clearEndOfRoundStatuses}from'../../core/battle/StatusLifecycle';import{selectCoverIntent}from'../../core/battle/CoverSelection';
import{DeathPresenter,type DeathStyle}from'../battle/DeathPresenter';import{OutcomePresenter}from'../battle/OutcomePresenter';
import{BattlefieldPresenter}from'../battle/BattlefieldPresenter';import type{BattlefieldMode}from'../battle/BattlefieldMode';
import{CombatResultFxPresenter}from'../battle/CombatResultFxPresenter';
import{CombatResolutionController}from'../../application/battle/CombatResolutionController';
import{readMonsterRule,resolveMonsterHit}from'../../core/battle/MonsterRules';
import{shouldStartJourney}from'../../core/route/EntryMode';
import{storyEncounter}from'../../core/route/EncounterCatalog';
import{canTargetActor}from'../../core/battle/Targeting';
import{planPlayerRelayContinuations}from'../../core/battle/RelayPlanner';
import{isCardSelected}from'../../core/cards/CardSelection';
import{brokenClashAction}from'../../core/battle/BrokenActionPolicy';
import{heroineDisplayHeight,playHeroinePose}from'../battle/HeroinePose';
import{playerRoster,playerRosterEntry}from'../../core/battle/PlayerRoster';
import{queuePlayerAssets}from'../assets/PlayerAssetManifest';
import{encounterSetup}from'../battle/EncounterSetup';
import{BattleAudioController}from'../battle/BattleAudioController';
import{createSceneLoadingScreen}from'./SceneLoadingScreen';
interface Actor extends VisualActor{sprite:Phaser.GameObjects.Sprite;hud:Phaser.GameObjects.Container;hudView:FighterHudView;hit:Phaser.GameObjects.Rectangle;hp:number;maxHp:number;shield:number;tempShield:number;balance:number;alive:boolean;exposed:boolean;broken:boolean;archetype?:EnemyArchetype;traitReady:boolean}
export class BootScene extends Phaser.Scene{private pc=4;private ec=4;private busy=false;private round=1;private deck:TeamDeckState=createTeamDeckState();private timeline:ActionNode[]=[];private skipBonusNext=new Set<string>();private players=new Map<string,Actor>();private enemies=new Map<string,Actor>();private commands=new Map<string,PlayerCommand|null>();private planning:ActionNode[]=[];private planIndex=0;private selected?:BattleCard;private discardMode=false;private discardUsedThisRound=false;private intentFocus?:string;private previewTargetId?:string;private world!:Phaser.GameObjects.Container;private intentLayer!:Phaser.GameObjects.Container;private intentController!:IntentLayerController;private fighterHud!:FighterHudPresenter;private combatLayer!:Phaser.GameObjects.Container;private hudLayer!:Phaser.GameObjects.Container;private handLayer!:Phaser.GameObjects.Container;private timelineLayer!:Phaser.GameObjects.Container;private status!:Phaser.GameObjects.Text;private phase!:Phaser.GameObjects.Text;private undoButton!:Phaser.GameObjects.Text;private battleAudio?:BattleAudioController;private cardTooltip?:Phaser.GameObjects.Container;
constructor(){super('BootScene')}
private deathPresenter!:DeathPresenter;private outcomePresenter!:OutcomePresenter;
private resultFxPresenter!:CombatResultFxPresenter;
private resolutionController=new CombatResolutionController();
private visibleHandCount=5;
private battlefieldMode:BattlefieldMode='rooftop';private battlefieldPresenter!:BattlefieldPresenter;
private requestedBattlefield?:BattlefieldMode;private journeyNodeId?:string;private selectedBattleMusicKey='battle-music';
private loadingLayer?:Phaser.GameObjects.Container;
private publishQaState(){
  const host=document.getElementById('game');if(!host)return;
  host.dataset.qaBattle=this.journeyNodeId??'demo';host.dataset.qaPlayers=String(this.players.size);host.dataset.qaEnemies=String(this.enemies.size);host.dataset.qaRound=String(this.round);host.dataset.qaBusy=String(this.busy);host.dataset.qaAssets=String(['player-rin-idle-a','player-chikage-idle-a','player-oboro-idle-a','player-mo-idle-a'].every(key=>this.textures.exists(key)))
}
init(data?:{battlefield?:BattlefieldMode;journeyNodeId?:string}){
  const qaJourneyNodeId=new URLSearchParams(window.location.search).get('qa-battle')??undefined;
  this.requestedBattlefield=data?.battlefield;this.journeyNodeId=data?.journeyNodeId??qaJourneyNodeId;this.pc=4;
  const setup=encounterSetup(this.journeyNodeId,this.requestedBattlefield);this.ec=setup.enemyCount;this.requestedBattlefield=setup.battlefield;this.selectedBattleMusicKey=setup.musicKey
}
private nextBattlefield():BattlefieldMode{return this.battlefieldMode==='rooftop'?'wayside':this.battlefieldMode==='wayside'?'exploration':'rooftop'}
private currentPlanner(){return applyPlannedInitiative(this.timeline,this.commands).find(n=>n.team==='player'&&!this.commands.has(n.id))}
private showLoadingScreen(label:string){
  this.loadingLayer=createSceneLoadingScreen(this,label);
}
preload(){this.showLoadingScreen(this.journeyNodeId?'正在整備戰場':'正在駛入雨暮山線');if(shouldStartJourney(new URLSearchParams(window.location.search),this.journeyNodeId))return;['bg-sky','bg-mountains-1','bg-mountains-2','bg-trees'].forEach(k=>this.load.image(k,`assets/battle/${k}.png`));this.load.image('bg-world01-rooftop-candidate','assets/battle/world01-rooftop-composite-candidate-v3.png');for(const name of ['wet-ground-shadow','wet-ground-shadow-wide','rain-splash-small','rain-splash-medium','ground-mist-low','fog-strip','puddle-reflection-soft','puddle-reflection-strong','stone-debris-a','stone-debris-b','rail-debris','lantern-foreground'])this.load.image(`battle-fg-${name.replace('wet-ground-shadow-wide','wet-shadow-wide').replace('wet-ground-shadow','wet-shadow').replace('rain-splash-','rain-').replace('ground-mist-low','ground-mist').replace('puddle-reflection-','puddle-').replace('stone-debris-','stone-').replace('lantern-foreground','lantern')}`,`assets/battle/foreground/world01/fg-${name}.png`);this.load.spritesheet('intent-smoke','assets/battle/generated/intent-smoke-sheet.png',{frameWidth:64,frameHeight:64});this.load.image('yokai-noise','assets/battle/generated/yokai-noise.png');this.load.audio('battle-music','assets/battle/demo_battle01.mp3');this.load.audio('boss-battle-music','assets/music/world-01/zone1-boss-bgm.mp3');this.load.audio('sword-swish','assets/battle/sword-swish.wav');this.load.audio('sword-impact','assets/battle/sword-impact.wav');this.load.image('fx-p9-arc-slash-1','assets/battle/fx/p9a-arc-slash-1.png');this.load.image('fx-p9-arc-slash-2','assets/battle/fx/p9a-arc-slash-2.png');this.load.image('fx-p9-arc-slash-3','assets/battle/fx/p8-arc-slash.svg');this.load.image('fx-p9-line-slash-1','assets/battle/fx/p9a-line-slash-1.png');this.load.image('fx-p9-line-slash-2','assets/battle/fx/p9a-line-slash-2.png');this.load.image('fx-p9-line-slash-3','assets/battle/fx/p8-line-slash.svg');this.load.image('fx-p9-impact-bloom','assets/battle/fx/p8-impact-bloom.svg');this.load.image('fx-p9-clash-cross','assets/battle/fx/p8-clash-cross.svg');this.load.image('fx-p9a-arc-slash-1','assets/battle/fx/p9a-arc-slash-1.png');this.load.image('fx-p9a-arc-slash-2','assets/battle/fx/p9a-arc-slash-2.png');this.load.image('fx-p9a-line-slash-1','assets/battle/fx/p9a-line-slash-1.png');this.load.image('fx-p9a-line-slash-2','assets/battle/fx/p9a-line-slash-2.png');this.load.image('fx-p10-enemy-arc-slash-1','assets/battle/fx/p8-arc-slash.svg');this.load.image('fx-p10-enemy-arc-slash-2','assets/battle/fx/p9a-arc-slash-2.png');this.load.image('fx-p10-enemy-line-slash-1','assets/battle/fx/p8-line-slash.svg');this.load.image('fx-p10-enemy-line-slash-2','assets/battle/fx/p9a-line-slash-2.png');for(const id of ['quick','heavy','break','guard','cover','relay','cycle','delay'])this.load.image(`card-art-${id}`,`assets/battle/cards/art/${id}.svg`);for(const id of ['power','tempo','damage','balance','shield','intercept','relay','restore'])this.load.image(`card-icon-${id}`,`assets/battle/cards/icons/${id}.svg`);for(const id of ['wet-corpse','lantern-child','mountain-hound','wayfarer-umbrella','noose-ghost','lost-monk','rain-warrior','rain-boss'])this.load.image(`fx-p11-enemy-${id}`,`assets/battle/fx/enemy/p11-${id}-slash.svg`);for(const family of ['attack','defense','support','tactics'])this.load.image(`card-frame-${family}`,`assets/battle/cards/frames/${family}.svg`);for(const pose of ['idle-a','idle-b','ready','attack-a','attack-b','hit-a','hit-b','down'])this.load.image(`heroine-${pose}`,`assets/battle/generated/characters/heroine/p11-4/heroine-${pose}.svg`);for(const pose of ['idle-a','idle-b','ready','attack-a','attack-b','hit-a','hit-b','down'])this.load.image(`redleaf-${pose}`,`assets/battle/generated/characters/redleaf/production/redleaf-${pose}.png`);this.load.image('fx-redleaf-slash-arc','assets/battle/generated/characters/redleaf/production/redleaf-slash-arc.png');this.load.image('fx-redleaf-slash-impact','assets/battle/generated/characters/redleaf/production/redleaf-slash-impact.png');this.load.image('chikage-idle-a','assets/battle/generated/characters/chikage/chikage-sd-idle-runtime-a.png');this.load.image('chikage-idle-b','assets/battle/generated/characters/chikage/chikage-sd-idle-runtime-b.png');this.load.image('oboro-idle-a','assets/battle/generated/characters/oboro/oboro-sd-idle-runtime-a.png');this.load.image('oboro-idle-b','assets/battle/generated/characters/oboro/oboro-sd-idle-runtime-b.png');for(const name of ['chikage','oboro','wet-corpse','lantern-child','mountain-hound','wayfarer-umbrella','noose-ghost','lost-monk','rain-warrior']){this.load.image(`portrait-${name}-current`,`assets/battle/portraits/${name}-current.png`);this.load.image(`portrait-${name}-timeline`,`assets/battle/portraits/${name}-timeline.png`)};this.load.image('portrait-heroine-current','assets/battle/portraits/heroine-p11-4-current.svg');this.load.image('portrait-heroine-timeline','assets/battle/portraits/heroine-p11-4-timeline.svg');this.load.image('portrait-redleaf-current','assets/battle/generated/characters/redleaf/production/redleaf-portrait-current.png');this.load.image('portrait-redleaf-timeline','assets/battle/generated/characters/redleaf/production/redleaf-portrait-timeline.png');for(const name of ['chikage','oboro']){this.load.image(`${name}-ready`,`assets/battle/generated/characters/${name}/${name}-sd-ready-runtime-v1.png`);this.load.image(`${name}-attack-a`,`assets/battle/generated/characters/${name}/${name}-sd-attack-runtime-v1.png`);this.load.image(`${name}-attack-b`,`assets/battle/generated/characters/${name}/${name}-sd-attack-runtime-v2.png`);this.load.image(`${name}-hit-a`,`assets/battle/generated/characters/${name}/${name}-sd-hit-runtime-v1.png`);this.load.image(`${name}-hit-b`,`assets/battle/generated/characters/${name}/${name}-sd-hit-runtime-v2.png`);this.load.image(`${name}-down`,`assets/battle/generated/characters/${name}/${name}-sd-down-runtime-v2.png`)};// 第一區怪物母版：已交付母版的走 PNG runtime；rain-warrior/rain-boss 尚未生圖，
// 暫時 fallback 到 SVG 剪影 placeholder（不 tint、不美觀，等使用者核准後補生）。
for(const name of ['wet-corpse','lantern-child','mountain-hound','wayfarer-umbrella','noose-ghost','lost-monk','rain-warrior'])this.load.image(`monster-${name}`,`assets/battle/generated/monsters/rainfall-ridgeline/${name}-master-runtime-v1.png`);
// rain-boss（BOSS 雨切終式）尚未生圖，先保留 SVG placeholder；核准後補為 PNG runtime。
this.load.image('monster-rain-boss','assets/battle/generated/monsters/rainfall-ridgeline/rain-boss-side-v1.svg');this.load.spritesheet('hero','assets/battle/samurai.png',{frameWidth:48,frameHeight:48});this.load.spritesheet('enemy','assets/battle/enemy-knight.png',{frameWidth:64,frameHeight:64});this.load.image('yokai','assets/battle/kamaitachi.png')}
create(){
    this.loadingLayer?.destroy(true);this.loadingLayer=undefined;
    if(shouldStartJourney(new URLSearchParams(window.location.search),this.journeyNodeId)){this.scene.start('JourneyScene');return}
    if(!this.anims.exists('hero-idle'))this.anims.create({key:'hero-idle',frames:this.anims.generateFrameNumbers('hero',{start:0,end:3}),frameRate:5,repeat:-1});
    if(!this.anims.exists('hero-ready'))this.anims.create({key:'hero-ready',frames:[{key:'hero',frame:4}]});
    if(!this.anims.exists('heroine-idle'))this.anims.create({key:'heroine-idle',frames:[{key:'heroine-idle-a'},{key:'heroine-idle-b'}],frameRate:2,repeat:-1});
    if(!this.anims.exists('heroine-ready'))this.anims.create({key:'heroine-ready',frames:[{key:'heroine-ready'}]});
    if(!this.anims.exists('heroine-strike'))this.anims.create({key:'heroine-strike',frames:[{key:'heroine-attack-a'},{key:'heroine-attack-b'}],frameRate:12,repeat:0});
    if(!this.anims.exists('heroine-down'))this.anims.create({key:'heroine-down',frames:[{key:'heroine-down'}]});
    if(!this.anims.exists('enemy-idle'))this.anims.create({key:'enemy-idle',frames:this.anims.generateFrameNumbers('enemy',{start:0,end:3}),frameRate:5,repeat:-1});
    this.battleAudio=new BattleAudioController(this,this.selectedBattleMusicKey);this.battleAudio.start();
    this.world=this.add.container();
    this.hudLayer=this.add.container().setDepth(30).setScrollFactor(0);
    this.handLayer=this.add.container().setDepth(20).setScrollFactor(0);
    this.timelineLayer=this.add.container().setDepth(80).setScrollFactor(0);
    this.battlefieldMode=this.requestedBattlefield??'rooftop';
    this.battlefieldPresenter=new BattlefieldPresenter(this,this.world);this.battlefieldPresenter.build(this.battlefieldMode);
    this.intentLayer=this.add.container();
    this.intentController=new IntentLayerController(this.intentLayer);
    this.fighterHud=new FighterHudPresenter(this);
    this.combatLayer=this.add.container();
    this.deathPresenter=new DeathPresenter(this,this.combatLayer);this.outcomePresenter=new OutcomePresenter(this,this.hudLayer);this.resultFxPresenter=new CombatResultFxPresenter(this,this.combatLayer);
    this.world.add([this.intentLayer,this.combatLayer]);
    const ui=this.cameras.add(0,0,1280,720);
    ui.ignore(this.world);
    this.input.setGlobalTopOnly(false);
    this.cameras.main.ignore([this.hudLayer,this.handLayer,this.timelineLayer]);
    this.hud();
    this.input.keyboard?.on('keydown-ESC',()=>this.undoCommand());
    this.input.keyboard?.on('keydown-BACKSPACE',(event:KeyboardEvent)=>{event.preventDefault();this.undoCommand()});
    this.rebuild();this.playBattleIntro()
  }
private playBattleIntro(){if(!this.journeyNodeId)return;const boss=this.journeyNodeId==='boss-1',elite=this.journeyNodeId==='elite-1';const veil=this.add.rectangle(640,360,1280,720,0x03070b,.92).setDepth(300).setScrollFactor(0),kicker=this.add.text(640,305,boss?'第一區・雨暮山線　終點':elite?'第一區・雨暮山線　精英':'第一區・雨暮山線',{fontFamily:'serif',fontSize:'18px',color:boss?'#ffb2a8':'#a9c8ce'}).setOrigin(.5).setDepth(301).setScrollFactor(0),title=this.add.text(640,350,boss?'雨暮驛・站守':elite?'雨夜武者':'遭遇',{fontFamily:'serif',fontSize:boss?'38px':'30px',fontStyle:'bold',color:'#fff1d6',stroke:'#12090b',strokeThickness:5}).setOrigin(.5).setDepth(301).setScrollFactor(0),line=this.add.rectangle(640,397,boss?420:280,2,boss?0xb6373f:0x87b6bd,.9).setDepth(301).setScrollFactor(0);this.input.enabled=false;this.time.delayedCall(boss?820:520,()=>this.tweens.add({targets:[veil,kicker,title,line],alpha:0,duration:320,onComplete:()=>{veil.destroy();kicker.destroy();title.destroy();line.destroy();this.input.enabled=true}}))}
private returnToJourney(){this.battleAudio?.fadeTo(0,350);this.time.delayedCall(350,()=>{this.battleAudio?.stop();this.scene.start('JourneyScene')})}
private hud(){
    this.phase=this.add.text(22,9,'',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#cbe9ee'}).setVisible(false);
    this.hudLayer.add(this.phase);
    // Single context ribbon: validation/prompts only. Keep it below the timeline and
    // outside the hand/card dock so it never becomes a second battle log.
    this.status=this.add.text(640,102,'',{fixedWidth:420,align:'center',fontFamily:'sans-serif',fontSize:'11px',fontStyle:'bold',color:'#e7f6f8',backgroundColor:'#07131bcc',padding:{x:10,y:5}}).setOrigin(.5).setDepth(82).setVisible(false);
    this.hudLayer.add(this.button(1015,612,130,'結束規劃',()=>this.nextRound(),0x285c67));
    this.hudLayer.add(this.button(1015,654,130,'跳過',()=>this.skip(),0x4d5364));
    this.undoButton=this.button(1155,654,105,'上一步',()=>this.undoCommand(),0x343b49).setVisible(false);this.hudLayer.add(this.undoButton)
  }
private setStatus(message:string){this.status.setText(message).setVisible(Boolean(message))}
private button(x:number,y:number,w:number,label:string,fn:()=>void,color=0x263c48){const b=this.add.text(x,y,label,{fixedWidth:w,align:'center',fontFamily:'sans-serif',fontSize:'13px',fontStyle:'bold',color:'#eaf2f3',backgroundColor:`#${color.toString(16).padStart(6,'0')}`,padding:{y:8}}).setInteractive({useHandCursor:true}).setAlpha(.94);b.on('pointerover',()=>b.setAlpha(1));b.on('pointerout',()=>b.setAlpha(.94));b.on('pointerdown',fn);return b}
private rebuild(){
  if(this.busy)return;
  this.world.each((x:any)=>{if(x instanceof Phaser.GameObjects.Container&&x.getData('actor'))x.destroy()});this.players.clear();this.enemies.clear();
  const encounter=storyEncounter(this.journeyNodeId);const enemyRoles:EnemyArchetype[]=encounter?.enemies??['wet-corpse','lantern-child'];this.ec=enemyRoles.length;
  const ps:Fighter[]=playerRoster.slice(0,this.pc).map((character,i)=>({id:character.id,team:'player',actorIndex:i,speed:Phaser.Math.Between(4,9),alive:true}));
  const roleSpeed=(role:EnemyArchetype)=>role==='lantern-child'||role==='mountain-hound'?Phaser.Math.Between(7,9):role==='wayfarer-umbrella'||role==='rain-warrior'||role==='rain-boss'?Phaser.Math.Between(3,5):Phaser.Math.Between(5,7);
  const es:Fighter[]=enemyRoles.map((role,i)=>({id:`E${String.fromCharCode(65+i)}`,team:'enemy',actorIndex:i,archetype:role,speed:roleSpeed(role),alive:true}));const roundSkills=dealEnemySkillsForArchetypes(enemyRoles);
  const skills=new Map(es.map((e,i)=>{const skill=roundSkills[i]!,target=Phaser.Math.RND.pick(ps);return[e.id,{id:`${e.id}-skill`,...skill,targetId:target.id}]}));
  this.timeline=buildRoundTimeline(ps,es,skills);ps.forEach(f=>this.addActor(f));es.forEach(f=>this.addActor(f));this.deck=refillHand(this.deck,5);
  this.commands.clear();this.planning=this.timeline.filter(n=>n.team==='player').sort((a,b)=>b.speed-a.speed);this.planIndex=0;this.selected=undefined;this.discardMode=false;this.discardUsedThisRound=false;this.updateUndoVisibility();this.renderTimeline();this.renderHand();this.focus();this.renderEnemyIntents();this.publishQaState()
}
private addActor(f:Fighter){
    const p=standbyPosition(f.team,f.team==='player'?this.pc:this.ec,f.actorIndex);
    const accent=f.team==='player'?0x65e7ff:0xff7087;
    const glow=this.add.ellipse(0,43,90,24,accent,.5).setVisible(false);
    const heroine=f.team==='player',character=heroine?playerRosterEntry(f.id):undefined,oboro=f.id==='oboro',poseLocked=Boolean(character),playerTexture=character?`${character.assetPrefix}-idle-a`:'rin-idle-a',
      rainfallArchetypes=['wet-corpse','lantern-child','mountain-hound','wayfarer-umbrella','noose-ghost','lost-monk','rain-warrior','rain-boss'],
      rainfallMonster=rainfallArchetypes.includes(f.archetype??''),
      // 若母版 PNG 已載入，切到 `monster-<id>`；否則 fallback 到 yokai/enemy 舊剪影，保留 tint 差異化。
      monsterKey=f.archetype?`monster-${f.archetype}`:'',
      hasMasterTexture=rainfallMonster&&Boolean(monsterKey)&&this.textures.exists(monsterKey),
      enemyTexture=hasMasterTexture?monsterKey:f.archetype==='crusher'?'enemy':'yokai',
      sprite=this.add.sprite(0,-8,heroine?playerTexture:enemyTexture).setFlipX(heroine&&!poseLocked).setData('heroine',heroine).setData('poseLocked',poseLocked).setData('poseAssetPrefix',character?.assetPrefix).setData('heroBaseY',-8).setData('darkSilhouette',oboro);
    if(heroine){sprite.setData('heroHeight',heroineDisplayHeight(this.pc));playHeroinePose(sprite,'idle')}
    else if(hasMasterTexture){
      // 母版原圖 ~2000px，需按顯示高度縮放；一律限制在最高 100px 以免頭部逼近上方時序條。
      // rain-warrior（精英）例外，比一般怪高 14px，用剪影比例表達精英強度但仍不超過 heroineDisplayHeight(pc<=2)。
      const eliteBoost=f.archetype==='rain-warrior'?14:0;
      const targetHeight=Math.min(100,heroineDisplayHeight(Math.max(3,this.ec)))+eliteBoost;
      const src=sprite.texture.getSourceImage()as{width:number;height:number};
      if(src.width>0&&src.height>0)sprite.setDisplaySize(Math.round(targetHeight*src.width/src.height),targetHeight);
    }
    else sprite.setScale(f.archetype==='crusher'?1.42:rainfallMonster?1.35:1.9);
    // 沒有母版時保留原本 tint 差異化剪影；有母版則不 tint 以保留原色。
    if(f.team==='enemy'&&!hasMasterTexture)sprite.setTint(f.archetype==='swift'?0xd9e7ee:f.archetype==='crusher'?0xc6a69c:f.archetype==='wet-corpse'?0xb9bec0:f.archetype==='lantern-child'?0xd8a348:f.archetype==='mountain-hound'?0x46545a:f.archetype==='wayfarer-umbrella'?0x82606d:f.archetype==='noose-ghost'?0x9eb5b8:f.archetype==='lost-monk'?0x89928d:f.archetype==='rain-warrior'?0x596b73:0x745b7f);
    if(f.team==='player'&&!poseLocked)sprite.play('heroine-idle');else if(f.team==='enemy'&&f.archetype==='crusher')sprite.play('enemy-idle');else if(f.team==='enemy')this.tweens.add({targets:sprite,y:-16,duration:f.archetype==='swift'?410:620,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

    const hudView=this.fighterHud.create();
    const hud=hudView.root;

    const hit=this.add.rectangle(0,0,120,166,0xffffff,.001).setInteractive({useHandCursor:true});
    hit.on('pointerdown',()=>this.target(f.id));
    hit.on('pointerover',()=>this.previewTarget(f.id));
    hit.on('pointerout',()=>{this.intentFocus=undefined;this.previewTargetId=undefined;if(this.selected?.definitionId==='cover')this.setStatus('選擇友方，或直接點一條敵方殺生線。');this.renderEnemyIntents()});
    const root=this.add.container(p.x,p.y,[glow,sprite,hud,hit]).setData('actor',true);
    this.world.add(root);
    const maxHp=f.team==='player'?44:40,a={root,x:p.x,y:p.y,sprite,hud,hudView,hit,hp:maxHp,maxHp,shield:0,tempShield:0,balance:8,alive:true,exposed:false,broken:false,archetype:f.archetype,traitReady:true};
    (f.team==='player'?this.players:this.enemies).set(f.id,a);
    this.refreshActor(a)
  }
private previewTarget(id:string){
    const hovered=this.players.get(id)??this.enemies.get(id);if(hovered&&!hovered.alive)return;
    if(this.selected){
      const hostile=this.selected.intent==='attack'||this.selected.intent==='disruption';
      const cover=this.selected.definitionId==='cover';
      const validTarget=cover?(this.enemies.has(id)||this.players.has(id)):hostile?this.enemies.has(id):this.players.has(id);
      const validGuard=this.selected.definitionId!=='guard'||id===this.currentPlanner()?.actorId;
      if(!validTarget||!validGuard){
        if(this.selected.definitionId==='guard'&&id!==this.currentPlanner()?.actorId)this.setStatus('堅守只能以自身為目標。');
        else if(cover)this.setStatus('掩護請點友方，或直接點帶有殺生線的敵人。');
        else this.setStatus(hostile?'此卡必須指定敵方。':'此卡必須指定友方。');
        this.intentFocus=undefined;this.previewTargetId=undefined;this.renderEnemyIntents();return
      }
    }
    this.intentFocus=id;this.previewTargetId=id;this.renderEnemyIntents();
    if(this.selected&&this.enemies.has(id))this.drawMonsterRuleRead(this.enemies.get(id)!,this.selected);
    if(!this.selected)return;
    const planner=this.currentPlanner();if(!planner)return;
    const initiative=planner.speed+this.selected.tempo;
    if(this.selected.definitionId==='cover'){
      const result=selectCoverIntent({timeline:this.timeline,commands:this.commands,actorId:planner.actorId,actorSpeed:planner.speed,cardTempo:this.selected.tempo,selectedActorId:id,selectedEnemyId:this.enemies.has(id)?id:undefined});
      if(!result.ok){this.setStatus(this.coverStatusMessage(result.reason));return}
      this.setStatus('掩護成立｜已截斷殺生線');
      const enemy=result.enemy,targetId=enemy.enemySkill!.targetId,enemyInitiative=enemy.initiative??enemy.speed+(enemy.enemySkill?.tempo??0),canClash=planner.actorId!==targetId&&initiative>enemyInitiative;
      this.drawCoverPreview(planner.actorId,targetId,canClash,false,initiative,enemyInitiative)
    }else if(this.players.has(id)&&this.selected.intent==='defense'){
      this.drawCoverPreview(planner.actorId,id,true,true,initiative,initiative)
    }
  }
private drawCoverPreview(actorId:string,targetId:string,valid:boolean,direct:boolean,actorInitiative:number,enemyInitiative:number){
    const actor=this.players.get(actorId)!,target=this.players.get(targetId)!;
    if(!canTargetActor(target))return;
    if(direct){
      const guard=this.add.graphics();
      guard.lineStyle(3,0xb7f8ff,.95).beginPath().arc(target.x-6,target.y,34,-1.15,1.15,false).strokePath();
      const label=this.add.text(target.x,target.y-58,'架守',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#fff',backgroundColor:'#16343bdd',padding:{x:7,y:3}}).setOrigin(.5);
      this.intentLayer.add([guard,label]);return
    }
    // Faster cover reaches farther upstream; a late cover only meets the
    // hostile causality line close to the protected actor.
    const speedEdge=actorInitiative-enemyInitiative;
    const x=Phaser.Math.Clamp(545+speedEdge*28,440,680),y=target.y;
    const g=this.add.graphics();
    const points=new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(actor.x+35,actor.y),new Phaser.Math.Vector2(actor.x+145,actor.y),
      new Phaser.Math.Vector2(x-105,y),new Phaser.Math.Vector2(x,y)
    ).getPoints(24);
    const curve=(width:number,color:number,alpha:number)=>{g.lineStyle(width,color,alpha).beginPath().moveTo(points[0]!.x,points[0]!.y);points.slice(1).forEach(p=>g.lineTo(p.x,p.y));g.strokePath()};
    curve(9,valid?0x52ddeb:0x75696d,.14);curve(2,valid?0xc5fbff:0xb28b91,.98);
    if(valid){g.lineStyle(2,0x8df3ff,.92).strokeCircle(x,y,10);g.lineStyle(4,0xffe5a0,1).lineBetween(x,y-11,x,y+11);g.fillStyle(0xffe5a0,1).fillCircle(x,y,3.5)}
    else g.lineStyle(4,0xff526b,1).lineBetween(x-8,y-8,x+8,y+8).lineBetween(x+8,y-8,x-8,y+8);
    const label=this.add.text(x,y-24,valid?`${actorInitiative} > ${enemyInitiative}`:'速度不足',{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#fff',backgroundColor:valid?'#16343bdd':'#5a1b29dd',padding:{x:7,y:3}}).setOrigin(.5);
    this.intentLayer.add([g,label])
  }
  private addKillingIntentFlow(curve:Phaser.Curves.CubicBezier,color:number,alpha:number,focused:boolean,delay=0){
    const count=focused?18:14;
    // Planning should feel like a drawn bow: nearly static, with a restrained current moving inside the line.
    const segmentAlpha=focused?.19:.11;
    const streaks=Array.from({length:count},()=>{const bar=this.add.rectangle(0,0,focused?17:13,focused?1.25:.9,color,alpha*segmentAlpha).setDepth(34).setData('intent',true);this.intentLayer.add(bar);return bar});
    const duration=focused?5000:7600;
    const tween=this.tweens.addCounter({from:0,to:1,duration,delay,repeat:-1,ease:'Linear',onUpdate:t=>{const phase=t.getValue() ?? 0;streaks.forEach((bar,i)=>{if(!bar.active)return;const u=(phase+i/count)%1,p=curve.getPoint(u),ahead=curve.getPoint(Math.min(.999,u+.006));bar.setPosition(p.x,p.y).setRotation(Phaser.Math.Angle.Between(p.x,p.y,ahead.x,ahead.y));const edge=Math.min(1,u*10,(1-u)*10);bar.setAlpha(alpha*segmentAlpha*Math.max(.05,edge))})}});
    streaks[0]?.once(Phaser.GameObjects.Events.DESTROY,()=>tween.stop())
  }
  private addKillingIntentTargetPulse(x:number,y:number,focused:boolean,alpha:number){
    const ring=this.add.circle(x,y,focused?8:6,0xff415f,.025).setStrokeStyle(focused?1.5:1,0xff6078,Math.min(.78,.28+alpha*.45)).setDepth(32).setData('intent',true);
    const core=this.add.circle(x,y,focused?2.4:1.8,0xff7b8c,Math.min(.9,.35+alpha*.38)).setDepth(35).setData('intent',true);this.intentLayer.add([ring,core])
  }
  private renderEnemyIntents(){
    this.intentController.clear();
    if(this.busy)return;
    if(!this.intentController.canRenderPlanning())this.intentController.beginPlanning();
    const visualCommands=new Map(this.commands);
    const previewPlanner=this.currentPlanner();
    if(this.previewTargetId&&this.selected&&previewPlanner){
      const hostile=this.selected.intent==='attack'||this.selected.intent==='disruption';
      const previewEnemy=this.timeline.find(n=>n.team==='enemy'&&n.actorId===this.previewTargetId);
      if(hostile&&previewEnemy)visualCommands.set(previewPlanner.id,{nodeId:previewPlanner.id,actorId:previewPlanner.actorId,card:this.selected,targetNodeId:previewEnemy.id,targetActorId:previewEnemy.actorId});
      else if(this.selected.definitionId==='cover'&&previewEnemy?.enemySkill)visualCommands.set(previewPlanner.id,{nodeId:previewPlanner.id,actorId:previewPlanner.actorId,card:this.selected,targetNodeId:previewEnemy.id,targetActorId:previewEnemy.enemySkill.targetId});
      else if(this.selected.definitionId==='cover'&&this.players.has(this.previewTargetId)){
        const reserved=new Set([...this.commands.values()].filter((c):c is PlayerCommand=>Boolean(c?.targetNodeId)).map(c=>c.targetNodeId!));
        const incoming=this.timeline.filter(n=>n.team==='enemy'&&n.enemySkill?.targetId===this.previewTargetId&&!reserved.has(n.id));
        if(incoming.length===1)visualCommands.set(previewPlanner.id,{nodeId:previewPlanner.id,actorId:previewPlanner.actorId,card:this.selected,targetNodeId:incoming[0]!.id,targetActorId:this.previewTargetId})
      }else if(this.selected.intent==='defense'&&this.players.has(this.previewTargetId))visualCommands.set(previewPlanner.id,{nodeId:previewPlanner.id,actorId:previewPlanner.actorId,card:this.selected,targetActorId:this.previewTargetId})
    }
    const visualBeats=resolveBattleBeats(applyPlannedInitiative(this.timeline,visualCommands),visualCommands);
    const resolvedClashes=new Set<string>();
    const renderedPlayerRoutes=new Set<string>();
    for(const beat of visualBeats){
      if(beat.kind==='clash')resolvedClashes.add(`${beat.clash.player.nodeId}|${beat.clash.enemy.id}`)
    }
    const strokeCurve=(g:Phaser.GameObjects.Graphics,style:{width:number;color:number;alpha:number},from:Phaser.Math.Vector2,c1:Phaser.Math.Vector2,c2:Phaser.Math.Vector2,to:Phaser.Math.Vector2)=>{
      const points=new Phaser.Curves.CubicBezier(from,c1,c2,to).getPoints(28);
      g.lineStyle(style.width,style.color,style.alpha).beginPath().moveTo(points[0]!.x,points[0]!.y);
      points.slice(1).forEach(p=>g.lineTo(p.x,p.y));
      g.strokePath()
    };
    const enemies=this.timeline.filter(x=>x.team==='enemy');
    const groups=new Map<string,ActionNode[]>();
    for(const n of enemies){const id=n.enemySkill!.targetId;groups.set(id,[...(groups.get(id)??[]),n])}
    groups.forEach((nodes,targetId)=>{
      const target=this.players.get(targetId);
      if(!target||!canTargetActor(target))return;
      // A killing intent belongs to its victim, not to an abstract UI lane.
      // Converging at the victim's height keeps the final read unambiguous.
      const lane=target.y;
      const focused=!this.intentFocus||this.intentFocus===targetId||nodes.some(n=>this.intentFocus===n.actorId);
      const passive=this.intentFocus?(focused ? 0.9 : 0.04):0.18;
      const mergeX=710,endX=target.x+42;
      const coverRedirects=new Map<string,Phaser.Math.Vector2>();
      for(const beat of visualBeats){
        if(beat.kind!=='clash'||beat.clash.enemy.enemySkill?.targetId!==targetId||beat.clash.player.card.intent!=='defense'||beat.clash.player.actorId===targetId)continue;
        const actorNode=this.timeline.find(node=>node.team==='player'&&node.actorId===beat.clash.player.actorId);
        const actorInitiative=(actorNode?.initiative??actorNode?.speed??0)+beat.clash.player.card.tempo;
        const enemyInitiative=beat.clash.enemy.initiative??beat.clash.enemy.speed;
        coverRedirects.set(beat.clash.enemy.id,new Phaser.Math.Vector2(Phaser.Math.Clamp(545+(actorInitiative-enemyInitiative)*28,440,680),lane))
      }
      let continuingToTarget=0;
      nodes.forEach((n,index)=>{
        const a=this.enemies.get(n.actorId)!;
        const s=n.enemySkill!;
        const approachOffset=(index-(nodes.length-1)/2)*14;
        const branch=this.add.graphics().setAlpha(passive).setData('intent',true);
        const redirect=coverRedirects.get(n.id);
        if(!redirect)continuingToTarget++;
        const branchFrom=new Phaser.Math.Vector2(a.x-42,a.y),branchTo=redirect??new Phaser.Math.Vector2(mergeX,lane);
        const approachX=branchTo.x+105;
        const branchC1=new Phaser.Math.Vector2(a.x-115,a.y),branchC2=new Phaser.Math.Vector2(approachX,branchTo.y+approachOffset);
        const branchCurve=new Phaser.Curves.CubicBezier(branchFrom,branchC1,branchC2,branchTo);
        const threatColor=s.clashPower>=7?0xff3857:0xff6078;
        strokeCurve(branch,{width:focused?7:4,color:0x7b1830,alpha:focused?.31:.19},branchFrom,branchC1,branchC2,branchTo);
        strokeCurve(branch,{width:focused?1.7:1,color:threatColor,alpha:focused?.98:.76},branchFrom,branchC1,branchC2,branchTo);
        this.intentLayer.add(branch);
        this.addKillingIntentFlow(branchCurve,threatColor,focused?.95:.42,focused,index*145);
        if(this.selected?.definitionId==='cover'){
          const hitPoints=branchCurve.getPoints(7);
          for(let i=1;i<hitPoints.length;i++){
            const p=hitPoints[i-1]!,q=hitPoints[i]!,zone=this.add.rectangle((p.x+q.x)/2,(p.y+q.y)/2,Phaser.Math.Distance.Between(p.x,p.y,q.x,q.y)+10,26,0xffffff,.001).setRotation(Phaser.Math.Angle.Between(p.x,p.y,q.x,q.y)).setInteractive({useHandCursor:true}).setData('intent',true);
            zone.on('pointerdown',()=>this.target(n.actorId));zone.on('pointerover',()=>{this.intentFocus=n.actorId});this.intentLayer.add(zone)
          }
        }
        const tag=this.add.container(a.x-62,a.y-55).setAlpha(focused?1:.48).setData('intent',true),targetPortrait=`portrait-${this.playerPortraitBase(s.targetId)}-timeline`;
        tag.add(this.add.rectangle(0,0,124,26,0x321019,.9).setStrokeStyle(1,0xa8374d,.62));
        tag.add(this.add.text(-51,0,s.name,{fixedWidth:62,fontFamily:'serif',fontSize:'10px',fontStyle:'bold',color:'#ffe9ec'}).setOrigin(0,.5));
        tag.add(this.add.text(22,0,String(s.clashPower),{fontFamily:'monospace',fontSize:'13px',fontStyle:'bold',color:'#ffbf72'}).setOrigin(.5));
        tag.add(this.add.text(35,0,'›',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#c9788d'}).setOrigin(.5));
        tag.add(this.add.circle(50,0,9,0x09070a,.95).setStrokeStyle(1,0xbd526b,.6));if(this.textures.exists(targetPortrait))tag.add(this.add.image(50,0,targetPortrait).setDisplaySize(16,16));
        this.intentLayer.add(tag);
        const paired=visualBeats.find(beat=>beat.kind==='clash'&&beat.clash.enemy.id===n.id);
        const planned=[...this.commands.values()].find(c=>c&&c.targetNodeId===n.id)??(paired?.kind==='clash'?paired.clash.player:undefined);
        const preview=this.previewTargetId===n.actorId&&this.selected&&(this.selected.intent==='attack'||this.selected.intent==='disruption')&&this.currentPlanner();
        const command=planned||preview;
        if(command){
          const actorId='actorId'in command?command.actorId:this.currentPlanner()!.actorId;
          const card='card'in command?command.card:this.selected!;
          const actor=this.players.get(actorId)!;
          const commandNodeId='nodeId'in command?command.nodeId:this.currentPlanner()!.id;
          renderedPlayerRoutes.add(commandNodeId);
          const isResolvedClash=resolvedClashes.has(`${commandNodeId}|${n.id}`);
          const actorNode=this.timeline.find(node=>node.team==='player'&&node.actorId===actorId);
          const actorInitiative=(actorNode?.initiative??actorNode?.speed??0)+card.tempo;
          const enemyInitiative=n.initiative??n.speed;
          if(card.intent==='defense'&&isResolvedClash){
            this.drawCoverPreview(actorId,s.targetId,true,actorId===s.targetId,actorInitiative,enemyInitiative);return
          }
          // The visible clash point is the causal result of initiative: faster
          // actors cut the hostile line farther upstream toward the enemy.
          const clashX=isResolvedClash?Phaser.Math.Clamp(545+(actorInitiative-enemyInitiative)*28,440,680):a.x-58;
          const clashY=isResolvedClash?lane:a.y;
          const blade=this.add.graphics().setData('intent',true);
          const bladeFrom=new Phaser.Math.Vector2(actor.x+42,actor.y),bladeTo=new Phaser.Math.Vector2(clashX,clashY);
          strokeCurve(blade,{width:9,color:0x52ddeb,alpha:.12},bladeFrom,new Phaser.Math.Vector2(actor.x+150,actor.y),new Phaser.Math.Vector2(clashX-105,clashY),bladeTo);
          strokeCurve(blade,{width:2,color:0xb7f8ff,alpha:.98},bladeFrom,new Phaser.Math.Vector2(actor.x+150,actor.y),new Phaser.Math.Vector2(clashX-105,clashY),bladeTo);
          if(isResolvedClash)blade.lineStyle(3,0xffe5a0,1).lineBetween(clashX-10,clashY-10,clashX+10,clashY+10).lineBetween(clashX+10,clashY-10,clashX-10,clashY+10);
          else blade.fillStyle(0x9ef6ff,1).fillTriangle(clashX+12,clashY-7,clashX+12,clashY+7,clashX,clashY);
          if(card.assist){
            // Relay is a second beat on the existing causal route, not a new
            // killing-intent line or a floating text label.
            blade.lineStyle(3,0xffd36e,.95)
              .lineBetween(clashX+22,clashY+9,clashX+31,clashY-9)
              .lineBetween(clashX+34,clashY+9,clashX+43,clashY-9)
          }
          this.intentLayer.add(blade);
          if(isResolvedClash){
            const result=card.clashPower===s.clashPower?'相殺':card.clashPower>s.clashPower?'有利':'不利';
            const resultColor=result==='有利'?0x236a63:result==='不利'?0x7a2639:0x5e5330;
            const badge=this.add.container(clashX,clashY-24).setData('intent',true);
            badge.add(this.add.rectangle(0,0,112,26,resultColor,.96).setStrokeStyle(1,0xffe6a2,.75));
            badge.add(this.add.text(0,0,`${result}  ${card.clashPower} : ${s.clashPower}`,{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#fff'}).setOrigin(.5));
            this.intentLayer.add(badge)
          }
        }
      });
      if(continuingToTarget>0){
        const trunk=this.add.graphics().setAlpha(passive).setData('intent',true);
        const trunkFrom=new Phaser.Math.Vector2(mergeX,lane),trunkTo=new Phaser.Math.Vector2(endX,target.y);
        const trunkC1=new Phaser.Math.Vector2(590,lane),trunkC2=new Phaser.Math.Vector2(endX+125,target.y);
        const trunkCurve=new Phaser.Curves.CubicBezier(trunkFrom,trunkC1,trunkC2,trunkTo);
        strokeCurve(trunk,{width:focused?7:5,color:0x7c1129,alpha:focused?.28:.17},trunkFrom,trunkC1,trunkC2,trunkTo);
        strokeCurve(trunk,{width:focused?1.8:1,color:0xff4964,alpha:focused?1:.74},trunkFrom,trunkC1,trunkC2,trunkTo);
        this.intentLayer.add(trunk);
        this.addKillingIntentFlow(trunkCurve,0xff4964,focused?.98:.45,focused,120);
        this.addKillingIntentTargetPulse(endX,target.y,focused,passive)
      }
    });
    // A hostile skill can be consumed by only one clash, but later player
    // attacks aimed at that enemy still exist as one-sided beats. They own
    // independent blade routes and must not disappear with the rewritten
    // killing-intent line.
    for(const beat of visualBeats){
      if(beat.kind!=='player-one-sided'||renderedPlayerRoutes.has(beat.command.nodeId)||!beat.command.targetActorId)continue;
      const actor=this.players.get(beat.command.actorId),target=this.enemies.get(beat.command.targetActorId);
      if(!actor||!target)continue;
      const focused=!this.intentFocus||this.intentFocus===beat.command.actorId||this.intentFocus===beat.command.targetActorId;
      const alpha=this.intentFocus?(focused?1:.08):.78;
      const blade=this.add.graphics().setAlpha(alpha).setData('intent',true);
      const from=new Phaser.Math.Vector2(actor.x+42,actor.y),to=new Phaser.Math.Vector2(target.x-44,target.y);
      strokeCurve(blade,{width:9,color:0x52ddeb,alpha:.11},from,new Phaser.Math.Vector2(actor.x+170,actor.y),new Phaser.Math.Vector2(target.x-150,target.y),to);
      strokeCurve(blade,{width:2,color:0xb7f8ff,alpha:.98},from,new Phaser.Math.Vector2(actor.x+170,actor.y),new Phaser.Math.Vector2(target.x-150,target.y),to);
      blade.fillStyle(0x9ef6ff,1).fillTriangle(to.x-12,to.y-7,to.x-12,to.y+7,to.x,to.y);
      if(beat.command.card.assist)blade.lineStyle(3,0xffd36e,.95)
        .lineBetween(to.x-25,to.y+9,to.x-34,to.y-9)
        .lineBetween(to.x-37,to.y+9,to.x-46,to.y-9);
      this.intentLayer.add(blade);
      renderedPlayerRoutes.add(beat.command.nodeId)
    }
  }
private drawMonsterRuleRead(actor:Actor,card:BattleCard){const read=readMonsterRule(actor.archetype,card,actor);if(read.state==='neutral'||!read.label)return;const safe=read.state==='counter',color=safe?0x83e9c0:0xff7185,g=this.add.circle(actor.x,actor.y-72,17,color,.16).setStrokeStyle(2,color,.95),label=this.add.text(actor.x,actor.y-72,read.label,{fontFamily:'serif',fontSize:'12px',fontStyle:'bold',color:safe?'#bfffe6':'#ffd3d9',backgroundColor:'#0b111bdd',padding:{x:6,y:3}}).setOrigin(.5);this.intentLayer.add([g,label])}
private actorDisplayName(team:'player'|'enemy',actorId:string,archetype?:EnemyArchetype){
    if(team==='player')return playerRosterEntry(actorId)?.name??actorId;
    const names:Partial<Record<EnemyArchetype,string>>={swift:'迅影',crusher:'重鎧',hexer:'咒徒','wet-corpse':'濡骸','lantern-child':'提燈童','mountain-hound':'山犬','wayfarer-umbrella':'辻傘','noose-ghost':'縊鬼','lost-monk':'迷途僧','rain-warrior':'雨夜武者','rain-boss':'站守'};
    return(archetype&&names[archetype])||actorId
  }
private portraitBaseForNode(n:ActionNode){
    const actor=(n.team==='player'?this.players:this.enemies).get(n.actorId);
    if(n.team==='player')return playerRosterEntry(n.actorId)?.assetPrefix??'rin';
    return actor?.archetype??''
  }
private playerPortraitBase(actorId:string){return playerRosterEntry(actorId)?.assetPrefix??'rin'}

private renderTimeline(){
    this.timelineLayer.removeAll(true);
    const planned=applyPlannedInitiative(this.timeline,this.commands);
    const players=planned.filter(n=>n.team==='player').sort((a,b)=>(b.initiative??b.speed)-(a.initiative??a.speed));
    const enemies=planned.filter(n=>n.team==='enemy').sort((a,b)=>(b.initiative??b.speed)-(a.initiative??a.speed));
    const values=planned.map(n=>n.initiative??n.speed),max=Math.max(...values,1),min=Math.min(...values,0);
    const xFor=(n:ActionNode)=>{const v=n.initiative??n.speed,t=max===min ? 0.5 : (max-v)/(max-min);return Phaser.Math.Linear(300,1160,t)};
    const current=this.currentPlanner()??planned[0];
    this.timelineLayer.setVisible(true).setAlpha(this.busy ? .22 : 1);
    this.timelineLayer.add(this.add.rectangle(640,43,1280,86,0x03070c,.92));
    this.timelineLayer.add(this.add.rectangle(640,84,1280,2,0x9ab3bb,.16));
    this.timelineLayer.add(this.add.text(230,20,'我方',{fontFamily:'sans-serif',fontSize:'10px',fontStyle:'bold',color:'#8fefff'}).setOrigin(1,.5));
    this.timelineLayer.add(this.add.text(230,61,'敵方',{fontFamily:'sans-serif',fontSize:'10px',fontStyle:'bold',color:'#ff91a3'}).setOrigin(1,.5));
    this.timelineLayer.add(this.add.rectangle(720,20,880,2,0x477b86,.52));this.timelineLayer.add(this.add.rectangle(720,61,880,2,0x7d3948,.52));
    const drawLane=(nodes:ActionNode[],y:number)=>nodes.forEach(n=>{
      const x=xFor(n),isCurrent=n.id===current?.id,teamColor=n.team==='player'?0x65d9ed:0xe5657a,base=this.portraitBaseForNode(n),key=base?`portrait-${base}-timeline`:'';
      this.timelineLayer.add(this.add.circle(x,y,isCurrent?18:15,0x071016,.96).setStrokeStyle(isCurrent?3:1.5,isCurrent?0xffe69a:teamColor,isCurrent?1:.78));
      if(key&&this.textures.exists(key))this.timelineLayer.add(this.add.image(x,y,key).setDisplaySize(isCurrent?29:24,isCurrent?29:24));
      else this.timelineLayer.add(this.add.text(x,y,n.actorId,{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#fff'}).setOrigin(.5));
      this.timelineLayer.add(this.add.text(x,y+18,String(n.initiative??n.speed),{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:isCurrent?'#ffe6a0':'#879ba2'}).setOrigin(.5));
    });
    drawLane(players,20);drawLane(enemies,61);
    if(current){
      const base=this.portraitBaseForNode(current),key=base?`portrait-${base}-current`:'',teamColor=current.team==='player'?0x8fefff:0xff8298,actor=(current.team==='player'?this.players:this.enemies).get(current.actorId),displayName=this.actorDisplayName(current.team,current.actorId,actor?.archetype);
      this.timelineLayer.add(this.add.polygon(42,42,[0,-35,35,0,0,35,-35,0],0x02070b,1).setStrokeStyle(3,teamColor,.98));
      if(key&&this.textures.exists(key)){const maskShape=this.add.graphics().fillStyle(0xffffff,1).fillPoints([new Phaser.Math.Vector2(42,7),new Phaser.Math.Vector2(77,42),new Phaser.Math.Vector2(42,77),new Phaser.Math.Vector2(7,42)],true).setVisible(false);const portrait=this.add.image(42,42,key).setDisplaySize(70,70).setMask(maskShape.createGeometryMask());this.timelineLayer.add([maskShape,portrait]);this.timelineLayer.add(this.add.polygon(42,42,[0,-35,35,0,0,35,-35,0],0xffffff,0).setStrokeStyle(2,teamColor,1))}
      this.timelineLayer.add(this.add.text(103,21,'行動',{fontFamily:'sans-serif',fontSize:'9px',fontStyle:'bold',color:'#e8c978'}).setOrigin(.5));
      this.timelineLayer.add(this.add.text(103,42,displayName,{fontFamily:'serif',fontSize:'15px',fontStyle:'bold',color:'#fff'}).setOrigin(.5));
      this.timelineLayer.add(this.add.text(103,62,`時序 ${current.initiative??current.speed}`,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:current.team==='player'?'#9eefff':'#ff9aac'}).setOrigin(.5));
    }
  }
private cardPalette(card:BattleCard){
    if(card.definitionId==='quick')return{frame:0x6fdaf0,base:0x102b36,accent:0x9ceeff,label:'#9ceeff'};
    if(card.definitionId==='heavy')return{frame:0xd9a14f,base:0x34261b,accent:0xffd27d,label:'#ffd27d'};
    if(card.definitionId==='break')return{frame:0xb95842,base:0x382020,accent:0xffae70,label:'#ffae70'};
    if(card.definitionId==='guard'||card.definitionId==='cover')return{frame:0x4faab9,base:0x15333b,accent:0x8defff,label:'#8defff'};
    if(card.definitionId==='cycle')return{frame:0x579169,base:0x1e3427,accent:0xa8e6bd,label:'#a8e6bd'};
    if(card.definitionId==='relay')return{frame:0xa88e4d,base:0x352f1e,accent:0xffe38c,label:'#ffe38c'};
    return{frame:0x735f9f,base:0x2d2640,accent:0xc4a5ff,label:'#c4a5ff'}
  }
private cardInvalidReason(card:BattleCard){
    const planner=this.currentPlanner();if(!planner)return'沒有可規劃的角色';
    if(card.definitionId==='cover'){
      const enemies=this.timeline.filter(n=>n.team==='enemy'&&Boolean(n.enemySkill));
      if(!enemies.length)return'沒有敵方殺生線';
      const reasons:string[]=[];
      for(const enemy of enemies){const r=selectCoverIntent({timeline:this.timeline,commands:this.commands,actorId:planner.actorId,actorSpeed:planner.speed,cardTempo:card.tempo,selectedActorId:enemy.enemySkill!.targetId,selectedEnemyId:enemy.actorId});if(r.ok)return undefined;reasons.push(r.reason)}
      if(reasons.includes('slow'))return'速度不足，無法截刀';if(reasons.includes('reserved'))return'可截斷的殺生線已被預約';if(reasons.every(r=>r==='self'))return'目前敵人只鎖定自己';return'沒有可掩護的殺生線'
    }
    if(card.definitionId==='guard'||card.definitionId==='cycle')return undefined;
    if(card.intent==='attack'||card.intent==='disruption')return[...this.enemies.values()].some(a=>a.alive)?undefined:'沒有可指定的敵人';
    return undefined
  }
private cardRows(card:BattleCard){
    const rows:{icon:string;text:string}[]=[];
    if(card.damage)rows.push({icon:'damage',text:`傷害 ${card.damage}`});
    if(card.balanceDamage)rows.push({icon:'balance',text:`架勢 ${card.balanceDamage}`});
    if(card.shield)rows.push({icon:'shield',text:`護符 ${card.shield}`});
    if(card.definitionId==='cover')rows.push({icon:'intercept',text:'截斷殺生線'});
    if(card.assist)rows.push({icon:'relay',text:'命中後補刀'});
    if(card.restoreBalance)rows.push({icon:'restore',text:`架勢 +${card.restoreBalance}`});
    if(card.clearExposed)rows.push({icon:'restore',text:'清除破綻'});
    if(card.delayTarget)rows.push({icon:'tempo',text:`敵序 −${card.delayTarget}`});
    return rows.slice(0,3)
  }
private clearCardTooltip(){
    for(const item of [...this.handLayer.list])if(item instanceof Phaser.GameObjects.Container&&item.getData('cardTooltip'))item.destroy(true);
    if(this.cardTooltip){this.cardTooltip.destroy(true);this.cardTooltip=undefined}
  }
private showCardTooltip(card:BattleCard,_x:number,invalid?:string){
    this.clearCardTooltip();const p=this.cardPalette(card),tip=this.add.container(1170,566).setDepth(96).setData('cardTooltip',true);this.handLayer.add(tip);this.cardTooltip=tip;
    const rows=[...this.cardRows(card),{icon:'tempo',text:`時序 ${card.tempo>0?'+':''}${card.tempo}`}].slice(0,4);
    const h=64+rows.length*15+(invalid?22:0),w=190,bg=this.add.graphics();bg.fillStyle(0x061018,.96).fillRoundedRect(-w/2,-h,w,h,7);bg.lineStyle(1,p.frame,.78).strokeRoundedRect(-w/2,-h,w,h,7);tip.add(bg);
    tip.add(this.add.text(-82,-h+12,card.name,{fontFamily:'serif',fontSize:'14px',fontStyle:'bold',color:'#ffffff'}));tip.add(this.add.text(82,-h+13,card.tags.slice(0,2).join('・'),{fontFamily:'sans-serif',fontSize:'8px',color:p.label}).setOrigin(1,0));
    rows.forEach((r,i)=>{const yy=-h+36+i*15;if(this.textures.exists(`card-icon-${r.icon}`))tip.add(this.add.image(-79,yy,`card-icon-${r.icon}`).setDisplaySize(11,11).setTint(p.accent));tip.add(this.add.text(-65,yy,r.text,{fontFamily:'sans-serif',fontSize:'9px',color:'#dce8ec'}).setOrigin(0,.5))});
    if(invalid)tip.add(this.add.text(0,-7,`! ${invalid}`,{fontFamily:'sans-serif',fontSize:'9px',fontStyle:'bold',color:'#ffb0be',backgroundColor:'#4b1724',padding:{x:6,y:3}}).setOrigin(.5,1));
  }
private renderHand(){
    this.clearCardTooltip();this.handLayer.removeAll(true);
    const assigned=new Set([...this.commands.values()].filter((x):x is PlayerCommand=>Boolean(x)).map(x=>x.card.instanceId));
    const cards=this.deck.hand.filter(c=>!assigned.has(c.instanceId)).slice(0,this.visibleHandCount);
    const dock=this.add.graphics();dock.fillStyle(0x03080d,.95).fillRect(0,580,1280,140);dock.fillStyle(0x0a171e,.86).fillRect(0,580,1280,2);dock.lineStyle(1,0x8ba0a8,.22).lineBetween(0,580,1280,580);dock.lineStyle(1,0x7f5932,.18).lineBetween(184,592,184,704);this.handLayer.add(dock);
    const gap=126,start=700-(cards.length-1)*gap/2;
    cards.forEach((card,i)=>{
      const selected=isCardSelected(this.selected,card),invalid=this.cardInvalidReason(card),x=start+i*gap,baseY=selected?632:644,p=this.cardPalette(card);const group=this.add.container(x,baseY).setDepth(selected?31:25);this.handLayer.add(group);
      const frame=this.add.graphics();frame.fillStyle(p.base,invalid?.58:.98).fillRoundedRect(-60,-75,120,150,9);frame.lineStyle(selected?3:1.5,selected?0xf0d47c:p.frame,selected?1:.82).strokeRoundedRect(-60,-75,120,150,9);frame.fillStyle(0x05090d,.72).fillRoundedRect(-54,-69,108,24,5);frame.fillStyle(p.accent,.9).fillRect(-55,-70,4,138);frame.lineStyle(1,p.accent,.35).lineBetween(-51,-40,51,-40);group.add(frame);const family=card.intent==='defense'?'defense':card.intent==='support'?'support':card.intent==='disruption'?'tactics':'attack',skinKey=`card-frame-${family}`;if(this.textures.exists(skinKey))group.add(this.add.image(0,0,skinKey).setDisplaySize(120,150).setAlpha(invalid?.4:.9));
      const artKey=`card-art-${card.definitionId}`;if(this.textures.exists(artKey))group.add(this.add.image(0,-10,artKey).setDisplaySize(104,66).setAlpha(invalid?.42:.92));
      group.add(this.add.text(0,-57,card.name,{fixedWidth:88,align:'center',fontFamily:'sans-serif',fontSize:'15px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5));
      const typeLabel=card.intent==='attack'?'攻':card.intent==='defense'?'守':card.intent==='support'?'整':'策';group.add(this.add.text(46,-57,typeLabel,{fontFamily:'serif',fontSize:'9px',fontStyle:'bold',color:p.label,backgroundColor:'#0b1218',padding:{x:3,y:2}}).setOrigin(.5));
      if(this.textures.exists('card-icon-power'))group.add(this.add.image(-42,27,'card-icon-power').setDisplaySize(22,22).setTint(p.accent));group.add(this.add.text(-42,27,card.clashPower>0?String(card.clashPower):'—',{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5));
      if(this.textures.exists('card-icon-tempo'))group.add(this.add.image(38,27,'card-icon-tempo').setDisplaySize(16,16).setTint(card.tempo>0?0x9af5ff:card.tempo<0?0xffa68f:0xb8c3c7).setFlipY(card.tempo<0));group.add(this.add.text(38,43,card.tempo>0?`+${card.tempo}`:String(card.tempo),{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:card.tempo>0?'#9af5ff':card.tempo<0?'#ffb3a7':'#cbd4d7'}).setOrigin(.5));
      const rows=this.cardRows(card).slice(0,2);rows.forEach((r,ri)=>{const yy=53+ri*14;if(this.textures.exists(`card-icon-${r.icon}`))group.add(this.add.image(-34,yy,`card-icon-${r.icon}`).setDisplaySize(11,11).setTint(p.accent));group.add(this.add.text(-25,yy,r.text,{fixedWidth:72,fontFamily:'sans-serif',fontSize:'8px',fontStyle:'bold',color:'#e4ecef'}).setOrigin(0,.5))});
      if(invalid)group.add(this.add.text(0,67,'! 不可用',{fontFamily:'sans-serif',fontSize:'8px',fontStyle:'bold',color:'#ff9caf',backgroundColor:'#4a1623',padding:{x:5,y:2}}).setOrigin(.5));
      const hit=this.add.rectangle(0,0,120,150,0xffffff,.001).setInteractive({useHandCursor:!invalid});group.add(hit);
      hit.on('pointerover',()=>{this.showCardTooltip(card,x,invalid);this.tweens.add({targets:group,y:baseY-12,scale:1.06,duration:90,ease:'Quad.easeOut'})});
      hit.on('pointerout',()=>{this.clearCardTooltip();if(this.selected)this.showCardTooltip(this.selected,0,this.cardInvalidReason(this.selected));this.tweens.add({targets:group,y:baseY,scale:1,duration:90,ease:'Quad.easeOut'})});
      hit.on('pointerdown',()=>{if(this.discardMode){this.discardHandCard(card,x);return}if(invalid){this.setStatus(invalid);this.showCardTooltip(card,x,invalid);return}this.selected=card;this.renderHand();this.setStatus(card.definitionId==='cover'?'選擇友方，或直接點一條敵方殺生線。':'')});
    });
    if(this.selected)this.showCardTooltip(this.selected,0,this.cardInvalidReason(this.selected));
    const deckX=112,discardX=154,hudY=650;this.handLayer.add(this.add.circle(deckX,hudY,24,0x0d1c25,.96).setStrokeStyle(1,0x7e9ca8,.65));this.handLayer.add(this.add.text(deckX,hudY-2,String(this.deck.drawPile.length),{fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',color:'#e7f6ff'}).setOrigin(.5));this.handLayer.add(this.add.text(deckX,684,'牌庫',{fontFamily:'sans-serif',fontSize:'8px',color:'#8ea7b3'}).setOrigin(.5));this.handLayer.add(this.add.circle(discardX,hudY,24,0x24161f,.96).setStrokeStyle(1,0x956077,.58));this.handLayer.add(this.add.text(discardX,hudY-2,String(this.deck.discardPile.length),{fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',color:'#ead7e4'}).setOrigin(.5));this.handLayer.add(this.add.text(discardX,684,'棄牌',{fontFamily:'sans-serif',fontSize:'8px',color:'#a98d9f'}).setOrigin(.5));
    const canDiscard=!this.busy&&!this.discardUsedThisRound&&cards.length>0;const discardButton=this.button(228,636,74,this.discardMode?'取消':'棄牌',()=>{if(!canDiscard&&!this.discardMode)return;this.discardMode=!this.discardMode;this.selected=undefined;this.setStatus(this.discardMode?'選擇 1 張手牌棄掉；本輪不立即補牌。':'');this.renderHand()},canDiscard||this.discardMode?0x683044:0x343640).setAlpha(canDiscard||this.discardMode?1:.45);this.handLayer.add(discardButton)
  }
private updateUndoVisibility(){if(this.undoButton)this.undoButton.setVisible(!this.busy&&[...this.commands.values()].some(command=>command!==null))}
private discardHandCard(card:BattleCard,fromX:number){
  if(this.busy||this.discardUsedThisRound||!this.deck.hand.some(item=>item.instanceId===card.instanceId))return;
  this.deck={...this.deck,hand:this.deck.hand.filter(item=>item.instanceId!==card.instanceId),discardPile:[...this.deck.discardPile,card]};
  this.discardMode=false;this.discardUsedThisRound=true;this.selected=undefined;this.visibleHandCount=Math.min(this.visibleHandCount,this.deck.hand.length);this.renderHand();this.animateCardTravel(fromX,310,0x823447);this.setStatus('已棄 1 張；下一回合補牌。')
}
private animateCardTravel(fromX:number,toX:number,color:number,onArrive?:()=>void){
    const ghost=this.add.rectangle(fromX,650,42,58,color,.95).setStrokeStyle(2,0xffe7a0).setDepth(120);this.hudLayer.add(ghost);
    this.tweens.add({targets:ghost,x:toX,y:625,angle:fromX<toX?8:-8,scale:1.35,duration:260,ease:'Cubic.easeOut',onComplete:()=>{onArrive?.();this.tweens.add({targets:ghost,alpha:0,y:650,duration:130,onComplete:()=>ghost.destroy()})}})
  }
private clearActorOutline(a:Actor){
    const sprite=a.sprite as Phaser.GameObjects.Sprite&{postFX?:{clear:()=>void}};
    sprite.postFX?.clear();
    a.root.setData('focusOutline',[]);
  }
private applyActorOutline(a:Actor,color:number){
    this.clearActorOutline(a);
    const sprite=a.sprite as Phaser.GameObjects.Sprite&{postFX?:{addGlow:(color:number,outerStrength?:number,innerStrength?:number,knockout?:boolean,quality?:number,distance?:number)=>unknown}};
    // P9.1: genuine alpha-silhouette outline. It follows the active texture/pose
    // automatically and does not duplicate/offset the character image.
    sprite.postFX?.addGlow(color,1.8,0,false,.1,4);
  }

private coverStatusMessage(reason:'self'|'none'|'multiple'|'reserved'|'slow'){
    return {self:'掩護用於保護隊友；自身防禦請用堅守。',none:'此目標目前沒有可截斷的殺生線。',multiple:'此角色身上有多條殺生線；請直接點要截斷的敵人。',reserved:'這條殺生線已由其他角色攔下。',slow:'速度不足，這次掩護趕不上。'}[reason]
  }

private focus(){
    for(const a of this.players.values()){this.clearActorOutline(a);if(a.alive){a.root.setAlpha(.94);a.hud.setAlpha(.92);if(a.sprite.getData('heroine'))playHeroinePose(a.sprite,'idle');else a.sprite.play('hero-idle')}else{a.root.setAlpha(.5);a.hud.setAlpha(.25)}(a.root.list[0]as Phaser.GameObjects.Ellipse).setVisible(false)}
    const n=this.currentPlanner();
    if(!n){void this.resolve();return}
    const a=this.players.get(n.actorId)!;
    a.root.setAlpha(1);a.hud.setAlpha(1);(a.root.list[0]as Phaser.GameObjects.Ellipse).setVisible(false);if(a.sprite.getData('heroine'))playHeroinePose(a.sprite,'ready');else a.sprite.play('hero-ready');
    this.applyActorOutline(a,0xbff8ff);
    this.phase.setText('');
    this.setStatus('')
  }
private target(id:string){
  const node=this.currentPlanner();if(!this.selected||!node)return;
  const selectedActor=this.players.get(id)??this.enemies.get(id);if(selectedActor&&!canTargetActor(selectedActor)){this.setStatus('斷命目標只能由復活效果指定。');return}
  let targetNode:ActionNode|undefined,targetActorId=id;
  if(this.selected.definitionId==='cover'){
    const result=selectCoverIntent({timeline:this.timeline,commands:this.commands,actorId:node.actorId,actorSpeed:node.speed,cardTempo:this.selected.tempo,selectedActorId:id,selectedEnemyId:this.enemies.has(id)?id:undefined});
    if(!result.ok){this.setStatus(this.coverStatusMessage(result.reason));if(result.reason==='multiple'){this.intentFocus=id;this.renderEnemyIntents()}return}
    targetNode=result.enemy;targetActorId=result.protectedActorId;
  }else{
    const hostile=this.selected.intent==='attack'||this.selected.intent==='disruption',enemy=this.enemies.has(id);
    if(hostile!==enemy){this.setStatus(hostile?'此卡必須指定敵方。':'此卡必須指定友方。');return}
    if(this.selected.definitionId==='guard'&&id!==node.actorId){this.setStatus('堅守只能以自身為目標。');return}
    if(this.selected.definitionId==='cycle'&&id!==node.actorId){this.setStatus('整備由行動者執行，請選擇自身。');return}
    targetNode=enemy?this.timeline.find(n=>n.team==='enemy'&&n.actorId===id):undefined
  }
  this.commands.set(node.id,{nodeId:node.id,actorId:node.actorId,card:this.selected,targetNodeId:targetNode?.id,targetActorId});this.selected=undefined;this.previewTargetId=undefined;this.intentFocus=undefined;this.planIndex++;this.renderHand();this.renderTimeline();this.updateUndoVisibility();this.focus();this.renderEnemyIntents()
}
private skip(){const node=this.currentPlanner();if(this.busy||!node)return;const actorId=node.actorId;this.commands.set(node.id,null);this.skipBonusNext.add(actorId);this.planIndex++;this.renderTimeline();this.updateUndoVisibility();this.setStatus('跳過｜下回合速度 +2（一次）');this.focus()}
private undoCommand(){
    if(this.busy||![...this.commands.values()].some(command=>command!==null))return;
    const entries=[...this.commands.entries()],last=entries[entries.length-1];
    if(!last)return;
    const [nodeId,command]=last;
    if(command===null){const node=this.timeline.find(n=>n.id===nodeId);if(node)this.skipBonusNext.delete(node.actorId)}
    this.commands.delete(nodeId);this.planIndex=Math.max(0,this.planIndex-1);this.selected=undefined;this.previewTargetId=undefined;this.intentFocus=undefined;
    this.renderHand();this.renderTimeline();this.updateUndoVisibility();this.focus();this.renderEnemyIntents()
}
private nextRound(automatic=false){
    if(this.busy)return;
    this.discardMode=false;
    if(![...this.enemies.values()].some(a=>a.alive)){this.setStatus('戰鬥勝利');return}
    if(this.planIndex<this.planning.length){
      let node=this.currentPlanner();
      while(node){
        this.commands.set(node.id,null);this.skipBonusNext.add(node.actorId);this.planIndex++;
        node=this.currentPlanner()
      }
      this.selected=undefined;this.previewTargetId=undefined;this.intentFocus=undefined;
      this.renderHand();this.renderTimeline();this.updateUndoVisibility();this.renderEnemyIntents();this.focus();
      return
    }
    if(!automatic)return;
    this.round++;this.publishQaState();
    clearEndOfRoundStatuses([...this.players.values(),...this.enemies.values()]);[...this.players.values(),...this.enemies.values()].forEach(a=>{a.traitReady=true;this.refreshActor(a)});
    this.timeline=this.timeline.filter(n=>(n.team==='player'?this.players:this.enemies).get(n.actorId)?.alive);
    const targets=[...this.players.entries()].filter(([,a])=>a.alive).map(([id])=>id),enemyNodes=this.timeline.filter(n=>n.team==='enemy'),roundRoles=enemyNodes.map(n=>(this.enemies.get(n.actorId)?.archetype??n.enemySkill?.archetype??'wet-corpse') as EnemyArchetype),roundSkills=dealEnemySkillsForArchetypes(roundRoles,Math.random,enemyNodes.map(n=>n.enemySkill?.name));
    if(targets.length===0){this.setStatus('全隊斷命');return}
    let enemyIndex=0;
    for(const node of this.timeline){
      const bonus=node.team==='player'&&this.skipBonusNext.has(node.actorId)?2:0;
      const role=node.team==='enemy'?this.enemies.get(node.actorId)?.archetype:undefined;node.speed=(role==='swift'||role==='lantern-child'||role==='mountain-hound'?Phaser.Math.Between(7,9):role==='crusher'||role==='wayfarer-umbrella'||role==='rain-warrior'||role==='rain-boss'?Phaser.Math.Between(3,5):Phaser.Math.Between(5,7))+bonus;node.initiative=undefined;
      if(node.team==='enemy'){const skill=roundSkills[enemyIndex++]!;node.enemySkill={id:`${node.actorId}-skill-r${this.round}`,...skill,targetId:Phaser.Math.RND.pick(targets)}}
    }
    this.skipBonusNext.clear();
    this.timeline.sort((a,b)=>b.speed-a.speed||(a.team==='player'?-1:1)).forEach((node,index)=>node.order=index);
    this.planning=this.timeline.filter(n=>n.team==='player').sort((a,b)=>b.speed-a.speed);
    this.commands.clear();this.intentFocus=undefined;this.previewTargetId=undefined;this.planIndex=0;this.selected=undefined;this.discardMode=false;this.discardUsedThisRound=false;this.updateUndoVisibility();
    const handBefore=this.deck.hand.length;this.intentController.beginPlanning();this.renderEnemyIntents();this.deck=refillHand(this.deck,5);
    const drawn=this.deck.hand.length-handBefore,finalStart=690-(this.deck.hand.length-1)*112/2;this.visibleHandCount=handBefore;this.renderHand();for(let i=0;i<drawn;i++)this.time.delayedCall(i*170,()=>this.animateCardTravel(245,finalStart+(handBefore+i)*112,0x286174,()=>{this.visibleHandCount++;this.renderHand()}));this.renderTimeline();this.focus()
  }
private refreshActor(a:Actor){
    this.fighterHud.refresh(a.hudView,a)
  }
private damage(a:Actor,n:number,balanceDamage=1,deferDeath=false,deathStyle:DeathStyle='normal'){
    const result=resolveDamage(a,n,balanceDamage),{blocked,hpLoss,justBroken,justShattered,died}=result;
    a.hp=result.hp;a.shield=result.shield;a.tempShield=result.tempShield;a.balance=result.balance;a.alive=deferDeath&&died?true:result.alive;a.broken=result.broken;
    if(died&&!deferDeath){a.hit.disableInteractive();a.exposed=false;a.hud.setAlpha(.35);this.deathPresenter.play(a,[...this.enemies.values()].includes(a),deathStyle);const actorId=[...this.players.entries(),...this.enemies.entries()].find(([,actor])=>actor===a)?.[0],node=this.timeline.find(item=>item.actorId===actorId);if(actorId&&(this.previewTargetId===actorId||this.intentFocus===actorId)){this.previewTargetId=undefined;this.intentFocus=undefined}if(node?.team==='player')this.skipBonusNext.delete(node.actorId)}
    this.refreshActor(a);
    // Neutral contact flash: preserve the authored sprite palette.
    if(hpLoss>0&&a.sprite){const prevAlpha=a.sprite.alpha;a.sprite.setAlpha(Math.min(prevAlpha,.62));this.tweens.add({targets:a.sprite,alpha:prevAlpha,duration:110,ease:'Quad.easeOut'})}
    // 傷害數字：從 1.6× 彈到 1.0×（Back.easeOut），字體加黑 stroke，heavy／崩勢字更大；上升距離 44px。
    const feedback=died&&!deferDeath?'':justShattered?'破符！':hpLoss>0?`−${hpLoss}`:balanceDamage>0&&n===0?`架勢 −${balanceDamage}`:blocked>0?`護符 −${blocked}`:'',color=justShattered?'#9ff5ff':balanceDamage>0&&n===0?'#ffcf75':'#ff8294';
    if(feedback){
      const heavyText=justShattered||hpLoss>=8;
      const text=this.add.text(a.root.x,a.root.y-70,feedback,{fontFamily:'sans-serif',fontSize:heavyText?'26px':'18px',fontStyle:'bold',color,stroke:'#000',strokeThickness:4,backgroundColor:'#080b12dd',padding:{x:9,y:4}}).setOrigin(.5).setDepth(95).setScale(1.6);
      this.combatLayer.add(text);
      this.tweens.add({targets:text,scale:1,duration:190,ease:'Back.easeOut'});
      this.tweens.add({targets:text,y:text.y-44,alpha:0,duration:720,ease:'Cubic.easeOut',onComplete:()=>text.destroy()});
    }
    return{justBroken,died}
  }
// 護符 (guard) / 截刀 (cover) 的護甲值改灌入臨時護甲 tempShield：
// 只在本回合有效，回合結束由 StatusLifecycle.clearEndOfRoundStatuses 清零。
private shield(a:Actor,n:number){a.tempShield=Math.min(50,a.tempShield+n);this.refreshActor(a)}
private hitMonster(attacker:Actor,target:Actor,card:BattleCard,extraBalance=0,deferDeath=false,deathStyle:DeathStyle='normal'){
    const hit=resolveMonsterHit(target.archetype,card,{exposed:target.exposed,broken:target.broken,traitReady:target.traitReady});if(hit.consumeTrait)target.traitReady=false;if(hit.cue)this.resultFxPresenter.playMonsterRule(target,hit.cue);const result=this.damage(target,hit.damage,hit.balanceDamage+extraBalance,deferDeath,deathStyle);if(hit.backlashBalance&&attacker.alive)this.damage(attacker,0,hit.backlashBalance);return result
  }
private async relayAssist(sourceId:string,targetId:string,actions:ActionPresenter,allyId?:string){
    const ally=allyId??[...this.players.keys()].find(id=>id!==sourceId&&this.players.get(id)!.alive&&!this.players.get(id)!.broken);
    if(!ally)return;
    await actions.relay(sourceId,ally,targetId,false,()=>{const target=this.enemies.get(targetId)!;this.damage(target,6,2,false,'relay');return target.hp<=0})
  }
private relayAlly(team:'player'|'enemy',sourceId:string){
    const actors=team==='player'?this.players:this.enemies;
    return [...actors.keys()].find(id=>id!==sourceId&&actors.get(id)!.alive&&!actors.get(id)!.broken)
  }
private async resolve(){
  this.busy=true;this.updateUndoVisibility();this.intentController.beginExecution();this.handLayer.setVisible(false);this.timelineLayer.setAlpha(.18);this.setStatus('');this.players.forEach(a=>{this.clearActorOutline(a);a.root.setAlpha(a.alive?1:.5);a.hud.setAlpha(a.alive?1:.25);(a.root.list[0]as Phaser.GameObjects.Ellipse).setVisible(false)});this.phase.setText('');
  const {beats}=this.resolutionController.createPlan(this.timeline,this.commands),presenter=new ClashPresenter(this,this.players,this.enemies,this.combatLayer),actions=new ActionPresenter(this,this.players,this.enemies,this.combatLayer),queuedRelays=planPlayerRelayContinuations(beats),consumedRelayNodes=new Set([...queuedRelays.values()].map(command=>command.nodeId));
  let pursuitTarget='';let pursuitCount=0;
  for(const beat of beats){
    this.intentFocus=beat.kind==='clash'?beat.clash.enemy.actorId:beat.kind==='enemy-one-sided'?beat.enemy.actorId:beat.kind==='player-one-sided'?beat.command.targetActorId:undefined;this.previewTargetId=undefined;
    if(beat.kind==='clash'){
      const playerActor=this.players.get(beat.clash.player.actorId)!,enemyActor=this.enemies.get(beat.clash.enemy.actorId)!;
      if(!playerActor.alive||!enemyActor.alive)continue;
      const brokenAction=brokenClashAction(playerActor.broken,enemyActor.broken);
      if(brokenAction!=='clash'){
        if(playerActor.broken)await actions.cancel(beat.clash.player.actorId);
        if(enemyActor.broken)await actions.cancel(beat.clash.enemy.actorId,true);
        if(brokenAction==='player-one-sided')await actions.attack(beat.clash.player.actorId,beat.clash.enemy.actorId,beat.clash.player.card,false,'normal',true,()=>this.hitMonster(playerActor,enemyActor,beat.clash.player.card,0,false,beat.clash.player.card.definitionId==='heavy'?'heavy':'normal').died);
        else if(brokenAction==='enemy-one-sided')await actions.attack(beat.clash.enemy.actorId,beat.clash.player.actorId,{name:beat.clash.enemy.enemySkill!.name,clashPower:beat.clash.enemy.enemySkill!.clashPower},true,'normal',true,()=>this.damage(playerActor,beat.clash.enemy.enemySkill!.damage,beat.clash.enemy.enemySkill!.balanceDamage??1).died);
        continue
      }
      const queuedRelay=queuedRelays.get(beat.clash.enemy.id);
      if(beat.clash.source==='intercept'&&beat.clash.player.card.definitionId==='cover'&&beat.clash.player.card.shield)this.shield(playerActor,beat.clash.player.card.shield);
      const playerRelay=(beat.clash.winner==='tie'||beat.clash.winner==='player')&&Boolean(beat.clash.player.card.assist);
      const enemyRelay=(beat.clash.winner==='tie'||beat.clash.winner==='enemy')&&Boolean(beat.clash.enemy.enemySkill?.assist);
      const playerAlly=queuedRelay?.actorId??(playerRelay?this.relayAlly('player',beat.clash.player.actorId):undefined);
      const enemyAlly=enemyRelay?this.relayAlly('enemy',beat.clash.enemy.actorId):undefined;
      const hold=Boolean(playerAlly||enemyAlly);
      const playerRelayImpact=()=>{if(queuedRelay){const ally=this.players.get(queuedRelay.actorId)!;return this.hitMonster(ally,enemyActor,queuedRelay.card,0,false,'relay').died}this.damage(enemyActor,6,2,false,'relay');return enemyActor.hp<=0};
      await presenter.play(beat.clash,hold,()=>{
        if(beat.clash.winner==='player'){
          const result=this.hitMonster(playerActor,enemyActor,beat.clash.player.card,0,Boolean(playerAlly),beat.clash.player.card.definitionId==='heavy'?'heavy':'normal');
          enemyActor.exposed=enemyActor.alive;this.refreshActor(enemyActor);return result.died&&!playerAlly
        }
        if(beat.clash.winner==='enemy'){
          const result=this.damage(playerActor,beat.clash.enemy.enemySkill!.damage,beat.clash.enemy.enemySkill!.balanceDamage??1,Boolean(enemyAlly));
          playerActor.exposed=playerActor.alive;this.refreshActor(playerActor);return result.died&&!enemyAlly
        }
        return false
      });
      if(beat.clash.winner==='tie'&&hold){
        if(playerAlly&&enemyAlly)await actions.dualRelay(beat.clash.player.actorId,playerAlly,beat.clash.enemy.actorId,enemyAlly,
          ()=>{this.damage(enemyActor,6,2,false,'relay');return enemyActor.hp<=0},
          ()=>{this.damage(playerActor,6,2,false,'relay');return playerActor.hp<=0});
        else if(playerAlly)await actions.relay(beat.clash.player.actorId,playerAlly,beat.clash.enemy.actorId,false,playerRelayImpact);
        else if(enemyAlly)await actions.relay(beat.clash.enemy.actorId,enemyAlly,beat.clash.player.actorId,true,()=>{const target=this.players.get(beat.clash.player.actorId)!;this.damage(target,6,2,false,'relay');return target.hp<=0})
      }
      if(beat.clash.winner==='player'&&playerAlly)await actions.relay(beat.clash.player.actorId,playerAlly,beat.clash.enemy.actorId,false,playerRelayImpact);
      else if(beat.clash.winner==='enemy'&&enemyAlly)await actions.relay(beat.clash.enemy.actorId,enemyAlly,beat.clash.player.actorId,true,()=>{this.damage(playerActor,6,2,false,'relay');return playerActor.hp<=0})
    }else if(beat.kind==='skip'||(beat.kind==='player-one-sided'&&consumedRelayNodes.has(beat.command.nodeId)))continue;
    else{
      const actorId=beat.kind==='enemy-one-sided'?beat.enemy.actorId:beat.command.actorId,targetId=beat.kind==='enemy-one-sided'?beat.enemy.enemySkill!.targetId:beat.command.targetActorId!;
      if(beat.kind==='enemy-one-sided'){
        const actor=this.enemies.get(actorId)!,target=this.players.get(targetId)!;if(!actor.alive||!target.alive)continue;
        const ally=beat.enemy.enemySkill!.assist?this.relayAlly('enemy',actorId):undefined;if(actor.broken){await actions.cancel(actorId,true);continue}
        await actions.attack(actorId,targetId,{name:beat.enemy.enemySkill!.name,clashPower:beat.enemy.enemySkill!.clashPower},true,'normal',!ally,()=>this.damage(target,beat.enemy.enemySkill!.damage,beat.enemy.enemySkill!.balanceDamage??1,Boolean(ally)).died&&!ally);
        if(ally)await actions.relay(actorId,ally,targetId,true,()=>{this.damage(target,6,2,false,'relay');return target.hp<=0})
      }else if(beat.kind==='support'){
        const actor=this.players.get(actorId)!,target=this.players.get(targetId)!;if(!actor.alive||!target.alive)continue;if(actor.broken){await actions.cancel(actorId);continue}
        await actions.support(actorId,targetId,beat.command.card);
        if(beat.command.card.restoreBalance){target.balance=Math.min(8,target.balance+beat.command.card.restoreBalance);if(beat.command.card.clearExposed)target.exposed=false;this.refreshActor(target)}
        else if(beat.command.card.shield)this.shield(target,beat.command.card.shield)
      }else{
        const actor=this.players.get(actorId)!,target=this.enemies.get(targetId)!;if(!actor.alive||!target.alive)continue;if(actor.broken){await actions.cancel(actorId);continue}
        pursuitCount=pursuitTarget===targetId?pursuitCount+1:1;pursuitTarget=targetId;const flank=target.exposed&&beat.command.card.tags.includes('側襲');this.setStatus('');
        let broke=false;await actions.attack(actorId,targetId,beat.command.card,false,flank?'flank':'normal',!beat.command.card.assist,()=>{const extraBalance=(pursuitCount>1?1:0)+(flank?2:0),style:DeathStyle=beat.command.card.definitionId==='heavy'?'heavy':'normal',result=this.hitMonster(actor,target,beat.command.card,extraBalance,Boolean(beat.command.card.assist),style);broke=result.justBroken;return result.died&&!beat.command.card.assist});
        if(flank){target.exposed=false;this.refreshActor(target)}if(broke&&target.alive)await actions.cancel(targetId,true);if(beat.command.card.assist)await this.relayAssist(actorId,targetId,actions)
      }
    }
  }
  const played=this.resolutionController.committedCards(this.commands);this.deck=commitPlayedCards(this.deck,played);this.visibleHandCount=this.deck.hand.length;this.renderHand();played.forEach((_,i)=>this.time.delayedCall(i*70,()=>this.animateCardTravel(640-i*18,310,0x823447)));this.phase.setText(`回合 ${this.round}`);this.intentFocus=undefined;this.intentController.completeRound();
  const outcome=this.resolutionController.outcome(this.players.values(),this.enemies.values());
  if(outcome){this.handLayer.setVisible(false);this.battleAudio?.fadeTo(.05,900);await this.outcomePresenter.show(outcome,{onRetry:()=>this.scene.restart({battlefield:this.battlefieldMode,journeyNodeId:this.journeyNodeId}),onContinue:outcome==='victory'?(this.journeyNodeId?()=>this.returnToJourney():()=>this.scene.restart({battlefield:this.nextBattlefield()})):undefined});return}
  this.handLayer.setVisible(true);this.timelineLayer.setAlpha(1).setVisible(true);const beginNextRound=()=>{this.setStatus('');this.busy=false;this.nextRound(true);this.publishQaState()};this.time.delayedCall(140,beginNextRound);
}
}

// Phaser asset queues belong to preload. Keeping this wrapper outside the
// compressed scene body also prevents dev/prod lifecycle timing differences.
const bootScenePreload=BootScene.prototype.preload;
BootScene.prototype.preload=function(){
  queuePlayerAssets(this.load);
  this.load.image('bg-world01-rail-halt-trial','assets/battle/area01-rail-halt-bg-runtime-trial-v1.png');
  bootScenePreload.call(this);
};

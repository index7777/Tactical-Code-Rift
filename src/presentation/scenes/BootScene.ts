import Phaser from'phaser';import{createTeamDeckState,refillHand,commitPlayedCards,type BattleCard,type TeamDeckState}from'../../core/cards/BattleCards';import{applyPlannedInitiative,buildRoundTimeline}from'../../core/battle/RoundPlanner';import{resolveBattleBeats}from'../../core/battle/ClashResolver';import{dealEnemySkills}from'../../core/battle/EnemySkills';import type{ActionNode,Fighter,PlayerCommand}from'../../core/battle/BattleTypes';import{standbyPosition}from'../battle/BattleLayout';import{ClashPresenter,type VisualActor}from'../battle/ClashPresenter';import{ActionPresenter}from'../battle/ActionPresenter';
import{FighterHudPresenter,type FighterHudView}from'../battle/FighterHudPresenter';import{IntentLayerController}from'../battle/IntentLayerController';
interface Actor extends VisualActor{sprite:Phaser.GameObjects.Sprite;hud:Phaser.GameObjects.Container;hudView:FighterHudView;hp:number;shield:number;balance:number;exposed:boolean;broken:boolean}
export class BootScene extends Phaser.Scene{private pc=4;private ec=4;private busy=false;private round=1;private deck:TeamDeckState=createTeamDeckState();private timeline:ActionNode[]=[];private skipBonusNext=new Set<string>();private players=new Map<string,Actor>();private enemies=new Map<string,Actor>();private commands=new Map<string,PlayerCommand|null>();private planning:ActionNode[]=[];private planIndex=0;private selected?:BattleCard;private intentFocus?:string;private previewTargetId?:string;private toolsVisible=false;private world!:Phaser.GameObjects.Container;private intentLayer!:Phaser.GameObjects.Container;private intentController!:IntentLayerController;private fighterHud!:FighterHudPresenter;private combatLayer!:Phaser.GameObjects.Container;private hudLayer!:Phaser.GameObjects.Container;private handLayer!:Phaser.GameObjects.Container;private timelineLayer!:Phaser.GameObjects.Container;private status!:Phaser.GameObjects.Text;private phase!:Phaser.GameObjects.Text;private battleMusic?:Phaser.Sound.BaseSound;
private visibleHandCount=5;
private currentPlanner(){return applyPlannedInitiative(this.timeline,this.commands).find(n=>n.team==='player'&&!this.commands.has(n.id))}
private toolKey?:Phaser.Input.Keyboard.Key;private toolsInitialized=false;
update(){if(!this.toolKey)this.toolKey=this.input.keyboard?.addKey('T');if(!this.toolsInitialized){this.toolsInitialized=true;this.setDevTools(false)}if(this.toolKey&&Phaser.Input.Keyboard.JustDown(this.toolKey))this.setDevTools(!this.toolsVisible)}
private setDevTools(visible:boolean){this.toolsVisible=visible;const labels=new Set(['重新開始','P−','P+','E−','E+']);for(const item of this.hudLayer?.list??[]){if(item instanceof Phaser.GameObjects.Text){if(item.text==='戰術編碼：裂痕')item.setText('妖異鐵道｜殺生線試作');if(item.text==='FOCUSED CLASH // SHARED DECK')item.setText('讀取殺意・截斷因果・繼刀崩勢');if(labels.has(item.text))item.setVisible(visible)}}this.phase?.setText(visible?'開發工具｜T 收起':this.phase.text.replace('開發工具｜T 收起',''))}
preload(){['bg-sky','bg-mountains-1','bg-mountains-2','bg-trees'].forEach(k=>this.load.image(k,`assets/battle/${k}.png`));this.load.image('slash-fx','assets/battle/slash-fx.png');this.load.spritesheet('intent-smoke','assets/battle/generated/intent-smoke-sheet.png',{frameWidth:64,frameHeight:64});this.load.image('yokai-noise','assets/battle/generated/yokai-noise.png');this.load.audio('battle-music','assets/battle/demo_battle01.mp3');this.load.audio('sword-swish','assets/battle/sword-swish.wav');this.load.audio('sword-impact','assets/battle/sword-impact.wav');this.load.spritesheet('hero','assets/battle/samurai.png',{frameWidth:48,frameHeight:48});this.load.spritesheet('enemy','assets/battle/enemy-knight.png',{frameWidth:64,frameHeight:64});this.load.image('yokai','assets/battle/kamaitachi.png')}
create(){
    if(!this.anims.exists('hero-idle'))this.anims.create({key:'hero-idle',frames:this.anims.generateFrameNumbers('hero',{start:0,end:3}),frameRate:5,repeat:-1});
    if(!this.anims.exists('hero-ready'))this.anims.create({key:'hero-ready',frames:[{key:'hero',frame:4}]});
    if(!this.anims.exists('enemy-idle'))this.anims.create({key:'enemy-idle',frames:this.anims.generateFrameNumbers('enemy',{start:0,end:3}),frameRate:5,repeat:-1});
    this.startBattleMusic();
    this.world=this.add.container();
    this.hudLayer=this.add.container().setDepth(30);
    this.handLayer=this.add.container().setDepth(20);
    this.timelineLayer=this.add.container().setDepth(30);
    this.makeBackdrop();
    this.intentLayer=this.add.container();
    this.intentController=new IntentLayerController(this.intentLayer);
    this.fighterHud=new FighterHudPresenter(this);
    this.combatLayer=this.add.container();
    this.world.add([this.intentLayer,this.combatLayer]);
    const ui=this.cameras.add(0,0,1280,720);
    ui.ignore(this.world);
    this.input.setGlobalTopOnly(false);
    this.cameras.main.ignore([this.hudLayer,this.handLayer,this.timelineLayer]);
    this.hud();
    this.input.keyboard?.on('keydown-Q',()=>this.scene.restart({pc:Math.max(1,this.pc-1),ec:this.ec}));
    this.input.keyboard?.on('keydown-W',()=>this.scene.restart({pc:Math.min(4,this.pc+1),ec:this.ec}));
    this.input.keyboard?.on('keydown-A',()=>this.scene.restart({pc:this.pc,ec:Math.max(1,this.ec-1)}));
    this.input.keyboard?.on('keydown-S',()=>this.scene.restart({pc:this.pc,ec:Math.min(4,this.ec+1)}));
    this.rebuild()
  }
private startBattleMusic(){
  this.battleMusic=this.sound.get('battle-music')??this.sound.add('battle-music',{loop:true,volume:0});
  if(!this.battleMusic.isPlaying)this.battleMusic.play({loop:true,volume:0});
  this.fadeBattleMusic(.3,1200);
  this.game.events.off(Phaser.Core.Events.BLUR,this.onGameBlur,this);
  this.game.events.off(Phaser.Core.Events.FOCUS,this.onGameFocus,this);
  this.game.events.on(Phaser.Core.Events.BLUR,this.onGameBlur,this);
  this.game.events.on(Phaser.Core.Events.FOCUS,this.onGameFocus,this);
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
    this.game.events.off(Phaser.Core.Events.BLUR,this.onGameBlur,this);
    this.game.events.off(Phaser.Core.Events.FOCUS,this.onGameFocus,this);
  });
}
private onGameBlur(){this.fadeBattleMusic(0,500)}
private onGameFocus(){this.fadeBattleMusic(.3,700)}
private fadeBattleMusic(volume:number,duration:number){
  if(!this.battleMusic)return;
  this.tweens.killTweensOf(this.battleMusic);
  this.tweens.add({targets:this.battleMusic,volume,duration,ease:'Sine.easeInOut'});
}
private makeBackdrop(){const items=[this.add.tileSprite(640,290,1280,520,'bg-sky').setTint(0x273342),this.add.tileSprite(640,305,1280,520,'bg-mountains-1').setTint(0x5a4858).setAlpha(.72),this.add.tileSprite(640,320,1280,520,'bg-mountains-2').setTint(0x25313b).setAlpha(.82),this.add.tileSprite(640,340,1280,520,'bg-trees').setTint(0x15191e)];items.forEach(x=>this.world.add(x));const carriage=this.add.container();carriage.add(this.add.rectangle(640,126,1280,24,0x120d11,.96));carriage.add(this.add.rectangle(640,520,1280,28,0x120d11,.97));for(let x=70;x<1280;x+=190){carriage.add(this.add.rectangle(x,323,14,380,0x1e1418,.95));carriage.add(this.add.rectangle(x+94,139,124,8,0x6e4036,.75))}carriage.add(this.add.rectangle(640,505,1280,5,0x8b4b3f,.65));this.world.add(carriage);this.world.add(this.add.rectangle(640,630,1280,180,0x07101b,.98))}
private hud(){
    this.phase=this.add.text(22,9,'',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#cbe9ee'}).setVisible(false);
    this.hudLayer.add(this.phase);
    this.hudLayer.add(this.button(1110,8,145,'重新開始',()=>this.scene.restart({pc:this.pc,ec:this.ec})));
    this.hudLayer.add(this.button(805,8,36,'P−',()=>this.scene.restart({pc:Math.max(1,this.pc-1),ec:this.ec})));
    this.hudLayer.add(this.button(850,8,36,'P+',()=>this.scene.restart({pc:Math.min(4,this.pc+1),ec:this.ec})));
    this.hudLayer.add(this.button(905,8,36,'E−',()=>this.scene.restart({pc:this.pc,ec:Math.max(1,this.ec-1)}),0x713141));
    this.hudLayer.add(this.button(950,8,36,'E+',()=>this.scene.restart({pc:this.pc,ec:Math.min(4,this.ec+1)}),0x713141));
    this.status=this.add.text(640,548,'',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#ffcfb8',backgroundColor:'#481522dd',padding:{x:8,y:4}}).setOrigin(.5);
    this.hudLayer.add(this.status);
    this.hudLayer.add(this.button(1015,612,130,'下一回合',()=>this.nextRound(),0x285c67));
    this.hudLayer.add(this.button(1015,654,130,'跳過',()=>this.skip(),0x4d5364))
  }
private button(x:number,y:number,w:number,label:string,fn:()=>void,color=0x24586e){const b=this.add.text(x,y,label,{fixedWidth:w,align:'center',fontFamily:'sans-serif',fontSize:'14px',color:'#fff',backgroundColor:`#${color.toString(16).padStart(6,'0')}`,padding:{y:8}}).setInteractive({useHandCursor:true});b.on('pointerdown',fn);return b}
private rebuild(){if(this.busy)return;this.world.each((x:any)=>{if(x instanceof Phaser.GameObjects.Container&&x.getData('actor'))x.destroy()});this.players.clear();this.enemies.clear();const ps:Fighter[]=Array.from({length:this.pc},(_,i)=>({id:`P${String.fromCharCode(65+i)}`,team:'player',actorIndex:i,speed:Phaser.Math.Between(4,9),alive:true}));const es:Fighter[]=Array.from({length:this.ec},(_,i)=>({id:`E${String.fromCharCode(65+i)}`,team:'enemy',actorIndex:i,speed:Phaser.Math.Between(4,9),alive:true})),roundSkills=dealEnemySkills(this.ec);const skills=new Map(es.map((e,i)=>{const skill=roundSkills[i]!,target=Phaser.Math.RND.pick(ps);return[e.id,{id:`${e.id}-skill`,...skill,targetId:target.id}]}));this.timeline=buildRoundTimeline(ps,es,skills);ps.forEach(f=>this.addActor(f));es.forEach(f=>this.addActor(f));this.deck=refillHand(this.deck,5);this.commands.clear();this.planning=this.timeline.filter(n=>n.team==='player').sort((a,b)=>b.speed-a.speed);this.planIndex=0;this.selected=undefined;this.renderTimeline();this.renderHand();this.focus();this.renderEnemyIntents()}
private addActor(f:Fighter){
    const p=standbyPosition(f.team,f.team==='player'?this.pc:this.ec,f.actorIndex);
    const accent=f.team==='player'?0x65e7ff:0xff7087;
    const glow=this.add.ellipse(0,43,90,24,accent,.5).setVisible(false);
    const sprite=this.add.sprite(0,-8,f.team==='player'?'hero':'yokai').setScale(f.team==='player'?1.7:1.9).setFlipX(f.team==='enemy');
    if(f.team==='player')sprite.play('hero-idle');else this.tweens.add({targets:sprite,y:-16,duration:520,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

    const hudView=this.fighterHud.create();
    const hud=hudView.root;

    const hit=this.add.rectangle(0,0,120,166,0xffffff,.001).setInteractive({useHandCursor:true});
    hit.on('pointerdown',()=>this.target(f.id));
    hit.on('pointerover',()=>this.previewTarget(f.id));
    hit.on('pointerout',()=>{this.intentFocus=undefined;this.previewTargetId=undefined;this.renderEnemyIntents()});
    const root=this.add.container(p.x,p.y,[glow,sprite,hud,hit]).setData('actor',true);
    this.world.add(root);
    const a={root,x:p.x,y:p.y,sprite,hud,hudView,hp:100,shield:20,balance:10,exposed:false,broken:false};
    (f.team==='player'?this.players:this.enemies).set(f.id,a);
    this.refreshActor(a)
  }
private previewTarget(id:string){
    if(this.selected){
      const hostile=this.selected.intent==='attack'||this.selected.intent==='disruption';
      const validTarget=hostile?this.enemies.has(id):this.players.has(id);
      if(!validTarget){
        this.intentFocus=undefined;this.previewTargetId=undefined;this.renderEnemyIntents();return
      }
    }
    this.intentFocus=id;this.previewTargetId=id;this.renderEnemyIntents();
    if(!this.selected)return;
    const planner=this.currentPlanner();if(!planner)return;
    const initiative=planner.speed+this.selected.tempo;
    if(this.players.has(id)&&this.selected.intent==='defense'){
      const enemy=this.timeline.find(n=>n.team==='enemy'&&n.enemySkill?.targetId===id);
      if(!enemy)return;
      const direct=planner.actorId===id,canClash=direct||initiative>(enemy.initiative??enemy.speed);
      this.drawCoverPreview(planner.actorId,id,canClash,direct,initiative,enemy.initiative??enemy.speed)
    }
  }
private drawCoverPreview(actorId:string,targetId:string,valid:boolean,direct:boolean,actorInitiative:number,enemyInitiative:number){
    const actor=this.players.get(actorId)!,target=this.players.get(targetId)!;
    if(direct){
      const guard=this.add.graphics();
      guard.lineStyle(3,0xb7f8ff,.95).beginPath().arc(target.x-6,target.y,34,-1.15,1.15,false).strokePath();
      const label=this.add.text(target.x,target.y-58,'架守',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#fff',backgroundColor:'#16343bdd',padding:{x:7,y:3}}).setOrigin(.5);
      this.intentLayer.add([guard,label]);return
    }
    // Faster cover reaches farther upstream; a late cover only meets the
    // hostile causality line close to the protected actor.
    const speedEdge=actorInitiative-enemyInitiative;
    const x=Phaser.Math.Clamp(735-speedEdge*28,600,840),y=target.y;
    const g=this.add.graphics();
    const points=new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(actor.x-35,actor.y),new Phaser.Math.Vector2(actor.x-145,actor.y),
      new Phaser.Math.Vector2(x+105,y),new Phaser.Math.Vector2(x,y)
    ).getPoints(24);
    const curve=(width:number,color:number,alpha:number)=>{g.lineStyle(width,color,alpha).beginPath().moveTo(points[0]!.x,points[0]!.y);points.slice(1).forEach(p=>g.lineTo(p.x,p.y));g.strokePath()};
    curve(9,valid?0x52ddeb:0x75696d,.14);curve(2,valid?0xc5fbff:0xb28b91,.98);
    if(valid)g.lineStyle(5,0xffe5a0,1).lineBetween(x-12,y+12,x+12,y-12);
    else g.lineStyle(4,0xff526b,1).lineBetween(x-8,y-8,x+8,y+8).lineBetween(x+8,y-8,x-8,y+8);
    const label=this.add.text(x,y-22,valid?'截刀':'速度不足',{fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#fff',backgroundColor:valid?'#16343bdd':'#5a1b29dd',padding:{x:7,y:3}}).setOrigin(.5);
    this.intentLayer.add([g,label])
  }
  private renderEnemyIntents(){
    this.intentController.clear();
    if(this.busy)return;
    if(!this.intentController.canRenderPlanning())this.intentController.beginPlanning();
    const visualCommands=new Map(this.commands);
    const previewPlanner=this.currentPlanner();
    if(this.previewTargetId&&this.selected&&previewPlanner){
      const hostile=this.selected.intent==='attack'||this.selected.intent==='disruption';
      const previewEnemy=hostile?this.timeline.find(n=>n.team==='enemy'&&n.actorId===this.previewTargetId):undefined;
      if(previewEnemy)visualCommands.set(previewPlanner.id,{nodeId:previewPlanner.id,actorId:previewPlanner.actorId,card:this.selected,targetNodeId:previewEnemy.id,targetActorId:previewEnemy.actorId});
      else if(this.selected.intent==='defense'&&this.players.has(this.previewTargetId))visualCommands.set(previewPlanner.id,{nodeId:previewPlanner.id,actorId:previewPlanner.actorId,card:this.selected,targetActorId:this.previewTargetId})
    }
    const visualBeats=resolveBattleBeats(applyPlannedInitiative(this.timeline,visualCommands),visualCommands);
    const resolvedClashes=new Set<string>();
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
      if(!target)return;
      // A killing intent belongs to its victim, not to an abstract UI lane.
      // Converging at the victim's height keeps the final read unambiguous.
      const lane=target.y;
      const focused=!this.intentFocus||this.intentFocus===targetId||nodes.some(n=>this.intentFocus===n.actorId);
      const passive=this.intentFocus?(focused ? 0.9 : 0.04):0.18;
      const mergeX=570,endX=target.x-42;
      const coverRedirects=new Map<string,Phaser.Math.Vector2>();
      for(const beat of visualBeats){
        if(beat.kind!=='clash'||beat.clash.enemy.enemySkill?.targetId!==targetId||beat.clash.player.card.intent!=='defense'||beat.clash.player.actorId===targetId)continue;
        const actorNode=this.timeline.find(node=>node.team==='player'&&node.actorId===beat.clash.player.actorId);
        const actorInitiative=(actorNode?.initiative??actorNode?.speed??0)+beat.clash.player.card.tempo;
        const enemyInitiative=beat.clash.enemy.initiative??beat.clash.enemy.speed;
        coverRedirects.set(beat.clash.enemy.id,new Phaser.Math.Vector2(Phaser.Math.Clamp(735-(actorInitiative-enemyInitiative)*28,600,840),lane))
      }
      let continuingToTarget=0;
      nodes.forEach((n,index)=>{
        const a=this.enemies.get(n.actorId)!;
        const s=n.enemySkill!;
        const approachOffset=(index-(nodes.length-1)/2)*14;
        const branch=this.add.graphics().setAlpha(passive).setData('intent',true);
        const redirect=coverRedirects.get(n.id);
        if(!redirect)continuingToTarget++;
        const branchFrom=new Phaser.Math.Vector2(a.x+42,a.y),branchTo=redirect??new Phaser.Math.Vector2(mergeX,lane);
        const approachX=branchTo.x-105;
        strokeCurve(branch,{width:focused?6:4,color:0x7b1830,alpha:.26},branchFrom,new Phaser.Math.Vector2(a.x+115,a.y),new Phaser.Math.Vector2(approachX,branchTo.y+approachOffset),branchTo);
        strokeCurve(branch,{width:1,color:0xff6078,alpha:.9},branchFrom,new Phaser.Math.Vector2(a.x+115,a.y),new Phaser.Math.Vector2(approachX,branchTo.y+approachOffset),branchTo);
        this.intentLayer.add(branch);
        const tag=this.add.container(a.x-58,a.y-55).setAlpha(focused?1:.52).setData('intent',true);
        tag.add(this.add.rectangle(0,0,116,28,0x3d101b,.92).setStrokeStyle(1,0xa8374d,.8));
        tag.add(this.add.text(-49,0,s.name,{fixedWidth:72,fontFamily:'sans-serif',fontSize:'11px',fontStyle:'bold',color:'#ffe9ec'}).setOrigin(0,.5));
        tag.add(this.add.text(47,0,String(s.clashPower),{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#ffbf72'}).setOrigin(.5));
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
          const isResolvedClash=resolvedClashes.has(`${commandNodeId}|${n.id}`);
          const actorNode=this.timeline.find(node=>node.team==='player'&&node.actorId===actorId);
          const actorInitiative=(actorNode?.initiative??actorNode?.speed??0)+card.tempo;
          const enemyInitiative=n.initiative??n.speed;
          if(card.intent==='defense'&&isResolvedClash){
            this.drawCoverPreview(actorId,s.targetId,true,actorId===s.targetId,actorInitiative,enemyInitiative);return
          }
          // The visible clash point is the causal result of initiative: faster
          // actors cut the hostile line farther upstream toward the enemy.
          const clashX=isResolvedClash?Phaser.Math.Clamp(735-(actorInitiative-enemyInitiative)*28,600,840):a.x+58;
          const clashY=isResolvedClash?lane:a.y;
          const blade=this.add.graphics().setData('intent',true);
          const bladeFrom=new Phaser.Math.Vector2(actor.x-42,actor.y),bladeTo=new Phaser.Math.Vector2(clashX,clashY);
          strokeCurve(blade,{width:9,color:0x52ddeb,alpha:.12},bladeFrom,new Phaser.Math.Vector2(actor.x-150,actor.y),new Phaser.Math.Vector2(clashX+105,clashY),bladeTo);
          strokeCurve(blade,{width:2,color:0xb7f8ff,alpha:.98},bladeFrom,new Phaser.Math.Vector2(actor.x-150,actor.y),new Phaser.Math.Vector2(clashX+105,clashY),bladeTo);
          if(isResolvedClash)blade.lineStyle(3,0xffe5a0,1).lineBetween(clashX-10,clashY-10,clashX+10,clashY+10).lineBetween(clashX+10,clashY-10,clashX-10,clashY+10);
          else blade.fillStyle(0x9ef6ff,1).fillTriangle(clashX-12,clashY-7,clashX-12,clashY+7,clashX,clashY);
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
        strokeCurve(trunk,{width:5,color:0x7c1129,alpha:.2},trunkFrom,new Phaser.Math.Vector2(690,lane),new Phaser.Math.Vector2(endX-125,target.y),trunkTo);
        strokeCurve(trunk,{width:1,color:0xff4964,alpha:1},trunkFrom,new Phaser.Math.Vector2(690,lane),new Phaser.Math.Vector2(endX-125,target.y),trunkTo);
        this.intentLayer.add(trunk)
      }
    })
  }
private renderTimeline(){
    this.timelineLayer.removeAll(true);
    const planned=applyPlannedInitiative(this.timeline,this.commands);
    const start=152,end=1150,y=38,gap=planned.length>1?(end-start)/(planned.length-1):0;
    this.timelineLayer.add(this.add.rectangle((start+end)/2,y,end-start,3,0x365969,.9));
    planned.forEach((n,i)=>{
      const x=planned.length===1?650:start+i*gap,color=n.team==='player'?0x2b9ab2:0xa53c52,radius=i===0?19:14;
      if(i===0)this.timelineLayer.add(this.add.circle(x,y,radius+5,0x171710,.92).setStrokeStyle(2,0xffe58a));
      this.timelineLayer.add(this.add.circle(x,y,radius,color,1).setStrokeStyle(2,n.team==='player'?0x9eeeff:0xff9aac,.85));
      this.timelineLayer.add(this.add.text(x,y,n.actorId,{fontFamily:'monospace',fontSize:i===0?'11px':'9px',fontStyle:'bold',color:'#fff'}).setOrigin(.5));
      this.timelineLayer.add(this.add.text(x,y+23,String(n.speed),{fontFamily:'monospace',fontSize:'9px',color:i===0?'#ffe58a':'#9aadb5'}).setOrigin(.5))
    })
  }
private renderHand(){
    this.handLayer.removeAll(true);
    const assigned=new Set([...this.commands.values()].filter((x):x is PlayerCommand=>Boolean(x)).map(x=>x.card.instanceId));
    const cards=this.deck.hand.filter(c=>!assigned.has(c.instanceId)).slice(0,this.visibleHandCount);
    const gap=106,start=640-(cards.length-1)*gap/2;
    cards.forEach((c,i)=>{
      const x=start+i*gap,color=c.intent==='attack'?0x823447:c.intent==='defense'?0x286174:c.intent==='support'?0x3e7058:0x65437d,selected=this.selected===c;
      const box=this.add.rectangle(x,653,98,112,color,.96).setStrokeStyle(selected?3:1,selected?0xffe78c:0x8eb4bf,selected?1:.55).setInteractive({useHandCursor:true});
      box.on('pointerdown',()=>{this.selected=c;this.renderHand();this.status.setText('')});
      this.handLayer.add([
        box,
        this.add.rectangle(x-45,653,4,100,c.intent==='attack'?0xff6a82:c.intent==='defense'?0x76e4f2:c.intent==='support'?0x8be0ad:0xc39cf2,1),
        this.add.text(x,616,c.name,{fixedWidth:82,align:'center',fontFamily:'sans-serif',fontSize:'14px',fontStyle:'bold',color:'#fff'}).setOrigin(.5),
        this.add.rectangle(x-27,659,24,24,0x111820,.96).setStrokeStyle(2,0xffdc7a).setAngle(45),
        this.add.text(x-27,659,String(c.clashPower),{fontFamily:'monospace',fontSize:'18px',fontStyle:'bold',color:'#fff0a8'}).setOrigin(.5),
        this.add.text(x+22,659,c.tempo>0?`速 +${c.tempo}`:c.tempo<0?`速 ${c.tempo}`:'速 0',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:c.tempo>0?'#8ff4ff':c.tempo<0?'#ffb3a7':'#b9c2c7'}).setOrigin(.5),
        this.add.text(x+22,687,c.intent==='attack'?'斬':c.intent==='defense'?'守':c.intent==='support'?'援':'破',{fontFamily:'serif',fontSize:'10px',color:'#d5e0e5'}).setOrigin(.5)
      ])
    });
    const deckX=245,discardX=310,hudY=655;
    for(let i=0;i<3;i++)this.handLayer.add(this.add.rectangle(deckX-i*3,hudY-i*3,46,62,0x17212c,1).setStrokeStyle(1,0x7093a5,.8));
    this.handLayer.add(this.add.text(deckX,hudY-3,String(this.deck.drawPile.length),{fontFamily:'monospace',fontSize:'17px',fontStyle:'bold',color:'#e7f6ff'}).setOrigin(.5));
    this.handLayer.add(this.add.text(deckX,696,'牌庫',{fontFamily:'sans-serif',fontSize:'10px',color:'#8ea7b3'}).setOrigin(.5));
    this.handLayer.add(this.add.rectangle(discardX,hudY,46,62,0x241b24,.9).setStrokeStyle(1,0x8f667e,.75));
    this.handLayer.add(this.add.text(discardX,hudY-3,String(this.deck.discardPile.length),{fontFamily:'monospace',fontSize:'17px',fontStyle:'bold',color:'#ead7e4'}).setOrigin(.5));
    this.handLayer.add(this.add.text(discardX,696,'棄牌',{fontFamily:'sans-serif',fontSize:'10px',color:'#a98d9f'}).setOrigin(.5));
  }
private animateCardTravel(fromX:number,toX:number,color:number,onArrive?:()=>void){
    const ghost=this.add.rectangle(fromX,650,42,58,color,.95).setStrokeStyle(2,0xffe7a0).setDepth(120);this.hudLayer.add(ghost);
    this.tweens.add({targets:ghost,x:toX,y:625,angle:fromX<toX?8:-8,scale:1.35,duration:260,ease:'Cubic.easeOut',onComplete:()=>{onArrive?.();this.tweens.add({targets:ghost,alpha:0,y:650,duration:130,onComplete:()=>ghost.destroy()})}})
  }
private focus(){
    for(const a of this.players.values()){a.root.setAlpha(.55);a.hud.setAlpha(.62);(a.root.list[0]as Phaser.GameObjects.Ellipse).setVisible(false);a.sprite.play('hero-idle')}
    const n=this.currentPlanner();
    if(!n){void this.resolve();return}
    const a=this.players.get(n.actorId)!;
    a.root.setAlpha(1);a.hud.setAlpha(1);(a.root.list[0]as Phaser.GameObjects.Ellipse).setVisible(true);a.sprite.play('hero-ready');
    this.phase.setText(`${this.commands.size+1}/${this.planning.length}  ${n.actorId}`);
    this.status.setText('')
  }
private target(id:string){const node=this.currentPlanner();if(!this.selected||!node)return;const hostile=this.selected.intent==='attack'||this.selected.intent==='disruption';const enemy=this.enemies.has(id);if(hostile!==enemy){this.status.setText(hostile?'此卡必須指定敵方。':'此卡必須指定友方。');return}const targetNode=enemy?this.timeline.find(n=>n.team==='enemy'&&n.actorId===id):undefined;this.commands.set(node.id,{nodeId:node.id,actorId:node.actorId,card:this.selected,targetNodeId:targetNode?.id,targetActorId:id});this.selected=undefined;this.previewTargetId=undefined;this.intentFocus=undefined;this.planIndex++;this.renderHand();this.renderTimeline();this.focus();this.renderEnemyIntents()}
private skip(){const node=this.currentPlanner();if(this.busy||!node)return;const actorId=node.actorId;this.commands.set(node.id,null);this.skipBonusNext.add(actorId);this.planIndex++;this.renderTimeline();this.status.setText(`${actorId} 跳過｜下回合速度 +2（一次）`);this.focus()}
private nextRound(){
    if(this.busy||this.planIndex<this.planning.length)return;
    this.round++;
    const targets=[...this.players.keys()],enemyNodes=this.timeline.filter(n=>n.team==='enemy'),roundSkills=dealEnemySkills(enemyNodes.length);
    let enemyIndex=0;
    for(const node of this.timeline){
      const bonus=node.team==='player'&&this.skipBonusNext.has(node.actorId)?2:0;
      node.speed=Phaser.Math.Between(4,9)+bonus;node.initiative=undefined;
      if(node.team==='enemy'){const skill=roundSkills[enemyIndex++]!;node.enemySkill={id:`${node.actorId}-skill-r${this.round}`,...skill,targetId:Phaser.Math.RND.pick(targets)}}
    }
    this.skipBonusNext.clear();
    this.timeline.sort((a,b)=>b.speed-a.speed||(a.team==='player'?-1:1)).forEach((node,index)=>node.order=index);
    this.planning=this.timeline.filter(n=>n.team==='player').sort((a,b)=>b.speed-a.speed);
    this.commands.clear();this.intentFocus=undefined;this.previewTargetId=undefined;this.planIndex=0;this.selected=undefined;
    const handBefore=this.deck.hand.length;this.intentController.beginPlanning();this.renderEnemyIntents();this.deck=refillHand(this.deck,5);
    const drawn=this.deck.hand.length-handBefore,finalStart=640-(this.deck.hand.length-1)*106/2;this.visibleHandCount=handBefore;this.renderHand();for(let i=0;i<drawn;i++)this.time.delayedCall(i*170,()=>this.animateCardTravel(245,finalStart+(handBefore+i)*106,0x286174,()=>{this.visibleHandCount++;this.renderHand()}));this.renderTimeline();this.focus()
  }
private refreshActor(a:Actor){
    this.fighterHud.refresh(a.hudView,a)
  }
private damage(a:Actor,n:number,balanceDamage=1){
    const shieldBefore=a.shield,blocked=Math.min(a.shield,n);
    a.shield-=blocked;
    const hpLoss=n-blocked;
    a.hp=Math.max(0,a.hp-hpLoss);
    a.balance=Math.max(0,a.balance-balanceDamage);
    const justBroken=!a.broken&&a.balance===0,justShattered=shieldBefore>0&&a.shield===0;
    a.broken=a.broken||justBroken;
    this.refreshActor(a);
    const feedback=justBroken?'崩勢！':justShattered?'破符！':hpLoss>0?`−${hpLoss}`:`護符 −${blocked}`,color=justBroken?'#ffcf75':justShattered?'#9ff5ff':'#ff8294';
    const text=this.add.text(a.root.x,a.root.y-70,feedback,{fontFamily:'sans-serif',fontSize:justBroken?'20px':'15px',fontStyle:'bold',color,backgroundColor:'#080b12dd',padding:{x:8,y:3}}).setOrigin(.5).setDepth(95);
    this.combatLayer.add(text);
    this.tweens.add({targets:text,y:text.y-28,alpha:0,duration:620,ease:'Cubic.easeOut',onComplete:()=>text.destroy()});
    if(justBroken){const ring=this.add.ellipse(a.root.x,a.root.y,94,28,0xffc35c,.25).setStrokeStyle(3,0xffd37a).setDepth(90);this.combatLayer.add(ring);this.tweens.add({targets:ring,scale:2,alpha:0,duration:420,onComplete:()=>ring.destroy()})}
    return justBroken
  }
private shield(a:Actor,n:number){a.shield=Math.min(50,a.shield+n);this.refreshActor(a)}
private async relayAssist(sourceId:string,targetId:string,actions:ActionPresenter){
    const ally=[...this.players.keys()].find(id=>id!==sourceId&&!this.players.get(id)!.broken);
    if(!ally)return;
    await actions.relay(sourceId,ally,targetId);
    this.damage(this.enemies.get(targetId)!,6,2)
  }
private relayAlly(team:'player'|'enemy',sourceId:string){
    const actors=team==='player'?this.players:this.enemies;
    return [...actors.keys()].find(id=>id!==sourceId&&!actors.get(id)!.broken)
  }
private async resolve(){
  this.busy=true;this.intentController.beginExecution();this.handLayer.setVisible(false);this.status.setText('');this.players.forEach(a=>{a.root.setAlpha(1);a.hud.setAlpha(1);(a.root.list[0]as Phaser.GameObjects.Ellipse).setVisible(false)});this.phase.setText('');
  const planned=applyPlannedInitiative(this.timeline,this.commands),beats=resolveBattleBeats(planned,this.commands),presenter=new ClashPresenter(this,this.players,this.enemies,this.combatLayer),actions=new ActionPresenter(this,this.players,this.enemies,this.combatLayer);
  let pursuitTarget='';let pursuitCount=0;
  for(const beat of beats){
    this.intentFocus=beat.kind==='clash'?beat.clash.enemy.actorId:beat.kind==='enemy-one-sided'?beat.enemy.actorId:beat.kind==='player-one-sided'?beat.command.targetActorId:undefined;this.previewTargetId=undefined;
    if(beat.kind==='clash'){
      const playerRelay=beat.clash.winner==='tie'&&Boolean(beat.clash.player.card.assist);
      const enemyRelay=beat.clash.winner==='tie'&&Boolean(beat.clash.enemy.enemySkill?.assist);
      const playerAlly=playerRelay?this.relayAlly('player',beat.clash.player.actorId):undefined;
      const enemyAlly=enemyRelay?this.relayAlly('enemy',beat.clash.enemy.actorId):undefined;
      const hold=Boolean(playerAlly||enemyAlly);
      await presenter.play(beat.clash,hold);
      if(beat.clash.winner==='tie'&&hold){
        if(playerAlly&&enemyAlly)await actions.dualRelay(beat.clash.player.actorId,playerAlly,beat.clash.enemy.actorId,enemyAlly);
        else if(playerAlly){await actions.relay(beat.clash.player.actorId,playerAlly,beat.clash.enemy.actorId);this.damage(this.enemies.get(beat.clash.enemy.actorId)!,6,2)}
        else if(enemyAlly){await actions.relay(beat.clash.enemy.actorId,enemyAlly,beat.clash.player.actorId,true);this.damage(this.players.get(beat.clash.player.actorId)!,6,2)}
        await presenter.release(beat.clash)
      }
      if(beat.clash.winner==='player'){const target=this.enemies.get(beat.clash.enemy.actorId)!;this.damage(target,beat.clash.player.card.damage??8,beat.clash.player.card.balanceDamage??1);target.exposed=true;this.refreshActor(target);if(beat.clash.player.card.assist)await this.relayAssist(beat.clash.player.actorId,beat.clash.enemy.actorId,actions)}
      else if(beat.clash.winner==='enemy'){const target=this.players.get(beat.clash.player.actorId)!;this.damage(target,beat.clash.enemy.enemySkill!.damage,1);target.exposed=true;this.refreshActor(target)}
    }else if(beat.kind==='skip')continue;
    else{
      const actorId=beat.kind==='enemy-one-sided'?beat.enemy.actorId:beat.command.actorId,targetId=beat.kind==='enemy-one-sided'?beat.enemy.enemySkill!.targetId:beat.command.targetActorId!;
      if(beat.kind==='enemy-one-sided'){const actor=this.enemies.get(actorId)!;if(actor.broken){await actions.cancel(actorId,true);continue}await actions.attack(actorId,targetId,{name:beat.enemy.enemySkill!.name,clashPower:beat.enemy.enemySkill!.clashPower},true);this.damage(this.players.get(targetId)!,beat.enemy.enemySkill!.damage,1)}
      else if(beat.kind==='support'){await actions.support(actorId,targetId,beat.command.card);this.shield(this.players.get(targetId)!,beat.command.card.shield??8)}
      else{const actor=this.players.get(actorId)!,target=this.enemies.get(targetId)!;if(actor.broken){await actions.cancel(actorId);continue}pursuitCount=pursuitTarget===targetId?pursuitCount+1:1;pursuitTarget=targetId;const flank=target.exposed&&beat.command.card.tags.includes('側襲');this.status.setText(`${actorId} → ${targetId}${pursuitCount>1?`｜追擊 ${pursuitCount}`:''}${flank?'｜側襲':''}`);await actions.attack(actorId,targetId,beat.command.card,false,flank?'flank':'normal',!beat.command.card.assist);const balance=(beat.command.card.balanceDamage??1)+(pursuitCount>1?1:0)+(flank?2:0);const broke=this.damage(target,beat.command.card.damage??8,balance);if(flank){target.exposed=false;this.refreshActor(target)}if(broke)await actions.cancel(targetId,true);if(beat.command.card.assist)await this.relayAssist(actorId,targetId,actions)}
    }
  }
  const played=[...this.commands.values()].filter((x):x is PlayerCommand=>Boolean(x)).map(x=>x.card);this.deck=commitPlayedCards(this.deck,played);this.visibleHandCount=this.deck.hand.length;this.renderHand();this.handLayer.setVisible(true);played.forEach((_,i)=>this.time.delayedCall(i*70,()=>this.animateCardTravel(640-i*18,310,0x823447)));this.status.setText('');this.phase.setText(`回合 ${this.round}`);this.intentFocus=undefined;this.intentController.completeRound();this.busy=false;
}
}

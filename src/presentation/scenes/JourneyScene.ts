import Phaser from'phaser';
import{availableStoryNodes,createJourneyState,moveJourney,type JourneyState,type StoryNodeType}from'../../core/route/RouteGenerator';

const labels:Record<StoryNodeType,string>={departure:'出發',battle:'迎擊',event:'事件',exploration:'探索',companion:'伙伴',elite:'精英',boss:'王'};
const colors:Record<StoryNodeType,number>={departure:0x477889,battle:0x963d50,event:0x74578c,exploration:0x367360,companion:0x3b7896,elite:0xb56a34,boss:0x8e263c};

export class JourneyScene extends Phaser.Scene{
  constructor(){super('JourneyScene')}
  create(){
    const state=(this.registry.get('journey-state')as JourneyState|undefined)??createJourneyState();this.registry.set('journey-state',state);
    this.add.rectangle(640,360,1280,720,0x07101a);this.add.circle(1060,145,78,0xb8c5d6,.12).setStrokeStyle(2,0xdde8ef,.16);
    for(let i=0;i<5;i++)this.add.ellipse(220+i*245,540+(i%2)*28,420,145,0x13252a,.78);
    this.add.text(52,42,'妖異鐵道',{fontFamily:'serif',fontSize:'30px',fontStyle:'bold',color:'#f2dfc0'});
    this.add.text(52,82,'沿因果軌道前往終點',{fontFamily:'sans-serif',fontSize:'14px',color:'#84abb4'});
    const available=new Set(availableStoryNodes(state).map(n=>n.id)),visited=new Set(state.visitedIds);
    const pos=(column:number,lane:number)=>({x:125+column*205,y:245+lane*118});
    for(const node of state.route.nodes)for(const nextId of node.nextIds){const next=state.route.nodes.find(n=>n.id===nextId)!;const a=pos(node.column,node.lane),b=pos(next.column,next.lane);this.add.line(0,0,a.x,a.y,b.x,b.y,visited.has(node.id)?0x547d83:0x273e47,visited.has(node.id)?.82:.45).setOrigin(0).setLineWidth(visited.has(node.id)?4:2)}
    for(const node of state.route.nodes){const p=pos(node.column,node.lane),active=available.has(node.id),done=visited.has(node.id),ring=this.add.circle(p.x,p.y,active?34:28,colors[node.type],done?1:active?.92:.42).setStrokeStyle(active?4:2,active?0xffe4a0:0x78909a,active?1:.45);const label=this.add.text(p.x,p.y,labels[node.type],{fontFamily:'sans-serif',fontSize:active?'15px':'13px',fontStyle:'bold',color:active?'#fff5dc':'#b1bec2'}).setOrigin(.5);if(active){ring.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.selectNode(state,node.id,p.x,p.y));label.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.selectNode(state,node.id,p.x,p.y))}}
    const current=state.route.nodes.find(n=>n.id===state.currentNodeId)!,cp=pos(current.column,current.lane),train=this.add.container(cp.x,cp.y+58).setData('train',true);
    train.add([this.add.rectangle(0,0,82,24,0x17151b,.98).setStrokeStyle(2,0xb27569,.8),this.add.rectangle(-18,-2,18,10,0x6b5362,.8),this.add.rectangle(8,-2,18,10,0x6b5362,.8),this.add.circle(-24,14,7,0x11151a).setStrokeStyle(2,0x77909a),this.add.circle(24,14,7,0x11151a).setStrokeStyle(2,0x77909a)]);
    this.add.text(640,655,available.size?'選擇下一段因果軌道':'主線終點尚待 Boss 實作',{fontFamily:'sans-serif',fontSize:'16px',color:'#d9c8ae'}).setOrigin(.5)
  }
  private selectNode(state:JourneyState,nodeId:string,x:number,y:number){
    const next=moveJourney(state,nodeId);this.registry.set('journey-state',next);const node=next.route.nodes.find(n=>n.id===nodeId)!,train=this.children.list.find(o=>o instanceof Phaser.GameObjects.Container&&o.getData('train'))as Phaser.GameObjects.Container;
    this.input.enabled=false;this.tweens.add({targets:train,x,y:y+58,duration:720,ease:'Sine.easeInOut',onComplete:()=>{
      if(node.type==='battle'||node.type==='elite')this.scene.start('BootScene',{journeyNodeId:node.id,battlefield:node.type==='elite'?'wayside':'rooftop'});
      else if(node.type==='boss'){this.input.enabled=true;this.add.text(640,610,'王節點已記錄｜等待 Boss 製作批次',{fontFamily:'sans-serif',fontSize:'18px',color:'#ffd0a0',backgroundColor:'#39151ddd',padding:{x:16,y:8}}).setOrigin(.5)}
      else{this.input.enabled=true;this.add.text(640,610,`${labels[node.type]}節點已記錄｜內容於角色與 Boss 完成後補入`,{fontFamily:'sans-serif',fontSize:'16px',color:'#ccecf0',backgroundColor:'#102a32dd',padding:{x:16,y:8}}).setOrigin(.5);this.time.delayedCall(850,()=>this.scene.restart())}
    }})
  }
}

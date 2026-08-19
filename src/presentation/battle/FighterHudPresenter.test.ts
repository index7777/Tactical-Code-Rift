import {beforeAll,describe,expect,it} from 'vitest';

let fighterHudStatus:(state:{alive:boolean;broken:boolean;exposed:boolean})=>string;
let fighterPostureSegments:(balance:number)=>number;

beforeAll(async()=>{
  if(!('navigator'in globalThis))Object.defineProperty(globalThis,'navigator',{value:{userAgent:'node'},configurable:true});
  const module=await import('./FighterHudPresenter');
  fighterHudStatus=module.fighterHudStatus;
  fighterPostureSegments=module.fighterPostureSegments;
});

describe('FighterHudPresenter semantics',()=>{
  it('maps posture directly to the eight visible segments',()=>{
    expect(fighterPostureSegments(8)).toBe(8);
    expect(fighterPostureSegments(5)).toBe(5);
    expect(fighterPostureSegments(1)).toBe(1);
    expect(fighterPostureSegments(0)).toBe(0);
  });

  it('clamps posture segments to the HUD range',()=>{
    expect(fighterPostureSegments(10)).toBe(8);
    expect(fighterPostureSegments(-2)).toBe(0);
  });

  it('keeps broken status above exposed status',()=>{
    expect(fighterHudStatus({alive:true,broken:true,exposed:true})).toBe('崩勢');
    expect(fighterHudStatus({alive:true,broken:false,exposed:true})).toBe('破綻');
    expect(fighterHudStatus({alive:false,broken:true,exposed:true})).toBe('');
  });
});

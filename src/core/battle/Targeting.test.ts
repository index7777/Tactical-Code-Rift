import{describe,expect,it}from'vitest';
import{canTargetActor}from'./Targeting';

describe('target life-state rules',()=>{
  it('allows ordinary actions to target only living actors',()=>{
    expect(canTargetActor({alive:true})).toBe(true);
    expect(canTargetActor({alive:false})).toBe(false);
  });

  it('reserves dead targets exclusively for explicit revival actions',()=>{
    expect(canTargetActor({alive:false},true)).toBe(true);
  });
});

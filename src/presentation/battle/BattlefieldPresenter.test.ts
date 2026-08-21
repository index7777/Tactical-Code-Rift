import{describe,expect,it}from'vitest';
import{normalizeBattlefieldMode}from'./BattlefieldMode';

describe('normalizeBattlefieldMode',()=>{
  it('supports roof, wayside and exploration encounter framing',()=>{
    expect(normalizeBattlefieldMode('rooftop')).toBe('rooftop');
    expect(normalizeBattlefieldMode('rail-halt')).toBe('rail-halt');
    expect(normalizeBattlefieldMode('wayside')).toBe('wayside');
    expect(normalizeBattlefieldMode('exploration')).toBe('exploration');
  });
  it('defaults unknown values to the horizontal rail halt',()=>expect(normalizeBattlefieldMode('carriage')).toBe('rail-halt'));
});

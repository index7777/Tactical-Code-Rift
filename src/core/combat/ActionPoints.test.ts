import { describe, expect, it } from 'vitest';
import { actionApCost, recoverAp, sequenceApCost } from './ActionPoints';

describe('action points',()=>{
  it('carries remaining AP into the next turn up to five',()=>{expect(recoverAp(1)).toBe(3);expect(recoverAp(4)).toBe(5)});
  it('charges one AP for the first action and two for repeats',()=>{expect(actionApCost(0)).toBe(1);expect(actionApCost(1)).toBe(2);expect(actionApCost(2)).toBe(2)});
  it('prices three different actors at three AP and a triple action at five',()=>{expect(sequenceApCost(['P-A','P-B','P-C'])).toBe(3);expect(sequenceApCost(['P-A','P-A','P-A'])).toBe(5)});
});

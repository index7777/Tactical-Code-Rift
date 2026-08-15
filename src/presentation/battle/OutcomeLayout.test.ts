import{describe,expect,it}from'vitest';
import{outcomeButtonLayout}from'./OutcomeLayout';

describe('battle outcome layout',()=>{
  it('keeps defeat retry as the centered primary action',()=>{
    expect(outcomeButtonLayout('defeat')).toEqual({retry:{x:640,y:394,primary:true}})
  });

  it('keeps journey continuation primary after victory',()=>{
    const layout=outcomeButtonLayout('victory');
    expect(layout.continue?.x).toBe(640);expect(layout.continue?.primary).toBe(true);expect(layout.retry.y).toBeGreaterThan(layout.continue!.y)
  });
});

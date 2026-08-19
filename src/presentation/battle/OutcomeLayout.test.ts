import{describe,expect,it}from'vitest';
import{outcomeButtonLayout}from'./OutcomeLayout';

describe('battle outcome layout',()=>{
  it('shows retry only after defeat',()=>{
    expect(outcomeButtonLayout('defeat')).toEqual({retry:{x:640,y:394,primary:true}})
  });

  it('shows only journey continuation after victory',()=>{
    const layout=outcomeButtonLayout('victory');
    expect(layout.continue).toEqual({x:640,y:394,primary:true});expect(layout.retry).toBeUndefined()
  });
});

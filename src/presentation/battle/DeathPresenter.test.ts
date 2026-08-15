import{describe,expect,it}from'vitest';
import{deathExitPlan}from'./DeathExitPolicy';

describe('deathExitPlan',()=>{
  it('removes defeated enemies after the readable death beat',()=>{
    const plan=deathExitPlan(true,'normal');
    expect(plan.removeFromField).toBe(true);
    expect(plan.impact+plan.fade).toBeGreaterThanOrEqual(400);
  });

  it('does not silently erase a defeated player before the defeat presentation owns the field',()=>{
    expect(deathExitPlan(false,'normal').removeFromField).toBe(false);
  });

  it('gives heavy deaths a longer impact beat',()=>{
    expect(deathExitPlan(true,'heavy').impact).toBeGreaterThan(deathExitPlan(true,'normal').impact);
  });
});

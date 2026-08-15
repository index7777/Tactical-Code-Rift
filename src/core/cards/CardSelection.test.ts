import{describe,expect,it}from'vitest';
import{createTeamDeck}from'./BattleCards';
import{isCardSelected}from'./CardSelection';

describe('card instance selection',()=>{
  it('selects only one of two cards with the same definition',()=>{
    const cycles=createTeamDeck().filter(card=>card.definitionId==='cycle');
    expect(cycles).toHaveLength(2);
    expect(cycles[0]!.instanceId).not.toBe(cycles[1]!.instanceId);
    expect(isCardSelected(cycles[0],cycles[0]!)).toBe(true);
    expect(isCardSelected(cycles[0],cycles[1]!)).toBe(false);
  });
});

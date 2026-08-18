import{describe,expect,it}from'vitest';
import{createTeamDeck}from'./BattleCards';
import{isCardSelected}from'./CardSelection';

describe('card instance selection',()=>{
  it('selects only one of two cards with the same definition',()=>{
    const cards=createTeamDeck().filter(card=>card.definitionId==='quick');
    expect(cards).toHaveLength(4);
    expect(cards[0]!.instanceId).not.toBe(cards[1]!.instanceId);
    expect(isCardSelected(cards[0],cards[0]!)).toBe(true);
    expect(isCardSelected(cards[0],cards[1]!)).toBe(false);
  });
});

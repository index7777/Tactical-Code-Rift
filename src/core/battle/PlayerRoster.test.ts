import { describe, expect, it } from 'vitest';
import { playerRoster } from './PlayerRoster';

describe('player roster identity and demo order', () => {
  it('keeps Mo in the fourth demo slot while using Redleaf production art', () => {
    expect(playerRoster.map((character) => character.id)).toEqual(['rin', 'chikage', 'oboro', 'mo']);
    expect(playerRoster[3]).toMatchObject({ id: 'mo', name: '紅葉', assetPrefix: 'player-mo' });
  });
});

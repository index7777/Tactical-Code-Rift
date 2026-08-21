export const playerRoster = [
  { id: 'rin', name: '凜', assetPrefix: 'player-rin' },
  { id: 'chikage', name: '千景', assetPrefix: 'player-chikage' },
  { id: 'oboro', name: '朧', assetPrefix: 'player-oboro' },
  { id: 'mo', name: '紅葉', assetPrefix: 'player-mo' },
] as const;

export type PlayerCharacterId = (typeof playerRoster)[number]['id'];

export function playerRosterEntry(id: string) {
  return playerRoster.find((character) => character.id === id);
}

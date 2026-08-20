export const playerRoster = [
  { id: 'rin', name: '凜', assetPrefix: 'rin' },
  { id: 'chikage', name: '千景', assetPrefix: 'chikage' },
  { id: 'oboro', name: '朧', assetPrefix: 'oboro' },
  { id: 'mo', name: '紅葉', assetPrefix: 'mo' },
] as const;

export type PlayerCharacterId = (typeof playerRoster)[number]['id'];

export function playerRosterEntry(id: string) {
  return playerRoster.find((character) => character.id === id);
}

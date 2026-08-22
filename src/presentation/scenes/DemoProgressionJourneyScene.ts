import Phaser from 'phaser';
import { prepareDemoCardUpgradeEncounterHandoff } from '../../application/battle/DemoCardUpgradeEncounterHandoff';
import type { DemoCardUpgradeId } from '../../core/cards/DemoCardUpgradeProgression';
import {
  claimDemoCardUpgradeReward,
  normalizeDemoCardUpgradeProgressionState,
  pendingDemoCardUpgradeReward,
  type DemoCardUpgradeProgressionState,
  type PendingDemoCardUpgradeReward,
} from '../../core/cards/DemoCardUpgradeRewardState';
import type { JourneyState } from '../../core/route/RouteGenerator';
import { JourneyScene } from './JourneyScene';

export const DEMO_CARD_UPGRADE_PROGRESSION_REGISTRY_KEY = 'journey-card-upgrade-progression';

const UPGRADE_COPY: Readonly<Record<DemoCardUpgradeId, { family: string; effect: string }>> = {
  'quick-v1': { family: '快', effect: '傷害 +2' },
  'heavy-v1': { family: '重', effect: '傷害 +3' },
  'guard-v1': { family: '守', effect: 'Guard 上限 +3' },
  'disruption-v1': { family: '擾', effect: 'Action Delay -1' },
  'break-v1': { family: '破', effect: 'Action Delay -1' },
};

export function demoProgressionStateFromRegistryValue(value: unknown): DemoCardUpgradeProgressionState {
  if (!value || typeof value !== 'object') return normalizeDemoCardUpgradeProgressionState();
  const candidate = value as {
    ownedUpgradeIds?: readonly string[];
    claimedMilestones?: readonly string[];
  };
  return normalizeDemoCardUpgradeProgressionState(candidate);
}

export class DemoProgressionJourneyScene extends JourneyScene {
  override create(): void {
    super.create();

    const progression = demoProgressionStateFromRegistryValue(
      this.registry.get(DEMO_CARD_UPGRADE_PROGRESSION_REGISTRY_KEY),
    );
    this.registry.set(DEMO_CARD_UPGRADE_PROGRESSION_REGISTRY_KEY, progression);
    prepareDemoCardUpgradeEncounterHandoff(progression.ownedUpgradeIds);

    const journey = this.registry.get('journey-state') as JourneyState | undefined;
    const reward = journey
      ? pendingDemoCardUpgradeReward(journey.currentNodeId, progression)
      : undefined;

    this.publishUpgradeQaState(progression, reward);
    if (reward) this.showUpgradeReward(reward, progression);
  }

  private showUpgradeReward(
    reward: PendingDemoCardUpgradeReward,
    progression: DemoCardUpgradeProgressionState,
  ): void {
    const veil = this.add.rectangle(640, 360, 1280, 720, 0x02070b, 0.78)
      .setDepth(400)
      .setInteractive();
    const panel = this.add.rectangle(640, 360, 760, 360, 0x101a21, 0.98)
      .setStrokeStyle(2, 0xc4a361, 0.9)
      .setDepth(401);
    const kicker = this.add.text(640, 238, '戰後整備', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#d6bd7d',
    }).setOrigin(0.5).setDepth(402);
    const title = this.add.text(640, 275, '選擇一項卡型強化', {
      fontFamily: 'serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#f4e5c9',
    }).setOrigin(0.5).setDepth(402);
    const subtitle = this.add.text(640, 310, '本區固定強化；已取得的卡型不會再次出現。', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#a9c4c9',
    }).setOrigin(0.5).setDepth(402);

    const buttonWidth = 132;
    const gap = 142;
    const startX = 640 - ((reward.choices.length - 1) * gap) / 2;
    const objects: Phaser.GameObjects.GameObject[] = [veil, panel, kicker, title, subtitle];

    reward.choices.forEach((upgradeId, index) => {
      const copy = UPGRADE_COPY[upgradeId];
      const x = startX + index * gap;
      const button = this.add.rectangle(x, 390, buttonWidth, 112, 0x18242a, 0.98)
        .setStrokeStyle(1, 0x88a9ad, 0.72)
        .setDepth(402)
        .setInteractive({ useHandCursor: true });
      const family = this.add.text(x, 366, copy.family, {
        fontFamily: 'serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#f1d38d',
      }).setOrigin(0.5).setDepth(403);
      const effect = this.add.text(x, 410, copy.effect, {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#dce9e7',
        align: 'center',
      }).setOrigin(0.5).setDepth(403);
      objects.push(button, family, effect);

      button.on('pointerover', () => button.setStrokeStyle(2, 0xe0c36f, 1));
      button.on('pointerout', () => button.setStrokeStyle(1, 0x88a9ad, 0.72));
      button.on('pointerdown', () => {
        const next = claimDemoCardUpgradeReward(progression, reward, upgradeId);
        this.registry.set(DEMO_CARD_UPGRADE_PROGRESSION_REGISTRY_KEY, next);
        prepareDemoCardUpgradeEncounterHandoff(next.ownedUpgradeIds);
        for (const object of objects) object.destroy();
        this.publishUpgradeQaState(next, undefined);
      });
    });
  }

  private publishUpgradeQaState(
    progression: DemoCardUpgradeProgressionState,
    reward: PendingDemoCardUpgradeReward | undefined,
  ): void {
    const host = document.getElementById('game');
    if (!host) return;
    host.dataset.qaUpgradeReward = reward?.milestone ?? '';
    host.dataset.qaUpgradeChoices = reward?.choices.join(',') ?? '';
    host.dataset.qaOwnedUpgrades = progression.ownedUpgradeIds.join(',');
  }
}

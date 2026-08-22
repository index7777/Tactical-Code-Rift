import Phaser from 'phaser';
import {
  DEMO_CARD_UPGRADE_RUN_STATE_KEY,
  chooseJourneyDemoUpgradeReward,
  ensureDemoCardUpgradeRunState,
  offerJourneyDemoUpgradeRewardAfterVictory,
  prepareJourneyDemoUpgradeEncounterHandoff,
} from '../../application/battle/DemoCardUpgradeJourneyRegistry';
import {
  availableDemoCardUpgrades,
  type DemoCardUpgradeId,
} from '../../core/cards/DemoCardUpgradeProgression';
import type { DemoCardUpgradeRunState } from '../../core/cards/DemoCardUpgradeRunState';
import type { JourneyState } from '../../core/route/RouteGenerator';
import { JourneyScene } from './JourneyScene';

export const DEMO_CARD_UPGRADE_PROGRESSION_REGISTRY_KEY = DEMO_CARD_UPGRADE_RUN_STATE_KEY;

const UPGRADE_COPY: Readonly<Record<DemoCardUpgradeId, { family: string; effect: string }>> = {
  'quick-v1': { family: '快攻', effect: '傷害 +2' },
  'heavy-v1': { family: '重擊', effect: '傷害 +3' },
  'guard-v1': { family: '守勢', effect: 'Guard 上限 +3' },
  'disruption-v1': { family: '干擾', effect: 'Action Delay -1' },
  'break-v1': { family: '破勢', effect: 'Action Delay -1' },
};

export class DemoProgressionJourneyScene extends JourneyScene {
  override create(): void {
    super.create();

    ensureDemoCardUpgradeRunState(this.registry);
    const journey = this.registry.get('journey-state') as JourneyState | undefined;
    const progression = journey
      ? offerJourneyDemoUpgradeRewardAfterVictory(this.registry, journey.currentNodeId)
      : ensureDemoCardUpgradeRunState(this.registry);

    prepareJourneyDemoUpgradeEncounterHandoff(this.registry);
    this.drawOwnedUpgradeSummary(progression);
    this.publishUpgradeQaState(progression);
    if (progression.pendingMilestone) this.showUpgradeReward(progression);
  }

  private showUpgradeReward(progression: DemoCardUpgradeRunState): void {
    const choices = availableDemoCardUpgrades(progression.ownedUpgradeIds);
    const veil = this.add.rectangle(640, 360, 1280, 720, 0x02070b, 0.78)
      .setDepth(400)
      .setInteractive();
    const panel = this.add.rectangle(640, 360, 860, 360, 0x101a21, 0.98)
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
    const subtitle = this.add.text(640, 310, '固定里程碑獎勵；已取得的卡型不會再次出現。', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#a9c4c9',
    }).setOrigin(0.5).setDepth(402);

    const buttonWidth = choices.length > 4 ? 146 : 158;
    const gap = choices.length > 4 ? 158 : 170;
    const startX = 640 - ((choices.length - 1) * gap) / 2;
    const objects: Phaser.GameObjects.GameObject[] = [veil, panel, kicker, title, subtitle];

    choices.forEach((upgradeId: DemoCardUpgradeId, index: number) => {
      const copy = UPGRADE_COPY[upgradeId];
      const x = startX + index * gap;
      const button = this.add.rectangle(x, 390, buttonWidth, 112, 0x18242a, 0.98)
        .setStrokeStyle(1, 0x88a9ad, 0.72)
        .setDepth(402)
        .setInteractive({ useHandCursor: true });
      const family = this.add.text(x, 366, copy.family, {
        fontFamily: 'serif',
        fontSize: '19px',
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
        const next = chooseJourneyDemoUpgradeReward(this.registry, upgradeId);
        prepareJourneyDemoUpgradeEncounterHandoff(this.registry);
        this.publishUpgradeQaState(next);
        for (const object of objects) object.destroy();
        this.scene.restart();
      });
    });
  }

  private drawOwnedUpgradeSummary(progression: DemoCardUpgradeRunState): void {
    const owned = progression.ownedUpgradeIds.map((id) => UPGRADE_COPY[id].family).join('・') || '尚無';
    this.add.text(48, 682, `卡組強化　${owned}`, {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#d8c98f',
    }).setDepth(60);
  }

  private publishUpgradeQaState(progression: DemoCardUpgradeRunState): void {
    const host = document.getElementById('game');
    if (!host) return;
    host.dataset.qaUpgradeReward = progression.pendingMilestone ?? '';
    host.dataset.qaUpgradeChoices = progression.pendingMilestone
      ? availableDemoCardUpgrades(progression.ownedUpgradeIds).join(',')
      : '';
    host.dataset.qaOwnedUpgrades = progression.ownedUpgradeIds.join(',');
    host.dataset.qaClaimedUpgradeMilestones = progression.claimedMilestones.join(',');
  }
}

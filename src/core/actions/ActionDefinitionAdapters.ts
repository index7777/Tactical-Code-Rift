import type { RefactorCardCategory, RefactorCardDefinition, RefactorTargetRule } from '../cards/RefactorCardTypes';
import type { IntentState } from '../intents/IntentState';
import {
  createActionDefinition,
  type ActionDefinition,
  type ActionPresentationProfile,
  type ActionTargetMode,
} from './ActionDefinition';

function targetModeFromCard(rule: RefactorTargetRule): ActionTargetMode {
  switch (rule) {
    case 'enemy':
      return 'single-enemy';
    case 'self':
      return 'self';
    case 'ally':
      return 'single-ally';
    case 'any-ally':
      return 'any-ally';
    case 'none':
      return 'none';
  }
}

function presentationProfileFromCategory(category: RefactorCardCategory): ActionPresentationProfile {
  switch (category) {
    case 'quick':
      return 'quick-melee';
    case 'heavy':
      return 'heavy-melee';
    case 'guard':
      return 'guard';
    case 'disruption':
      return 'disruption';
    case 'break':
      return 'break';
  }
}

export function actionDefinitionFromRefactorCard(card: RefactorCardDefinition): ActionDefinition {
  const effect = card.effect;

  return createActionDefinition({
    id: card.id,
    owner: 'player-card',
    name: card.name,
    targetMode: targetModeFromCard(card.targetRule),
    hits: effect.damage === undefined ? [] : [{ damage: effect.damage }],
    actionDelay: card.delay,
    targetDelay: effect.delayTarget,
    guard:
      effect.guardRatio === undefined
        ? undefined
        : {
            ratio: effect.guardRatio,
            cap: effect.guardCap,
          },
    breakWindow: effect.createBreakWindow,
    interrupt: effect.interrupt,
    statuses: [],
    clash: { mode: 'none', tags: [] },
    telegraph: { level: 'normal' },
    presentationProfile: presentationProfileFromCategory(card.category),
  });
}

export function actionDefinitionFromIntent(intent: IntentState): ActionDefinition {
  if (intent.targetIds.length > 1) {
    throw new Error('legacy IntentState with multiple targets cannot be adapted without authored target semantics');
  }

  return createActionDefinition({
    id: intent.id,
    owner: 'enemy',
    name: intent.name,
    targetMode: intent.targetIds.length === 0 ? 'none' : 'single-enemy',
    hits: intent.damage === undefined ? [] : [{ damage: intent.damage }],
    actionDelay: intent.delay,
    statuses: intent.statusEffects.map((id) => ({ id })),
    clash: { mode: 'none', tags: [] },
    telegraph: { level: 'normal' },
    counterplay: {
      delayable: intent.canDelay,
      interruptible: intent.canInterrupt,
      guardable: intent.canGuard,
      redirectable: intent.canRedirect,
    },
    presentationProfile: intent.kind === 'hard-stagger' ? 'none' : 'enemy-light',
  });
}

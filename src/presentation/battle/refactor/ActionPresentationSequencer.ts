import type { ActionPresentationProfile } from '../../../core/actions/ActionDefinition';
import type { RefactorCardCategory } from '../../../core/cards/RefactorCardTypes';

export type AnimatedActionPresentationProfile = Exclude<ActionPresentationProfile, 'none'>;

export type ActionPresentationPhase =
  | 'FOCUS'
  | 'ANTICIPATION'
  | 'APPROACH'
  | 'STRIKE'
  | 'IMPACT'
  | 'RECOVERY'
  | 'RETURN';

export type ActionPresentationContactMode = 'melee' | 'guard' | 'control';

export type ActionPresentationFxLanguage =
  | 'quick-slash'
  | 'heavy-slash'
  | 'guard-deflect'
  | 'disruption-control'
  | 'break-fracture'
  | 'enemy-light-hit'
  | 'enemy-heavy-hit'
  | 'boss-signature-hit';

export interface ActionPresentationProfileSpec {
  id: AnimatedActionPresentationProfile;
  anticipationMs: number;
  approachMs: number;
  strikeMs: number;
  impactHoldMs: number;
  recoveryMs: number;
  returnMs: number;
  cameraZoom: number;
  actorScale: number;
  cameraImpulse: number;
  contactMode: ActionPresentationContactMode;
  fxLanguage: ActionPresentationFxLanguage;
}

export interface ActionPresentationMarker {
  phase: ActionPresentationPhase;
  atMs: number;
}

export interface ActionPresentationSequence {
  profile: ActionPresentationProfileSpec;
  markers: readonly ActionPresentationMarker[];
  totalDurationMs: number;
}

const profiles: Readonly<Record<AnimatedActionPresentationProfile, ActionPresentationProfileSpec>> = {
  'quick-melee': {
    id: 'quick-melee',
    anticipationMs: 70,
    approachMs: 95,
    strikeMs: 90,
    impactHoldMs: 45,
    recoveryMs: 100,
    returnMs: 160,
    cameraZoom: 1.1,
    actorScale: 1.06,
    cameraImpulse: 3,
    contactMode: 'melee',
    fxLanguage: 'quick-slash',
  },
  'heavy-melee': {
    id: 'heavy-melee',
    anticipationMs: 160,
    approachMs: 130,
    strikeMs: 120,
    impactHoldMs: 85,
    recoveryMs: 190,
    returnMs: 220,
    cameraZoom: 1.14,
    actorScale: 1.1,
    cameraImpulse: 7,
    contactMode: 'melee',
    fxLanguage: 'heavy-slash',
  },
  guard: {
    id: 'guard',
    anticipationMs: 100,
    approachMs: 80,
    strikeMs: 70,
    impactHoldMs: 60,
    recoveryMs: 140,
    returnMs: 180,
    cameraZoom: 1.08,
    actorScale: 1.04,
    cameraImpulse: 2,
    contactMode: 'guard',
    fxLanguage: 'guard-deflect',
  },
  disruption: {
    id: 'disruption',
    anticipationMs: 120,
    approachMs: 80,
    strikeMs: 100,
    impactHoldMs: 45,
    recoveryMs: 130,
    returnMs: 170,
    cameraZoom: 1.08,
    actorScale: 1.04,
    cameraImpulse: 2,
    contactMode: 'control',
    fxLanguage: 'disruption-control',
  },
  break: {
    id: 'break',
    anticipationMs: 130,
    approachMs: 110,
    strikeMs: 100,
    impactHoldMs: 75,
    recoveryMs: 160,
    returnMs: 200,
    cameraZoom: 1.12,
    actorScale: 1.08,
    cameraImpulse: 5,
    contactMode: 'melee',
    fxLanguage: 'break-fracture',
  },
  'enemy-light': {
    id: 'enemy-light',
    anticipationMs: 90,
    approachMs: 120,
    strikeMs: 100,
    impactHoldMs: 55,
    recoveryMs: 130,
    returnMs: 190,
    cameraZoom: 1.08,
    actorScale: 1.05,
    cameraImpulse: 4,
    contactMode: 'melee',
    fxLanguage: 'enemy-light-hit',
  },
  'enemy-heavy': {
    id: 'enemy-heavy',
    anticipationMs: 170,
    approachMs: 150,
    strikeMs: 130,
    impactHoldMs: 90,
    recoveryMs: 200,
    returnMs: 240,
    cameraZoom: 1.13,
    actorScale: 1.1,
    cameraImpulse: 7,
    contactMode: 'melee',
    fxLanguage: 'enemy-heavy-hit',
  },
  'boss-signature': {
    id: 'boss-signature',
    anticipationMs: 260,
    approachMs: 180,
    strikeMs: 150,
    impactHoldMs: 120,
    recoveryMs: 260,
    returnMs: 300,
    cameraZoom: 1.17,
    actorScale: 1.14,
    cameraImpulse: 10,
    contactMode: 'melee',
    fxLanguage: 'boss-signature-hit',
  },
};

const animatedProfileIds = Object.freeze(Object.keys(profiles) as AnimatedActionPresentationProfile[]);

function cloneProfile(profile: ActionPresentationProfileSpec): ActionPresentationProfileSpec {
  return { ...profile };
}

function assertFiniteNonNegativeInteger(value: number, label: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative integer`);
  }
}

function validateProfile(profile: ActionPresentationProfileSpec): void {
  assertFiniteNonNegativeInteger(profile.anticipationMs, `${profile.id}.anticipationMs`);
  assertFiniteNonNegativeInteger(profile.approachMs, `${profile.id}.approachMs`);
  assertFiniteNonNegativeInteger(profile.strikeMs, `${profile.id}.strikeMs`);
  assertFiniteNonNegativeInteger(profile.impactHoldMs, `${profile.id}.impactHoldMs`);
  assertFiniteNonNegativeInteger(profile.recoveryMs, `${profile.id}.recoveryMs`);
  assertFiniteNonNegativeInteger(profile.returnMs, `${profile.id}.returnMs`);

  if (!Number.isFinite(profile.cameraZoom) || profile.cameraZoom < 1) {
    throw new Error(`${profile.id}.cameraZoom must be finite and >= 1`);
  }
  if (!Number.isFinite(profile.actorScale) || profile.actorScale < 1) {
    throw new Error(`${profile.id}.actorScale must be finite and >= 1`);
  }
  if (!Number.isFinite(profile.cameraImpulse) || profile.cameraImpulse < 0) {
    throw new Error(`${profile.id}.cameraImpulse must be finite and non-negative`);
  }
}

for (const profile of Object.values(profiles)) validateProfile(profile);

export function actionPresentationProfileIds(): readonly AnimatedActionPresentationProfile[] {
  return [...animatedProfileIds];
}

export function actionPresentationProfile(
  profileId: AnimatedActionPresentationProfile,
): ActionPresentationProfileSpec {
  return cloneProfile(profiles[profileId]);
}

export function actionPresentationProfileForCardCategory(
  category: RefactorCardCategory,
): AnimatedActionPresentationProfile {
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

export function buildActionPresentationSequence(
  profileId: AnimatedActionPresentationProfile,
): ActionPresentationSequence {
  const profile = actionPresentationProfile(profileId);
  const markers: ActionPresentationMarker[] = [{ phase: 'FOCUS', atMs: 0 }];
  let cursor = 0;

  cursor += profile.anticipationMs;
  markers.push({ phase: 'ANTICIPATION', atMs: cursor });
  cursor += profile.approachMs;
  markers.push({ phase: 'APPROACH', atMs: cursor });
  cursor += profile.strikeMs;
  markers.push({ phase: 'STRIKE', atMs: cursor });
  cursor += profile.impactHoldMs;
  markers.push({ phase: 'IMPACT', atMs: cursor });
  cursor += profile.recoveryMs;
  markers.push({ phase: 'RECOVERY', atMs: cursor });
  cursor += profile.returnMs;
  markers.push({ phase: 'RETURN', atMs: cursor });

  return {
    profile,
    markers,
    totalDurationMs: cursor,
  };
}

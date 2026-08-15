export type IntentPhase = 'planning' | 'execution' | 'resolved';

interface IntentLayer {
  removeAll(destroyChildren?: boolean): unknown;
  setVisible(visible: boolean): unknown;
}

export class IntentLayerController {
  private phase: IntentPhase = 'resolved';

  constructor(private layer: IntentLayer) {}

  beginPlanning() {
    this.clear();
    this.phase = 'planning';
    this.layer.setVisible(true);
  }

  beginExecution() {
    this.clear();
    this.phase = 'execution';
    this.layer.setVisible(false);
  }

  completeRound() {
    this.clear();
    this.phase = 'resolved';
    this.layer.setVisible(false);
  }

  clear() {
    this.layer.removeAll(true);
  }

  canRenderPlanning() {
    return this.phase === 'planning';
  }
}

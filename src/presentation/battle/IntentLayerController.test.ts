import { describe, expect, it, vi } from 'vitest';
import { IntentLayerController } from './IntentLayerController';

function layerDouble() {
  return {
    removeAll: vi.fn(),
    setVisible: vi.fn(),
  };
}

describe('IntentLayerController', () => {
  it('allows planning only after beginning a fresh planning phase', () => {
    const layer = layerDouble();
    const controller = new IntentLayerController(layer as never);

    expect(controller.canRenderPlanning()).toBe(false);
    controller.beginPlanning();

    expect(controller.canRenderPlanning()).toBe(true);
    expect(layer.removeAll).toHaveBeenCalledWith(true);
    expect(layer.setVisible).toHaveBeenLastCalledWith(true);
  });

  it('removes every planning line before execution and after resolution', () => {
    const layer = layerDouble();
    const controller = new IntentLayerController(layer as never);
    controller.beginPlanning();
    controller.beginExecution();

    expect(controller.canRenderPlanning()).toBe(false);
    expect(layer.setVisible).toHaveBeenLastCalledWith(false);

    controller.completeRound();
    expect(layer.removeAll).toHaveBeenCalledTimes(3);
    expect(layer.setVisible).toHaveBeenLastCalledWith(false);
  });
});


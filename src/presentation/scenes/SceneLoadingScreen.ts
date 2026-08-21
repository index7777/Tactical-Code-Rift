import type Phaser from 'phaser';

export function createSceneLoadingScreen(scene: Phaser.Scene, label: string): Phaser.GameObjects.Container {
  const background = scene.add.rectangle(640, 360, 1280, 720, 0x050914, 1);
  const glow = scene.add.ellipse(640, 348, 420, 94, 0x487b85, 0.08);
  const title = scene.add.text(640, 312, '戰術編碼：裂痕', {
    fontFamily: 'serif',
    fontSize: '30px',
    fontStyle: 'bold',
    color: '#f0dfc2',
  }).setOrigin(0.5);
  const status = scene.add.text(640, 356, label, {
    fontFamily: 'sans-serif',
    fontSize: '13px',
    color: '#91b8c0',
  }).setOrigin(0.5);
  const track = scene.add.rectangle(640, 392, 360, 3, 0x283a43, 0.9);
  const bar = scene.add.rectangle(460, 392, 0, 3, 0xcaa55f, 1).setOrigin(0, 0.5);
  scene.load.on('progress', (value: number) => bar.setDisplaySize(360 * value, 3));
  return scene.add.container(0, 0, [background, glow, title, status, track, bar]).setDepth(1000);
}

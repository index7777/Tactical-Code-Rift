import Phaser from 'phaser';

export class BattleAudioController {
  private music?: Phaser.Sound.BaseSound;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly musicKey: string,
  ) {}

  start(): void {
    this.music = this.scene.sound.get(this.musicKey) ?? this.scene.sound.add(this.musicKey, { loop: true, volume: 0 });
    if (!this.music.isPlaying) this.music.play({ loop: true, volume: 0 });
    this.fadeTo(0.3, 1200);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.scene.game.events.off(Phaser.Core.Events.FOCUS, this.onFocus, this);
    this.scene.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.scene.game.events.on(Phaser.Core.Events.FOCUS, this.onFocus, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
  }

  fadeTo(volume: number, duration: number): void {
    if (!this.music) return;
    this.scene.tweens.killTweensOf(this.music);
    this.scene.tweens.add({ targets: this.music, volume, duration, ease: 'Sine.easeInOut' });
  }

  stop(): void {
    this.music?.stop();
  }

  private readonly onBlur = () => this.fadeTo(0, 500);
  private readonly onFocus = () => this.fadeTo(0.3, 700);

  private dispose(): void {
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.scene.game.events.off(Phaser.Core.Events.FOCUS, this.onFocus, this);
  }
}

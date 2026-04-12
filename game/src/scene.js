export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.player = this.add.circle(400, 300, 20, 0xffffff);

    this.velocity = { x: 0, y: 0 };
    this.dragStart = null;

    this.input.on('pointerdown', (pointer) => {
      this.dragStart = { x: pointer.x, y: pointer.y };
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragStart) return;

      let dx = this.dragStart.x - pointer.x;
      let dy = this.dragStart.y - pointer.y;

      this.velocity.x = dx * 0.1;
      this.velocity.y = dy * 0.1;

      this.dragStart = null;
    });
  }

  update() {
    this.player.x += this.velocity.x;
    this.player.y += this.velocity.y;

    // atrito
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
  }
}
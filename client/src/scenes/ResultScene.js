/**
 * ResultScene.js — Tela de resultado da corrida
 */

import { GAME } from '../config/GameConfig.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'Result' }); }
  init(d) { this.d = d; }

  create() {
    const W = GAME.WIDTH, H = GAME.HEIGHT;
    const g = this.add.graphics();
    g.fillStyle(0x020110); g.fillRect(0, 0, W, H);
    g.lineStyle(1, 0xffffff, 0.02);
    for (let x = 0; x < W + 80; x += 44) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 30, H); g.strokePath();
    }

    // Confete
    for (let i = 0; i < 60; i++) {
      const col = [0xFF5500, 0xFFD700, 0x00EEFF, 0x44FF88, 0xFF8833, 0xffffff][i % 6];
      const conf = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(-50, H * .25),
        Phaser.Math.Between(6, 14), Phaser.Math.Between(6, 14), col,
      );
      this.tweens.add({
        targets: conf, y: conf.y + H + 140,
        angle: Phaser.Math.Between(-360, 360), alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(1600, 3200), delay: Phaser.Math.Between(0, 1400), repeat: -1,
      });
    }

    // Card
    const card = this.add.graphics();
    card.fillStyle(0x0a0820, 0.97); card.fillRoundedRect(140, 40, 520, 420, 18);
    card.lineStyle(2, 0xFF5500, 0.5); card.strokeRoundedRect(140, 40, 520, 420, 18);

    this.add.text(W / 2, 98, '🏁 CORRIDA COMPLETA!', {
      fontFamily: "Impact,'Arial Black',sans-serif",
      fontSize: '28px', color: '#FF5500', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, 140, '⏱  Tempo Total', { fontFamily: "'Courier New',monospace", fontSize: '12px', color: '#334455' }).setOrigin(0.5);
    this.add.text(W / 2, 176, `${this.d.time}s`, { fontFamily: "Impact,'Arial Black',sans-serif", fontSize: '46px', color: '#00EEFF' }).setOrigin(0.5);

    this.add.text(W / 2, 236, '🚀  Lançamentos', { fontFamily: "'Courier New',monospace", fontSize: '12px', color: '#334455' }).setOrigin(0.5);
    this.add.text(W / 2, 272, `${this.d.launches}`, { fontFamily: "Impact,'Arial Black',sans-serif", fontSize: '46px', color: '#FF5500' }).setOrigin(0.5);

    const crBox = this.add.graphics();
    crBox.fillStyle(0x0a0510, 0.8); crBox.fillRoundedRect(W / 2 - 110, 310, 220, 52, 8);
    crBox.lineStyle(1.5, 0xFFD700, 0.6); crBox.strokeRoundedRect(W / 2 - 110, 310, 220, 52, 8);
    this.add.text(W / 2, 336, `🪙  $CR ${this.d.cr}  GANHOS`, {
      fontFamily: "Impact,'Arial Black',sans-serif", fontSize: '22px', color: '#FFD700',
    }).setOrigin(0.5);

    const stars = ['⭐', '⭐⭐', '⭐⭐⭐'][Math.max(0, (this.d.rating ?? 1) - 1)];
    const grades = ['', 'CONTINUE TREINANDO!', 'MUITO BOM!', 'MESTRE DA TAMPINHA!'];
    this.add.text(W / 2, 386, `${stars}  ${grades[this.d.rating ?? 1]}`, {
      fontFamily: "Impact,'Arial Black',sans-serif", fontSize: '20px', color: '#FFD700',
    }).setOrigin(0.5);

    const mk = (x, label, bg, scene, data = {}) => {
      const b = this.add.text(x, 430, label, {
        fontFamily: "'Courier New',monospace", fontSize: '14px', color: '#fff',
        backgroundColor: bg, padding: { x: 16, y: 12 },
      }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
      b.on('pointerdown', () => this.scene.start(scene, data));
      b.on('pointerover', () => b.setAlpha(0.8));
      b.on('pointerout', () => b.setAlpha(1));
    };
    mk(W / 2 - 130, '▶ JOGAR DE NOVO', '#AA2200', 'Lobby');
    mk(W / 2 + 130, '⬅ MENU', '#112244', 'Menu');
  }
}

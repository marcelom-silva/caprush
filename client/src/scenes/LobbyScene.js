/**
 * LobbyScene.js — Seleção de personagem antes da corrida
 * ─────────────────────────────────────────────────────────
 * Fase 1: só Yuki desbloqueado. Os outros mostrados como bloqueados.
 */

import { CHARACTERS, GAME } from '../config/GameConfig.js';

export class LobbyScene extends Phaser.Scene {
  constructor() { super({ key: 'Lobby' }); }

  create() {
    const W = GAME.WIDTH, H = GAME.HEIGHT;
    const g = this.add.graphics();
    g.fillStyle(0x020110); g.fillRect(0, 0, W, H);
    g.lineStyle(1, 0xff5500, 0.018);
    for (let x = 0; x < W + 80; x += 44) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 40, H); g.strokePath();
    }

    this.add.text(W / 2, 30, 'ESCOLHA SEU PILOTO', {
      fontFamily: "Impact,'Arial Black',Arial,sans-serif",
      fontSize: '28px', color: '#FF5500',
    }).setOrigin(0.5);

    this.add.text(W / 2, 58, 'Fase 1 · Apenas Yuki disponível', {
      fontFamily: "'Courier New',monospace", fontSize: '11px', color: '#1e3055',
    }).setOrigin(0.5);

    const chars = Object.values(CHARACTERS);
    const cardW = 160, gap = 20;
    const totalW = chars.length * cardW + (chars.length - 1) * gap;
    const startX = (W - totalW) / 2;

    chars.forEach((c, i) => {
      const locked = c.name !== 'Yuki';
      const x = startX + i * (cardW + gap);
      const card = this.add.graphics();

      card.fillStyle(locked ? 0x0a0820 : 0x0d0d28, 1);
      card.fillRoundedRect(x, 90, cardW, 280, 4);
      card.lineStyle(2, locked ? 0x1e3055 : 0xFF5500, 1);
      card.strokeRoundedRect(x, 90, cardW, 280, 4);

      // Emoji/avatar placeholder
      const emoji = ['🐕', '🐈', '🐶', '🦮'][i];
      this.add.text(x + cardW / 2, 180, emoji, { fontSize: '64px' }).setOrigin(0.5);

      this.add.text(x + cardW / 2, 250, c.name, {
        fontFamily: "Impact,'Arial Black',Arial,sans-serif",
        fontSize: '24px', color: locked ? '#334455' : '#FFFFFF',
      }).setOrigin(0.5);

      this.add.text(x + cardW / 2, 272, c.species, {
        fontFamily: "'Courier New',monospace", fontSize: '9px', color: '#1e3055',
      }).setOrigin(0.5);

      // Stats mini
      [
        { label: 'FORÇA',   val: c.power,             col: '#FF5500' },
        { label: 'PRECISÃO', val: c.precision,         col: '#00EEFF' },
        { label: 'ATRITO',  val: c.friction_resistance, col: '#FFD700' },
      ].forEach((s, si) => {
        const sy = 295 + si * 20;
        this.add.text(x + 10, sy, s.label, { fontFamily: "'Courier New',monospace", fontSize: '8px', color: '#1e3055' });
        this.add.text(x + cardW - 10, sy, s.val.toFixed(1), { fontFamily: "'Courier New',monospace", fontSize: '8px', color: s.col }).setOrigin(1, 0);
        const barW = (s.val / 1.5) * (cardW - 20);
        g.fillStyle(parseInt(s.col.replace('#', '0x')), locked ? 0.15 : 0.5);
        g.fillRect(x + 10, sy + 11, Math.min(barW, cardW - 20), 3);
      });

      if (locked) {
        this.add.text(x + cardW / 2, 352, '🔒 Em breve', {
          fontFamily: "'Courier New',monospace", fontSize: '11px', color: '#1e3055',
        }).setOrigin(0.5);
      } else {
        const btn = this.add.text(x + cardW / 2, 348, '▶ JOGAR', {
          fontFamily: "'Courier New',monospace", fontSize: '13px',
          color: '#fff', backgroundColor: '#CC3300', padding: { x: 14, y: 8 },
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
        btn.on('pointerdown', () => this.scene.start('Game', { charId: c.name }));
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#FF4400' }));
        btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#CC3300' }));
      }
    });

    // Especial
    const sel = chars[0];
    this.add.text(W / 2, 412, `⚡ ESPECIAL: ${sel.special} — ${Object.values(CHARACTERS)[0].specialDesc ?? ''}`, {
      fontFamily: "'Courier New',monospace", fontSize: '11px', color: '#FF5500',
    }).setOrigin(0.5);

    // Voltar
    const back = this.add.text(W / 2, 452, '← MENU', {
      fontFamily: "'Courier New',monospace", fontSize: '12px', color: '#1e3055',
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    back.on('pointerdown', () => this.scene.start('Menu'));
  }
}

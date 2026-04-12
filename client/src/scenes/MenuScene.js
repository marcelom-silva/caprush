/**
 * MenuScene.js — Tela inicial do CapRush
 * ─────────────────────────────────────────
 * Exibe logo animado, botão de jogar e features.
 */

import { GAME } from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'Menu' }); }

  create() {
    const W = GAME.WIDTH, H = GAME.HEIGHT;
    const g = this.add.graphics();

    // Fundo com grid diagonal
    g.fillStyle(0x020110); g.fillRect(0, 0, W, H);
    g.lineStyle(1, 0xff5500, 0.018);
    for (let x = 0; x < W + 80; x += 44) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 40, H); g.strokePath();
    }

    // Speed lines
    [{ w: 420, y: 55, h: 1, a: .7 }, { w: 300, y: 61, h: 2.5, a: .45 }, { w: 200, y: 67, h: 1, a: .28 }]
      .forEach(sl => { g.fillStyle(0xFF5500, sl.a); g.fillRect(0, sl.y, sl.w, sl.h); });

    // Watermark
    g.fillStyle(0xFF5500, 0.028);
    // (watermark grande em texto adicionado abaixo)
    this.add.text(W - 40, H / 2 + 40, 'CR', {
      fontFamily: "Impact,'Arial Black',Arial,sans-serif",
      fontSize: '340px', color: '#FF5500', alpha: 0.03,
    }).setOrigin(1, 0.5).setAlpha(0.03);

    // Barra accent esquerda
    g.fillStyle(0xFF5500, 0.9); g.fillRect(38, 52, 4.5, 172);

    // Logo
    this.add.text(54, 178, 'CAP', {
      fontFamily: "Impact,'Arial Black',Arial,sans-serif",
      fontSize: '120px', color: '#FFFFFF',
    }).setOrigin(0, 1);
    this.add.text(218, 178, 'RUSH', {
      fontFamily: "Impact,'Arial Black',Arial,sans-serif",
      fontSize: '120px', color: '#FF5500',
    }).setOrigin(0, 1);

    g.fillStyle(0xFF5500, 0.8); g.fillRect(54, 182, 546, 3);

    this.add.text(62, 222, '— OVERDRIVE!', {
      fontFamily: "Impact,'Arial Black',Arial,sans-serif",
      fontSize: '33px', color: '#00EEFF', fontStyle: 'italic',
    });

    this.add.text(66, 254, 'CORRIDA DE TAMPINHAS · ANIME · BLOCKCHAIN', {
      fontFamily: "'Courier New',monospace", fontSize: '10px', color: '#1e3050',
    });

    // Pills
    ['🏁 Física Real', '🐕 Personagens Anime', '💎 NFTs Metaplex', '🌐 Fogo SVM']
      .forEach((p, i) => {
        this.add.text(80 + i * 162, 308, p, {
          fontFamily: "'Courier New',monospace", fontSize: '11px',
          color: '#cc7755', backgroundColor: '#0d0820', padding: { x: 10, y: 6 },
        }).setOrigin(0.5);
      });

    // Botão jogar
    const btn = this.add.text(W / 2, 370, '  ▶  INICIAR  ', {
      fontFamily: "'Courier New',monospace", fontSize: '22px', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#CC3300', padding: { x: 24, y: 14 },
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

    this.tweens.add({ targets: btn, scaleX: 1.03, scaleY: 1.03, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    btn.on('pointerdown', () => this.scene.start('Lobby'));
    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#FF4400' }));
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#CC3300' }));

    // Instrução
    this.add.text(W / 2, 438, '💡 Arraste para trás da tampinha → solte para lançar!', {
      fontFamily: "'Courier New',monospace", fontSize: '12px', color: '#334455',
    }).setOrigin(0.5);
  }
}

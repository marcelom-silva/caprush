/**
 * CapCoin.js — Tampinha (sprite + body físico)
 * ─────────────────────────────────────────────
 * Vincula o CapBody (física) ao sprite Phaser.
 * Gera a textura da tampinha proceduralmente.
 */

import { CapBody } from '../core/Physics.js';

export class CapCoin {
  /**
   * @param {Phaser.Scene} scene
   * @param {number}       x, y     - posição inicial
   * @param {Object}       charSpecs - specs do personagem
   * @param {number}       color     - cor primária (hex)
   * @param {number}       accent    - cor de destaque (hex)
   * @param {string}       label     - texto no centro (inicial do personagem)
   */
  constructor(scene, x, y, charSpecs, color = 0xFF5500, accent = 0xFF8C00, label = '') {
    this.scene     = scene;
    this.charSpecs = charSpecs;
    this.radius    = 18;

    // Gera textura proceduralmente
    const key = `cap_${label}_${color.toString(16)}`;
    if (!scene.textures.exists(key)) {
      this._generateTexture(scene, key, color, accent, label);
    }

    // Sprite Phaser
    this.sprite = scene.add.image(x, y, key).setDepth(10);

    // Motor de física puro
    this.body = new CapBody(charSpecs, 'ASPHALT');
    this.body.pos.x = x;
    this.body.pos.y = y;
  }

  _generateTexture(scene, key, color, accent, label) {
    const size = this.radius * 2 + 4;
    const cx   = size / 2;
    const gfx  = scene.make.graphics({ add: false });

    // Sombra
    gfx.fillStyle(0x000000, 0.35);
    gfx.fillCircle(cx + 2, cx + 2, this.radius);

    // Corpo da tampinha (polígono dentado)
    const n = 18, R1 = this.radius, R2 = this.radius - 3;
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n - Math.PI / 2;
      const r = i % 2 === 0 ? R1 : R2;
      pts.push({ x: cx + r * Math.cos(a), y: cx + r * Math.sin(a) });
    }
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y);
    gfx.closePath();
    gfx.fillPath();

    // Anel interno
    gfx.lineStyle(2, accent, 0.8);
    gfx.strokeCircle(cx, cx, this.radius - 5);

    // Reflexo
    gfx.fillStyle(0xffffff, 0.5);
    gfx.fillEllipse(cx - 5, cx - 6, 10, 6);

    // Brilho central
    gfx.fillStyle(0xffffff, 0.85);
    gfx.fillCircle(cx, cx, 3.5);

    // Label (inicial)
    if (label) {
      const txt = scene.add.text(0, 0, label, {
        fontFamily: "Impact,'Arial Black',Arial,sans-serif",
        fontSize: '11px', color: '#ffffff',
      }).setVisible(false);
      // Renderiza texto diretamente na textura não é trivial em Phaser puro;
      // o label será adicionado como filho do sprite na cena.
      txt.destroy();
    }

    gfx.generateTexture(key, size, size);
    gfx.destroy();
  }

  /** Sincroniza sprite com o motor de física */
  sync() {
    this.sprite.x     = this.body.pos.x;
    this.sprite.y     = this.body.pos.y;
    this.sprite.angle = this.body.angle;
  }

  /** Posiciona tampinha e reseta física */
  reset(x, y) {
    this.body.pos.x  = x;
    this.body.pos.y  = y;
    this.body.vel.x  = 0;
    this.body.vel.y  = 0;
    this.body.stopped = true;
    this.body.angle  = 0;
    this.sync();
  }

  destroy() { this.sprite.destroy(); }
}

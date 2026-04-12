import { MainScene } from './scene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a1a',
  scene: [MainScene]
};

new Phaser.Game(config);
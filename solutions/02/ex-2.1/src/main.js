import Phaser from 'phaser';
import { Play } from './scenes/Play.js';

const config = {
  type: Phaser.AUTO, // WebGL if the browser has it, otherwise Canvas
  parent: 'game', // the <div id="game"> in index.html
  width: 960,
  height: 540,
  backgroundColor: '#1e2530',
  pixelArt: true, // keep pixel art sharp when it's scaled up
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Play],
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) window.game = game;

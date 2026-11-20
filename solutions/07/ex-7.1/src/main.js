import Phaser from 'phaser';
import { Boot } from './scenes/Boot.js';
import { Title } from './scenes/Title.js';
import { Play } from './scenes/Play.js';
import { Hud } from './scenes/Hud.js';
import { Results } from './scenes/Results.js';
import { Pause } from './scenes/Pause.js'; // new
import { listenForTuning } from './tuning-bridge.js';

// add ?debug to the URL to see every physics body
const debug = new URLSearchParams(window.location.search).has('debug');

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1e2530',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 2,
  },
  physics: {
    default: 'arcade',
    arcade: { debug },
  },
  scene: [Boot, Title, Play, Hud, Results, Pause], // new: Pause
};

const game = new Phaser.Game(config);
listenForTuning(game);

// while developing, poke at the game from the browser console: game.scene.getScene('Play')
if (import.meta.env.DEV) window.game = game;

import { tuning } from './tuning.js';

// Lets the course pages change tuning values while the game runs, through
// window.postMessage. Only messages from the same site are accepted.
//
//   iframe.contentWindow.postMessage(
//     { source: 'phaser-course', type: 'tune', path: 'thaw.perSecond', value: 12 },
//     location.origin,
//   );

export function listenForTuning(game) {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    const msg = event.data;
    if (!msg || msg.source !== 'phaser-course') return;

    if (msg.type === 'tune') {
      const keys = msg.path.split('.');
      const last = keys.pop();
      const target = keys.reduce((obj, key) => obj?.[key], tuning);
      if (target && typeof target[last] === typeof msg.value) {
        target[last] = msg.value;
        game.events.emit('tuning-changed', msg.path, msg.value);
      }
    }

    if (msg.type === 'restart') {
      game.scene.getScenes(true).forEach((scene) => scene.scene.stop());
      game.scene.start('Title');
    }
  });
}

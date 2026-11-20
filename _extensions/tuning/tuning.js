// Sends tuning changes from a .tuning-panel to the game in its target iframe.
// The game listens in src/tuning-bridge.js.
document.addEventListener('DOMContentLoaded', () => {
  for (const panel of document.querySelectorAll('.tuning-panel')) {
    const frame = () => document.getElementById(panel.dataset.target);
    const send = (message) => {
      const target = frame()?.contentWindow;
      if (target) target.postMessage({ source: 'phaser-course', ...message }, window.location.origin);
    };
    const valueOf = (input) => (input.type === 'checkbox' ? input.checked : Number(input.value));
    const show = (input) => {
      const out = input.parentElement.querySelector('output');
      out.textContent = input.type === 'checkbox' ? (input.checked ? 'on' : 'off') : input.value;
    };
    const inputs = panel.querySelectorAll('input[data-path]');

    for (const input of inputs) {
      input.addEventListener('input', () => {
        show(input);
        send({ type: 'tune', path: input.dataset.path, value: valueOf(input) });
      });
    }

    // the game starts with its own defaults; re-send ours whenever it (re)loads
    frame()?.addEventListener('load', () => {
      for (const input of inputs) send({ type: 'tune', path: input.dataset.path, value: valueOf(input) });
    });

    panel.querySelector('[data-action="reset"]').addEventListener('click', () => {
      for (const input of inputs) {
        if (input.type === 'checkbox') input.checked = input.dataset.default === 'true';
        else input.value = input.dataset.default;
        show(input);
        send({ type: 'tune', path: input.dataset.path, value: valueOf(input) });
      }
    });
    panel.querySelector('[data-action="restart"]').addEventListener('click', () => send({ type: 'restart' }));
  }
});

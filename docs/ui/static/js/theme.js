(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  var label = toggle && toggle.querySelector('.theme-toggle__label');

  if (!toggle) {
    return;
  }

  function updateToggle() {
    var dark = root.dataset.theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    label.textContent = dark ? '淺色模式' : '深色模式';
  }

  toggle.addEventListener('click', function () {
    var theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    try {
      localStorage.setItem('docs-theme', theme);
    } catch (error) {
      // file:// 或隱私模式可能禁止儲存，主題切換本身仍可正常使用。
    }
    updateToggle();
  });

  updateToggle();
}());

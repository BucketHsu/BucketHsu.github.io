(function () {
  'use strict';

  var root = document.documentElement;
  var navRoots = document.querySelectorAll('.site-nav__menu, .mobile-nav nav');

  if (!navRoots.length) {
    return;
  }

  root.classList.add('nav-enhanced');

  function setExpanded(item, expanded) {
    if (!item) {
      return;
    }

    item.classList.toggle('is-expanded', expanded);

    var toggle = item.querySelector(':scope > .nav-item__row > .nav-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute(
        'aria-label',
        (expanded ? '收合 ' : '展開 ') + (toggle.dataset.label || '')
      );
    }
  }

  navRoots.forEach(function (navRoot) {
    navRoot.querySelectorAll('.nav-toggle').forEach(function (toggle) {
      var row = toggle.closest('.nav-item__row');
      var item = row && row.parentElement;
      var labelElement = row && row.querySelector('.nav-link, .nav-text');
      var label = labelElement ? labelElement.textContent.trim() : '此分類';

      toggle.dataset.label = label;
      toggle.setAttribute('aria-label', '展開 ' + label);

      toggle.addEventListener('click', function () {
        setExpanded(item, !item.classList.contains('is-expanded'));
      });
    });

    navRoot.querySelectorAll(':scope > .nav-list > .nav-item.has-children').forEach(function (item) {
      setExpanded(item, true);
    });

    navRoot.querySelectorAll('.nav-link[aria-current="page"]').forEach(function (currentLink) {
      var currentItem = currentLink.closest('.nav-item');
      var ancestor = currentItem;

      while (ancestor && ancestor !== navRoot) {
        if (ancestor.classList.contains('has-children')) {
          setExpanded(ancestor, true);
        }
        ancestor = ancestor.parentElement && ancestor.parentElement.closest('.nav-item');
      }

      currentItem.classList.add('is-current');
    });
  });

  var desktopCurrent = document.querySelector(
    '.site-nav .nav-link[aria-current="page"]'
  );

  if (desktopCurrent) {
    window.requestAnimationFrame(function () {
      desktopCurrent.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'auto'
      });
    });
  }
}());

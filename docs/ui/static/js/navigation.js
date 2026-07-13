(function () {
  'use strict';

  var root = document.documentElement;
  var navRoots = document.querySelectorAll('.site-nav__menu, .mobile-nav nav');
  var storageKey = 'docs-nav-expanded';

  if (!navRoots.length) {
    return;
  }

  root.classList.add('nav-enhanced');

  function getItemLabel(item) {
    var row = item && item.querySelector(':scope > .nav-item__row');
    var labelElement = row && row.querySelector('.nav-link, .nav-text');
    return labelElement ? labelElement.textContent.trim() : '';
  }

  function getItemKey(item) {
    var labels = [];
    var current = item;

    while (current && current.classList && current.classList.contains('nav-item')) {
      labels.unshift(getItemLabel(current));
      current = current.parentElement && current.parentElement.closest('.nav-item');
    }

    return labels.filter(Boolean).join(' > ');
  }

  function readExpandedState() {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  function writeExpandedState(items) {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      // 隱私模式或 file:// 可能禁止儲存，不影響導覽操作。
    }
  }

  function saveExpandedState(navRoot) {
    var expanded = [];

    navRoot.querySelectorAll('.nav-item.has-children.is-expanded').forEach(function (item) {
      if (!item.matches(':scope')) {
        return;
      }
      var key = getItemKey(item);
      if (key) {
        expanded.push(key);
      }
    });

    writeExpandedState(expanded);
  }

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
    var expandedState = readExpandedState();

    navRoot.querySelectorAll('.nav-toggle').forEach(function (toggle) {
      var row = toggle.closest('.nav-item__row');
      var item = row && row.parentElement;
      var label = getItemLabel(item) || '此分類';

      toggle.dataset.label = label;
      toggle.setAttribute('aria-label', '展開 ' + label);

      toggle.addEventListener('click', function () {
        setExpanded(item, !item.classList.contains('is-expanded'));
        saveExpandedState(navRoot);
      });
    });

    navRoot.querySelectorAll('.nav-item.has-children > .nav-item__row > .nav-text').forEach(function (text) {
      var item = text.closest('.nav-item');

      text.setAttribute('role', 'button');
      text.setAttribute('tabindex', '0');

      function toggleItem() {
        setExpanded(item, !item.classList.contains('is-expanded'));
        saveExpandedState(navRoot);
      }

      text.addEventListener('click', toggleItem);
      text.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleItem();
        }
      });
    });

    navRoot.querySelectorAll('.nav-item.has-children').forEach(function (item) {
      var key = getItemKey(item);
      if (expandedState.indexOf(key) !== -1) {
        setExpanded(item, true);
      }
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

    saveExpandedState(navRoot);
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
(function () {
  'use strict';

  var root = document.documentElement;
  var navRoots = document.querySelectorAll('.site-nav__menu, .mobile-nav nav');
  var storageKey = 'docs-nav-expanded';
  var siteNav = document.querySelector('.site-nav');
  var siteNavToggle = document.querySelector('.topbar-nav-toggle');
  var siteNavClose = document.querySelector('.site-nav__close');
  var siteOverlay = document.querySelector('.site-overlay');
  var lastFocusedElement = null;

  function centerCurrentItem() {
    if (!siteNav) {
      return;
    }

    var current = siteNav.querySelector('.nav-link[aria-current="page"]');

    if (!current) {
      return;
    }

    var targetTop = current.offsetTop - (siteNav.clientHeight / 2) + (current.offsetHeight / 2);
    siteNav.scrollTop = Math.max(0, targetTop);
  }

  function setSiteNavOpen(open, options) {
    if (!siteNav || !siteNavToggle) {
      return;
    }

    root.classList.toggle('site-nav-open', open);
    root.classList.remove('page-toc-mobile-open');
    siteNavToggle.setAttribute('aria-expanded', String(open));
    siteNav.setAttribute('aria-hidden', String(!open));

    var pageTocToggle = document.querySelector('.mobile-page-toc-toggle');
    var pageTocPanel = document.querySelector('.page-toc-panel');
    if (pageTocToggle) {
      pageTocToggle.setAttribute('aria-expanded', 'false');
    }
    if (pageTocPanel) {
      pageTocPanel.setAttribute(
        'aria-hidden',
        String(window.matchMedia('(max-width: 960px)').matches)
      );
    }

    if (open) {
      lastFocusedElement = document.activeElement;
      window.requestAnimationFrame(function () {
        centerCurrentItem();
        if (!options || options.focus !== false) {
          siteNavClose.focus();
        }
      });
    } else if ((!options || options.restoreFocus !== false) && lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function trapSiteNavFocus(event) {
    if (event.key !== 'Tab' || !root.classList.contains('site-nav-open')) {
      return;
    }

    var focusable = siteNav.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable.length) {
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (siteNav && siteNavToggle) {
    siteNavToggle.addEventListener('click', function () {
      setSiteNavOpen(!root.classList.contains('site-nav-open'));
    });

    siteNavClose.addEventListener('click', function () {
      setSiteNavOpen(false);
    });

    siteNav.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a[href]')) {
        setSiteNavOpen(false, { restoreFocus: false });
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('site-nav-open')) {
        setSiteNavOpen(false);
      } else {
        trapSiteNavFocus(event);
      }
    });
  }

  if (siteOverlay) {
    siteOverlay.addEventListener('click', function () {
      if (root.classList.contains('site-nav-open')) {
        setSiteNavOpen(false);
      }
    });
  }

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

}());

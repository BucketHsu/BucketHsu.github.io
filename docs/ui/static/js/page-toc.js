(function () {
  'use strict';

  var root = document.documentElement;
  var panel = document.querySelector('.page-toc-panel');
  var target = document.querySelector('.page-toc__content');
  var collapseButton = document.querySelector('.page-toc__collapse');
  var collapseIcon = document.querySelector('.page-toc__collapse-icon');
  var mobileToggle = document.querySelector('.mobile-page-toc-toggle');
  var siteOverlay = document.querySelector('.site-overlay');
  var sourceToc = document.querySelector('.doc > #toc');
  var storageKey = 'docs-page-toc-collapsed';
  var mobileMedia = window.matchMedia('(max-width: 960px)');
  var activeLink = null;
  var updateQueued = false;

  if (!panel || !target || !sourceToc) {
    root.classList.add('no-page-toc');
    root.classList.remove('page-toc-collapsed');
    if (panel) {
      panel.setAttribute('hidden', '');
    }
    return;
  }

  target.appendChild(sourceToc);

  var links = Array.prototype.slice.call(sourceToc.querySelectorAll('a[href^="#"]'));
  var topLevelItems = Array.prototype.slice.call(
    sourceToc.querySelectorAll(':scope > ul > li')
  );
  var headingLinks = links.map(function (link) {
    var id = decodeURIComponent(link.getAttribute('href').slice(1));
    var heading = document.getElementById(id);
    return heading ? { heading: heading, link: link } : null;
  }).filter(Boolean);

  function readCollapsedState() {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch (error) {
      return false;
    }
  }

  function writeCollapsedState(collapsed) {
    try {
      localStorage.setItem(storageKey, String(collapsed));
    } catch (error) {
      // 隱私模式或 file:// 可能禁止儲存，不影響目錄操作。
    }
  }

  function syncCollapsedState() {
    if (mobileMedia.matches) {
      collapseButton.setAttribute('aria-expanded', 'true');
      collapseButton.setAttribute('aria-label', '關閉本頁目錄');
      collapseButton.setAttribute('title', '關閉本頁目錄');
      collapseIcon.textContent = '×';
      return;
    }

    var collapsed = root.classList.contains('page-toc-collapsed');
    collapseButton.setAttribute('aria-expanded', String(!collapsed));
    collapseButton.setAttribute(
      'aria-label',
      collapsed ? '展開本頁目錄' : '收合本頁目錄'
    );
    collapseButton.setAttribute(
      'title',
      collapsed ? '展開本頁目錄' : '收合本頁目錄'
    );
    collapseIcon.textContent = collapsed ? '›' : '‹';
  }

  function setMobileOpen(open, options) {
    if (!mobileMedia.matches) {
      open = false;
    }

    root.classList.toggle('page-toc-mobile-open', open);
    root.classList.remove('site-nav-open');
    mobileToggle.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open && mobileMedia.matches));
    syncCollapsedState();

    var siteNavToggle = document.querySelector('.topbar-nav-toggle');
    var siteNav = document.querySelector('.site-nav');
    if (siteNavToggle) {
      siteNavToggle.setAttribute('aria-expanded', 'false');
    }
    if (siteNav) {
      siteNav.setAttribute('aria-hidden', 'true');
    }

    if (open && (!options || options.focus !== false)) {
      window.requestAnimationFrame(function () {
        collapseButton.focus();
      });
    }
  }

  function findTopLevelItem(link) {
    return topLevelItems.find(function (item) {
      return item.contains(link);
    });
  }

  function keepActiveLinkVisible(link) {
    var containerRect = target.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();

    if (linkRect.top < containerRect.top) {
      target.scrollTop -= containerRect.top - linkRect.top + 12;
    } else if (linkRect.bottom > containerRect.bottom) {
      target.scrollTop += linkRect.bottom - containerRect.bottom + 12;
    }
  }

  function setActiveLink(link) {
    if (!link || link === activeLink) {
      return;
    }

    links.forEach(function (item) {
      item.classList.toggle('is-active', item === link);
      if (item === link) {
        item.setAttribute('aria-current', 'location');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    var activeTopLevelItem = findTopLevelItem(link);
    topLevelItems.forEach(function (item) {
      item.classList.toggle('is-active-section', item === activeTopLevelItem);
    });

    activeLink = link;
    keepActiveLinkVisible(link);
  }

  function updateActiveSection() {
    updateQueued = false;

    if (!headingLinks.length) {
      return;
    }

    var topbarHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--topbar-height')
    ) || 68;
    var current = headingLinks[0];

    headingLinks.forEach(function (item) {
      if (item.heading.getBoundingClientRect().top <= topbarHeight + 24) {
        current = item;
      }
    });

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = headingLinks[headingLinks.length - 1];
    }

    setActiveLink(current.link);
  }

  function queueActiveSectionUpdate() {
    if (updateQueued) {
      return;
    }

    updateQueued = true;
    window.requestAnimationFrame(updateActiveSection);
  }

  function handleViewportChange() {
    setMobileOpen(false, { focus: false });
    panel.setAttribute('aria-hidden', String(mobileMedia.matches));
    syncCollapsedState();
  }

  function trapMobileFocus(event) {
    if (
      event.key !== 'Tab' ||
      !mobileMedia.matches ||
      !root.classList.contains('page-toc-mobile-open')
    ) {
      return;
    }

    var focusable = panel.querySelectorAll(
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

  root.classList.toggle('page-toc-collapsed', readCollapsedState());
  syncCollapsedState();
  panel.setAttribute('aria-hidden', String(mobileMedia.matches));

  collapseButton.addEventListener('click', function () {
    if (mobileMedia.matches) {
      setMobileOpen(false);
      mobileToggle.focus();
      return;
    }

    var collapsed = !root.classList.contains('page-toc-collapsed');
    root.classList.toggle('page-toc-collapsed', collapsed);
    writeCollapsedState(collapsed);
    syncCollapsedState();
  });

  mobileToggle.addEventListener('click', function () {
    setMobileOpen(!root.classList.contains('page-toc-mobile-open'));
  });

  sourceToc.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }

    setActiveLink(link);
    if (mobileMedia.matches) {
      setMobileOpen(false, { focus: false });
    }
  });

  if (siteOverlay) {
    siteOverlay.addEventListener('click', function () {
      if (root.classList.contains('page-toc-mobile-open')) {
        setMobileOpen(false);
      }
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && root.classList.contains('page-toc-mobile-open')) {
      setMobileOpen(false);
      mobileToggle.focus();
    } else {
      trapMobileFocus(event);
    }
  });

  if (typeof mobileMedia.addEventListener === 'function') {
    mobileMedia.addEventListener('change', handleViewportChange);
  } else {
    mobileMedia.addListener(handleViewportChange);
  }

  window.addEventListener('scroll', queueActiveSectionUpdate, { passive: true });
  window.addEventListener('resize', queueActiveSectionUpdate);
  updateActiveSection();
}());

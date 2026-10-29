/**
 * Gopalan Pre-University College (GPUC) - Embeddable AI Admissions Chatbot
 * Bottom-Right Floating Widget for GPUC North & WordPress websites
 */
(function () {
  'use strict';

  // Prevent double injection
  if (window.__GPUC_CHATBOT_EMBEDDED__) return;
  window.__GPUC_CHATBOT_EMBEDDED__ = true;

  // Determine chatbot server origin
  const scriptTag = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('gpuc-chatbot-embed.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();

  let baseUrl = window.GPUC_CHATBOT_URL || 'http://localhost:3000';
  if (scriptTag && scriptTag.src) {
    try {
      const url = new URL(scriptTag.src);
      baseUrl = url.origin;
    } catch (e) {
      // keep fallback baseUrl
    }
  }

  // State
  let isOpen = false;
  let isMaximized = false;

  // Create scoped styles
  const styleEl = document.createElement('style');
  styleEl.id = 'gpuc-chatbot-embed-styles';
  styleEl.textContent = `
    #gpuc-widget-launcher {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      width: 58px !important;
      height: 58px !important;
      border-radius: 50% !important;
      background: #FFFFFF !important;
      border: 2.5px solid #F59E0B !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 0 0 3px rgba(245, 158, 11, 0.25) !important;
      cursor: pointer !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
      outline: none !important;
      padding: 0 !important;
      user-select: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    #gpuc-widget-launcher.hidden {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
      visibility: hidden !important;
    }

    #gpuc-widget-launcher:hover {
      transform: scale(1.08) translateY(-2px) !important;
      box-shadow: 0 14px 38px rgba(0, 0, 0, 0.45), 0 0 0 5px rgba(245, 158, 11, 0.35) !important;
    }

    #gpuc-widget-launcher img {
      width: 40px !important;
      height: 40px !important;
      object-fit: contain !important;
      display: block !important;
      pointer-events: none !important;
    }

    #gpuc-widget-launcher .gpuc-status-dot {
      position: absolute !important;
      top: -2px !important;
      right: -2px !important;
      width: 14px !important;
      height: 14px !important;
      border-radius: 50% !important;
      background: #22C55E !important;
      border: 2px solid #060D19 !important;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.9) !important;
      animation: gpuc-pulse-dot 2s infinite !important;
    }

    #gpuc-widget-tooltip {
      position: fixed !important;
      bottom: 90px !important;
      right: 24px !important;
      background: rgba(11, 23, 39, 0.96) !important;
      backdrop-filter: blur(8px) !important;
      color: #FFFFFF !important;
      padding: 8px 16px !important;
      border-radius: 20px !important;
      border: 1px solid #F59E0B !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4) !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      z-index: 2147483646 !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transform: translateY(6px) !important;
      transition: all 0.2s ease !important;
      white-space: nowrap !important;
    }

    #gpuc-widget-tooltip.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    #gpuc-widget-container {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      width: 420px;
      height: 640px;
      min-width: 320px !important;
      min-height: 440px !important;
      max-width: calc(100vw - 32px) !important;
      max-height: calc(100vh - 36px) !important;
      border-radius: 18px !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28), 0 2px 10px rgba(0, 0, 0, 0.08) !important;
      z-index: 2147483645 !important;
      overflow: visible !important;
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      opacity: 0 !important;
      transform: translateY(16px) scale(0.97) !important;
      pointer-events: none !important;
      border: 1px solid rgba(15, 23, 42, 0.14) !important;
      background: transparent !important;
    }

    #gpuc-widget-container.is-resizing {
      transition: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }

    #gpuc-widget-container.open {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
      pointer-events: auto !important;
    }

    #gpuc-widget-container.maximized {
      width: min(1040px, calc(100vw - 40px)) !important;
      height: calc(100vh - 40px) !important;
      max-height: calc(100vh - 40px) !important;
      bottom: 20px !important;
      right: 20px !important;
    }

    #gpuc-widget-iframe-wrapper {
      width: 100% !important;
      height: 100% !important;
      border-radius: 18px !important;
      overflow: hidden !important;
      position: relative !important;
      background: transparent !important;
    }

    #gpuc-widget-iframe {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      display: block !important;
      background: transparent !important;
    }

    /* Invisible native resize handles */
    .gpuc-resize-handle {
      position: absolute !important;
      z-index: 2147483647 !important;
      touch-action: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      background: transparent !important;
    }

    .gpuc-resize-top {
      top: -8px !important;
      left: 36px !important;
      right: 36px !important;
      height: 18px !important;
      cursor: ns-resize !important;
    }

    .gpuc-resize-left {
      left: -8px !important;
      top: 36px !important;
      bottom: 36px !important;
      width: 18px !important;
      cursor: ew-resize !important;
    }

    .gpuc-resize-corner {
      top: -12px !important;
      left: -12px !important;
      width: 48px !important;
      height: 48px !important;
      cursor: nwse-resize !important;
    }

    /* Completely hide Google reCAPTCHA badge / error card behind the launcher */
    .grecaptcha-badge,
    .recaptcha_v3-bottomright,
    div[style*="bottom: 14px"][style*="right: 0"],
    iframe[src*="recaptcha"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      width: 0 !important;
      height: 0 !important;
      position: absolute !important;
      left: -9999px !important;
      z-index: -9999 !important;
    }

    @keyframes gpuc-pulse-dot {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }

    @keyframes gpuc-3-bounces {
      0% {
        transform: translateY(0) scale(1, 1);
      }
      15% {
        transform: translateY(2px) scale(1.08, 0.92);
      }
      45% {
        transform: translateY(-24px) scale(0.94, 1.08);
      }
      75% {
        transform: translateY(0) scale(1.10, 0.90);
      }
      88% {
        transform: translateY(-4px) scale(0.98, 1.02);
      }
      100% {
        transform: translateY(0) scale(1, 1);
      }
    }

    #gpuc-widget-launcher.gpuc-bouncing {
      animation: gpuc-3-bounces 0.65s cubic-bezier(0.28, 0.84, 0.42, 1) 3 !important;
    }

    @media (max-width: 768px) {
      #gpuc-widget-launcher {
        bottom: 16px !important;
        right: 16px !important;
        width: 48px !important;
        height: 48px !important;
      }
      #gpuc-widget-launcher img {
        width: 30px !important;
        height: 30px !important;
      }
      #gpuc-widget-container,
      #gpuc-widget-container.open,
      #gpuc-widget-container.maximized {
        position: fixed !important;
        top: 0 !important;
        bottom: 0 !important;
        right: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100% !important;
        height: 100dvh !important;
        max-width: 100vw !important;
        max-height: 100dvh !important;
        border-radius: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
      .gpuc-resize-handle,
      #gpuc-resize-shield {
        display: none !important;
      }
      #gpuc-widget-tooltip {
        display: none !important;
      }
      #gpuc-widget-iframe {
        border-radius: 0 !important;
        border: none !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // 1. Tooltip
  const tooltipEl = document.createElement('div');
  tooltipEl.id = 'gpuc-widget-tooltip';
  tooltipEl.innerHTML = `
    <span style="width:8px;height:8px;border-radius:50%;background:#22C55E;display:inline-block;"></span>
    <span>GPUC North Campus &bull; Admissions 2026–27</span>
  `;
  document.body.appendChild(tooltipEl);

  // 2. Chat Window Container with Free Resizing
  const containerEl = document.createElement('div');
  containerEl.id = 'gpuc-widget-container';

  // Restore saved custom size from localStorage if available
  try {
    const savedW = localStorage.getItem('gpuc_chat_custom_width');
    const savedH = localStorage.getItem('gpuc_chat_custom_height');
    if (savedW && savedH) {
      const parsedW = parseInt(savedW, 10);
      const parsedH = parseInt(savedH, 10);
      if (parsedW >= 340 && parsedH >= 460) {
        containerEl.style.setProperty('width', `${parsedW}px`, 'important');
        containerEl.style.setProperty('height', `${parsedH}px`, 'important');
      }
    }
  } catch (e) {}

  const iframeWrapper = document.createElement('div');
  iframeWrapper.id = 'gpuc-widget-iframe-wrapper';

  const iframeEl = document.createElement('iframe');
  iframeEl.id = 'gpuc-widget-iframe';
  iframeEl.src = baseUrl + '/embed';
  iframeEl.title = 'Gopalan Pre-University College North Campus AI Admissions Assistant';
  iframeEl.allow = 'clipboard-write; autoplay; microphone';

  iframeWrapper.appendChild(iframeEl);
  containerEl.appendChild(iframeWrapper);

  // Resize handles: top, left, and corner
  const resizeHandleTop = document.createElement('div');
  resizeHandleTop.className = 'gpuc-resize-handle gpuc-resize-top';
  resizeHandleTop.title = 'Drag top edge to resize height';

  const resizeHandleLeft = document.createElement('div');
  resizeHandleLeft.className = 'gpuc-resize-handle gpuc-resize-left';
  resizeHandleLeft.title = 'Drag left edge to resize width';

  const resizeHandleCorner = document.createElement('div');
  resizeHandleCorner.className = 'gpuc-resize-handle gpuc-resize-corner';
  resizeHandleCorner.title = 'Drag to freely expand size';

  containerEl.appendChild(resizeHandleTop);
  containerEl.appendChild(resizeHandleLeft);
  containerEl.appendChild(resizeHandleCorner);
  document.body.appendChild(containerEl);

  // Free Resize Drag Controller with Pointer Capture and RequestAnimationFrame
  let isResizing = false;
  let resizeDir = null;
  let startX = 0;
  let startY = 0;
  let startW = 420;
  let startH = 640;
  let curTargetW = 420;
  let curTargetH = 640;
  let resizeRafId = null;
  let activeHandle = null;

  function initResize(e, direction) {
    if (e.button !== undefined && e.button !== 0) return; // Only primary mouse button or touch
    if (isMaximized) {
      isMaximized = false;
      containerEl.classList.remove('maximized');
      try {
        iframeEl.contentWindow?.postMessage({
          type: 'GPUC_WIDGET_SET_MAXIMIZED',
          isMaximized: false
        }, '*');
      } catch (err) {}
    }

    isResizing = true;
    resizeDir = direction;
    activeHandle = e.currentTarget;

    try {
      if (activeHandle && activeHandle.setPointerCapture) {
        activeHandle.setPointerCapture(e.pointerId);
      }
    } catch (err) {}

    containerEl.classList.add('is-resizing');
    iframeEl.style.pointerEvents = 'none'; // Prevents iframe from intercepting pointer moves

    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    startX = clientX;
    startY = clientY;

    const rect = containerEl.getBoundingClientRect();
    startW = rect.width;
    startH = rect.height;
    curTargetW = startW;
    curTargetH = startH;

    if (direction === 'corner') document.body.style.cursor = 'nwse-resize';
    else if (direction === 'top') document.body.style.cursor = 'ns-resize';
    else if (direction === 'left') document.body.style.cursor = 'ew-resize';

    activeHandle.addEventListener('pointermove', onResizing);
    activeHandle.addEventListener('pointerup', stopResizing);
    activeHandle.addEventListener('pointercancel', stopResizing);

    window.addEventListener('mousemove', onResizing);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', onResizing, { passive: false });
    window.addEventListener('touchend', stopResizing);
    e.preventDefault();
  }

  function onResizing(e) {
    if (!isResizing) return;
    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);

    const deltaX = startX - clientX;
    const deltaY = startY - clientY;

    const maxW = Math.max(340, window.innerWidth - 32);
    const maxH = Math.max(460, window.innerHeight - 36);

    if (resizeDir === 'left' || resizeDir === 'corner') {
      curTargetW = Math.max(340, Math.min(startW + deltaX, maxW));
    }
    if (resizeDir === 'top' || resizeDir === 'corner') {
      curTargetH = Math.max(460, Math.min(startH + deltaY, maxH));
    }

    if (resizeRafId === null) {
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        if (!isResizing) return;
        if (resizeDir === 'left' || resizeDir === 'corner') {
          containerEl.style.setProperty('width', `${Math.round(curTargetW)}px`, 'important');
        }
        if (resizeDir === 'top' || resizeDir === 'corner') {
          containerEl.style.setProperty('height', `${Math.round(curTargetH)}px`, 'important');
        }
      });
    }

    e.preventDefault();
  }

  function stopResizing(e) {
    if (!isResizing) return;
    isResizing = false;
    if (resizeRafId !== null) {
      cancelAnimationFrame(resizeRafId);
      resizeRafId = null;
    }

    containerEl.classList.remove('is-resizing');
    iframeEl.style.pointerEvents = 'auto'; // Re-enable iframe pointer events
    document.body.style.cursor = '';

    if (activeHandle) {
      try {
        if (e && e.pointerId && activeHandle.releasePointerCapture) {
          activeHandle.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
      activeHandle.removeEventListener('pointermove', onResizing);
      activeHandle.removeEventListener('pointerup', stopResizing);
      activeHandle.removeEventListener('pointercancel', stopResizing);
      activeHandle = null;
    }

    window.removeEventListener('mousemove', onResizing);
    window.removeEventListener('mouseup', stopResizing);
    window.removeEventListener('touchmove', onResizing);
    window.removeEventListener('touchend', stopResizing);

    const rect = containerEl.getBoundingClientRect();
    const finalW = Math.round(rect.width);
    const finalH = Math.round(rect.height);
    containerEl.style.setProperty('width', `${finalW}px`, 'important');
    containerEl.style.setProperty('height', `${finalH}px`, 'important');
    try {
      localStorage.setItem('gpuc_chat_custom_width', finalW.toString());
      localStorage.setItem('gpuc_chat_custom_height', finalH.toString());
    } catch (err) {}
  }

  resizeHandleTop.addEventListener('pointerdown', (e) => initResize(e, 'top'));
  resizeHandleLeft.addEventListener('pointerdown', (e) => initResize(e, 'left'));
  resizeHandleCorner.addEventListener('pointerdown', (e) => initResize(e, 'corner'));

  // 3. Floating Launcher Button
  const launcherBtn = document.createElement('button');
  launcherBtn.id = 'gpuc-widget-launcher';
  launcherBtn.setAttribute('aria-label', 'Open GPUC Admissions Assistant');
  launcherBtn.innerHTML = `
    <img src="${baseUrl}/gopalan_crest.svg" alt="GPUC Logo" />
    <span class="gpuc-status-dot"></span>
  `;
  document.body.appendChild(launcherBtn);

  // Toggle Functionality
  function openChat() {
    isOpen = true;
    launcherBtn.classList.remove('gpuc-bouncing');
    launcherBtn.classList.add('hidden');
    containerEl.classList.add('open');
    tooltipEl.classList.remove('visible');
    try {
      iframeEl.contentWindow?.postMessage({ type: 'GPUC_WIDGET_SET_OPEN', isOpen: true }, '*');
    } catch (e) {}
  }

  function closeChat() {
    isOpen = false;
    launcherBtn.classList.remove('gpuc-bouncing');
    launcherBtn.classList.remove('hidden');
    try {
      sessionStorage.setItem('gpuc_ai_popped', 'true');
    } catch (e) {}
    containerEl.classList.remove('open');
    launcherBtn.style.transform = '';
    try {
      iframeEl.contentWindow?.postMessage({ type: 'GPUC_WIDGET_SET_OPEN', isOpen: false }, '*');
    } catch (e) {}
  }

  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  launcherBtn.addEventListener('click', toggleChat);
  launcherBtn.addEventListener('mouseenter', () => {
    if (!isOpen) tooltipEl.classList.add('visible');
  });
  launcherBtn.addEventListener('mouseleave', () => {
    tooltipEl.classList.remove('visible');
  });

  // Preset dimension toggle (Small: 420x640 vs Big: 1040xViewport)
  const PRESET_SMALL_W = 420;
  const PRESET_SMALL_H = 640;

  function setPresetMaximize(nextMaximized) {
    isMaximized = nextMaximized;
    containerEl.classList.remove('is-resizing');

    if (isMaximized) {
      containerEl.classList.add('maximized');
      const maxW = Math.min(1040, window.innerWidth - 32);
      const maxH = Math.max(500, window.innerHeight - 36);
      containerEl.style.setProperty('width', `${maxW}px`, 'important');
      containerEl.style.setProperty('height', `${maxH}px`, 'important');
      try {
        localStorage.setItem('gpuc_chat_custom_width', maxW.toString());
        localStorage.setItem('gpuc_chat_custom_height', maxH.toString());
      } catch (e) {}
    } else {
      containerEl.classList.remove('maximized');
      containerEl.style.setProperty('width', `${PRESET_SMALL_W}px`, 'important');
      containerEl.style.setProperty('height', `${PRESET_SMALL_H}px`, 'important');
      try {
        localStorage.setItem('gpuc_chat_custom_width', PRESET_SMALL_W.toString());
        localStorage.setItem('gpuc_chat_custom_height', PRESET_SMALL_H.toString());
      } catch (e) {}
    }

    try {
      iframeEl.contentWindow?.postMessage({
        type: 'GPUC_WIDGET_SET_MAXIMIZED',
        isMaximized: isMaximized
      }, '*');
    } catch (e) {}
  }

  // Listen to postMessages from chatbot iframe (close, minimize, maximize)
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'GPUC_CHAT_CLOSE' || event.data.type === 'GPUC_CHAT_MINIMIZE') {
      closeChat();
    } else if (event.data.type === 'GPUC_CHAT_MAXIMIZE') {
      setPresetMaximize(!isMaximized);
    }
  });

  // Global API
  window.GPUCChatbot = {
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
  };

  // Exactly 3 bounces on page load, then auto-open the chat bot
  function triggerAutoPopup() {
    if (isOpen) return;

    // Gentle 600ms pause on page load so user sees launcher at rest before bouncing
    setTimeout(() => {
      if (isOpen) return;

      launcherBtn.classList.add('gpuc-bouncing');
      tooltipEl.classList.add('visible');

      let autoOpened = false;
      function onBouncesFinished() {
        if (autoOpened) return;
        autoOpened = true;
        launcherBtn.removeEventListener('animationend', onBouncesFinished);
        launcherBtn.classList.remove('gpuc-bouncing');
        tooltipEl.classList.remove('visible');

        if (!isOpen) {
          openChat();
        }
      }

      // Listen for when all 3 bounces finish
      launcherBtn.addEventListener('animationend', onBouncesFinished);

      // Reliable fallback: 3 bounces * 650ms + 100ms buffer = 2050ms
      setTimeout(onBouncesFinished, 2050);
    }, 600);
  }

  if (document.readyState === 'complete') {
    triggerAutoPopup();
  } else {
    window.addEventListener('load', triggerAutoPopup);
  }

  // Ensure iframe content receives open and maximize states as soon as it loads
  iframeEl.addEventListener('load', () => {
    try {
      if (isOpen) {
        iframeEl.contentWindow?.postMessage({ type: 'GPUC_WIDGET_SET_OPEN', isOpen: true }, '*');
      }
      iframeEl.contentWindow?.postMessage({ type: 'GPUC_WIDGET_SET_MAXIMIZED', isMaximized: isMaximized }, '*');
    } catch (e) {}
  });
})();

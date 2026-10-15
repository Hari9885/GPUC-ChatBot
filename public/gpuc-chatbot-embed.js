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
      bottom: 94px !important;
      right: 24px !important;
      width: 440px !important;
      height: 680px !important;
      max-width: calc(100vw - 32px) !important;
      max-height: calc(100vh - 120px) !important;
      border-radius: 20px !important;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.15) !important;
      z-index: 2147483645 !important;
      overflow: hidden !important;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      opacity: 0 !important;
      transform: translateY(20px) scale(0.96) !important;
      pointer-events: none !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      background: #FFFFFF !important;
    }

    #gpuc-widget-container.open {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
      pointer-events: auto !important;
    }

    #gpuc-widget-container.maximized {
      width: min(960px, calc(100vw - 40px)) !important;
      height: calc(100vh - 40px) !important;
      max-height: calc(100vh - 40px) !important;
      bottom: 20px !important;
      right: 20px !important;
    }

    #gpuc-widget-iframe {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      display: block !important;
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

    @media (max-width: 640px) {
      #gpuc-widget-launcher {
        bottom: 16px !important;
        right: 16px !important;
        width: 52px !important;
        height: 52px !important;
      }
      #gpuc-widget-launcher img {
        width: 34px !important;
        height: 34px !important;
      }
      #gpuc-widget-container {
        bottom: 0 !important;
        right: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 92vh !important;
        max-width: 100vw !important;
        max-height: 92vh !important;
        border-radius: 20px 20px 0 0 !important;
      }
      #gpuc-widget-tooltip {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // 1. Tooltip
  const tooltipEl = document.createElement('div');
  tooltipEl.id = 'gpuc-widget-tooltip';
  tooltipEl.innerHTML = `
    <span style="width:8px;height:8px;border-radius:50%;background:#22C55E;display:inline-block;"></span>
    <span>GPUC AI Admissions Assistant &bull; Click to chat</span>
  `;
  document.body.appendChild(tooltipEl);

  // 2. Chat Window Container
  const containerEl = document.createElement('div');
  containerEl.id = 'gpuc-widget-container';

  const iframeEl = document.createElement('iframe');
  iframeEl.id = 'gpuc-widget-iframe';
  iframeEl.src = baseUrl + '/embed';
  iframeEl.title = 'Gopalan Pre-University College AI Admissions Assistant';
  iframeEl.allow = 'clipboard-write; autoplay; microphone';
  containerEl.appendChild(iframeEl);
  document.body.appendChild(containerEl);

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
    containerEl.classList.add('open');
    launcherBtn.style.transform = 'scale(0.92)';
    tooltipEl.classList.remove('visible');
    try {
      iframeEl.contentWindow?.postMessage({ type: 'GPUC_WIDGET_SET_OPEN', isOpen: true }, '*');
    } catch (e) {}
  }

  function closeChat() {
    isOpen = false;
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

  // Listen to postMessages from chatbot iframe (close, minimize, maximize)
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'GPUC_CHAT_CLOSE' || event.data.type === 'GPUC_CHAT_MINIMIZE') {
      closeChat();
    } else if (event.data.type === 'GPUC_CHAT_MAXIMIZE') {
      isMaximized = !isMaximized;
      if (isMaximized) {
        containerEl.classList.add('maximized');
      } else {
        containerEl.classList.remove('maximized');
      }
    }
  });

  // Global API
  window.GPUCChatbot = {
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
  };
})();

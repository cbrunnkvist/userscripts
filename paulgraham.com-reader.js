// ==UserScript==
// @name         Paul Graham Reader - Founder Mode Edition
// @namespace    http://tampermonkey.net/
// @version      2026.22
// @description  Doing things that don't scale: fixing PG's HTML tables one cell at a time
// @author       Conny Brunnkvist <cbrunnkvist@gmail.com>
// @license      MIT
// @match        https://www.paulgraham.com/*.html
// @grant        GM_addStyle
// ==/UserScript==

/* jshint esversion: 6 */

(function () {
  'use strict';

  GM_addStyle(`
        /* The Floating Button */
        #reader-toggle {
            position: fixed; bottom: 30px; right: 30px; z-index: 10000;
            padding: 14px 24px; background: #ff6600; color: white;
            border: none; border-radius: 50px; cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15); font-weight: 600; font-size: 15px;
            transition: transform 0.2s ease;
        }
        #reader-toggle:hover { transform: scale(1.05); }

        /* The "Desk" */
        .reader-active-body {
            background-color: #f4f5f7 !important;
            margin: 0 !important;
            padding: 40px 0 !important;
            display: block !important;
            min-height: 100vh !important;
        }

        /* The "Paper" */
        #pg-reader-container {
            width: 90% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            height: auto !important;
            background-color: #ffffff !important;
            padding: 50px 90px 70px 90px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
            border-radius: 8px !important;
            animation: fadeIn 0.4s ease;
            box-sizing: border-box !important;
            overflow: hidden !important;
        }

        /* --- STRETCHED ORIGINAL WATERMARK --- */
        #pg-image-watermark {
            width: 100% !important;
            height: auto !important;
            margin: -20px 0 35px 0 !important;
            display: block !important;

            /* Make image unselectable */
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            pointer-events: none !important;
        }

        /* --- AUTHENTIC VINTAGE TITLE STYLING --- */
        #pg-reader-container h1 {
            font-family: Verdana, Geneva, sans-serif !important;
            font-variant: small-caps !important;
            font-size: 42px !important;
            line-height: 1.25 !important;
            font-weight: normal !important;
            color: #822b28 !important;
            margin: 0 0 15px 0 !important;
            letter-spacing: 1px !important;
        }

        /* --- TYPOGRAPHY & SPACING --- */
        #pg-reader-content {
            font-family: "Charter", "Bitstream Charter", "Georgia", serif !important;
            color: #222 !important;
            height: auto !important;
        }

        #pg-reader-content font,
        #pg-reader-content span,
        #pg-reader-content {
            font-family: inherit !important;
            font-size: 22px !important;
            line-height: 1.8 !important;
        }

        /* Standardized Paragraph Spacing */
        #pg-reader-content p {
            margin: 0 0 1.4em 0 !important;
        }

        #pg-reader-content table {
            width: 582px !important;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
            #pg-reader-container { padding: 40px 30px !important; width: 95% !important; }
            #pg-reader-container h1 { font-size: 32px !important; }
            #pg-reader-content font, #pg-reader-content { font-size: 19px !important; }
            #pg-image-watermark { margin-bottom: 25px !important; }
        }
    `);

  const btn = document.createElement('button');
  btn.id = 'reader-toggle';
  btn.innerText = '🎨 Hack & Paint';
  document.body.appendChild(btn);

  const toggleReaderMode = () => {
    if (!document.getElementById('pg-reader-container')) {
      const cells = document.querySelectorAll('td');
      const essayCell = Array.from(cells).reduce((prev, current) =>
        (prev.innerText.length > current.innerText.length) ? prev : current
      );

      const titleText = document.title || 'Paul Graham Essay';
      let bodyHTML = essayCell.innerHTML;

      // --- TARGETED DOM CLEANUP ---
      // Strip the legacy title images AND the specific <br><br> gap that follows them
      bodyHTML = bodyHTML.replace(/<img[^>]*src="[^"]*(bel-|write-simply)[^"]*"[^>]*>\s*(<br\s*\/?>\s*){0,2}/gi, '');
      bodyHTML = bodyHTML.replace(/<img[^>]*alt="Write Simply"[^>]*>\s*(<br\s*\/?>\s*){0,2}/gi, '');

      // Catch any remaining standalone <br> tags hovering at the very top of the content
      bodyHTML = bodyHTML.replace(/^(?:\s*<br\s*\/?>\s*)+/i, '');

      document.body.innerHTML = '';
      document.body.className = 'reader-active-body';

      const container = document.createElement('div');
      container.id = 'pg-reader-container';

      container.innerHTML = `
                <img id="pg-image-watermark" src="https://s.turbifycdn.com/aah/paulgraham/bel-8.gif" alt="">
                <h1>${titleText}</h1>
                <div id="pg-reader-content">${bodyHTML}</div>
            `;

      document.body.appendChild(container);
      document.body.appendChild(btn);
      btn.innerText = '🕰️ Return to 1998';
    }
    else {
      location.reload();
    }
  };

  // Click event
  btn.onclick = toggleReaderMode;

  // Keyboard shortcut event ('r' or 'R')
  document.addEventListener('keydown', (e) => {
    // Ignore the input if any modifier key is currently pressed
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
      return;
    }

    if (e.key === 'r' || e.key === 'R') {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        toggleReaderMode();
      }
    }
  });

})();

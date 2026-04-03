// ==UserScript==
// @name         Metric display mode for NASA Artemis II "AROW"
// @namespace    https://ninzin.net/
// @version      2026.1
// @description  Turns "mi" and "MPH" into "km" and "km/h". Well, at least in the "accessibility" panel at the bottom of the canvas...
// @author       Conny Brunnkvist <cbrunnkvist@gmail.com>
// @license      MIT
// @match        https://www.nasa.gov/missions/artemis-ii/arow/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nasa.gov
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /**
     * Format an integer with a narrow no-break space (U+202F) as the
     * thousands separator, per ISO 80000-1 / SI-BIPM recommendations.
     * e.g. 111541 → "111 541"
     */
    function siFormat(n) {
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    }

    function milesToKilometers(miStr) {
        const MI_TO_KM_FACTOR = 1.60934;
        return parseFloat(miStr) * MI_TO_KM_FACTOR;
    }

    /**
     * Apply metric conversions to a raw text string.
     *
     * Handles patterns like:
     *   "Distance to Earth: 69307 mi."
     *   "Distance to the Moon: 182980 mi " (space or other word boundary)
     *   "Velocity: 5015 mph,"  (trailing punctuation varies)
     */
    function convertToMetric(text) {
        // this regexp is probably overkill because AFAICS we never need to match decimal points inside numbers
        return text.replace(
            /(\d[\d,]*(?:\.\d+)?)\s*(mi|mph)\b/gi,
            function (match, number, unit) {
                const clean = number.replace(/,/g, '');
                const lowerUnit = unit.toLowerCase();
                const unitMapping = {
                    'mi': 'km',
                    'mph': 'km/h'
                };
                return siFormat(milesToKilometers(clean)) + ' ' + unitMapping[lowerUnit];
            }
        );
    }

    function processNode(panel) {
        const original = panel.textContent;
        if (!/\b(?:mi|mph)\b/i.test(original)) return;
        const converted = convertToMetric(original);
        if (converted !== original) panel.textContent = converted;
    }

    let isProcessing = false;

    function safeProcess(panel) {
        if (isProcessing) return;
        isProcessing = true;
        try {
            processNode(panel);
        } finally {
            Promise.resolve().then(() => { isProcessing = false; });
        }
    }

    function attachObserver(panel) {
        safeProcess(panel);
        const observer = new MutationObserver(function () {
            if (isProcessing) return;
            safeProcess(panel);
        });
        observer.observe(panel, { subtree: true, childList: true, characterData: true });
    }

    function waitForPanel() {
        const panel = document.getElementById('AccessibilityOutput');
        if (panel) { attachObserver(panel); return; }
        const bodyObserver = new MutationObserver(function () {
            const panel = document.getElementById('AccessibilityOutput');
            if (panel) { bodyObserver.disconnect(); attachObserver(panel); }
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (document.body) {
        waitForPanel();
    } else {
        document.addEventListener('DOMContentLoaded', waitForPanel);
    }

})();

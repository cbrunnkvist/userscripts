// ==UserScript==
// @name         Metric display mode for NASA Artemis II "AROW"
// @namespace    https://ninzin.net/
// @version      2026-04-03
// @description  Turns "mi" and "MPH" into "km" and "km/h". Well, at least in the "accessibility" panel at the bottom of the canvas...
// @author       Conny Brunnkvist <cbrunnkvist@gmail.com>
// @match        https://www.nasa.gov/missions/artemis-ii/arow/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nasa.gov
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const MI_TO_KM = 1.60934;

    /**
     * Format an integer with a narrow no-break space (U+202F) as the
     * thousands separator, per ISO 80000-1 / SI-BIPM recommendations.
     * e.g. 111541 → "111 541"
     */
    function siFormat(n) {
        return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    }

    /** Convert miles → km, SI-formatted. */
    function miToKm(miStr) {
        return siFormat(parseFloat(miStr) * MI_TO_KM);
    }

    /** Convert mph → km/h, SI-formatted. */
    function mphToKmh(mphStr) {
        return siFormat(parseFloat(mphStr) * MI_TO_KM);
    }

    /**
     * Apply metric conversions to a raw text string.
     *
     * Handles patterns like:
     *   "Distance to Earth: 69307 mi."
     *   "Distance to the Moon: 182980 mi."
     *   "Velocity: 5015 mph,"
     *   "Velocity: 5015 mph."  (trailing punctuation varies)
     *
     * Replacements are done in a single .replace() pass with a combined
     * regex so we never touch the same substring twice.
     */
    function convertToMetric(text) {
        // Match integers or decimals followed by " mi" or " mph" (case-insensitive),
        // optionally trailed by punctuation we want to preserve.
        return text.replace(
            /(\d[\d,]*(?:\.\d+)?)\s*(mi|mph)\b/gi,
            function (match, number, unit, offset, string) {
                // Strip any thousands-commas before converting
                const clean = number.replace(/,/g, '');
                const lowerUnit = unit.toLowerCase();

                if (lowerUnit === 'mi') {
                    return miToKm(clean) + ' km';
                } else if (lowerUnit === 'mph') {
                    return mphToKmh(clean) + ' km/h';
                }

                // Fallback – should never hit, but be safe
                return match;
            }
        );
    }

    function processNode(panel) {
        const originalText = panel.textContent;
        if (!/\b(?:mi|mph)\b/i.test(originalText)) return;
        const convertedText = convertToMetric(originalText);
        if (convertedText !== originalText) panel.textContent = convertedText;
    }

    let isProcessing = false;

    // It looks like the panel update at a rate of about four times per second,
    // so we need to debounce a bit in order to avoid flickering the UI.
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

// ==UserScript==
// @name         Colorize
// @description  Impose custom colors scheme on webpages
// @author       Trumpeter
// @match        *://*/*
// ==/UserScript==

(function () {
    'use strict';

    const reverseMap = {
        "lightsteelblue": ['#f8f7f6'],
        "lightgrey": ['#fcfcfc']
    };

    const colorMap = Object.keys(reverseMap).reduce((acc, color) => {
        reverseMap[color].forEach(value => {
            acc[value] = color;
        });
        return acc;
    }, {})

    // Function to normalize color to rgba format for comparison
    function normalizeColor(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    }

    // Function to replace colors in a string (e.g., for gradients)
    function replaceColorInString(str, oldNorm, newColor) {
        const colorRegex = /(rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*[\d.]+\s*(?:deg)?\s*,\s*[\d.]+\s*%\s*,\s*[\d.]+\s*%\s*\)|hsla\(\s*[\d.]+\s*(?:deg)?\s*,\s*[\d.]+\s*%\s*,\s*[\d.]+\s*%\s*,\s*[\d.]+\s*\)|#[0-9a-fA-F]{3,8})/gi;
        return str.replace(colorRegex, (match) => {
            if (normalizeColor(match) === oldNorm) {
                return newColor;
            }
            return match;
        });
    }

    const colorizeElement = (element) => {
        const computedStyle = window.getComputedStyle(element);

        for (const [oldColor, newColor] of Object.entries(colorMap)) {
            const normalizedOldColor = normalizeColor(oldColor);

            // Text color
            if (normalizeColor(computedStyle.color) === normalizedOldColor) {
                element.style.setProperty('color', newColor, 'important');
            }

            // Background color
            if (normalizeColor(computedStyle.backgroundColor) === normalizedOldColor) {
                element.style.setProperty('background-color', newColor, 'important');
            }

            // Border colors (check each side)
            const borderProps = ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
            borderProps.forEach(prop => {
                if (normalizeColor(computedStyle[prop]) === normalizedOldColor) {
                    element.style.setProperty(prop.replace('Color', '-color'), newColor, 'important');
                }
            });

            // Background image (e.g., gradients)
            const bgImage = computedStyle.backgroundImage;
            if (bgImage !== 'none' && bgImage.includes('gradient')) {
                const newBgImage = replaceColorInString(bgImage, normalizedOldColor, newColor);
                if (newBgImage !== bgImage) {
                    element.style.setProperty('background-image', newBgImage, 'important');
                }
            }

            // SVG fill and stroke (if applicable)
            if (computedStyle.fill && normalizeColor(computedStyle.fill) === normalizedOldColor) {
                element.style.setProperty('fill', newColor, 'important');
            }
            if (computedStyle.stroke && normalizeColor(computedStyle.stroke) === normalizedOldColor) {
                element.style.setProperty('stroke', newColor, 'important');
            }
        }
    }

    // Rep
    const processAllElements = () => {
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
            colorizeElement(element);
        }
    }

    const processElementAndChildren = (element) => {
        if (element.nodeType === Node.ELEMENT_NODE) {
            colorizeElement(element);
        }
        // Recursion
        element.querySelectorAll('*').forEach(child => {
            colorizeElement(child);
        });
    }

    // Observer for dynamic changes
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        processElementAndChildren(node);
                    }
                }
            } else if (mutation.type === 'attributes') {
                if (mutation.target.nodeType === Node.ELEMENT_NODE) {
                    colorizeElement(mutation.target);
                }
            }
        }
    });

    // Event listeners
    const startObserver = () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    window.addEventListener('load', () => {
        processAllElements();
        startObserver();
    });

    // Interval processing
    // setInterval(processAllElements, 10000);
})();
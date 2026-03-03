# Info Panel Formatting Fix Spec

## Problem

The "Scenario" and "Given" boxes in the info panel display broken formatting for AP Stats Topic 5.8 (and likely 5.5–5.7 as well). Two symptoms:

1. **No spaces in Scenario text** — Text like `"Test scores are compared between two large high schools..."` renders as `"Testscoresarecomparedbetweentwolargehighschools..."` with all spaces removed.

2. **Pipe characters render literally in Given text** — Text like `"mu1 = 4, sigma1 = 0.5, n1 = 6 | mu2 = 3, sigma2 = 0.4, n2 = 6"` shows the `|` characters as literal text instead of being converted to line breaks.

3. **Scenario box overflows** — The rendered content breaks out of its column boundary, overlapping the right-pane input area.

## Root Cause

**File:** `platform/platform.js`, method `formatMathExpression()` (lines 846–894)

The method has a math-detection heuristic that wraps entire text blocks in `$...$` KaTeX delimiters when the text contains `=` signs:

```javascript
// Line 889 — this regex matches ANY text containing "="
if (/^[^$]*[=]/.test(text) || /^-?\d*[a-zA-Z]/.test(text)) {
  return `$${text}$`;  // Wraps entire paragraph as a math expression!
}
```

**What happens:**
1. Generator produces `scenarioText` like: `"Test scores are compared... Group 1 (School A): mu1 = 72, sigma1 = 8, n1 = 40..."`
2. This text has no `$` delimiters, so the method enters the auto-detection branch (line 858+)
3. The text contains `=` (from `mu1 = 72`), so the regex on line 889 matches
4. The **entire paragraph** gets wrapped in `$...$` → `$Test scores are compared...$`
5. KaTeX renders this as a single math expression, stripping all spaces (LaTeX treats spaces as insignificant in math mode)
6. The resulting KaTeX output is one unbroken horizontal block that overflows the container

**Secondary issue:** The `|` pipe separator in `givenText` is never converted to `<br>`. Even if the KaTeX wrapping bug is fixed, pipes will still show as literal characters.

## Fix

### Change 1: Exempt long text from math auto-wrapping

In `formatMathExpression()`, add an early return for text that's clearly prose (long, multi-word) rather than a standalone math expression. The auto-wrapping logic (lines 858–893) was designed for short field values like `"2x^2 + 3x - 1"`, not multi-sentence paragraphs.

**Replace lines 858–893** with:

```javascript
// Auto-wrapping is only for SHORT, standalone math expressions (e.g., "2x^2 + 3x - 1")
// Long text (paragraphs, scenarios) should never be wrapped in $...$
// Threshold: if text has multiple words and is longer than ~60 chars, treat as prose
const wordCount = text.trim().split(/\s+/).length;
if (wordCount > 8 || text.length > 80) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\s*\|\s*/g, '<br>')   // pipe separators → line breaks
    .replace(/\n/g, '<br>');
}

// For short text without $ delimiters, check if it needs auto-wrapping
// Patterns that indicate math content
const mathPatterns = [
  /[a-zA-Z]\^[\d{}\w]+/,   // x^2, x^{10}
  /\d+x\^?\d*/,            // 2x, 3x^2
  /[+-]\s*\d*x/,           // + 2x, - x
  /f\(x\)\s*=/,            // f(x) =
  /[√∛]/,                  // square/cube root symbols
  /\^{/                    // explicit exponent braces
];

// Check if text contains math-like content
const hasMath = mathPatterns.some(pattern => pattern.test(text));

if (!hasMath) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\s*\|\s*/g, '<br>')
    .replace(/\n/g, '<br>');
}

// If the text starts with a label like "Expression: " or "f(x) = ", wrap just the math part
const labelMatch = text.match(/^(Expression:\s*|Function:\s*|Polynomial:\s*|Term:\s*|f\(x\)\s*=\s*)/i);

if (labelMatch) {
  const label = labelMatch[1];
  const mathPart = text.slice(label.length);
  return `${label}$${mathPart}$`;
}

// Otherwise wrap the whole thing if it looks like an equation
if (/^[^$]*[=]/.test(text) || /^-?\d*[a-zA-Z]/.test(text)) {
  return `$${text}$`;
}

return text;
```

**Key changes:**
- Lines with `wordCount > 8 || text.length > 80`: early return treating it as prose, not math
- All prose code paths now include `.replace(/\s*\|\s*/g, '<br>')` to convert pipe separators to line breaks
- The existing math auto-wrapping logic (for short expressions) is preserved unchanged

### Change 2: Add overflow protection CSS

In `platform/app.html`, add `overflow-hidden` and `break-words` to the info panel container (line 331):

**Before:**
```html
<div id="info-panel" class="flex flex-wrap gap-2 text-sm"></div>
```

**After:**
```html
<div id="info-panel" class="flex flex-wrap gap-2 text-sm overflow-hidden break-words"></div>
```

Also add overflow protection to the blue box divs that `renderInfoPanel()` generates. In `platform/platform.js`, update the `renderInfoPanel()` method's long-text template (line 812):

**Before (line 812):**
```html
<div class="text-gray-800 text-sm leading-relaxed">${formattedValue}</div>
```

**After:**
```html
<div class="text-gray-800 text-sm leading-relaxed overflow-x-auto break-words">${formattedValue}</div>
```

## Files to Modify

1. **`platform/platform.js`** — `formatMathExpression()` method (lines 858–893): add prose early-return and pipe-to-br conversion
2. **`platform/platform.js`** — `renderInfoPanel()` method (line 812): add overflow CSS classes
3. **`platform/app.html`** — info-panel div (line 331): add overflow CSS classes

## Testing

After the fix, verify:

1. **Topic 5.8 Scenario box**: Text should display with proper spacing, line breaks between Group 1 / Group 2 parameters, and the question on its own line
2. **Topic 5.8 Given box**: Pipe-separated values should display on separate lines (e.g., `mu1 = 4, sigma1 = 0.5, n1 = 6` on one line, `mu2 = 3, sigma2 = 0.4, n2 = 6` on the next)
3. **Scenario box width**: Should stay within the left pane (lg:w-1/2) without overlapping the right pane
4. **Algebra 2 cartridges**: Short math expressions like `2x^2 + 3x - 1` should still render properly with KaTeX (the auto-wrapping path is preserved for short text)
5. **Topics 5.5–5.7**: These also use pipe separators in `givenText` — verify they now show line breaks too

## Regression Risk

Low. The change only affects the prose detection threshold in `formatMathExpression()`. Short math expressions (< 8 words and < 80 chars) follow the same code path as before. The pipe-to-br conversion only activates in prose mode, and `|` is not used in any KaTeX math expressions in the codebase.

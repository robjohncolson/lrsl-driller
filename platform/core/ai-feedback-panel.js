/**
 * AI Feedback Panel - Shows AI grading results to students
 * v2.0.1: Always visible when AI grading runs
 *
 * Displays:
 * - Which AI provider/model was used
 * - The AI's score (E/P/I)
 * - The AI's feedback text
 * - Whether AI agreed or disagreed with keywords
 */

/**
 * Create the AI feedback panel DOM element
 * @returns {HTMLElement} The panel element
 */
export function createAIFeedbackPanel() {
  const panel = document.createElement('div');
  panel.id = 'ai-feedback-panel';
  panel.className = 'ai-feedback-panel';

  // Inline styles for the panel (matches existing app dark theme)
  panel.style.cssText = `
    display: none;
    margin-top: 12px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
    border: 1px solid #333;
    border-radius: 8px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
  `;

  panel.innerHTML = `
    <div class="ai-header" style="
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #333;
    ">
      <span class="ai-icon" style="font-size: 16px;">&#129302;</span>
      <span class="ai-title" style="color: #0ff; font-weight: bold;">AI REVIEW</span>
      <span class="ai-model" style="color: #888; font-size: 11px; margin-left: auto;"></span>
    </div>
    <div class="ai-score-row" style="
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    ">
      <span class="ai-score-label" style="color: #888;">AI Score:</span>
      <span class="ai-score" style="font-weight: bold; font-size: 15px;"></span>
      <span class="ai-agreement" style="font-size: 11px; margin-left: auto;"></span>
    </div>
    <div class="ai-feedback" style="
      color: #ccc;
      line-height: 1.5;
      padding: 8px;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
      white-space: pre-wrap;
    "></div>
  `;

  return panel;
}

/**
 * Update the AI feedback panel with grading results
 * @param {HTMLElement} panel - The panel element
 * @param {Object} aiResponse - The AI response object with provider, model, results
 * @param {string} keywordScore - The keyword grading score (E/P/I) for comparison
 * @param {Object} options - Additional options
 * @param {boolean} options.isAppeal - Whether this is an appeal result
 */
export function updateAIFeedbackPanel(panel, aiResponse, keywordScore, options = {}) {
  if (!panel) return;

  if (!aiResponse) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';

  // Model info with provider icon
  const provider = aiResponse._provider || aiResponse.provider;
  const model = aiResponse._model || aiResponse.model;

  let modelText = '';
  if (provider === 'groq') {
    modelText = `&#9889; Groq ${model || 'Llama-3.3-70B'}`;
  } else if (provider === 'gemini') {
    modelText = `&#128312; Gemini ${model || '2.0 Flash'}`;
  } else if (provider) {
    modelText = `&#129302; ${provider}`;
  } else {
    modelText = '&#129302; AI';
  }
  panel.querySelector('.ai-model').innerHTML = modelText;

  // Update title if this is an appeal
  const titleEl = panel.querySelector('.ai-title');
  if (options.isAppeal) {
    titleEl.innerHTML = '&#129302; AI APPEAL REVIEW';
    titleEl.style.color = '#f0f';
  } else {
    titleEl.innerHTML = 'AI REVIEW';
    titleEl.style.color = '#0ff';
  }

  // Get the AI score for the primary field
  // Results may be at aiResponse.results or directly on aiResponse
  const results = aiResponse.results || aiResponse;

  // Find the first field that has a score
  let aiScore = null;
  let aiFeedback = 'No feedback provided';

  for (const [key, value] of Object.entries(results)) {
    // Skip metadata fields
    if (key.startsWith('_') || key === 'composite' || key === 'provider' || key === 'model' || key === 'timestamp') {
      continue;
    }

    if (value && typeof value === 'object' && 'score' in value) {
      aiScore = value.score;
      aiFeedback = value.feedback || 'No feedback provided';
      break;
    }
  }

  // Handle case where AI gave a direct response (not field-keyed)
  if (!aiScore && results.score) {
    aiScore = results.score;
    aiFeedback = results.feedback || 'No feedback provided';
  }

  // Score display with color coding
  const scoreEl = panel.querySelector('.ai-score');
  scoreEl.textContent = aiScore || '?';

  if (aiScore === 'E') {
    scoreEl.style.color = '#0f0';
  } else if (aiScore === 'P') {
    scoreEl.style.color = '#ff0';
  } else {
    scoreEl.style.color = '#f44';
  }

  // Agreement indicator
  const agreementEl = panel.querySelector('.ai-agreement');
  if (keywordScore && aiScore) {
    const agreed = aiScore === keywordScore;
    if (agreed) {
      agreementEl.innerHTML = '&#10003; Agrees with keywords';
      agreementEl.style.color = '#0f0';
    } else {
      agreementEl.innerHTML = `&#9889; Keywords said ${keywordScore}`;
      agreementEl.style.color = '#ff0';
    }
  } else {
    agreementEl.textContent = '';
  }

  // Feedback text
  panel.querySelector('.ai-feedback').textContent = aiFeedback;
}

/**
 * Show error state in the AI feedback panel
 * @param {HTMLElement} panel - The panel element
 * @param {string} errorMessage - The error message to display
 */
export function showAIFeedbackError(panel, errorMessage) {
  if (!panel) return;

  panel.style.display = 'block';

  panel.querySelector('.ai-model').innerHTML = '&#10060; AI Unavailable';
  panel.querySelector('.ai-model').style.color = '#f44';

  const titleEl = panel.querySelector('.ai-title');
  titleEl.innerHTML = 'AI REVIEW';
  titleEl.style.color = '#888';

  panel.querySelector('.ai-score').textContent = '-';
  panel.querySelector('.ai-score').style.color = '#888';

  panel.querySelector('.ai-agreement').textContent = '';

  panel.querySelector('.ai-feedback').textContent =
    errorMessage || 'AI grading failed. Using keyword grading only.';
}

/**
 * Hide the AI feedback panel
 * @param {HTMLElement} panel - The panel element
 */
export function hideAIFeedbackPanel(panel) {
  if (panel) {
    panel.style.display = 'none';
  }
}

export default {
  createAIFeedbackPanel,
  updateAIFeedbackPanel,
  showAIFeedbackError,
  hideAIFeedbackPanel
};

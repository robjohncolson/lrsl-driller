/**
 * Prompt Building Utilities
 *
 * Functions for building AI grading prompts from cartridge templates.
 * Extracted for testability and reuse.
 */

/**
 * Build a prompt from a cartridge-specific template
 * Replaces {{variables}} with values from scenario and answers
 *
 * Supported placeholders:
 * - {{problemContext}} - Auto-built from scenario fields
 * - {{studentResponse}} - All answers formatted as "field: value"
 * - {{expectedAnswer}} - From scenario.gradingPairs
 * - {{STUDENT_ANSWER}} - Alias for scenario.studentAnswer (SCREAMING_SNAKE_CASE)
 * - {{studentAnswer}} - From scenario.studentAnswer (camelCase)
 * - {{fieldIdAnswer}} - Individual answer values (e.g., {{termAnswer}})
 * - {{anyScenarioKey}} - Any key from the scenario object
 * - {{#if mode}}...{{/if}} - Conditional sections
 *
 * @param {string} template - The prompt template with {{placeholders}}
 * @param {Object} scenario - Context including topic, mode, studentAnswer, etc.
 * @param {Object} answers - Student answers keyed by fieldId
 * @returns {string} The interpolated prompt
 */
function buildCartridgePrompt(template, scenario, answers) {
  let prompt = template;

  // Build problem context from scenario
  const contextParts = [];
  if (scenario.topic) contextParts.push(`Topic: ${scenario.topic}`);
  if (scenario.mode) contextParts.push(`Mode: ${scenario.mode}`);
  if (scenario.givenValues) contextParts.push(`Given values: ${scenario.givenValues}`);
  if (scenario.r) contextParts.push(`r = ${scenario.r}`);
  if (scenario.slope) contextParts.push(`Slope = ${scenario.slope}`);
  if (scenario.intercept) contextParts.push(`Intercept = ${scenario.intercept}`);
  const problemContext = contextParts.join('\n');

  // Build student response from answers
  const studentResponse = Object.entries(answers)
    .map(([field, value]) => `${field}: ${value}`)
    .join('\n');

  // Build expected answer from gradingPairs if available
  const expectedAnswer = scenario.gradingPairs || 'See grading pairs in context';

  // Replace special template variables
  prompt = prompt.replace(/\{\{problemContext\}\}/g, problemContext);
  prompt = prompt.replace(/\{\{studentResponse\}\}/g, studentResponse);
  prompt = prompt.replace(/\{\{expectedAnswer\}\}/g, expectedAnswer);

  // Handle STUDENT_ANSWER as an alias for studentAnswer (some templates use SCREAMING_SNAKE_CASE)
  if (scenario.studentAnswer) {
    prompt = prompt.replace(/\{\{STUDENT_ANSWER\}\}/g, String(scenario.studentAnswer));
  }

  // Replace scenario variables
  for (const [key, value] of Object.entries(scenario)) {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }
  }

  // Replace answer variables (e.g., {{predictedAnswer}}, {{residualAnswer}})
  for (const [key, value] of Object.entries(answers)) {
    const answerKey = `${key}Answer`;
    const regex = new RegExp(`\\{\\{${answerKey}\\}\\}`, 'g');
    prompt = prompt.replace(regex, String(value || ''));
  }

  // Handle conditional sections {{#if mode}}...{{/if}}
  // For residuals: calculateMode, interpretMode, analyzeMode
  const mode = scenario.mode || '';
  const modeFlags = {
    calculateMode: mode === 'calculate',
    interpretMode: mode === 'interpret',
    analyzeMode: mode === 'analyze'
  };

  for (const [flag, isActive] of Object.entries(modeFlags)) {
    const ifRegex = new RegExp(`\\{\\{#if ${flag}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'g');
    if (isActive) {
      // Keep the content, remove the markers
      prompt = prompt.replace(ifRegex, '$1');
    } else {
      // Remove the entire block
      prompt = prompt.replace(ifRegex, '');
    }
  }

  // Handle other conditional variables like {{#if residualPositive}}
  const residualPositive = parseFloat(scenario.residual) > 0;
  prompt = prompt.replace(/\{\{#if residualPositive\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    residualPositive ? '$1' : '$2');

  // Compute derived values
  const moreOrLess = residualPositive ? 'more' : 'less';
  prompt = prompt.replace(/\{\{moreOrLess\}\}/g, moreOrLess);

  // Clean up any remaining unmatched {{...}} that weren't replaced
  prompt = prompt.replace(/\{\{[^}]+\}\}/g, '');

  return prompt.trim();
}

module.exports = {
  buildCartridgePrompt
};

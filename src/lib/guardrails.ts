const irrelevantPatterns = [
  /\bamethyst\b/i,
  /\bjoke\b/i,
  /\bweather\b/i,
  /\bsports score\b/i,
  /\bcelebrity\b/i,
  /\brecipe\b/i,
];

const founderPatterns = [
  /\bidea\b/i,
  /\bstartup\b/i,
  /\bfounder\b/i,
  /\bmarket\b/i,
  /\buser\b/i,
  /\bcustomer\b/i,
  /\broadmap\b/i,
  /\bskill\b/i,
  /\bvalidation\b/i,
  /\bdrop out\b/i,
  /\byc\b/i,
  /\bfunding\b/i,
  /\bstartup india\b/i,
  /\bdpiit\b/i,
  /\bmaarg\b/i,
];

export const redirectMessage =
  "Let's stay focused on your founder plan for now. I can help with your idea, skills, market, risks, roadmap, opportunities, or next step.";

export function isIrrelevantFounderQuestion(input: string) {
  const text = input.trim();
  if (!text) return false;
  if (founderPatterns.some((pattern) => pattern.test(text))) return false;
  return irrelevantPatterns.some((pattern) => pattern.test(text));
}

export function sanitizeAdvisorResponse(text: string) {
  return text
    .replace(/\b\d{1,3}% likely to succeed\b/gi, "not possible to predict")
    .replace(/\bYC would fund\b/gi, "no one can predict whether YC would fund")
    .replace(/\bshould drop out\b/gi, "should not make a dropout decision from AI advice");
}

const STOP = new Set("a an and are as at be been being but by did do does for from had has have he her hers him his i if in into is it its me my of on or our she so that the their them they this to was we were what when where which who will with you your".split(" "));
const STANCE = new Set("awful bad biased corrupt disappointing dreadful late poor rushed short terrible unfair wrong bottling bottled confident confidence slow weak".split(" "));
const BOILERPLATE = new Set("focus performance improve improvement think believe could better next time constructive respectfully".split(" "));

function words(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}'-]+/gu, " ").split(/\s+/).filter((word) => word && !STOP.has(word));
}

export function evaluateRewriteFidelity(original, rewrite = {}) {
  const suggestion = String(rewrite?.suggestion || "").trim();
  if (!suggestion) return {
    status:"not_applicable", suitable:false, score:null, sourceRecall:null,
    stancePreserved:null, inventedContentRisk:null,
    explanation:"No rewrite was offered, so fidelity is not scored.",
  };
  const sourceTokens = new Set(words(rewrite.sourceBasis || rewrite.preservedPoint || original));
  const suggestionTokens = new Set(words(suggestion));
  const retained = [...sourceTokens].filter((word) => suggestionTokens.has(word));
  const sourceRecall = sourceTokens.size ? retained.length / sourceTokens.size : 1;
  const sourceStance = [...sourceTokens].filter((word) => STANCE.has(word));
  const stancePreserved = sourceStance.length === 0 || sourceStance.some((word) => suggestionTokens.has(word));
  const invented = [...suggestionTokens].filter((word) => !sourceTokens.has(word) && !BOILERPLATE.has(word));
  const inventedContentRisk = invented.length > Math.max(3, Math.ceil(sourceTokens.size * .65));
  const score = Math.max(0, Math.min(100, Math.round(sourceRecall * 70 + (stancePreserved ? 20 : 0) + (inventedContentRisk ? 0 : 10))));
  const suitable = score >= 70 && stancePreserved && !inventedContentRisk;
  return {
    status:suitable ? "source_faithful" : "needs_author_review", suitable, score,
    sourceRecall:Math.round(sourceRecall * 100), stancePreserved, inventedContentRisk,
    retainedTerms:retained.slice(0,8),
    explanation:suitable
      ? `The rewrite retains ${Math.round(sourceRecall * 100)}% of the recoverable source terms and keeps the original stance without adding a new claim.`
      : `The wording is safe, but fidelity is uncertain; the author should confirm it before publication.`,
  };
}

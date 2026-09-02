import { moderateContent } from "./moderation.js?v=4.24.1.0";
import { getCsrfToken } from "./serverPlatform.js?v=4.24.1.0";

const RANK = { clean:0, warning:1, review:2, block:3 };

function decide(text, context) {
  return String(text || "").trim() ? moderateContent(text, context) : {
    outcome:"clean", category:"no_text", reason:"No text was detected", analysis:null,
  };
}

function strongest(...decisions) {
  return decisions.reduce((best, item) => RANK[item?.outcome] > RANK[best?.outcome] ? item : best, decisions[0]);
}

export function combineMediaEvidence(evidence = {}, caption = "", context = {}) {
  const ocrText = String(evidence.ocr?.text || evidence.ocrText || "").trim();
  const ocrConfidence = Number(evidence.ocr?.confidence ?? evidence.ocrConfidence ?? 0);
  const observations = evidence.ocr?.observations || [];
  const captionDecision = decide(caption, context);
  const embeddedTextDecision = decide(ocrText, context);
  const regionDecisions = observations.map((item) => ({ text:String(item.text || ""), confidence:Number(item.confidence || 0), decision:decide(item.text, context) }));
  const strongestRegion = regionDecisions.length ? strongest(...regionDecisions.map((item) => item.decision)) : { outcome:"clean", category:"no_text", reason:"No separate text region was detected" };
  const combinedText = [caption, ocrText].filter((value) => String(value || "").trim()).join(" ");
  const fusedDecision = decide(combinedText, context);
  const visualSignals = evidence.visualClassifier?.safetySignals || [];
  const visualSignal = visualSignals.reduce((best, item) => RANK[item?.outcome] > RANK[best?.outcome] ? item : best, { outcome:"clean" });
  const visualDecision = visualSignal.outcome === "clean" ? { outcome:"clean", category:"visual_clear", reason:"No enforceable visual safety signal" } : {
    outcome:visualSignal.outcome, category:"visual_safety", reason:visualSignal.reason || `Visual classifier detected ${visualSignal.label || "a safety signal"}`,
  };
  const serverMediaDecision = RANK[evidence.serverMediaDecision?.outcome] != null ? {
    outcome:evidence.serverMediaDecision.outcome,
    category:"server_media_evidence",
    reason:evidence.serverMediaDecision.reason || "Server media policy decision",
  } : { outcome:"clean", category:"server_media_not_supplied", reason:"No separate server media decision supplied" };
  let decision = strongest(captionDecision, embeddedTextDecision, fusedDecision, strongestRegion, visualDecision, serverMediaDecision);
  const manipulationSignals = evidence.manipulationSignals || [];
  const lowConfidenceText = !!ocrText && ocrConfidence > 0 && ocrConfidence < 0.35;
  const ocrUnavailable = evidence.ocr?.ok === false;
  if ((manipulationSignals.length || lowConfidenceText || ocrUnavailable) && RANK[decision.outcome] < RANK.review) {
    decision = {
      outcome:"review",
      category:manipulationSignals.length ? "media_integrity" : ocrUnavailable ? "media_evidence_unavailable" : "uncertain_embedded_text",
      reason:manipulationSignals.length ? "Media integrity signals require enhanced moderation" : ocrUnavailable ? "Embedded-text evidence is unavailable, so the image cannot be declared safe" : "Embedded text could not be read with enough confidence",
      analysis:decision.analysis,
    };
  }
  const source = decision === serverMediaDecision ? "server media policy" : decision === visualDecision ? "visual classification" : decision === strongestRegion ? "an embedded text region" : decision === embeddedTextDecision ? "embedded text" : decision === captionDecision ? "caption" : "caption and embedded text together";
  const checks = ["file signature", "local OCR", "caption context", "combined text policy"];
  if (evidence.visualClassifier?.status === "active") checks.push("active on-device visual classification");
  if (evidence.visualClassifier?.status === "not_configured") checks.push("visual classifier not supplied by this fixture");
  if (evidence.manipulationDetector?.status === "not_configured") checks.push("forensic model unavailable in preview");
  return {
    outcome:decision.outcome,
    category:decision.category || "media_context",
    reason:decision.outcome === "clean" ? "Caption, readable embedded text and available visual evidence passed the safety policy" : `${decision.reason} in ${source}`,
    checks,
    ocr:{
      text:ocrText,
      confidence:ocrConfidence,
      engine:evidence.ocr?.engine || "unavailable",
      observations,
    },
    captionDecision:{ outcome:captionDecision.outcome, reason:captionDecision.reason },
    embeddedTextDecision:{ outcome:embeddedTextDecision.outcome, reason:embeddedTextDecision.reason },
    fusedDecision:{ outcome:fusedDecision.outcome, reason:fusedDecision.reason },
    regionDecisions:regionDecisions.map((item) => ({ text:item.text, confidence:item.confidence, outcome:item.decision.outcome, reason:item.decision.reason })),
    manipulationSignals,
    serverMediaDecision:evidence.serverMediaDecision || null,
    visualClassifier:evidence.visualClassifier || { status:"not_configured", reason:"No production visual classifier is connected" },
    manipulationDetector:evidence.manipulationDetector || { status:"not_configured", reason:"No production forensic model is connected" },
    privacy:evidence.privacy || "processed locally",
    sha256:evidence.sha256 || null,
    media:evidence.media || null,
    productionBoundary:evidence.visualClassifier?.status === "active"
      ? "On-device OCR and general visual classification are active. A dedicated identity-hate/symbol model, known-harm hashing and forensic manipulation model are still required for production."
      : "The upload was not declared visually safe because active visual classification evidence was unavailable.",
  };
}

export async function analyseUploadedMedia(file, caption = "", context = {}) {
  if (!file) return null;
  try {
    const response = await fetch("/api/media/analyze", {
      method:"POST",
      credentials:"same-origin",
      headers:{ "Content-Type":file.type || "application/octet-stream", "X-K1ND-CSRF":getCsrfToken() },
      body:file,
    });
    const evidence = await response.json();
    if (!response.ok || !evidence.ok) throw new Error(evidence.error || "Media analysis failed");
    return combineMediaEvidence(evidence, caption, context);
  } catch (error) {
    return {
      outcome:"review", category:"media_service_unavailable",
      reason:"Media evidence service is unavailable, so the post is held rather than guessed safe",
      checks:["fail-closed media route"], ocr:{ text:"", confidence:0, engine:"unavailable", observations:[] },
      error:String(error?.message || error),
      visualClassifier:{ status:"not_configured", reason:"No production visual classifier is connected" },
      productionBoundary:"The upload was not declared safe because its evidence could not be analysed.",
    };
  }
}

export async function analyseMediaUrl(url, caption = "", context = {}) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load the challenge image");
  const blob = await response.blob();
  return analyseUploadedMedia(new File([blob], "challenge.png", { type:blob.type || "image/png" }), caption, context);
}

export const MEDIA_EVIDENCE_TESTS = [
  { label:"Clean caption and clean OCR", caption:"That return was late.", ocrText:"Match point", confidence:.98, expect:"clean" },
  { label:"Clean image with no readable text", caption:"Great atmosphere tonight.", ocrText:"", confidence:0, expect:"clean" },
  { label:"Embedded direct insult", caption:"Thoughts?", ocrText:"You are an idiot.", confidence:.97, expect:"warning" },
  { label:"Embedded threat", caption:"See you later", ocrText:"I'm going to hurt you after the match.", confidence:.96, expect:"block" },
  { label:"Unsafe caption with clean embedded text", caption:"You are an idiot.", ocrText:"Match day", confidence:.94, expect:"warning" },
  { label:"Caption and image jointly form attack", caption:"That player", ocrText:"is useless.", confidence:.93, expect:"warning" },
  { label:"Counterspeech with quoted abuse", caption:"Safety reminder", ocrText:"Don’t call her an idiot.", confidence:.95, expect:"clean" },
  { label:"Reported abuse context", caption:"Evidence for my report", ocrText:"He called me an idiot after the match.", confidence:.92, expect:"clean" },
  { label:"Low-confidence embedded text", caption:"Match photo", ocrText:"unclear lettering", confidence:.22, expect:"review" },
  { label:"Media integrity signal", caption:"Match photo", ocrText:"", confidence:0, manipulationSignals:["composite boundary"], expect:"review" },
  { label:"Hard block overrides uncertain media", caption:"I'm going to hurt you after the match.", ocrText:"blurred", confidence:.12, expect:"block" },
  { label:"Educational vocabulary context", caption:"Education card", ocrText:"The word idiot is insulting.", confidence:.97, expect:"clean" },
  { label:"OCR unavailable fails closed", caption:"Match photo", ocrText:"", confidence:0, ocrOk:false, expect:"review" },
  { label:"Active visual classifier clean", caption:"Match court", ocrText:"", confidence:0, visualStatus:"active", serverMediaOutcome:"clean", expect:"clean" },
  { label:"Weapon concept requires review", caption:"Match photo", ocrText:"", confidence:0, visualStatus:"active", safetySignals:[{ label:"weapon", outcome:"review", reason:"possible weapon concept" }], serverMediaOutcome:"review", expect:"review" },
  { label:"Graphic violence concept blocks", caption:"Match photo", ocrText:"", confidence:0, visualStatus:"active", safetySignals:[{ label:"gore", outcome:"block", reason:"possible graphic-violence concept" }], serverMediaOutcome:"block", expect:"block" },
  { label:"Forged clean image verdict overridden", caption:"Match photo", ocrText:"", confidence:0, visualStatus:"active", serverMediaOutcome:"review", expect:"review" },
  { label:"Unavailable visual evidence fails closed", caption:"Match photo", ocrText:"", confidence:0, visualStatus:"unavailable", serverMediaOutcome:"review", expect:"review" },
  { label:"Server hard block beats clean caption", caption:"Great match", ocrText:"", confidence:0, visualStatus:"active", serverMediaOutcome:"block", expect:"block" },
  { label:"Region threat beats clean visual result", caption:"Photo", ocrText:"", confidence:0, observations:[{ text:"I'm going to hurt you after the match.", confidence:.97 }], visualStatus:"active", serverMediaOutcome:"block", expect:"block" },
];

export function runMediaEvidenceTests() {
  return MEDIA_EVIDENCE_TESTS.map((test) => {
    const result = combineMediaEvidence({
      ocr:{ text:test.ocrText, confidence:test.confidence, engine:"fixture", ...(test.ocrOk === false ? { ok:false } : { ok:true }) },
      ...(test.observations ? { ocr:{ text:test.ocrText, confidence:test.confidence, engine:"fixture", ok:true, observations:test.observations } } : {}),
      manipulationSignals:test.manipulationSignals || [],
      visualClassifier:{ status:test.visualStatus || "not_configured", safetySignals:test.safetySignals || [] },
      ...(test.serverMediaOutcome ? { serverMediaDecision:{ outcome:test.serverMediaOutcome, reason:"Fixture server media decision" } } : {}),
      manipulationDetector:{ status:"not_configured" },
    }, test.caption, test.context || {});
    return { ...test, result, pass:result.outcome === test.expect };
  });
}

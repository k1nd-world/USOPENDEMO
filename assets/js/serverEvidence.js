import { serverRequest } from "./serverPlatform.js?v=4.24.1.0";

async function request(path, options = {}) {
  return serverRequest(path, options);
}

export async function enforceOnServer({ userId, contentType, text, clientDecision, mediaSha256, photoKey, context }) {
  return request("/api/moderation/enforce", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ userId, contentType, text, clientDecision, mediaSha256:mediaSha256 || null, photoKey:photoKey || null, context:context || {} }),
  });
}

export async function commitPublicationOnServer({ userId, contentType, text, receiptId, signature, metadata }) {
  return request("/api/publications/commit", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ userId, contentType, text, receiptId, signature, metadata:metadata || {} }),
  });
}

export async function persistAppealOnServer(payload) {
  return request("/api/appeals", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}

export async function persistAdjudicationOnServer(payload) {
  return request("/api/appeals/adjudicate", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}

export async function getServerEvidenceSummary() {
  return request("/api/evidence/summary");
}

export async function getServerHealth() {
  return request("/api/health");
}

import { serverRequest } from "./serverPlatform.js?v=4.24.1.brand1";

export function getTournamentOperations() {
  return serverRequest("/api/tournament-operations/summary");
}

export function launchTournamentDemo() {
  return serverRequest("/api/tournament-operations/launch", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}",
  });
}

export function resetTournamentDemo() {
  return serverRequest("/api/tournament-operations/reset", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}",
  });
}

export function runTournamentPreflight() {
  return serverRequest("/api/tournament-operations/preflight", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}",
  });
}

export function updateTournamentIncident(payload) {
  return serverRequest("/api/tournament-operations/incident", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload),
  });
}

export function authorizeTournamentEscalation(payload) {
  return serverRequest("/api/tournament-operations/escalation-authorize", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload),
  });
}

export function updateTournamentAthletePhase(payload) {
  return serverRequest("/api/tournament-operations/athlete-phase", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload),
  });
}

export function getTournamentMatchReport(arenaId) {
  const params = new URLSearchParams({ arenaId });
  return serverRequest(`/api/tournament-operations/report?${params}`);
}

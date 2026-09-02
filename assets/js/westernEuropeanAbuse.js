// K1ND.world v4.9 — Western European targeted-abuse policy pack.
//
// These deterministic demo rules cover high-confidence person-directed labels,
// dismissive commands, sexualised family abuse and death wishes in six common
// US Open audience languages. They are deliberately target- and context-aware:
// ordinary vocabulary, sporting objects and dictionary/translation discussion
// are not treated as attacks merely because they share a token.

export const WESTERN_EUROPEAN_PACK_VERSION = "2026.08-west-eu-1";

export const WESTERN_EUROPEAN_ABUSE_RULES = [
  { id:"es-personal-labels", language:"Spanish", displayTerm:"idiota · imbécil · inútil · payaso", forms:"idiot(?:a|as)|imbecil(?:es)?|inutil(?:es)?|payas(?:o|a|os|as)", targets:"tu|usted|vos|eres|es|jugador|jugadora", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Spanish personal labels receive intervention when directed at a participant.", safeExample:"La palabra ‘idiota’ aparece en el diccionario." },
  { id:"es-dismissal", language:"Spanish", displayTerm:"vete a la mierda", forms:"vete\\s+a\\s+la\\s+mierda", targets:"tu|usted|vos", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"A vulgar Spanish command dismisses the addressed participant.", safeExample:"El artículo traduce la frase para un estudio." },
  { id:"es-family-abuse", language:"Spanish", displayTerm:"targeted sexualised family abuse", forms:"hij[oa]\\s+de\\s+put[ao]", targets:"tu|usted|vos|eres|jugador|jugadora", mode:"targeted_prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe sexualised family insult is blocked when used as a personal label.", safeExample:"El estudio analiza un insulto familiar sin dirigirlo a nadie." },
  { id:"es-death-wish", language:"Spanish", displayTerm:"ojalá te mueras", forms:"ojala\\s+(?:que\\s+)?te\\s+mueras", targets:"te|tu|usted", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The phrase wishes death on the addressed person.", safeExample:"La política cita la frase como ejemplo prohibido." },

  { id:"fr-personal-labels", language:"French", displayTerm:"idiot · imbécile · débile · minable", forms:"idiot(?:e|s|es)?|imbecile(?:s)?|debile(?:s)?|minable(?:s)?", targets:"tu|vous|toi|es|etes|joueur|joueuse", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"French personal labels receive intervention when aimed at somebody.", safeExample:"Le mot ‘idiot’ est étudié dans le dictionnaire." },
  { id:"fr-dismissal", language:"French", displayTerm:"va te faire foutre", forms:"va\\s+te\\s+faire\\s+foutre", targets:"tu|toi|vous", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"A vulgar French dismissal is a directed command rather than sporting criticism.", safeExample:"Le linguiste traduit cette expression." },
  { id:"fr-family-abuse", language:"French", displayTerm:"targeted sexualised family abuse", forms:"fils\\s+de\\s+pute", targets:"tu|vous|toi|es|etes|joueur|joueuse", mode:"targeted_prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe sexualised family insult is blocked when used against a person.", safeExample:"La recherche examine une insulte familiale citée." },
  { id:"fr-death-wish", language:"French", displayTerm:"va crever", forms:"va\\s+crever|crever\\s+toi", targets:"tu|toi|vous", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The phrase tells the addressed person to die.", safeExample:"La règle cite l'expression comme exemple interdit." },

  { id:"de-personal-labels", language:"German", displayTerm:"Idiot · Trottel · Versager · Arschloch", forms:"idiot(?:en)?|trottel|versager|arschloch", targets:"du|sie|ihr|bist|seid|spieler|spielerin", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"German fool, failure and strong personal labels are moderated when targeted.", safeExample:"Das Wörterbuch erklärt das Wort ‘Idiot’." },
  { id:"de-dismissal", language:"German", displayTerm:"verpiss dich", forms:"verpiss\\s+dich", targets:"du|dich|ihr|sie", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"A vulgar German directive tells another participant to go away.", safeExample:"Der Artikel übersetzt die Redewendung." },
  { id:"de-family-abuse", language:"German", displayTerm:"targeted sexualised family abuse", forms:"hurensohn", targets:"du|sie|ihr|bist|seid|spieler|spielerin", mode:"targeted_prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe sexualised family label is blocked when aimed at a person.", safeExample:"Die Studie untersucht ein zitiertes Schimpfwort." },
  { id:"de-death-wish", language:"German", displayTerm:"stirb", forms:"stirb", targets:"du|sie|ihr", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The imperative tells the target to die.", safeExample:"Die Richtlinie nennt ‘stirb’ als verbotenes Beispiel." },

  { id:"it-personal-labels", language:"Italian", displayTerm:"idiota · imbecille · incapace · pagliaccio", forms:"idiot(?:a|i|e)|imbecill(?:e|i)|incapac(?:e|i)|pagliacci(?:o|a|i|e)", targets:"tu|lei|sei|siete|giocatore|giocatrice", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Italian personal degradation is moderated when it targets a participant.", safeExample:"Il dizionario spiega la parola ‘idiota’." },
  { id:"it-dismissal", language:"Italian", displayTerm:"vai a fanculo", forms:"vai\\s+a\\s+fanculo|vaffanculo", targets:"tu|lei|voi", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"A vulgar Italian dismissal is a person-directed command.", safeExample:"Il linguista traduce l'espressione." },
  { id:"it-family-abuse", language:"Italian", displayTerm:"targeted sexualised family abuse", forms:"figli[oa]\\s+di\\s+puttana", targets:"tu|lei|sei|siete|giocatore|giocatrice", mode:"targeted_prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe sexualised family insult is blocked when directed at somebody.", safeExample:"La ricerca analizza un insulto familiare citato." },
  { id:"it-death-wish", language:"Italian", displayTerm:"muori", forms:"muori", targets:"tu|lei|voi", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The imperative tells the addressed person to die.", safeExample:"La policy cita ‘muori’ come esempio vietato." },

  { id:"pt-personal-labels", language:"Portuguese", displayTerm:"idiota · imbecil · inútil · palhaço", forms:"idiot(?:a|as)|imbecil(?:is|s)?|inutil(?:eis|es)?|palhac(?:o|a|os|as)", targets:"tu|voce|voces|es|e|jogador|jogadora", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Portuguese personal labels receive intervention when aimed at a participant.", safeExample:"O dicionário explica a palavra ‘idiota’." },
  { id:"pt-dismissal", language:"Portuguese", displayTerm:"vai tomar no cu", forms:"vai\\s+tomar\\s+no\\s+cu", targets:"tu|voce|voces", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"A vulgar Portuguese dismissal is a directed command.", safeExample:"O artigo traduz a expressão para estudo." },
  { id:"pt-family-abuse", language:"Portuguese", displayTerm:"targeted sexualised family abuse", forms:"filh[oa]\\s+d[ao]\\s+put[ao]", targets:"tu|voce|voces|es|e|jogador|jogadora", mode:"targeted_prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe sexualised family insult is blocked when directed at a person.", safeExample:"A pesquisa analisa um insulto familiar citado." },
  { id:"pt-death-wish", language:"Portuguese", displayTerm:"morre", forms:"morre", targets:"tu|voce|voces", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The imperative tells the target to die.", safeExample:"A política cita ‘morre’ como exemplo proibido." },

  { id:"nl-personal-labels", language:"Dutch", displayTerm:"idioot · sukkel · loser · klootzak", forms:"idioot|sukkel|loser|klootzak", targets:"jij|je|u|bent|speler|speelster", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Dutch person-directed labels receive pre-publication intervention.", safeExample:"Het woordenboek legt het woord ‘idioot’ uit." },
  { id:"nl-dismissal", language:"Dutch", displayTerm:"rot op", forms:"rot\\s+op", targets:"jij|je|u", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"A vulgar Dutch command dismisses another participant.", safeExample:"De taalkundige vertaalt de uitdrukking." },
  { id:"nl-family-abuse", language:"Dutch", displayTerm:"targeted sexualised family abuse", forms:"hoerenzoon", targets:"jij|je|u|bent|speler|speelster", mode:"targeted_prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe sexualised family label is blocked when aimed at a person.", safeExample:"Het onderzoek bespreekt een geciteerd scheldwoord." },
  { id:"nl-death-wish", language:"Dutch", displayTerm:"sterf", forms:"sterf", targets:"jij|je|u", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The imperative tells the addressed person to die.", safeExample:"Het beleid citeert ‘sterf’ als verboden voorbeeld." },
];

const EDUCATIONAL = /\b(?:word|term|phrase|dictionary|definition|translation|translate|research|study|analysis|example|palabra|diccionario|traduce|estudio|mot|dictionnaire|traduit|recherche|wort|worterbuch|ubersetzt|studie|parola|dizionario|traduce|ricerca|palavra|dicionario|traduz|pesquisa|woord|woordenboek|vertaalt|onderzoek|linguist|linguiste|linguista|taalkundige)\b/;
const COMMON_TARGETS = "you|u|he|she|they|player|athlete|@[a-z0-9_.-]+";

function has(rule, norm) {
  return new RegExp(`\\b(?:${rule.forms})\\b`).test(norm);
}

function targeted(rule, norm) {
  const englishAmbiguous = ["fr-personal-labels", "de-personal-labels"].includes(rule.id) && /\bidiot\b/.test(norm);
  const target = englishAmbiguous ? `(?:${rule.targets}|@[a-z0-9_.-]+)` : `(?:${COMMON_TARGETS}|${rule.targets})`;
  const term = `(?:${rule.forms})`;
  return new RegExp(`(?:\\b${target}\\b|@[a-z0-9_.-]+)[^.!?]{0,36}\\b${term}\\b|\\b${term}\\b[^.!?]{0,28}(?:\\b${target}\\b|@[a-z0-9_.-]+)`).test(norm);
}

export function moderateWesternEuropeanAbuse(norm) {
  for (const rule of WESTERN_EUROPEAN_ABUSE_RULES) {
    if (!has(rule, norm)) continue;
    const isTargeted = targeted(rule, norm);
    if (EDUCATIONAL.test(norm) && !isTargeted) continue;
    if (["targeted", "targeted_prohibited"].includes(rule.mode) && !isTargeted) continue;
    return {
      outcome:rule.outcome,
      category:rule.mechanism,
      reason:rule.mechanism === "harm" ? "Wishing or encouraging death" : rule.mechanism === "sexualised_family_abuse" ? "Severe targeted family-directed sexual abuse" : rule.mechanism === "dismissive_command" ? "Regional dismissive abuse" : "Targeted Western European-language abuse",
      westernEuropeanRule:rule.id,
      targetHint:isTargeted ? { label:"the addressed participant", type:"person", scope:"individual", explicitness:"explicit in the detected language" } : undefined,
      policyRationale:rule.rationale,
    };
  }
  return null;
}

// K1ND.world v4.12 — research-backed functional policy wave.
//
// The pack adds ten language groups selected for published offensive-language,
// target-identification or dialogue-safety resources. It is intentionally a
// functional test pack, not a claim that five phrases complete a language.
// Every group includes target-gated degradation, a recoverable boundary
// request, severe abuse, a death wish, dehumanisation and clean counterexamples.

export const V412_LANGUAGE_PACK_VERSION = "2026.08-context-wave-1";

const GROUPS = [
  {
    code:"ta", language:"Tamil · Tanglish", targets:"நீ|நீங்கள்|அவன்|அவள்|வீரர்|nee|ni|avan|aval|player|athlete",
    personal:["முட்டாள் · muttal", "முட்டாள்|mutt+a+l", "personal_degradation", "Tamil and common Tanglish fool labels receive intervention only when directed at a participant."],
    dismissal:["வாயை மூடு · vaaya moodu", "வாயை\\s*மூடு|vaaya?\\s+moodu", "தயவுசெய்து எனக்கு சிறிது இடம் கொடுங்கள்.", "A Tamil silencing command is reduced to a request for space."],
    severe:["targeted severe Tamil family abuse", "தேவடியா\\s*மகனே|thevadiya\\s+magane", "sexualised_family_abuse", "A severe sexualised family attack is blocked."],
    death:["செத்து போ · sethu po", "செத்து\\s*போ|seth+u\\s+po", "The Tamil imperative tells the recipient to die."],
    animal:["நீ நாய் · nee naai", "நாய்|naai", "Tamil animal nouns are moderated as labels for a person, while literal animal references remain allowed."],
    tests:["நீ முட்டாள்.","வாயை மூடு.","தேவடியா மகனே.","செத்து போ.","நீ நாய்.","அகராதி முட்டாள் என்ற சொல்லை அவமதிப்பாக விளக்குகிறது.","You are muttal."],
    safe:"அகராதி முட்டாள் என்ற சொல்லை அவமதிப்பாக விளக்குகிறது.", literal:"நாய் பூங்காவில் ஓடுகிறது."
  },
  {
    code:"te", language:"Telugu · Tenglish", targets:"నువ్వు|మీరు|అతను|ఆమె|ఆటగాడు|nuvvu|meeru|player|athlete",
    personal:["మూర్ఖుడు · moorkhudu", "మూర్ఖ(?:ుడివి|ుడు|ురాలు)|moor+k+h?u?du", "personal_degradation", "Telugu and Romanised Telugu fool labels are target-gated personal degradation."],
    dismissal:["నోరు మూయి · noru muyi", "నోరు\\s*మూయి|noru\\s+muyi", "దయచేసి నాకు కొంత సమయం ఇవ్వండి.", "A Telugu silencing command is converted into a request for space."],
    severe:["targeted severe Telugu family abuse", "లంజ\\s*కొడకా|lanja\\s+kodaka", "sexualised_family_abuse", "A severe Telugu sexualised family attack is blocked."],
    death:["చచ్చిపో · chachipo", "చచ్చిపో|chach+i?po", "The Telugu imperative tells the recipient to die."],
    animal:["నువ్వు కుక్క · nuvvu kukka", "కుక్క(?:వు)?|kukka", "The dog noun is moderated only when used to label a participant."],
    tests:["నువ్వు మూర్ఖుడివి.","నోరు మూయి.","లంజ కొడకా.","చచ్చిపో.","నువ్వు కుక్కవు.","నిఘంటువు మూర్ఖుడు అనే పదాన్ని అవమానంగా వివరిస్తుంది.","You are moorkhudu."],
    safe:"నిఘంటువు మూర్ఖుడు అనే పదాన్ని అవమానంగా వివరిస్తుంది.", literal:"కుక్క పార్కులో పరుగెడుతోంది."
  },
  {
    code:"kn", language:"Kannada · Kanglish", targets:"ನೀನು|ನೀವು|ಅವನು|ಅವಳು|ಆಟಗಾರ|neenu|ninu|player|athlete",
    personal:["ಮೂರ್ಖ · moorkha", "ಮೂರ್ಖ|moor+k+ha", "personal_degradation", "Kannada and Romanised Kannada fool labels require a person target."],
    dismissal:["ಬಾಯಿ ಮುಚ್ಚು · baayi muchchu", "ಬಾಯಿ\\s*ಮುಚ್ಚು|baayi\\s+much+u", "ದಯವಿಟ್ಟು ನನಗೆ ಸ್ವಲ್ಪ ಸಮಯ ಕೊಡಿ.", "A Kannada silencing command is converted into a request for space."],
    severe:["targeted severe Kannada family abuse", "ಸೂಳೆ\\s*ಮಗನೇ|soole\\s+magane", "sexualised_family_abuse", "A severe Kannada sexualised family attack is blocked."],
    death:["ಸತ್ತು ಹೋಗು · sattu hogu", "ಸತ್ತು\\s*ಹೋಗು|sattu\\s+hogu", "The Kannada imperative tells the recipient to die."],
    animal:["ನೀನು ನಾಯಿ · neenu naayi", "ನಾಯಿ|naayi", "Kannada animal language intervenes only when it labels a person."],
    tests:["ನೀನು ಮೂರ್ಖ.","ಬಾಯಿ ಮುಚ್ಚು.","ಸೂಳೆ ಮಗನೇ.","ಸತ್ತು ಹೋಗು.","ನೀನು ನಾಯಿ.","ನಿಘಂಟು ಮೂರ್ಖ ಎಂಬ ಪದವನ್ನು ಅವಮಾನವೆಂದು ವಿವರಿಸುತ್ತದೆ.","You are moorkha."],
    safe:"ನಿಘಂಟು ಮೂರ್ಖ ಎಂಬ ಪದವನ್ನು ಅವಮಾನವೆಂದು ವಿವರಿಸುತ್ತದೆ.", literal:"ನಾಯಿ ಉದ್ಯಾನದಲ್ಲಿ ಓಡುತ್ತಿದೆ."
  },
  {
    code:"ml", language:"Malayalam · Manglish", targets:"നീ|നിങ്ങൾ|അവൻ|അവൾ|കളിക്കാരൻ|nee|ningal|player|athlete",
    personal:["മണ്ടൻ · mandan", "മണ്ട(?:നാണ്|ൻ|ി)|mand+a+n", "personal_degradation", "Malayalam and Manglish fool labels receive intervention when aimed at somebody."],
    dismissal:["വായ അടക്ക് · vaaya adakku", "വായ\\s*അടക്ക്|vaaya\\s+adakku", "ദയവായി എനിക്ക് കുറച്ച് ഇടം തരൂ.", "A Malayalam silencing command becomes a request for space."],
    severe:["targeted severe Malayalam family abuse", "വേശ്യയുടെ\\s*മകനേ|veshyayude\\s+makane", "sexualised_family_abuse", "A severe Malayalam sexualised family attack is blocked."],
    death:["ചത്തു പോ · chathu po", "ചത്തു\\s*പോ|chath+u\\s+po", "The Malayalam imperative tells the recipient to die."],
    animal:["നീ പട്ടി · nee patti", "പട്ടി(?:യാണ്)?|patti", "The dog noun is moderated as a human label but remains clean in literal use."],
    tests:["നീ മണ്ടനാണ്.","വായ അടക്ക്.","വേശ്യയുടെ മകനേ.","ചത്തു പോ.","നീ പട്ടിയാണ്.","നിഘണ്ടു മണ്ടൻ എന്ന വാക്കിനെ അപമാനമായി വിശദീകരിക്കുന്നു.","You are mandan."],
    safe:"നിഘണ്ടു മണ്ടൻ എന്ന വാക്കിനെ അപമാനമായി വിശദീകരിക്കുന്നു.", literal:"പട്ടി പാർക്കിൽ ഓടുന്നു."
  },
  {
    code:"mr", language:"Marathi", targets:"तू|तुम्ही|तो|ती|खेळाडू|tu|tumhi|player|athlete",
    personal:["मूर्ख · murkh", "मूर्ख|mur+k+h", "personal_degradation", "Marathi fool labels are moderated only with target evidence."],
    dismissal:["गप्प बस · gapp bas", "गप्प\\s*बस|gapp\\s+bas", "कृपया मला थोडी जागा द्या.", "A Marathi silencing command becomes a request for space."],
    severe:["targeted severe Marathi family abuse", "रांडेचा\\s*मुलगा|rand(?:e|i)cha\\s+mulga", "sexualised_family_abuse", "A severe Marathi sexualised family attack is blocked."],
    death:["मरून जा · marun ja", "मरून\\s*जा|marun\\s+ja", "The Marathi imperative tells the recipient to die."],
    animal:["तू कुत्रा · tu kutra", "कुत्रा|kutra", "Marathi animal nouns require a person-targeting frame."],
    tests:["तू मूर्ख आहेस.","गप्प बस.","रांडेचा मुलगा.","मरून जा.","तू कुत्रा आहेस.","शब्दकोश मूर्ख या शब्दाचे अपमानकारक उदाहरण देतो.","You are murkh."],
    safe:"शब्दकोश मूर्ख या शब्दाचे अपमानकारक उदाहरण देतो.", literal:"कुत्रा उद्यानात धावत आहे."
  },
  {
    code:"ne", language:"Nepali", targets:"तँ|तिमी|तपाईं|ऊ|खेलाडी|ta|timi|tapai|player|athlete",
    personal:["मूर्ख · murkha", "मूर्ख|mur+k+ha", "personal_degradation", "Nepali fool labels receive intervention when directed at a person."],
    dismissal:["चुप लाग · chup laga", "चुप\\s*लाग|chup\\s+laga", "कृपया मलाई केही समय दिनुहोस्।", "A Nepali silencing command is converted into a request for space."],
    severe:["targeted severe Nepali family abuse", "रन्डीको\\s*छोरा|randiko\\s+chhora", "sexualised_family_abuse", "A severe Nepali sexualised family attack is blocked."],
    death:["मरेस् · mares", "मरेस्|mares", "The Nepali wording wishes death on the recipient."],
    animal:["तँ कुकुर · ta kukur", "कुकुर|kukur", "The dog noun is moderated as a person label, not as literal animal language."],
    tests:["तँ मूर्ख होस्.","चुप लाग.","रन्डीको छोरा.","मरेस्.","तँ कुकुर होस्.","शब्दकोशले मूर्ख शब्दलाई अपमानको उदाहरणका रूपमा व्याख्या गर्छ.","You are murkha."],
    safe:"शब्दकोशले मूर्ख शब्दलाई अपमानको उदाहरणका रूपमा व्याख्या गर्छ.", literal:"कुकुर पार्कमा दौडिरहेको छ."
  },
  {
    code:"ha", language:"Hausa", targets:"kai|ke|ku|shi|ita|dan wasa|yar wasa|player|athlete|you",
    personal:["kai wawa ne", "wawa", "personal_degradation", "Hausa fool labels are moderated when a participant is the target."],
    dismissal:["yi shiru · tafi can", "yi\\s+shiru|tafi\\s+can", "Don Allah ka bar ni.", "A Hausa silencing or dismissal command becomes a request to be left alone."],
    severe:["direct Hausa severe degradation", "dan\\s+iska", "severe_family_degradation", "A strongly degrading Hausa personal label is held as severe targeted abuse rather than treated as a neutral phrase."],
    death:["je ka mutu", "je\\s+ka\\s+mutu", "The Hausa phrase tells the recipient to die."],
    animal:["kai kare ne", "kare", "Hausa animal terms require target evidence so literal dog references remain allowed."],
    tests:["Kai wawa ne.","Yi shiru.","Kai dan iska ne.","Je ka mutu.","Kai kare ne.","Kamus ya bayyana kalmar wawa a matsayin misalin zagi.","That player is wawa."],
    safe:"Kamus ya bayyana kalmar wawa a matsayin misalin zagi.", literal:"Kare yana gudu a filin shakatawa.", severeOutcome:"review"
  },
  {
    code:"yo", language:"Yorùbá", targets:"o|iwo|e|oun|elere|you|player|athlete",
    personal:["o jẹ òmùgọ̀ · omugo", "omugo", "personal_degradation", "Yorùbá fool labels are target-gated and diacritic-insensitive."],
    dismissal:["dákẹ́ · dakẹ", "dake", "Jọ̀wọ́, fi mí sílẹ̀.", "A Yorùbá silencing command becomes a request to be left alone."],
    severe:["direct Yorùbá severe degradation", "omo\\s+ale", "severe_family_degradation", "A strongly degrading Yorùbá lineage label is held for enhanced review when targeted."],
    death:["lọ kú · lo ku", "lo\\s+ku", "The Yorùbá phrase tells the recipient to die."],
    animal:["o jẹ ajá · aja", "aja", "Yorùbá animal nouns are moderated only as labels for a person."],
    tests:["Ìwọ jẹ́ òmùgọ̀.","Dákẹ́.","Ìwọ ọmọ àlè.","Lọ kú.","Ìwọ jẹ́ ajá.","Ìwé-itumọ̀ ṣàlàyé ọ̀rọ̀ òmùgọ̀ gẹ́gẹ́ bí ẹ̀gàn.","That player is omugo."],
    safe:"Ìwé-itumọ̀ ṣàlàyé ọ̀rọ̀ òmùgọ̀ gẹ́gẹ́ bí ẹ̀gàn.", literal:"Ajá ń sáré ní ọgbà.", severeOutcome:"review"
  },
  {
    code:"ig", language:"Igbo", targets:"i|ị|gi|ya|onye egwu|you|player|athlete",
    personal:["ị bụ onye nzuzu", "nzuzu", "personal_degradation", "Igbo fool labels receive intervention when a participant is targeted."],
    dismissal:["mechie ọnụ · mechie onu", "mechie\\s+onu", "Biko, hapụ m.", "An Igbo silencing command becomes a request to be left alone."],
    severe:["targeted severe Igbo family abuse", "nwa\\s+akwuna", "sexualised_family_abuse", "A severe Igbo sexualised family attack is blocked."],
    death:["gaa nwụọ · gaa nwuo", "gaa\\s+nwuo", "The Igbo phrase tells the recipient to die."],
    animal:["ị bụ nkịta · nkita", "nkita", "Igbo animal language requires a participant target."],
    tests:["Ị bụ onye nzuzu.","Mechie ọnụ.","Ị bụ nwa akwụna.","Gaa nwụọ.","Ị bụ nkịta.","Akwụkwọ okwu kọwara nzuzu dịka ihe atụ nke mkparị.","That player is nzuzu."],
    safe:"Akwụkwọ okwu kọwara nzuzu dịka ihe atụ nke mkparị.", literal:"Nkịta na-agba ọsọ n'ogige."
  },
  {
    code:"pcm", language:"Nigerian Pidgin", targets:"you|u|e|she|dem|player|athlete",
    personal:["you be mumu", "mumu", "personal_degradation", "Nigerian Pidgin personal degradation receives intervention with target evidence."],
    dismissal:["commot for here", "commot\\s+(?:for|from)\\s+here", "Abeg give me space.", "A Nigerian Pidgin dismissal becomes a request for space."],
    severe:["targeted severe Pidgin family abuse", "ashawo\\s+pikin", "sexualised_family_abuse", "A severe sexualised family label is blocked when targeted."],
    death:["go die", "go\\s+die", "The Pidgin imperative tells the recipient to die."],
    animal:["you be animal · you be dog", "animal|dog", "Animal nouns require a direct Pidgin person-label frame."],
    tests:["You be mumu.","Commot for here.","You be ashawo pikin.","Go die.","You be animal.","Dictionary explain mumu as example of insult.","That player na mumu."],
    safe:"Dictionary explain mumu as example of insult.", literal:"The dog dey run for park."
  },
];

function makeRules(group) {
  const base = { code:group.code, language:group.language, targets:group.targets };
  return [
    { ...base, id:`${group.code}-personal`, displayTerm:group.personal[0], forms:group.personal[1], mode:"targeted", outcome:"warning", mechanism:group.personal[2], rationale:group.personal[3], safeExample:group.safe },
    { ...base, id:`${group.code}-dismissal`, displayTerm:group.dismissal[0], forms:group.dismissal[1], mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:group.dismissal[2], rationale:group.dismissal[3], safeExample:group.safe },
    { ...base, id:`${group.code}-severe`, displayTerm:group.severe[0], forms:group.severe[1], mode:"prohibited", outcome:group.severeOutcome || "block", mechanism:group.severe[2], rationale:group.severe[3], safeExample:group.safe },
    { ...base, id:`${group.code}-death`, displayTerm:group.death[0], forms:group.death[1], mode:"prohibited", outcome:"block", mechanism:"harm", rationale:group.death[2], safeExample:group.safe },
    { ...base, id:`${group.code}-animal`, displayTerm:group.animal[0], forms:group.animal[1], mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:group.animal[2], safeExample:group.literal },
  ];
}

export const V412_LANGUAGE_RULES = GROUPS.flatMap(makeRules);

export const V412_LANGUAGE_TEST_CASES = GROUPS.flatMap((group) => [
  { input:group.tests[0], expect:"warning", expectNoRewrite:true },
  { input:group.tests[1], expect:"warning", expectRewrite:group.dismissal[2] },
  { input:group.tests[2], displayInput:`[${group.language} severe targeted abuse]`, expect:group.severeOutcome || "block" },
  { input:group.tests[3], displayInput:`[${group.language} death wish]`, expect:"block" },
  { input:group.tests[4], expect:"warning", expectNoRewrite:true },
  { input:group.tests[5], expect:"clean" },
  { input:group.tests[6], expect:"warning", expectNoRewrite:true, expectCodeSwitch:true },
]);

const EDUCATIONAL = /(?:\b(?:word|term|phrase|dictionary|definition|translation|translate|research|study|analysis|example|policy|history|means?|meaning|kamus|kalmar|misalin|iwe|itumọ|salaye|akwukwo|okwu|kọwara)\b|அகராதி|சொல்|ஆராய்ச்சி|నిఘంటువు|పదం|ಸಂಶೋಧನೆ|ನಿಘಂಟು|നിഘണ്ടു|വാക്ക്|शब्दकोश|शब्दलाई)/u;
const RESIDUAL = /(?:\b(?:but|and)\s+(?:you|that\s+player)\b|ஆனால்\s+நீ|కానీ\s+నువ్వు|ಆದರೆ\s+ನೀನು|പക്ഷേ\s+നീ|पण\s+तू|तर\s+तिमी|amma\\s+kai|sugbon\\s+iwo|mana\\s+gi|but\\s+you)/u;
const UNIVERSAL_TARGETS = "you|u|he|she|they|that\\s+player|the\\s+player|athlete|@[a-z0-9_.-]+";

function fold(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/([\p{Script=Latin}])\p{M}+/gu, "$1")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
    .replace(/0/g,"o").replace(/1/g,"i").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s")
    .replace(/([^\p{L}\p{N}])\1+/gu, "$1")
    .replace(/[^\p{L}\p{M}\p{N}@]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function re(body) {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${body})(?=$|[^\\p{L}\\p{N}])`, "u");
}

function targetRe(rule) {
  return re(`(?:${UNIVERSAL_TARGETS}|${rule.targets})`);
}

function targeted(rule, text) {
  const hit = text.match(re(rule.forms));
  const target = text.match(targetRe(rule));
  return Boolean(hit && target && Math.abs((hit.index || 0) - (target.index || 0)) <= 64);
}

function hasCodeSwitch(original, rule) {
  const latin = /[A-Za-z]/u.test(original);
  const nonLatin = /[^\u0000-\u024F\s\p{P}\p{N}]/u.test(original);
  const englishTarget = /\b(?:you|that\s+player|the\s+player|athlete)\b/i.test(original);
  return (latin && nonLatin) || (englishTarget && !["ha","yo","ig","pcm"].includes(rule.code));
}

export function moderateV412LanguageWave(original) {
  const text = fold(original);
  const educational = EDUCATIONAL.test(text) || EDUCATIONAL.test(String(original || "")) || /\b(?:spell|spelling|exercise|dictionary|translation|research|study|dataset|example)\b/i.test(String(original || ""));
  for (const rule of V412_LANGUAGE_RULES) {
    const hit = text.match(re(rule.forms));
    if (!hit) continue;
    const isTargeted = targeted(rule, text);
    if (educational && !RESIDUAL.test(text)) {
      return { outcome:"clean", category:"contextual_safe", reason:"Educational or translation context", v412LanguageRule:rule.id, languageCode:rule.code, languageConfidence:"functional match with protected context", policyRationale:rule.rationale };
    }
    if (["targeted","targeted_prohibited"].includes(rule.mode) && !isTargeted) continue;
    const codeSwitch = hasCodeSwitch(original, rule) || /\b(?:you|player|athlete)\b/i.test(original) && !["en","pcm"].includes(rule.code);
    return {
      outcome:rule.outcome,
      category:rule.mechanism,
      reason:rule.mechanism === "harm" ? "Wishing or encouraging death" : rule.mechanism === "dismissive_command" ? "Multilingual dismissive command" : ["sexualised_family_abuse","severe_family_degradation"].includes(rule.mechanism) ? "Severe targeted multilingual abuse" : rule.mechanism === "dehumanising_label" ? "Targeted multilingual dehumanisation" : "Targeted multilingual personal degradation",
      rewriteSuggestion:rule.rewrite,
      v412LanguageRule:rule.id,
      languageCode:rule.code,
      languageConfidence:codeSwitch ? "code-switched functional match" : "native or transliterated functional match",
      codeSwitch,
      transliterationEvidence:/[A-Za-z]/.test(hit[0]) && rule.code !== "pcm" ? `Romanised ${rule.language} form` : undefined,
      matchedPolicyText:hit[0].trim(),
      targetHint:isTargeted || ["phrase","prohibited"].includes(rule.mode) ? { label:"the addressed participant", type:"person", scope:"individual", explicitness:`functional target in ${rule.language}` } : undefined,
      policyRationale:rule.rationale,
    };
  }
  return null;
}

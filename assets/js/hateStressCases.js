// Presenter-safe adversarial fixtures. Raw hostile inputs are never rendered;
// the UI shows redacted labels while the engine receives the actual fixture.

const leet = (value) => value.replace(/a/g,"4").replace(/e/g,"3").replace(/i/g,"1").replace(/o/g,"0").replace(/s/g,"5").replace(/t/g,"7");
const fullwidth = (value) => [...value].map((c) => /[!-~]/.test(c) ? String.fromCharCode(c.charCodeAt(0) + 0xFEE0) : c).join("");
const circled = (value) => [...value].map((c) => String.fromCodePoint(0x24D0 + c.charCodeAt(0) - 97)).join("");
const mathBold = (value) => [...value].map((c) => String.fromCodePoint(0x1D41A + c.charCodeAt(0) - 97)).join("");
const variants = (value) => [
  value.toUpperCase(), [...value].join(" "), [...value].join("."), [...value].join("-"),
  [...value].map((c) => `${c}${c}`).join(""), leet(value), [...value].join("\u200B"), fullwidth(value),
  [...value].join("_"), [...value].join("/"), [...value].join("\n"),
  [...value].map((c) => `${c}\u0338`).join(""), circled(value), mathBold(value),
  [...value].join("🤡"), [...value].join("***"),
];

const lexicalSeeds = [
  ["racial","anti-Black slur","nigger"], ["racial","anti-Black slur variant","coon"],
  ["ethnic","South-Asian ethnic slur","paki"], ["religious","antisemitic slur","kike"],
  ["homophobic","homophobic slur","faggot"], ["transphobic","transphobic slur","tranny"],
  ["disability","disability-directed slur","retard"], ["racial","anti-East-Asian slur","chink"],
];

const phraseSeeds = [
  ["racial","historical labour-based racial slur","cotton picker"],
  ["racial","historical racial slur","spear chucker"],
  ["racial","dehumanising racial slur","porch monkey"],
  ["ethnic","Middle-Eastern ethnic slur","camel jockey"],
  ["ethnic","South-Asian ethnic slur","curry muncher"],
  ["racial","anti-East-Asian mocking phrase","ching chong"],
];

let serial = 0;
const generatedLexical = lexicalSeeds.flatMap(([group,label,term]) => variants(term).map((input,index) => ({ id:`lex-${++serial}`, group, label:`${label} · evasion ${index+1}`, input, expect:"block" })));
const generatedPhrases = phraseSeeds.flatMap(([group,label,term]) => [
  term.replaceAll(" ",""), term.replaceAll(" ","-"), leet(term), term.split("").join("\u200B"),
  term.replaceAll(" ","_"), term.replaceAll(" ","/"), term.replaceAll(" ","\n"), [...term].join("🤡"),
].map((input,index) => ({ id:`phrase-${++serial}`, group, label:`${label} · phrase evasion ${index+1}`, input, expect:"block" })));

const contextual = [
  ["threat","targeted violence","I'm going to hurt you after the match.","block"],
  ["threat","joined self-harm command","killyourself","block"],
  ["threat","spaced self-harm command","k i l l y o u r s e l f","block"],
  ["threat","punctuation-obfuscated self-harm command","k.i.l.l.y.o.u.r.s.e.l.f","block"],
  ["threat","leetspeak self-harm command","k1lly0urself","block"],
  ["threat","joined euphemistic self-harm command","unaliveyourself","block"],
  ["threat","self-belief sporting counterexample","That loss killed your self-belief.","clean"],
  ["threat","sporting hyperbole counterexample","I'm going to destroy you in the final.","clean"],
  ["racial","targeted primate emoji","Send that player 🦍 back where she belongs.","block"],
  ["racial","benign food/emoji counterexample","I had a banana smoothie before the match 🍌.","clean"],
  ["extremism","extremist hate expression","White power.","block"],
  ["discriminatory","sex-based exclusion","Women belong in the kitchen.","block"],
  ["dehumanising","targeted dehumanisation","You are subhuman vermin.","block"],
  ["sexual","sexual violence encouragement","You deserve to be raped.","block"],
  ["doxxing","address disclosure","You live at 42 Oakfield Road, SW1A 2AA.","block"],
  ["clean","ordinary sporting criticism","That was an awful performance.","clean"],
  ["clean","English substring counterexample","I heard a snigger from the back row.","clean"],
  ["clean","country-name counterexample","The team from Pakistan played well.","clean"],
  ["clean","technical substring counterexample","The fire-retardant material passed inspection.","clean"],
  ["multilingual","Spanish colour counterexample","El coche negro ganó la carrera.","clean"],
  ["multilingual","Portuguese animal counterexample","O macaco vive na floresta.","clean"],
  ["multilingual","targeted Portuguese simian slur","Você é um macaco.","block"],
  ["multilingual","historical Hindi proper-name counterexample","The Habshi dynasty is part of Indian history.","clean"],
  ["multilingual","targeted Hindi racial slur","Tum habshi ho.","block"],
  ["multilingual","French ethnic slur","bougnoule","block"],
  ["multilingual","Italian anti-Black slur","negraccio","block"],
  ["multilingual","Spanish ethnic slur","sudaca","block"],
  ["multilingual","German targeted ethnic slur","Du Kanake.","block"],
  ["multilingual","Arabic racialised slave slur","يا عبيد","block"],
  ["multilingual","Mandarin anti-Black slur","黑鬼","block"],
  ["multilingual","Cyrillic N-word transliteration","ниггер","block"],
  ["multilingual","Gujarati N-word transliteration","નિગ્ગર","block"],
  ["australian","targeted Australian fool label","You are a drongo.","warning"],
  ["australian","literal Australian bird counterexample","A galah landed beside the oval.","clean"],
  ["australian","contemporary Australian personal label","You are a cooker.","warning"],
  ["australian","cooking appliance counterexample","Use the slow cooker.","clean"],
  ["czech","targeted Czech personal label","Ty jsi blbec.","warning"],
  ["czech","Czech dictionary-discussion counterexample","Slovo blbec je ve slovníku označeno jako urážka.","clean"],
  ["czech","Czech death wish","Chcípni.","block"],
  ["czech","Czech dismissive command","Drž hubu.","warning"],
  ["lithuanian","targeted Lithuanian animal-based insult","Tu esi gaidys.","warning"],
  ["lithuanian","literal Lithuanian rooster counterexample","Gaidys gieda kieme.","clean"],
  ["latvian","targeted Latvian sexualised abuse","Tu esi mauka.","block"],
  ["latvian","Latvian research-discussion counterexample","Pētījums analizē aizskaroša vārda lietojumu.","clean"],
  ["estonian","targeted Estonian personal label","Sa oled loll.","warning"],
  ["estonian","Estonian idea-criticism counterexample","See mõte on loll.","clean"],
  ["estonian","Estonian identity slur","Sa oled tibla.","block"],
  ["estonian","Estonian research-discussion counterexample","Uurimus käsitleb solvavat sõna ajaloolises kontekstis.","clean"],
  ["context","reported insult counterexample","He called me an idiot after the match.","clean"],
  ["context","direct personal attack control","He is an idiot.","warning"],
  ["context","counterspeech counterexample","Don’t call her an idiot.","clean"],
  ["context","counterspeech with residual attack","Don’t call her an idiot, you moron.","warning"],
  ["context","idea criticism counterexample","Your argument is stupid.","clean"],
  ["context","person degradation control","You are stupid.","warning"],
  ["context","educational profanity counterexample","The phrase fuck off is vulgar.","clean"],
  ["context","direct profanity control","Fuck off.","warning"],
  ["profanity-context","positive expletive praise","Fuck what a great shot","clean"],
  ["profanity-context","profanity as sporting intensifier","What a fucking shot!","clean"],
  ["profanity-context","celebratory exclamation","Fuck yes, what a point.","clean"],
  ["profanity-context","emphatic sporting frustration","This match is fucking terrible.","clean"],
  ["profanity-context","untargeted exclamation","Fuck!","clean"],
  ["profanity-context","profane compliment to a participant","You played fucking brilliantly.","clean"],
  ["profanity-context","person-directed hostility control","Fuck that player.","warning"],
  ["profanity-context","profane personal degradation control","You fucking idiot.","warning"],
  ["profanity-context","threat with inserted profanity","I will fucking hurt you.","block"],
  ["profanity-context","reported profanity counterexample","He told me to fuck off.","clean"],
  ["context","self-directed criticism counterexample","I was an idiot for missing that shot.","clean"],
  ["context","direct second-person attack control","You are an idiot.","warning"],
  ["context","quotation-only control","‘You are an idiot.’","warning"],
  ["context","reported quotation counterexample","She wrote ‘you are a clown’ and I reported it.","clean"],
  ["evasion-shield","spaced target and insult evasion","Y o u are an i d i o t.","warning"],
  ["evasion-shield","partially punctuated insult evasion","You are an id.io.t.","warning"],
  ["evasion-shield","emoji-separated insult evasion","You are an i🤡d🤡i🤡o🤡t.","warning"],
  ["evasion-shield","leetspeak shorthand attack","u r an 1d10t.","warning"],
  ["evasion-shield","spelled-out fool label","You are a f o o l.","warning"],
  ["evasion-shield","educational spelling counterexample","Spell idiot as i d i o t for the exercise.","clean"],
  ["evasion-shield","educational punctuation counterexample","The term i.d.i.o.t is insulting.","clean"],
  ["evasion-shield","invisible-control targeted uncertainty","You are x‍q‍z.","review"],
  ["evasion-shield","bidirectional-control targeted uncertainty","You are x‮qz.","review"],
  ["evasion-shield","mixed-script target uncertainty","y о u are xqz.","review"],
  ["evasion-shield","technical invisible-character counterexample","The variables x‍q‍z are placeholders.","clean"],
  ["evasion-shield","mixed-script educational counterexample","The Greek and Latin letters aа are compared.","clean"],
  ["evasion-shield","circled-letter insult evasion","You are an ⓘⓓⓘⓞⓣ.","warning"],
  ["evasion-shield","mathematical-letter insult evasion","You are an 𝐢𝐝𝐢𝐨𝐭.","warning"],
  ["evasion-shield","underscore-separated insult evasion","You are an i___d___i___o___t.","warning"],
  ["evasion-shield","unknown separated target wording","You are z•z•z•z.","review"],
].map(([group,label,input,expect]) => ({ id:`context-${++serial}`,group,label,input,expect }));

export const HATE_STRESS_CASES = [...generatedLexical, ...generatedPhrases, ...contextual];

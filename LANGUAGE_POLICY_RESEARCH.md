# K1ND.world language-policy research note

Research updated: 31 August 2026

## Method

User-submitted slang sites were used for discovery, not as an automatic source of truth. Candidate terms were corroborated against dictionaries, corpus research and abusive-language datasets before inclusion. Each included rule has an abuse mechanism, severity, rewrite policy and safe counterexample. A target requirement is used when a word also has a common literal, reclaimed, self-descriptive or merely profane use; high-confidence threats and identity slurs do not depend on that same gate.

## Pragmatic context policy

Lexical matching is now followed by an explicit pragmatic assessment. It resolves the target, classifies the speech act, reads the author's stance, checks quotation/reporting/counterspeech/self-reference, detects a fresh attack outside any protected frame and summarises stacked abuse mechanisms.

Context can reduce a false positive for ordinary warning-level language: reporting `He called me an idiot`, preventing `Don’t call her an idiot`, or criticising `Your argument is stupid` is different from directing the label at a person. Context cannot downgrade a hard block or enhanced-review decision in the browser demo. Quotation marks and hypothetical wording without a clear reporting, educational or opposing stance are not treated as safe on their own.

The public API accepts an optional context envelope containing `parentText`, `isReply`, the post author, reply target, known participant profiles, recent public `conversationHistory` and prior targeted interventions. This supports real reply-target inference, athlete and U18 awareness, detection of wording copied from a parent message for reporting, repeat-author targeting and multi-account pile-on signals. The deterministic demo exposes these fields as evidence; production still requires trained conversational models, secure server-side state and measured multilingual evaluation.

Participant status is not a shortcut to censorship. Athlete status raises awareness and appears in the evidence, but strong criticism of a performance remains publishable. Warning-level personal abuse is escalated only when another consequential condition exists, such as a known U18 target, repeated targeting by the same author or a developing multi-account pile-on.

## Presenter Shield uncertainty policy

The US Open demo fail-safe recognises sixteen lexical mutation families plus joined, hyphenated, zero-width, leetspeak, underscore, slash, line-break and emoji-separated phrase forms. It also records invisible controls, bidirectional controls, compatibility characters, mixed-script targets and abnormal separator density.

The fail-safe distinguishes two outcomes. A recognisable reviewed abuse term receives an intervention. Suspicious targeted wording whose meaning is genuinely unknown is held for enhanced review rather than being published or falsely classified as abuse. Research, spelling, variable and script-comparison contexts remain allowed. This is a safer demo policy, but it is not evidence of universal language understanding.

## `benchod` / `bhenchod` / `behenchod`

The expression is a Romanised South Asian vulgarism literally referring to sexual activity with someone's sister. Corpus evidence shows substantial spelling variation, with `bhenchod` and `behenchod` dominant and variants including `benchod`, `bahinchod`, `behanchod`, `bhaenchud` and Punjabi-influenced `penchod`. It also occurs as a non-targeted exclamation, so a keyword-only universal hard block would be overbroad.

K1ND policy:

- Directed at a person: **hard block** as severe sexualised family abuse.
- Untargeted exclamation: **intervention** as strong multilingual profanity.
- Definition, translation, research or moderator discussion: **allow**.
- Active scripts: Romanised Latin, Devanagari `बहनचोद`, Urdu `بہن چود`, Gujarati `બહેનચોદ`.
- Ambiguous abbreviations such as `BC` are intentionally excluded.

## Current curated South Asian pack

The first pack contains contextual rules for family-directed sexualised abuse, sexualised misogyny, vulgar personal abuse, mental-state ridicule, sycophant ridicule and silencing. It recognises selected Romanised, Devanagari, Gujarati and Urdu forms. This is a starting pack, not a claim of complete South Asian coverage.

`saala` / `saali` is treated contextually because it can be a literal kinship word as well as an insult. `haraam saala` receives an intervention as stacked personal degradation. The spelling `hinchod` was not corroborated as a stable lexical form in the reviewed sources; when it targets somebody, the demo therefore holds it for enhanced review as a suspected evasion rather than asserting an automatic hard block.

## First Polish pack

Polish dictionary evidence distinguishes `kurwa` as a vulgar noun/term of abuse from its widespread use as an interjection or intensifier. `Kurwa mać` is classified as a vulgar exclamatory phrase expressing anger or frustration. K1ND therefore intervenes on the exclamation, but hard-blocks `kurwa` / `kurwo` when grammatical and targeting context shows that it is being used as sexualised abuse against a person. Common non-diacritic or phonetic forms such as `kurwa mac`, `kurva matc` and `kurva match` are recognised.

## Australian English pack

Australian insults are unusually context-sensitive. The same word can be a serious attack, affectionate banter, self-identification or an ordinary reference to an animal, food, appliance, sale or sporting action. Australian eSafety guidance similarly treats target, serious harm, circumstances and context as part of the assessment rather than using a word alone.

The first pack covers person-directed uses of `drongo`, `galah`, `dill`, `dropkick`, `ratbag`, `flog`, `grub`, `deadshit`, `sook`, `sooky`, `whinger`, `bogan`, `cooker`, `fuckwit`, `dickhead` and `pull your head in`. These terms are not all equal in severity and are not treated as universal hate speech.

K1ND policy:

- Person-directed ridicule or contempt: **intervention**.
- Literal animal, food, appliance, sale and sporting uses: **allow**.
- Reclaimed or proud self-identification: **allow**, absent another abusive signal.
- Dictionary, translation, quotation or policy discussion: **allow**.
- A bare insult: **no automatic rewrite** because there is no genuine proposition to preserve.
- `You are a cooker.`: preserve the recoverable credibility challenge as `I don't think that claim is credible.`
- `Pull your head in.`: preserve the request as `Please stop that behaviour.`

`Bogan` receives a particularly narrow targeting gate because Australian usage includes positive self-description. `Cooker` also requires targeting because the literal appliance is common. `Galah`, `dropkick`, `grub`, `dill` and `flog` have explicit literal or sporting counterexamples.

## Czech and Baltic-region pack

Czech is a **West Slavic** language, not a Baltic language. Lithuanian and Latvian are **Baltic** languages. Estonian is a **Finnic** language included because this pack covers the Baltic region as well as the Baltic language family.

The implementation follows the distinction made in Czech invectivity research between lexical offensiveness and the pragmatic act of insulting somebody. It also follows the cross-language functional-testing approach used by research covering English, Czech, Lithuanian and Polish: each abusive function is paired with neutral or quoted counterexamples rather than treating every dictionary entry as a blanket ban.

The first regional pack contains:

- Czech person-directed degradation, aggressive dismissal, targeted sexualised abuse, death wishes and selected high-confidence identity slurs.
- Lithuanian personal degradation and animal-based ridicule, dismissive abuse and a selected high-confidence homophobic slur.
- Latvian personal degradation, dismissal, targeted sexualised abuse and a selected high-confidence homophobic slur.
- Estonian personal degradation, dismissal, targeted sexualised abuse and selected high-confidence identity slurs.

K1ND policy:

- Person-directed fool/loser/degradation labels: **intervention**.
- Aggressive dismissive commands: **intervention**.
- Dismissive commands with a recoverable request: **rewrite in the original language**, retaining “stop talking” or “leave me alone” without the vulgar command.
- Untargeted strong sexualised profanity: **intervention** where a non-targeted reading exists.
- Sexualised abuse aimed at a person, a death wish, or a high-confidence identity slur: **hard block**.
- Dictionary, translation, research or historical discussion: **allow**.
- Literal animal use and criticism of an idea rather than a person: **allow**.

Target markers are isolated by language. This prevents, for example, Czech `on` (“he”) from being interpreted as a target marker inside an Estonian sentence where `on` means “is.” Diacritics are normalised for matching while the original text remains available for script- and context-sensitive checks.

## Western European pack

V4.9 adds a first reviewed pack for Spanish, French, German, Italian, Portuguese and Dutch. It contains 24 functional rules covering person-directed degradation, aggressive dismissal, severe sexualised family abuse and death wishes. Each language has neutral, educational or literal controls so that a term is not treated as abusive merely because it appears in a definition, policy discussion or non-targeted ordinary use.

K1ND policy:

- Person-directed degradation: **intervention**.
- Aggressive dismissal with a recoverable request: **intervention** plus a concise rewrite in the original language.
- Severe sexualised family abuse and death wishes: **hard block**.
- Definition, translation, research, counterspeech and clear educational use: **allow**, unless a fresh attack remains outside that frame.
- Short words that overlap with ordinary English are isolated to the relevant language context rather than applied as universal substrings.

This pack is deliberately bounded. It is evidence of a reviewable functional-policy pattern, not a claim that six languages—or all regional varieties within them—are complete.

## Global racial-slur policy

The original English engine already hard-blocked the n-word, common inflections and evasions, `coon`, `cotton picker`, `porch monkey`, `spear chucker` and related anti-Black racial abuse. The hardened pack adds the phonetic spelling `koon`, joined/hyphenated evasions and selected high-confidence equivalents or direct transliterations across Cyrillic, Devanagari, Gujarati, Polish, Dutch, German, French, Spanish and Mandarin.

The pack intentionally does not treat every translation of “black” as a slur. For example, Spanish `negro` is an ordinary colour word, while the independently derogatory `negrata` is blocked. This prevents an English-centric blacklist from censoring neutral speech in other languages.

HurtLex is useful as a discovery and evaluation reference because it covers offensive-language categories in more than 50 languages, but its repository explains that parts of the resource are semi-automatically translated and distinguishes conservative from inclusive senses. K1ND therefore does not copy it wholesale. Multilingual HateCheck's native-expert functional testing approach is the safer model for promotion into a hard-block policy pack.

## V4.10 priority global functional pack

The V4.10 wave adds Arabic, Russian, Ukrainian, Mandarin Chinese, Japanese, Korean, Turkish, Greek, Romanian, Hungarian, Slovak, Serbian, Croatian and Bosnian. The pack contributes 60 rules and 86 paired functional tests.

Every language group contains five policy functions:

- person-directed fool or degradation labels: **intervention** only with target evidence;
- aggressive commands to leave or disappear: **intervention** with a concise native-language rewrite;
- severe directed sexualised or family abuse: **hard block**;
- direct death wishes: **hard block**;
- a selected high-confidence identity-hate form: **hard block**, with target gating where the same word has a literal, historical, reclaimed or ambiguous use.

Dictionary, translation, research, historical and policy discussion is tested as clean. A protected frame does not excuse a fresh attack added afterwards. Raw high-impact terms are redacted in presenter-facing test views.

This pack was manually curated rather than copied from a downloadable lexicon. HurtLex was used only as cross-language discovery support because its own documentation distinguishes conservative and inclusive senses and warns that some entries come from automatic translation. Multilingual HateCheck, Arabic OSACT work, KOLD, Japanese Taboo WordNet and Russian/Turkish abusive-language research support the functional focus on target, category, context and counterexamples.

The 29-language figure describes deterministic functional coverage in the V4.10 preview, not complete dialectal or production understanding. Arabic dialects, code-mixing, morphology, reclaimed terms, sarcasm and community change still require native reviewers and measured multilingual models.

## V4.11 next language wave and rewrite fidelity

V4.11 adds Bengali plus Romanised Bengali, Persian/Farsi, Hebrew, Indonesian, Malay, Vietnamese, Thai, Tagalog/Filipino, Swahili and Amharic. The active preview now has 39 functional language groups and 201 inspectable rules.

The implementation follows a functional pattern rather than importing a scraped profanity list: target, abuse mechanism, severity, speech act, protected educational/literal frame and proportional outcome are all represented. The ten groups contribute 50 rules and 70 paired fixtures, including clean counterexamples.

The research basis matters because spelling and word presence alone are weak proxies for abuse. Bengali research includes both native and Romanised text; Indonesian and Amharic datasets annotate target or intensity; Vietnamese work identifies harmful spans; Hebrew detoxification work explicitly evaluates meaning preservation; and Swahili resources include code-switched content. These findings support the decision to retain script and transliteration evidence while keeping target and context central.

V4.11 also changes the rewrite contract. A rewrite must preserve an identifiable proposition from the source, remove the abusive element and re-moderate clean. Allegations are qualified. A hard-block original never receives an ordinary rewrite; a separable clean point can only be offered as a distinct, revalidated new draft. If no legitimate proposition exists, no wording is invented.

The 39-language figure still describes bounded deterministic coverage, not universal comprehension. Cross-lingual detoxification research continues to report uneven transfer and meaning-preservation challenges, while current multilingual moderation research explicitly treats a universally robust classifier as an unsolved goal. Native review, maintained contextual models and measured community performance remain production requirements.

## V4.12 code-switching, indirect targets and next language wave

V4.12 adds bounded functional packs for Tamil/Tanglish, Telugu/Tenglish, Kannada/Kanglish, Malayalam/Manglish, Marathi, Nepali, Hausa, Yorùbá, Igbo and Nigerian Pidgin. The wave was chosen because published work provides code-mixed offensive-language tasks, target-identification resources or dialogue-safety evidence for these language communities. The pack contributes 50 rules and 70 fixtures; eight additional context signals contribute 18 fixtures.

Code-switching is evaluated compositionally: a target can appear in English while the degrading label appears in another language or Romanisation. Common separators and repeated letters are normalised, but definitions, spelling exercises, research discussion and literal animal use remain explicit controls. This is functional coverage, not a claim that a small phrase set completes any language or dialect.

Potential dog whistles are treated differently from high-confidence abuse. Published dog-whistle research describes disambiguation as context-dependent, so triple-parenthesis notation, numeric constructions, belonging language and group-exception stereotypes are routed to enhanced review with ambiguity evidence. The browser does not automatically label the author hateful and does not turn ambiguous signals into a hard block.

The conversation envelope now accepts participant aliases, the last referenced participant and longer-lived author/target behaviour history. These fields support indirect-target resolution and persistent-harassment signals across threads. Clean sporting criticism remains publishable even when prior harmful attempts exist; behaviour evidence changes proportional handling of a current personal attack, not the opinion itself.

The active preview now reports 49 functional language groups and 259 inspectable rules/signals. Production still requires native experts, maintained contextual models, secure server-side history, privacy and retention controls, appeal paths and false-positive/false-negative measurement per community.

## Sources

- Wiktionary, “behenchod”: https://en.wiktionary.org/wiki/behenchod
- Wiktionary, Hindi `बहनचोद`: https://en.wiktionary.org/wiki/%E0%A4%AC%E0%A4%B9%E0%A4%A8%E0%A4%9A%E0%A5%8B%E0%A4%A6
- Urban Dictionary, “benchod” discovery entries: https://www.urbandictionary.com/define.php?term=benchod
- “‘Bad’ Indian English on Reddit” corpus study: https://doi.org/10.1080/13488678.2025.2549180
- “Mapping out Violence Against Women of Influence on Twitter”: https://pmc.ncbi.nlm.nih.gov/articles/PMC8044621/
- ACL Anthology, Hindi-English code-mixed corpus and lexicon: https://aclanthology.org/2024.icon-1.9/
- HASOC multilingual abusive-content datasets: https://hasocfire.github.io/hasoc/2025/dataset.html
- Polish Academy of Sciences dictionary, `kurwa mać`: https://wsjp.pl/haslo/podglad/47353/kurwa-mac
- Polish Wiktionary, `kurwa`: https://pl.wiktionary.org/wiki/kurwa
- Australian eSafety Commissioner, adult cyber abuse: https://www.esafety.gov.au/key-topics/adult-cyber-abuse
- Australian National Dictionary Centre, `drongo`: https://history.cass.anu.edu.au/centres/andc/australian-words-d
- Cambridge Dictionary, `galah`: https://dictionary.cambridge.org/us/dictionary/english/galah
- Green's Dictionary of Slang, `dropkick`: https://greensdictofslang.com/entry/ssdbdzi
- ABC, changing Australian insults and the importance of context: https://www.abc.net.au/news/2026-05-25/swearing-insults-offensive-words-change-over-time/106711220
- ABC, `bogan` identity and self-description: https://www.abc.net.au/news/2017-06-04/rebel-wilsons-bogan-pride-how-to-spot-a-bogan/8582890
- ACL Anthology, Czech offensive-language dataset research: https://aclanthology.org/2023.ldk-1.68.pdf
- University of West Bohemia, Czech invectivity and insulting as a pragmatic act: https://dspace.zcu.cz/items/3b4381be-17fc-411f-b0ad-604dddb2b2a6
- Masaryk University, functional offensive-language taxonomy tested on English, Czech, Lithuanian and Polish: https://www.muni.cz/en/research/publications/2362562
- Lithuanian Hate Speech Corpus: https://clarin-repo.lt/items/c128682b-75d7-42f1-a300-b01776307edd
- Czech Encyklopedický slovník, vulgarism: https://www.czechency.org/slovnik/VULGARISMUS
- Estonian Language Institute dictionary, `loll`: https://arhiiv.eki.ee/dict/ekss/index.cgi?Q=lollid
- Estonian Sõnaveeb, `sitapea`: https://sonaveeb.ee/search/unif/dlall/dsall/sitapea/1/est
- HurtLex multilingual lexicon project: https://github.com/valeriobasile/hurtlex
- Multilingual HateCheck: https://aclanthology.org/2022.woah-1.15.pdf
- AraTar Arabic fine-grained hate-target corpus: https://aclanthology.org/2024.osact-1.1/
- OSACT5 Arabic offensive-language and fine-grained hate shared task: https://aclanthology.org/2022.osact-1.20/
- KOLD Korean Offensive Language Dataset: https://aclanthology.org/2022.emnlp-main.744/
- Japanese Taboo Wordnet: https://aclanthology.org/2021.gwc-1.5/
- Abusive Language Recognition in Russian: https://aclanthology.org/2021.bsnlp-1.3.pdf
- HATECAT-TR Turkish hate-speech span dataset: https://aclanthology.org/2025.findings-emnlp.1393/
- Bengali actual and Romanised social-media abuse dataset: https://aclanthology.org/2022.aacl-main.23/
- Hebrew detoxification with meaning-preservation evaluation: https://aclanthology.org/2025.ranlp-1.149/
- Vietnamese targeted hate and offensive-span dataset: https://aclanthology.org/2023.eacl-main.47/
- Indonesian hate target, category and severity dataset: https://aclanthology.org/W19-3506/
- Amharic offensive-language intensity and target dataset: https://aclanthology.org/2024.trac-1.17/
- Thai hate-speech dataset: https://github.com/dsmlr/HateThaiSent
- Swahili code-switched hate-speech dataset: https://zenodo.org/records/14103420
- Dravidian-CodeMix shared task covering Tamil, Malayalam and Kannada: https://aclanthology.org/2021.dravidianlangtech-1.17/
- Offensive-language identification in Dravidian code-mixed text: https://aclanthology.org/2021.dravidianlangtech-1.5/
- Tamil and Telugu code-mixed abusive-language work: https://aclanthology.org/2023.dravidianlangtech-1.33/
- Marathi MahaHate corpus: https://aclanthology.org/2022.trac-1.1/
- Marathi Offensive Language Dataset: https://aclanthology.org/2021.ranlp-1.50/
- Nepali and Marathi target identification: https://aclanthology.org/2025.chipsal-1.39/
- HausaHate corpus: https://aclanthology.org/2024.woah-1.5/
- Hausa and Yorùbá dialogue safety: https://aclanthology.org/2026.rail-1.9/
- Nigerian social-media code mixing: https://aclanthology.org/2026.africanlp-main.9.pdf
- AfriHate multilingual African hate-speech resource: https://aclanthology.org/2025.naacl-long.92/
- EkoHate Nigerian hate-speech dataset: https://aclanthology.org/2024.woah-1.3/
- Dog-whistle disambiguation as context-dependent inference: https://aclanthology.org/2024.acl-long.675/
- Word-level code-mixed hate-speech identification: https://aclanthology.org/2025.findings-acl.1086/
- Cross-lingual text detoxification and transfer limitations: https://aclanthology.org/2022.acl-srw.26/
- Multilingual semantic-preservation detoxification: https://aclanthology.org/2025.emnlp-main.1636/
- Chinese sentiment-polarity preserving detoxification: https://aclanthology.org/2025.emnlp-main.1808/
- Multilingual parallel detoxification including Amharic: https://aclanthology.org/2025.coling-main.535/
- Multilingual content moderation and the universal-robustness gap: https://aclanthology.org/2024.emnlp-demo.15/

## All-language boundary

No static lexicon can safely cover all languages. Production coverage requires language and script identification, native-language policy packs, transliteration, multilingual contextual models, a translation cross-check, ensemble disagreement handling, specialist review, appeals and continuously measured false-positive/false-negative performance by language and community.

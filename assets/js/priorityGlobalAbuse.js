// K1ND.world v4.10 — priority global functional-abuse policy pack.
//
// This pack extends the product preview across fourteen additional languages.
// Rules are organised by abuse function, not by a flat banned-word list. Bare
// personal labels require target evidence; severe directed family/sexual abuse,
// death wishes and high-confidence identity hate are blocked. Dictionary,
// translation, research and policy discussion are excluded when they do not
// contain a fresh attack.

export const PRIORITY_GLOBAL_PACK_VERSION = "2026.08-priority-global-1";

export const PRIORITY_GLOBAL_ABUSE_RULES = [
  { id:"ar-personal", code:"ar", language:"Arabic", displayTerm:"يا حمار · يا غبي", forms:"يا\\s+(?:حمار|غبي)|انت\\s+غبي", targets:"يا|انت|انتي|هو|هي|لاعب|لاعبة", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Arabic vocative or second-person fool labels are moderated when directed at a participant.", safeExample:"يشرح القاموس كلمة غبي كمثال لغوي." },
  { id:"ar-dismissal", code:"ar", language:"Arabic", displayTerm:"انقلع · اغرب عن وجهي", forms:"انقلع|اغرب\\s+عن\\s+وجهي", targets:"انت|انتي|يا", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"من فضلك اتركني وشأني.", rationale:"A forceful Arabic command dismisses the addressed participant.", safeExample:"يترجم البحث عبارة انقلع في سياق لغوي." },
  { id:"ar-family", code:"ar", language:"Arabic", displayTerm:"targeted severe family abuse", forms:"ابن\\s+(?:الكلب|العاهر(?:ة|ه))", targets:"يا|انت|هو|لاعب", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Arabic family-directed label is blocked as targeted degradation.", safeExample:"يناقش البحث شتيمة عائلية دون توجيهها إلى شخص." },
  { id:"ar-death", code:"ar", language:"Arabic", displayTerm:"directed death wish", forms:"موت\\s+يا", targets:"يا|انت|انتي", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Arabic imperative explicitly tells the addressed person to die.", safeExample:"تذكر السياسة العبارة كمثال محظور." },
  { id:"ar-identity", code:"ar", language:"Arabic", displayTerm:"high-confidence Arabic identity slur", forms:"يا\\s+شاذ", targets:"يا|انت|هو", mode:"prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A high-confidence homophobic vocative is blocked while non-directed linguistic discussion remains allowed.", safeExample:"يحلل الباحث المصطلح في دراسة عن خطاب الكراهية." },

  { id:"ru-personal", code:"ru", language:"Russian", displayTerm:"ты идиот · ты придурок · ты дебил", forms:"(?:ты|он|она)\\s+(?:идиот|придурок|дебил)", targets:"ты|он|она|игрок|спортсмен|спортсменка", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Russian personal degradation is moderated when a participant is the grammatical target.", safeExample:"Словарь объясняет слово идиот как оскорбление." },
  { id:"ru-dismissal", code:"ru", language:"Russian", displayTerm:"пошёл на хуй", forms:"пош(?:е|о)л(?:а)?\\s+на\\s+хуи", targets:"ты|вы", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Пожалуйста, оставь меня в покое.", rationale:"A vulgar Russian dismissal is treated as an aggressive request for distance.", safeExample:"Исследование переводит эту фразу как языковой пример." },
  { id:"ru-family", code:"ru", language:"Russian", displayTerm:"targeted severe family abuse", forms:"сын\\s+шлюхи", targets:"ты|он|игрок", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Russian sexualised family label is blocked.", safeExample:"Лингвист цитирует семейное оскорбление в исследовании." },
  { id:"ru-death", code:"ru", language:"Russian", displayTerm:"сдохни", forms:"сдохни", targets:"ты|вы", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Russian imperative wishes death on the recipient.", safeExample:"Правило приводит слово сдохни только как запрещённый пример." },
  { id:"ru-identity", code:"ru", language:"Russian", displayTerm:"high-confidence targeted Russian ethnic slur", forms:"чурк(?:а|и|у|ои)", targets:"ты|он|она|они|игрок|спортсмен", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"The term has a literal sense, so it is blocked only when person-targeting evidence makes the ethnic slur use clear.", safeExample:"Словарь также описывает буквальное значение слова." },

  { id:"uk-personal", code:"uk", language:"Ukrainian", displayTerm:"ти ідіот · ти дурень · ти дебіл", forms:"(?:ти|він|вона)\\s+(?:ідіот|дурень|дебіл)", targets:"ти|він|вона|гравець|спортсмен|спортсменка", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Ukrainian fool and idiot labels receive intervention when directed at somebody.", safeExample:"Словник пояснює слово ідіот як образливе." },
  { id:"uk-dismissal", code:"uk", language:"Ukrainian", displayTerm:"іди нахуй", forms:"іди\\s+нахуи", targets:"ти|ви", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Будь ласка, залиш мене в спокої.", rationale:"A vulgar Ukrainian dismissal is converted into a recoverable request for distance.", safeExample:"Дослідження перекладає цю фразу як мовний приклад." },
  { id:"uk-family", code:"uk", language:"Ukrainian", displayTerm:"targeted severe family abuse", forms:"син\\s+пові{1,2}", targets:"ти|він|гравець", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Ukrainian sexualised family label is blocked.", safeExample:"Лінгвіст цитує сімейну образу для дослідження." },
  { id:"uk-death", code:"uk", language:"Ukrainian", displayTerm:"здохни", forms:"здохни", targets:"ти|ви", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Ukrainian imperative explicitly wishes death on the recipient.", safeExample:"Політика наводить це слово лише як заборонений приклад." },
  { id:"uk-identity", code:"uk", language:"Ukrainian", displayTerm:"high-confidence Ukrainian homophobic slur", forms:"педик(?:и|а|ом)?", targets:"ти|він|вона|вони|гравець", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A high-confidence homophobic label is blocked when directed at a person; research discussion remains allowed.", safeExample:"Дослідження аналізує гомофобну лексику." },

  { id:"zh-personal", code:"zh", language:"Mandarin Chinese", displayTerm:"你是白痴 · 你是傻逼", forms:"你(?:就)?是(?:个)?(?:白痴|傻逼)", targets:"你|他|她|球员|运动员", compact:true, mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Mandarin second-person fool labels are moderated as direct personal attacks.", safeExample:"词典把白痴列为侮辱性词语。" },
  { id:"zh-dismissal", code:"zh", language:"Mandarin Chinese", displayTerm:"滚开 · 滚蛋", forms:"滚开|滚蛋", targets:"你", compact:true, mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"请别再打扰我。", rationale:"A Mandarin command aggressively dismisses the addressed participant.", safeExample:"研究把滚开作为翻译例子。" },
  { id:"zh-family", code:"zh", language:"Mandarin Chinese", displayTerm:"targeted severe family abuse", forms:"操你妈|草你妈", targets:"你", compact:true, mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Mandarin sexualised family attack is blocked.", safeExample:"语言研究引用该家庭侮辱语。" },
  { id:"zh-death", code:"zh", language:"Mandarin Chinese", displayTerm:"去死", forms:"去死", targets:"你", compact:true, mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Mandarin imperative tells the recipient to die.", safeExample:"政策把去死列为禁止示例。" },
  { id:"zh-identity", code:"zh", language:"Mandarin Chinese", displayTerm:"high-confidence Mandarin identity slur", forms:"支那(?:人)?", targets:"你|他|她|他们|日本人|中国人", compact:true, mode:"prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A high-confidence historical ethnic slur is blocked outside clear educational or historical discussion.", safeExample:"历史研究解释支那一词的侮辱性。" },

  { id:"ja-personal", code:"ja", language:"Japanese", displayTerm:"お前は馬鹿 · お前はアホ", forms:"(?:お前|あなた)は(?:馬鹿|バカ|アホ)", targets:"お前|あなた|彼|彼女|選手", compact:true, mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Japanese second-person fool labels are moderated when directed at a participant.", safeExample:"辞書はバカという言葉を侮辱語として説明する。" },
  { id:"ja-dismissal", code:"ja", language:"Japanese", displayTerm:"消えろ · 失せろ", forms:"消えろ|失せろ", targets:"お前|あなた", compact:true, mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"もう関わらないでください。", rationale:"A Japanese command aggressively orders the recipient to disappear or go away.", safeExample:"研究は消えろという表現を翻訳例として扱う。" },
  { id:"ja-sexualised", code:"ja", language:"Japanese", displayTerm:"targeted severe sexualised abuse", forms:"(?:お前|この)(?:は)?売女", targets:"お前|あなた|この女", compact:true, mode:"prohibited", outcome:"block", mechanism:"sexualised_misogyny", rationale:"A severe Japanese sexualised label aimed at a woman is blocked.", safeExample:"歴史研究は売女という語の用法を分析する。" },
  { id:"ja-death", code:"ja", language:"Japanese", displayTerm:"死ね", forms:"死ね", targets:"お前|あなた", compact:true, mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Japanese imperative tells the recipient to die.", safeExample:"方針は死ねを禁止例として引用する。" },
  { id:"ja-identity", code:"ja", language:"Japanese", displayTerm:"high-confidence targeted Japanese ethnic slur", forms:"チョン", targets:"お前|あなた|彼|彼女|あいつ", compact:true, mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A high-confidence anti-Korean slur is blocked when used as a label for a person.", safeExample:"研究はチョンという差別語の歴史を説明する。" },

  { id:"ko-personal", code:"ko", language:"Korean", displayTerm:"너는 바보 · 너는 병신", forms:"너(?:는|가)?\\s*(?:바보|병신)", targets:"너|당신|그|그녀|선수", compact:true, mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Korean second-person degradation is moderated as a direct personal attack.", safeExample:"사전은 바보라는 단어를 모욕 표현으로 설명한다." },
  { id:"ko-dismissal", code:"ko", language:"Korean", displayTerm:"꺼져", forms:"꺼져", targets:"너|당신", compact:true, mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"제발 나를 내버려 둬.", rationale:"A Korean command aggressively dismisses the recipient.", safeExample:"연구는 꺼져라는 표현을 번역 예시로 사용한다." },
  { id:"ko-family", code:"ko", language:"Korean", displayTerm:"targeted severe family abuse", forms:"(?:니\\s*애미|네\\s*엄마)\\s*창녀", targets:"너|니|네", compact:true, mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Korean sexualised attack involving the recipient's mother is blocked.", safeExample:"언어 연구는 가족 모욕 표현을 인용한다." },
  { id:"ko-death", code:"ko", language:"Korean", displayTerm:"죽어", forms:"죽어", targets:"너|당신", compact:true, mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Korean imperative tells the recipient to die.", safeExample:"정책은 죽어를 금지된 예시로 제시한다." },
  { id:"ko-identity", code:"ko", language:"Korean", displayTerm:"high-confidence targeted Korean ethnic slur", forms:"짱깨", targets:"너|당신|그|그녀|중국인", compact:true, mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A high-confidence anti-Chinese slur is blocked when used as a personal or group label.", safeExample:"연구는 짱깨라는 차별어를 분석한다." },

  { id:"tr-personal", code:"tr", language:"Turkish", displayTerm:"sen aptalsın · sen salaksın", forms:"sen\\s+(?:aptals[ıi]n|salaks[ıi]n)|gerizekal[ıi]s[ıi]n", targets:"sen|o|oyuncu|sporcu", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Turkish second-person fool labels receive intervention.", safeExample:"Sözlük aptal kelimesini hakaret olarak açıklar." },
  { id:"tr-dismissal", code:"tr", language:"Turkish", displayTerm:"siktir git", forms:"siktir\\s+git", targets:"sen|siz", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Lütfen beni rahat bırak.", rationale:"A vulgar Turkish dismissal preserves only the request for distance.", safeExample:"Araştırma siktir git ifadesini çeviri örneği olarak inceler." },
  { id:"tr-family", code:"tr", language:"Turkish", displayTerm:"targeted severe family abuse", forms:"orospu\\s+cocugu", targets:"sen|o|oyuncu", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Turkish sexualised family insult is blocked.", safeExample:"Dilbilimci aileye yönelik hakareti araştırmada alıntılar." },
  { id:"tr-death", code:"tr", language:"Turkish", displayTerm:"geber", forms:"geber", targets:"sen|siz", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Turkish imperative tells the recipient to die.", safeExample:"Politika geber sözcüğünü yasaklı örnek olarak verir." },
  { id:"tr-identity", code:"tr", language:"Turkish", displayTerm:"high-confidence targeted Turkish homophobic slur", forms:"ibne(?:sin|dir|ler)?", targets:"sen|o|onlar|oyuncu", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A homophobic Turkish label is blocked when directed at a person while research and reclaimed discussion remain reviewable.", safeExample:"Araştırma ibne kelimesinin hakaret kullanımını analiz eder." },

  { id:"el-personal", code:"el", language:"Greek", displayTerm:"είσαι ηλίθιος · είσαι βλάκας", forms:"εισαι\\s+(?:ηλιθιος|ηλιθια|βλακας|βλακα|μαλακας)", targets:"εσυ|εισαι|αυτος|αυτη|παικτης|αθλητης", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Greek fool and idiot labels are moderated when a participant is targeted.", safeExample:"Το λεξικό εξηγεί τη λέξη ηλίθιος ως προσβολή." },
  { id:"el-dismissal", code:"el", language:"Greek", displayTerm:"άντε γαμήσου", forms:"αντε\\s+γαμησου", targets:"εσυ|σου", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Σε παρακαλώ, άφησέ με ήσυχο.", rationale:"A vulgar Greek dismissal is reduced to its recoverable request for distance.", safeExample:"Η έρευνα μεταφράζει τη φράση ως γλωσσικό παράδειγμα." },
  { id:"el-family", code:"el", language:"Greek", displayTerm:"targeted severe family abuse", forms:"γιε\\s+της\\s+πουτανας", targets:"εσυ|αυτος|παικτης", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Greek sexualised family label is blocked.", safeExample:"Ο γλωσσολόγος παραθέτει οικογενειακή προσβολή σε μελέτη." },
  { id:"el-death", code:"el", language:"Greek", displayTerm:"ψόφα", forms:"ψοφα", targets:"εσυ|σου", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Greek imperative wishes death on the recipient.", safeExample:"Η πολιτική αναφέρει τη λέξη μόνο ως απαγορευμένο παράδειγμα." },
  { id:"el-identity", code:"el", language:"Greek", displayTerm:"high-confidence targeted Greek ethnic slur", forms:"γυφτ(?:ος|ε|οι|ων)", targets:"εσυ|αυτος|αυτη|αυτοι|παικτης", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"An anti-Roma Greek label is blocked when person-targeting evidence makes the derogatory use clear.", safeExample:"Η ιστορική μελέτη εξηγεί τη χρήση του όρου." },

  { id:"ro-personal", code:"ro", language:"Romanian", displayTerm:"ești prost · ești idiot", forms:"esti\\s+(?:prost|proasta|idiot|idioata)", targets:"tu|esti|el|ea|jucator|sportiv|sportiva", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Romanian second-person fool labels receive intervention.", safeExample:"Dicționarul explică termenul idiot ca insultă." },
  { id:"ro-dismissal", code:"ro", language:"Romanian", displayTerm:"du-te dracului", forms:"du\\s+te\\s+dracului", targets:"tu|voi", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Te rog, lasă-mă în pace.", rationale:"A Romanian dismissal is converted into a request to be left alone.", safeExample:"Studiul traduce expresia ca exemplu lingvistic." },
  { id:"ro-family", code:"ro", language:"Romanian", displayTerm:"targeted severe family abuse", forms:"fiu\\s+de\\s+curva", targets:"tu|el|jucator", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Romanian sexualised family label is blocked.", safeExample:"Cercetarea citează insulta familială fără a o adresa cuiva." },
  { id:"ro-death", code:"ro", language:"Romanian", displayTerm:"mori", forms:"mori", targets:"tu|voi", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The imperative form tells the recipient to die; linguistic discussion remains allowed.", safeExample:"Politica menționează cuvântul mori ca exemplu interzis." },
  { id:"ro-identity", code:"ro", language:"Romanian", displayTerm:"high-confidence targeted Romanian homophobic slur", forms:"poponar(?:ule|i)?", targets:"tu|el|ei|jucator", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A high-confidence homophobic Romanian label is blocked when directed at a person.", safeExample:"Studiul analizează termenul homofob în context istoric." },

  { id:"hu-personal", code:"hu", language:"Hungarian", displayTerm:"hülye vagy · idióta vagy", forms:"(?:hulye|idiota)\\s+vagy", targets:"te|vagy|o|jatekos|sportolo", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Hungarian second-person fool labels are moderated as personal attacks.", safeExample:"A szótár az idióta szót sértésként magyarázza." },
  { id:"hu-dismissal", code:"hu", language:"Hungarian", displayTerm:"menj a picsába", forms:"menj\\s+a\\s+picsaba", targets:"te|ti", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Kérlek, hagyj békén.", rationale:"A vulgar Hungarian dismissal preserves only the request for distance.", safeExample:"A kutatás nyelvi példaként fordítja le a kifejezést." },
  { id:"hu-family", code:"hu", language:"Hungarian", displayTerm:"targeted severe family abuse", forms:"kurva\\s+anyad", targets:"te|o|jatekos", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Hungarian sexualised attack involving the recipient's mother is blocked.", safeExample:"A nyelvész kutatási példaként idézi a családi sértést." },
  { id:"hu-death", code:"hu", language:"Hungarian", displayTerm:"dögölj meg", forms:"dogolj\\s+meg", targets:"te|ti", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Hungarian phrase tells the recipient to die.", safeExample:"A szabály csak tiltott példaként említi a kifejezést." },
  { id:"hu-identity", code:"hu", language:"Hungarian", displayTerm:"high-confidence targeted Hungarian homophobic slur", forms:"buzi", targets:"te|o|ok|jatekos", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A Hungarian homophobic label is blocked when used against a person; neutral research discussion is excluded.", safeExample:"A tanulmány a buzi szó sértő használatát elemzi." },

  { id:"sk-personal", code:"sk", language:"Slovak", displayTerm:"si idiot · si debil · si hlupák", forms:"(?:ty\\s+)?si\\s+(?:idiot|debil|hlupak)", targets:"ty|on|ona|hrac|sportovec|sportovkyna", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Slovak person-directed fool labels receive intervention.", safeExample:"Slovník vysvetľuje slovo idiot ako urážku." },
  { id:"sk-dismissal", code:"sk", language:"Slovak", displayTerm:"choď do riti", forms:"chod\\s+do\\s+riti", targets:"ty|vy", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Prosím, nechaj ma na pokoji.", rationale:"A vulgar Slovak dismissal is converted into a request to be left alone.", safeExample:"Výskum prekladá frázu ako jazykový príklad." },
  { id:"sk-family", code:"sk", language:"Slovak", displayTerm:"targeted severe family abuse", forms:"syn\\s+kurvy", targets:"ty|on|hrac", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Slovak sexualised family label is blocked.", safeExample:"Jazykovedec cituje rodinnú urážku vo výskume." },
  { id:"sk-death", code:"sk", language:"Slovak", displayTerm:"zdochni", forms:"zdochni", targets:"ty|vy", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Slovak imperative explicitly wishes death on the recipient.", safeExample:"Pravidlo uvádza slovo iba ako zakázaný príklad." },
  { id:"sk-identity", code:"sk", language:"Slovak", displayTerm:"high-confidence targeted Slovak homophobic slur", forms:"buzerant(?:i|a|om)?", targets:"ty|on|oni|hrac", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A Slovak homophobic label is blocked when directed at a person.", safeExample:"Štúdia analyzuje homofóbny výraz v historickom kontexte." },

  { id:"bcs-personal", code:"bcs", language:"Serbian · Croatian · Bosnian", displayTerm:"ti si idiot · budala · kreten", forms:"(?:ti\\s+si|ти\\s+си)\\s+(?:idiot|budala|debil|kreten|идиот|будала|дебил|кретен)", targets:"ti|on|ona|igrac|sportista|ти|он|она|играч|спортиста", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Serbian, Croatian and Bosnian personal labels receive intervention when directed at a participant.", safeExample:"Rječnik objašnjava riječ idiot kao uvredu." },
  { id:"bcs-dismissal", code:"bcs", language:"Serbian · Croatian · Bosnian", displayTerm:"odjebi · марш", forms:"odjebi|марш", targets:"ti|vi|ти|ви", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Molim te, ostavi me na miru.", rationale:"A South Slavic dismissal is converted into a neutral request for distance.", safeExample:"Istraživanje prevodi izraz kao jezički primjer." },
  { id:"bcs-family", code:"bcs", language:"Serbian · Croatian · Bosnian", displayTerm:"targeted severe family abuse", forms:"jebem\\s+ti\\s+(?:mater|majku)|јебем\\s+ти\\s+(?:матер|мајку)", targets:"ti|tebi|ти|теби", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe South Slavic sexualised family attack is blocked.", safeExample:"Lingvista citira porodičnu uvredu u istraživanju." },
  { id:"bcs-death", code:"bcs", language:"Serbian · Croatian · Bosnian", displayTerm:"crkni · цркни", forms:"crkni|цркни", targets:"ti|vi|ти|ви", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The imperative tells the recipient to die in Serbian, Croatian or Bosnian.", safeExample:"Pravilo navodi riječ samo kao zabranjeni primjer." },
  { id:"bcs-identity", code:"bcs", language:"Serbian · Croatian · Bosnian", displayTerm:"high-confidence targeted South Slavic homophobic slur", forms:"peder(?:u|i|a)?|педер(?:у|и|а)?", targets:"ti|on|oni|igrac|ти|он|они|играч", mode:"targeted_prohibited", outcome:"block", mechanism:"identity_slur", rationale:"A high-confidence homophobic label is blocked when directed at a person; research and quoted analysis remain allowed.", safeExample:"Studija analizira homofobni izraz u istorijskom kontekstu." },
];

// Functional regression fixtures: each language has abusive outcomes plus
// counterexamples proving that dictionary/research use is not a keyword trap.
export const PRIORITY_GLOBAL_TEST_CASES = [
  { input:"يا حمار.", expect:"warning", expectNoRewrite:true },
  { input:"انقلع.", expect:"warning", expectRewrite:"من فضلك اتركني وشأني." },
  { input:"يا ابن الكلب.", displayInput:"[targeted Arabic severe family abuse]", expect:"block" },
  { input:"موت يا لاعب.", displayInput:"[directed Arabic death wish]", expect:"block" },
  { input:"يا شاذ.", displayInput:"[Arabic homophobic slur]", expect:"block" },
  { input:"القاموس يشرح عبارة يا حمار كمثال لغوي.", expect:"clean" },
  { input:"يدرس البحث عبارة يا شاذ في سياق خطاب الكراهية.", displayInput:"[Arabic research discussion of a slur]", expect:"clean" },

  { input:"Ты идиот.", expect:"warning", expectNoRewrite:true },
  { input:"Пошёл на хуй.", expect:"warning", expectRewrite:"Пожалуйста, оставь меня в покое." },
  { input:"Ты сын шлюхи.", displayInput:"[targeted Russian severe family abuse]", expect:"block" },
  { input:"Сдохни.", displayInput:"[Russian death wish]", expect:"block" },
  { input:"Ты чурка.", displayInput:"[targeted Russian ethnic slur]", expect:"block" },
  { input:"Словарь объясняет слово идиот как оскорбление.", expect:"clean" },
  { input:"Словарь объясняет слово чурка и его буквальное значение.", displayInput:"[Russian dictionary discussion of an ambiguous slur]", expect:"clean" },

  { input:"Ти ідіот.", expect:"warning", expectNoRewrite:true },
  { input:"Іди нахуй.", expect:"warning", expectRewrite:"Будь ласка, залиш мене в спокої." },
  { input:"Ти син повії.", displayInput:"[targeted Ukrainian severe family abuse]", expect:"block" },
  { input:"Здохни.", displayInput:"[Ukrainian death wish]", expect:"block" },
  { input:"Ти педик.", displayInput:"[targeted Ukrainian homophobic slur]", expect:"block" },
  { input:"Словник пояснює слово ідіот як образливе.", expect:"clean" },
  { input:"Дослідження аналізує слово педик як гомофобну лексику.", displayInput:"[Ukrainian research discussion of a slur]", expect:"clean" },

  { input:"你是白痴。", expect:"warning", expectNoRewrite:true },
  { input:"滚开。", expect:"warning", expectRewrite:"请别再打扰我。" },
  { input:"操你妈。", displayInput:"[Mandarin severe family abuse]", expect:"block" },
  { input:"你去死。", displayInput:"[Mandarin death wish]", expect:"block" },
  { input:"支那人。", displayInput:"[Mandarin historical ethnic slur]", expect:"block" },
  { input:"词典把白痴列为侮辱性词语。", expect:"clean" },
  { input:"历史研究解释支那一词的侮辱性。", displayInput:"[Mandarin historical discussion of a slur]", expect:"clean" },

  { input:"お前は馬鹿だ。", expect:"warning", expectNoRewrite:true },
  { input:"消えろ。", expect:"warning", expectRewrite:"もう関わらないでください。" },
  { input:"この売女。", displayInput:"[targeted Japanese sexualised abuse]", expect:"block" },
  { input:"死ね。", displayInput:"[Japanese death wish]", expect:"block" },
  { input:"お前はチョンだ。", displayInput:"[targeted Japanese ethnic slur]", expect:"block" },
  { input:"辞書はバカという言葉を侮辱語として説明する。", expect:"clean" },
  { input:"研究はチョンという差別語の歴史を説明する。", displayInput:"[Japanese research discussion of a slur]", expect:"clean" },

  { input:"너는 바보야.", expect:"warning", expectNoRewrite:true },
  { input:"꺼져.", expect:"warning", expectRewrite:"제발 나를 내버려 둬." },
  { input:"니 애미 창녀.", displayInput:"[targeted Korean severe family abuse]", expect:"block" },
  { input:"죽어.", displayInput:"[Korean death wish]", expect:"block" },
  { input:"너는 짱깨야.", displayInput:"[targeted Korean ethnic slur]", expect:"block" },
  { input:"사전은 바보라는 단어를 모욕 표현으로 설명한다.", expect:"clean" },
  { input:"연구는 짱깨라는 차별어를 분석한다.", displayInput:"[Korean research discussion of a slur]", expect:"clean" },

  { input:"Sen aptalsın.", expect:"warning", expectNoRewrite:true },
  { input:"Siktir git.", expect:"warning", expectRewrite:"Lütfen beni rahat bırak." },
  { input:"Sen orospu çocuğu.", displayInput:"[targeted Turkish severe family abuse]", expect:"block" },
  { input:"Geber.", displayInput:"[Turkish death wish]", expect:"block" },
  { input:"Sen ibnesin.", displayInput:"[targeted Turkish homophobic slur]", expect:"block" },
  { input:"Sözlük aptal kelimesini hakaret olarak açıklar.", expect:"clean" },
  { input:"Araştırma ibne kelimesinin hakaret kullanımını analiz eder.", displayInput:"[Turkish research discussion of a slur]", expect:"clean" },

  { input:"Είσαι ηλίθιος.", expect:"warning", expectNoRewrite:true },
  { input:"Άντε γαμήσου.", expect:"warning", expectRewrite:"Σε παρακαλώ, άφησέ με ήσυχο." },
  { input:"Είσαι γιε της πουτάνας.", displayInput:"[targeted Greek severe family abuse]", expect:"block" },
  { input:"Ψόφα.", displayInput:"[Greek death wish]", expect:"block" },
  { input:"Εσύ είσαι γύφτος.", displayInput:"[targeted Greek ethnic slur]", expect:"block" },
  { input:"Το λεξικό εξηγεί τη λέξη ηλίθιος ως προσβολή.", expect:"clean" },
  { input:"Η ιστορική μελέτη εξηγεί τη χρήση του όρου γύφτος.", displayInput:"[Greek research discussion of a slur]", expect:"clean" },

  { input:"Ești prost.", expect:"warning", expectNoRewrite:true },
  { input:"Du-te dracului.", expect:"warning", expectRewrite:"Te rog, lasă-mă în pace." },
  { input:"Ești fiu de curvă.", displayInput:"[targeted Romanian severe family abuse]", expect:"block" },
  { input:"Mori!", displayInput:"[Romanian death wish]", expect:"block" },
  { input:"Tu ești poponar.", displayInput:"[targeted Romanian homophobic slur]", expect:"block" },
  { input:"Dicționarul explică expresia ești prost ca insultă.", expect:"clean" },
  { input:"Studiul analizează termenul poponar în context istoric.", displayInput:"[Romanian research discussion of a slur]", expect:"clean" },

  { input:"Hülye vagy.", expect:"warning", expectNoRewrite:true },
  { input:"Menj a picsába.", expect:"warning", expectRewrite:"Kérlek, hagyj békén." },
  { input:"Kurva anyád.", displayInput:"[targeted Hungarian severe family abuse]", expect:"block" },
  { input:"Dögölj meg.", displayInput:"[Hungarian death wish]", expect:"block" },
  { input:"Te buzi vagy.", displayInput:"[targeted Hungarian homophobic slur]", expect:"block" },
  { input:"A szótár az idióta szót sértésként magyarázza.", expect:"clean" },
  { input:"A tanulmány a buzi szó sértő használatát elemzi.", displayInput:"[Hungarian research discussion of a slur]", expect:"clean" },

  { input:"Ty si idiot.", expect:"warning", expectNoRewrite:true },
  { input:"Choď do riti.", expect:"warning", expectRewrite:"Prosím, nechaj ma na pokoji." },
  { input:"Ty si syn kurvy.", displayInput:"[targeted Slovak severe family abuse]", expect:"block" },
  { input:"Zdochni.", displayInput:"[Slovak death wish]", expect:"block" },
  { input:"Ty si buzerant.", displayInput:"[targeted Slovak homophobic slur]", expect:"block" },
  { input:"Slovník vysvetľuje vetu ty si idiot ako urážku.", expect:"clean" },
  { input:"Štúdia analyzuje slovo buzerant v historickom kontexte.", displayInput:"[Slovak research discussion of a slur]", expect:"clean" },

  { input:"Ti si idiot.", expect:"warning", expectNoRewrite:true },
  { input:"Ти си идиот.", expect:"warning", expectNoRewrite:true },
  { input:"Odjebi.", expect:"warning", expectRewrite:"Molim te, ostavi me na miru." },
  { input:"Jebem ti mater.", displayInput:"[South Slavic severe family abuse]", expect:"block" },
  { input:"Crkni.", displayInput:"[South Slavic death wish]", expect:"block" },
  { input:"Цркни.", displayInput:"[South Slavic Cyrillic death wish]", expect:"block" },
  { input:"Ti si peder.", displayInput:"[targeted South Slavic homophobic slur]", expect:"block" },
  { input:"Rječnik objašnjava izraz ti si idiot kao uvredu.", expect:"clean" },
  { input:"Studija analizira riječ peder u istorijskom kontekstu.", displayInput:"[South Slavic research discussion of a slur]", expect:"clean" },
];

const EDUCATIONAL = /(?:\b(?:word|term|phrase|dictionary|definition|translation|translate|research|study|analysis|example|policy|history|slovo|termin|slovar|perevod|issledovan|primer|slovnik|pereklad|doslidzen|priklad|sozluk|kelime|arastirma|ceviri|lexic|dictionar(?:ul)?|studiu|cercetare|szotar|kutatas|tanulmany|vyskum|studia|studija|rjecnik|rjec|istrazivanje|lingvist)\b|слово|термин|словар|перевод|исследован|пример|политик|досліджен|словник|переклад|приклад|студија|истраживање|речник|λεξικ|ερευν|μελετ|παραδειγ|πολιτικ|كلمة|مصطلح|قاموس|ترجم|بحث|دراس|مثال|سياس|这个词|词语|词典|翻译|研究|例子|という言葉|単語|辞書|翻訳|研究|例|단어|사전|번역|연구|예시)/u;
const RESIDUAL_ATTACK = /(?:\b(?:but|and)\s+you\b|\bно\s+ты\b|\bале\s+ти\b|但是你|可是你|でもお前|しかしお前|하지만\s*너|그런데\s*너|\bama\s+sen\b|\bαλλα\s+εσυ\b|\bdar\s+tu\b|\bde\s+te\b|\bale\s+ty\b|\bali\s+ti\b|\bали\s+ти\b|لكن\s+انت)/u;
const COMMON_TARGETS = "you|u|he|she|they|player|athlete|@[a-z0-9_.-]+";

function foldPolicyText(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
    .replace(/[^\p{L}\p{N}@]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pattern(rule) {
  return rule.compact
    ? new RegExp(`(?:${rule.forms})`, "u")
    : new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${rule.forms})(?=$|[^\\p{L}\\p{N}])`, "u");
}

function targetPattern(rule) {
  const body = `(?:${COMMON_TARGETS}|${rule.targets})`;
  return rule.compact ? new RegExp(body, "u") : new RegExp(`(?:^|[^\\p{L}\\p{N}])${body}(?=$|[^\\p{L}\\p{N}])`, "u");
}

function isTargeted(rule, folded) {
  if (!targetPattern(rule).test(folded)) return false;
  const hit = folded.match(pattern(rule));
  if (!hit) return false;
  const target = folded.match(targetPattern(rule));
  if (!target) return false;
  return Math.abs((hit.index || 0) - (target.index || 0)) <= 48 || rule.compact;
}

export function moderatePriorityGlobalAbuse(original) {
  const folded = foldPolicyText(original);
  const educational = EDUCATIONAL.test(folded);

  for (const rule of PRIORITY_GLOBAL_ABUSE_RULES) {
    if (!pattern(rule).test(folded)) continue;
    const targeted = isTargeted(rule, folded);
    if (educational && !RESIDUAL_ATTACK.test(folded)) {
      return {
        outcome:"clean", category:"contextual_safe", reason:"Quoted educational or research context",
        priorityGlobalRule:rule.id, contextOverride:"educational", policyRationale:rule.rationale,
      };
    }
    if (["targeted", "targeted_prohibited"].includes(rule.mode) && !targeted) continue;

    return {
      outcome:rule.outcome,
      category:rule.mechanism,
      reason:rule.mechanism === "harm" ? "Wishing or encouraging death" : rule.mechanism === "identity_slur" ? "High-confidence identity-based abuse" : ["sexualised_family_abuse", "sexualised_misogyny"].includes(rule.mechanism) ? "Severe targeted sexualised abuse" : rule.mechanism === "dismissive_command" ? "Regional dismissive abuse" : "Targeted multilingual personal abuse",
      rewriteSuggestion:rule.rewrite,
      priorityGlobalRule:rule.id,
      targetHint:targeted || ["phrase", "prohibited"].includes(rule.mode) ? { label:"the addressed participant", type:"person", scope:"individual", explicitness:`explicit in ${rule.language}` } : undefined,
      policyRationale:rule.rationale,
    };
  }
  return null;
}

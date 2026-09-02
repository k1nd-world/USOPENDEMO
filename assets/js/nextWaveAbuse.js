// K1ND.world v4.11 — next-wave functional-abuse policy pack.
//
// This demo pack adds ten languages that are prominent in global sport and
// social media but underrepresented in the previous browser rules. It is not a
// flat blacklist: rules encode target, speech act, abuse mechanism, severity,
// safe linguistic context and an intent-preserving native rewrite where a
// recoverable request exists. Production activation still requires native
// reviewer sign-off, maintained corpora, appeals and monitoring.

export const NEXT_WAVE_PACK_VERSION = "2026.08-next-wave-1";

export const NEXT_WAVE_ABUSE_RULES = [
  { id:"bn-personal", code:"bn", language:"Bengali · Romanised Bengali", displayTerm:"তুমি বোকা · tumi boka", forms:"(?:তুমি|তুই)\\s+(?:বোকা|গাধা)|(?:tumi|tui)\\s+(?:boka|gadha)", targets:"তুমি|তুই|tumi|tui|খেলোয়াড়|kheloyar", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Bengali and Romanised Bengali second-person fool labels receive intervention when aimed at a participant.", safeExample:"অভিধান বোকা শব্দটিকে অপমানজনক উদাহরণ হিসেবে ব্যাখ্যা করে।" },
  { id:"bn-dismissal", code:"bn", language:"Bengali · Romanised Bengali", displayTerm:"চুপ কর · chup koro", forms:"চুপ\\s*কর|chup\\s+koro?", targets:"তুমি|তুই|tumi|tui", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"দয়া করে আমাকে একটু সময় দিন।", rationale:"A Bengali silencing command is converted into a request for space without inventing a new opinion.", safeExample:"গবেষণাটি চুপ কর বাক্যাংশটি অনুবাদের উদাহরণ হিসেবে ব্যবহার করে।" },
  { id:"bn-family", code:"bn", language:"Bengali · Romanised Bengali", displayTerm:"targeted severe family abuse", forms:"মাদারচোদ|madar(?:chod|chud)", targets:"তুমি|তুই|tumi|tui", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Bengali maternal sexual insult is blocked whether written in Bengali script or common Romanisation.", safeExample:"গবেষণাটি পারিবারিক গালিটিকে ভাষাতাত্ত্বিক উদাহরণ হিসেবে উদ্ধৃত করে।" },
  { id:"bn-death", code:"bn", language:"Bengali · Romanised Bengali", displayTerm:"directed death wish", forms:"মরে\\s*যা|more\\s+ja", targets:"তুমি|তুই|tumi|tui", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Bengali imperative tells the addressed person to die.", safeExample:"নীতিটি বাক্যাংশটিকে নিষিদ্ধ উদাহরণ হিসেবে উল্লেখ করে।" },
  { id:"bn-animal", code:"bn", language:"Bengali · Romanised Bengali", displayTerm:"তুমি কুকুর · tumi janowar", forms:"(?:তুমি|তুই)\\s+(?:কুকুর|জানোয়ার)|(?:tumi|tui)\\s+(?:kukur|janowar)", targets:"তুমি|তুই|tumi|tui", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"Animal words are moderated only when they label a person; literal animal discussion remains allowed.", safeExample:"কুকুরটি পার্কে দৌড়াচ্ছে।" },

  { id:"fa-personal", code:"fa", language:"Persian / Farsi", displayTerm:"تو احمقی · تو نادانی", forms:"تو\\s+(?:احمقی|نادانی)|to\\s+(?:ahmaghi|nadani)", targets:"تو|شما|to|shoma|بازیکن", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Persian second-person fool labels are moderated as direct personal degradation.", safeExample:"فرهنگ واژه احمق را به عنوان توهین توضیح می‌دهد." },
  { id:"fa-dismissal", code:"fa", language:"Persian / Farsi", displayTerm:"گمشو · gomsho", forms:"گمشو|gomsho", targets:"تو|شما|to|shoma", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"لطفاً من را تنها بگذار.", rationale:"A Persian dismissal is reduced to its recoverable request to be left alone.", safeExample:"پژوهش عبارت گمشو را به عنوان نمونه ترجمه می‌کند." },
  { id:"fa-family", code:"fa", language:"Persian / Farsi", displayTerm:"targeted severe family abuse", forms:"مادرجنده|madarjendeh", targets:"تو|شما|to|shoma", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Persian sexualised maternal insult is blocked.", safeExample:"پژوهشگر توهین خانوادگی را فقط برای تحلیل زبانی نقل می‌کند." },
  { id:"fa-death", code:"fa", language:"Persian / Farsi", displayTerm:"بمیر · bemir", forms:"بمیر|bemir", targets:"تو|شما|to|shoma", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Persian imperative tells the recipient to die.", safeExample:"سیاست واژه بمیر را به عنوان نمونه ممنوع ذکر می‌کند." },
  { id:"fa-animal", code:"fa", language:"Persian / Farsi", displayTerm:"تو سگی · تو حیوانی", forms:"تو\\s+(?:سگی|حیوانی)|to\\s+(?:sagi|heyvani)", targets:"تو|شما|to|shoma", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"Persian animal labels receive intervention only when applied to a person.", safeExample:"این حیوان در باغ‌وحش زندگی می‌کند." },

  { id:"he-personal", code:"he", language:"Hebrew", displayTerm:"אתה אידיוט · את טיפשה", forms:"(?:אתה|את)\\s+(?:אידיוט|אידיוטית|טיפש|טיפשה)", targets:"אתה|את|הוא|היא|שחקן|שחקנית", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Hebrew second-person fool labels receive intervention when directed at somebody.", safeExample:"המילון מסביר את המילה אידיוט כדוגמה פוגענית." },
  { id:"he-dismissal", code:"he", language:"Hebrew", displayTerm:"לך לעזאזל · לכי לעזאזל", forms:"(?:לך|לכי)\\s+לעזאזל", targets:"אתה|את", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"בבקשה, תנו לי מרחב.", rationale:"A Hebrew dismissal is converted into a neutral request for space.", safeExample:"המחקר מתרגם את הביטוי לך לעזאזל כדוגמה לשונית." },
  { id:"he-family", code:"he", language:"Hebrew", displayTerm:"targeted severe family abuse", forms:"(?:בן|בת)\\s+זונה", targets:"אתה|את|הוא|היא|שחקן|שחקנית", mode:"targeted_prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Hebrew sexualised family label is blocked when directed at a person.", safeExample:"המחקר מצטט קללה משפחתית לצורך ניתוח בלבד." },
  { id:"he-death", code:"he", language:"Hebrew", displayTerm:"תמות · תמותי", forms:"תמותי?", targets:"אתה|את", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Hebrew imperative wishes death on the recipient.", safeExample:"המדיניות מציגה את המילה כדוגמה אסורה בלבד." },
  { id:"he-animal", code:"he", language:"Hebrew", displayTerm:"אתה כלב · את חיה", forms:"(?:אתה|את)\\s+(?:כלב|חיה)", targets:"אתה|את", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"Hebrew animal nouns are moderated when used as labels for a person, not in literal discussion.", safeExample:"הכלב רץ בפארק." },

  { id:"id-personal", code:"id", language:"Indonesian", displayTerm:"kamu bodoh · kamu goblok", forms:"kamu\\s+(?:bodoh|goblok|tolol)", targets:"kamu|anda|dia|pemain|atlet", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Indonesian second-person degradation receives pre-publication intervention.", safeExample:"Kamus menjelaskan kata bodoh sebagai contoh penghinaan." },
  { id:"id-dismissal", code:"id", language:"Indonesian", displayTerm:"pergi sana · diam kamu", forms:"pergi\\s+sana|diam\\s+kamu", targets:"kamu|anda", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Tolong beri saya ruang.", rationale:"An Indonesian dismissal is converted into its recoverable request for distance.", safeExample:"Penelitian menerjemahkan frasa pergi sana sebagai contoh." },
  { id:"id-sexualised", code:"id", language:"Indonesian", displayTerm:"targeted severe sexualised abuse", forms:"(?:ngentot|entot)\\s+(?:lu|kamu)", targets:"lu|kamu|anda", mode:"prohibited", outcome:"block", mechanism:"sexualised_personal_abuse", rationale:"A severe Indonesian sexualised attack is blocked as person-directed abuse.", safeExample:"Penelitian bahasa mengutip makian seksual untuk analisis." },
  { id:"id-death", code:"id", language:"Indonesian", displayTerm:"mati saja · mampus", forms:"mati\\s+saja|mampus", targets:"kamu|anda|lu", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Indonesian wording wishes or commands death.", safeExample:"Kebijakan menyebut frasa itu hanya sebagai contoh terlarang." },
  { id:"id-animal", code:"id", language:"Indonesian", displayTerm:"kamu anjing · kamu babi", forms:"kamu\\s+(?:anjing|babi)|(?:anjing|babi)\\s+kamu", targets:"kamu|anda|lu", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"Animal nouns are moderated when used as direct Indonesian personal labels; literal animal references remain allowed.", safeExample:"Anjing itu bermain di taman." },

  { id:"ms-personal", code:"ms", language:"Malay", displayTerm:"kau bodoh · kau bangang", forms:"kau\\s+(?:bodoh|bangang|bengap)", targets:"kau|awak|anda|dia|pemain|atlet", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Malay second-person fool labels receive intervention when aimed at a participant.", safeExample:"Kamus menerangkan kata bodoh sebagai contoh penghinaan." },
  { id:"ms-dismissal", code:"ms", language:"Malay", displayTerm:"diam lah · pergi sana", forms:"diam\\s+lah|pergi\\s+sana", targets:"kau|awak|anda", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Tolong beri saya ruang.", rationale:"A Malay silencing or dismissal command is converted into a neutral request for space.", safeExample:"Kajian menterjemah frasa diam lah sebagai contoh bahasa." },
  { id:"ms-family", code:"ms", language:"Malay", displayTerm:"targeted severe family abuse", forms:"pukimak", targets:"kau|awak|anda", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Malay maternal sexual insult is blocked.", safeExample:"Kajian bahasa memetik makian keluarga untuk analisis." },
  { id:"ms-death", code:"ms", language:"Malay", displayTerm:"pergi mampus · mati lah", forms:"pergi\\s+mampus|mati\\s+lah", targets:"kau|awak|anda", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Malay phrase tells the addressed person to die.", safeExample:"Dasar menyebut frasa itu sebagai contoh yang dilarang." },
  { id:"ms-animal", code:"ms", language:"Malay", displayTerm:"kau anjing · kau babi", forms:"kau\\s+(?:anjing|babi)|(?:anjing|babi)\\s+kau", targets:"kau|awak|anda", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"Malay animal labels receive intervention only when applied to a person.", safeExample:"Anjing itu berlari di taman." },

  { id:"vi-personal", code:"vi", language:"Vietnamese", displayTerm:"mày ngu · mày đần", forms:"may\\s+(?:ngu|dan)", targets:"may|ban|no|cau thu|van dong vien", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Vietnamese second-person fool labels are moderated as direct personal attacks.", safeExample:"Từ điển giải thích từ ngu như một ví dụ xúc phạm." },
  { id:"vi-dismissal", code:"vi", language:"Vietnamese", displayTerm:"cút đi", forms:"cut\\s+di", targets:"may|ban", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Xin hãy để tôi yên.", rationale:"A Vietnamese dismissal preserves the request to end the interaction without retaining the abuse.", safeExample:"Nghiên cứu dịch cụm từ cút đi như một ví dụ ngôn ngữ." },
  { id:"vi-family", code:"vi", language:"Vietnamese", displayTerm:"targeted severe family abuse", forms:"dit\\s+me\\s+may", targets:"may|ban", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Vietnamese maternal sexual attack is blocked.", safeExample:"Nghiên cứu ngôn ngữ trích dẫn lời xúc phạm gia đình để phân tích." },
  { id:"vi-death", code:"vi", language:"Vietnamese", displayTerm:"chết đi", forms:"chet\\s+di", targets:"may|ban", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Vietnamese imperative tells the recipient to die.", safeExample:"Chính sách chỉ trích dẫn cụm từ này như ví dụ bị cấm." },
  { id:"vi-animal", code:"vi", language:"Vietnamese", displayTerm:"đồ chó · mày là chó", forms:"do\\s+cho|may\\s+la\\s+cho", targets:"may|ban", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"Vietnamese dog labels receive intervention when aimed at a person; literal animal discussion remains allowed.", safeExample:"Con chó đang chạy trong công viên." },

  { id:"th-personal", code:"th", language:"Thai", displayTerm:"มึงโง่", forms:"มึง(?:มัน)?โง่", targets:"มึง|คุณ|เขา|นักกีฬา", compact:true, mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"A Thai second-person fool label is moderated as personal degradation.", safeExample:"พจนานุกรมอธิบายคำว่าโง่เป็นตัวอย่างคำดูหมิ่น" },
  { id:"th-dismissal", code:"th", language:"Thai", displayTerm:"ไปให้พ้น · หุบปาก", forms:"ไปให้พ้น|หุบปาก", targets:"มึง|คุณ", compact:true, mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"กรุณาปล่อยฉันไว้ตามลำพัง", rationale:"A Thai dismissal or silencing command is converted into a request to be left alone.", safeExample:"งานวิจัยแปลคำว่าไปให้พ้นเป็นตัวอย่างทางภาษา" },
  { id:"th-family", code:"th", language:"Thai", displayTerm:"targeted severe family abuse", forms:"เย็ดแม่มึง", targets:"มึง|คุณ", compact:true, mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Thai maternal sexual attack is blocked.", safeExample:"งานวิจัยภาษาอ้างคำด่าครอบครัวเพื่อการวิเคราะห์" },
  { id:"th-death", code:"th", language:"Thai", displayTerm:"ไปตายซะ", forms:"ไปตายซะ|ตายซะ", targets:"มึง|คุณ", compact:true, mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Thai imperative tells the recipient to die.", safeExample:"นโยบายยกวลีนี้เป็นตัวอย่างต้องห้ามเท่านั้น" },
  { id:"th-animal", code:"th", language:"Thai", displayTerm:"ไอ้ควาย · มึงเป็นควาย", forms:"ไอ้ควาย|มึงเป็นควาย", targets:"มึง|คุณ", compact:true, mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"The Thai buffalo term receives intervention when it labels a person; literal animal discussion remains allowed.", safeExample:"ควายกำลังกินหญ้าในทุ่ง" },

  { id:"tl-personal", code:"tl", language:"Tagalog / Filipino", displayTerm:"ang bobo mo · tanga ka", forms:"(?:ang\\s+)?bobo\\s+mo|tanga\\s+ka", targets:"ikaw|ka|mo|siya|manlalaro|atleta", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Tagalog second-person fool labels receive intervention when directed at somebody.", safeExample:"Ipinaliliwanag ng diksyunaryo ang salitang bobo bilang mapanlait." },
  { id:"tl-dismissal", code:"tl", language:"Tagalog / Filipino", displayTerm:"tumahimik ka · layuan mo ako", forms:"tumahimik\\s+ka|layuan\\s+mo\\s+ako", targets:"ikaw|ka|mo", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Pakiusap, bigyan mo muna ako ng espasyo.", rationale:"A Tagalog silencing or distancing command is converted into a neutral request for space.", safeExample:"Isinasalin ng pananaliksik ang pariralang tumahimik ka bilang halimbawa." },
  { id:"tl-family", code:"tl", language:"Tagalog / Filipino", displayTerm:"targeted severe family abuse", forms:"putang\\s+ina\\s+mo|tangina\\s+mo", targets:"ikaw|ka|mo", mode:"prohibited", outcome:"block", mechanism:"sexualised_family_abuse", rationale:"A severe Tagalog maternal sexual insult is blocked.", safeExample:"Sinisipi ng pag-aaral ang mura sa pamilya para sa pagsusuri." },
  { id:"tl-death", code:"tl", language:"Tagalog / Filipino", displayTerm:"mamatay ka", forms:"mamatay\\s+ka", targets:"ikaw|ka", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Tagalog imperative wishes death on the addressed person.", safeExample:"Binabanggit ng patakaran ang parirala bilang ipinagbabawal na halimbawa." },
  { id:"tl-animal", code:"tl", language:"Tagalog / Filipino", displayTerm:"hayop ka", forms:"hayop\\s+ka", targets:"ikaw|ka", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"The Tagalog animal label receives intervention when directed at a person; literal animal reference remains allowed.", safeExample:"Ang hayop ay nasa kagubatan." },

  { id:"sw-personal", code:"sw", language:"Swahili", displayTerm:"wewe ni mjinga · wewe ni mpumbavu", forms:"wewe\\s+ni\\s+(?:mjinga|mpumbavu)", targets:"wewe|yeye|mchezaji|mwanariadha", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Swahili second-person fool labels are moderated as direct personal degradation.", safeExample:"Kamusi inaeleza neno mjinga kama mfano wa tusi." },
  { id:"sw-dismissal", code:"sw", language:"Swahili", displayTerm:"nyamaza · nenda zako", forms:"nyamaza|nenda\\s+zako", targets:"wewe|yeye", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"Tafadhali niache kwa sasa.", rationale:"A Swahili silencing or dismissal command is converted into a request for space.", safeExample:"Utafiti unatafsiri neno nyamaza kama mfano wa lugha." },
  { id:"sw-family", code:"sw", language:"Swahili", displayTerm:"mwana wa mbwa", forms:"mwana\\s+wa\\s+mbwa", targets:"wewe|yeye|mchezaji", mode:"targeted_prohibited", outcome:"block", mechanism:"severe_family_degradation", rationale:"A severe Swahili family-and-animal label is blocked when directed at a person.", safeExample:"Utafiti wa lugha unanukuu tusi la familia kwa uchambuzi." },
  { id:"sw-death", code:"sw", language:"Swahili", displayTerm:"nenda ukafe", forms:"nenda\\s+ukafe|kufa\\s+wewe", targets:"wewe|yeye", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Swahili phrase tells the recipient to die.", safeExample:"Sera inataja kifungu hiki kama mfano uliopigwa marufuku." },
  { id:"sw-animal", code:"sw", language:"Swahili", displayTerm:"wewe ni mnyama · mbwa wewe", forms:"wewe\\s+ni\\s+mnyama|mbwa\\s+wewe", targets:"wewe|yeye", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"Swahili animal nouns receive intervention when used as labels for a person.", safeExample:"Mnyama huyo anaishi msituni." },

  { id:"am-personal", code:"am", language:"Amharic", displayTerm:"አንተ ደደብ ነህ · አንቺ ሞኝ ነሽ", forms:"አንተ\\s+(?:ደደብ|ሞኝ)\\s+ነህ|አንቺ\\s+(?:ደደብ|ሞኝ)\\s+ነሽ", targets:"አንተ|አንቺ|እሱ|እሷ|ተጫዋች", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Amharic second-person fool labels receive intervention when directed at a participant.", safeExample:"መዝገበ ቃላት ደደብ የሚለውን ቃል እንደ ስድብ ያብራራል።" },
  { id:"am-dismissal", code:"am", language:"Amharic", displayTerm:"ዝም በል · ዝም በይ", forms:"ዝም\\s+በል|ዝም\\s+በይ", targets:"አንተ|አንቺ", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rewrite:"እባክዎ ብቻዬን ይተዉኝ።", rationale:"An Amharic silencing command is converted into a polite request to be left alone.", safeExample:"ጥናቱ ዝም በል የሚለውን ሐረግ እንደ ትርጉም ምሳሌ ይጠቀማል።" },
  { id:"am-family", code:"am", language:"Amharic", displayTerm:"targeted severe family degradation", forms:"የውሻ\\s+ልጅ", targets:"አንተ|አንቺ|እሱ|እሷ|ተጫዋች", mode:"targeted_prohibited", outcome:"block", mechanism:"severe_family_degradation", rationale:"A severe Amharic family-and-animal label is blocked when directed at a person.", safeExample:"የቋንቋ ጥናቱ የቤተሰብ ስድብን ለትንታኔ ይጠቅሳል።" },
  { id:"am-death", code:"am", language:"Amharic", displayTerm:"ሙት", forms:"ሙት", targets:"አንተ|አንቺ", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The Amharic imperative tells the recipient to die.", safeExample:"ፖሊሲው ቃሉን እንደ የተከለከለ ምሳሌ ብቻ ይጠቅሳል።" },
  { id:"am-animal", code:"am", language:"Amharic", displayTerm:"አንተ ውሻ ነህ", forms:"አንተ\\s+ውሻ\\s+ነህ|አንቺ\\s+ውሻ\\s+ነሽ", targets:"አንተ|አንቺ", mode:"targeted", outcome:"warning", mechanism:"dehumanising_label", rationale:"The Amharic dog label receives intervention when applied to a person; literal animal discussion remains allowed.", safeExample:"ውሻው በመናፈሻው ውስጥ ይሮጣል።" },
];

export const NEXT_WAVE_TEST_CASES = [
  { input:"তুমি বোকা।", expect:"warning", expectNoRewrite:true },
  { input:"chup koro", expect:"warning", expectRewrite:"দয়া করে আমাকে একটু সময় দিন।" },
  { input:"মাদারচোদ", displayInput:"[Bengali severe family abuse]", expect:"block" },
  { input:"মরে যা", displayInput:"[Bengali death wish]", expect:"block" },
  { input:"তুমি কুকুর।", expect:"warning", expectNoRewrite:true },
  { input:"অভিধান বোকা শব্দটিকে অপমানজনক উদাহরণ হিসেবে ব্যাখ্যা করে।", expect:"clean" },
  { input:"কুকুরটি পার্কে দৌড়াচ্ছে।", expect:"clean" },

  { input:"تو احمقی", expect:"warning", expectNoRewrite:true },
  { input:"گمشو", expect:"warning", expectRewrite:"لطفاً من را تنها بگذار." },
  { input:"مادرجنده", displayInput:"[Persian severe family abuse]", expect:"block" },
  { input:"بمیر", displayInput:"[Persian death wish]", expect:"block" },
  { input:"تو سگی", expect:"warning", expectNoRewrite:true },
  { input:"فرهنگ واژه احمق را به عنوان توهین توضیح می‌دهد.", expect:"clean" },
  { input:"این حیوان در باغ‌وحش زندگی می‌کند.", expect:"clean" },

  { input:"אתה אידיוט", expect:"warning", expectNoRewrite:true },
  { input:"לך לעזאזל", expect:"warning", expectRewrite:"בבקשה, תנו לי מרחב." },
  { input:"אתה בן זונה", displayInput:"[Hebrew severe family abuse]", expect:"block" },
  { input:"תמות", displayInput:"[Hebrew death wish]", expect:"block" },
  { input:"אתה כלב", expect:"warning", expectNoRewrite:true },
  { input:"המילון מסביר את המילה אידיוט כדוגמה פוגענית.", expect:"clean" },
  { input:"הכלב רץ בפארק.", expect:"clean" },

  { input:"Kamu bodoh.", expect:"warning", expectNoRewrite:true },
  { input:"Pergi sana.", expect:"warning", expectRewrite:"Tolong beri saya ruang." },
  { input:"Ngentot lu.", displayInput:"[Indonesian severe sexualised abuse]", expect:"block" },
  { input:"Mati saja.", displayInput:"[Indonesian death wish]", expect:"block" },
  { input:"Kamu anjing.", expect:"warning", expectNoRewrite:true },
  { input:"Kamus menjelaskan kata bodoh sebagai contoh penghinaan.", expect:"clean" },
  { input:"Anjing itu bermain di taman.", expect:"clean" },

  { input:"Kau bangang.", expect:"warning", expectNoRewrite:true },
  { input:"Diam lah.", expect:"warning", expectRewrite:"Tolong beri saya ruang." },
  { input:"Pukimak.", displayInput:"[Malay severe family abuse]", expect:"block" },
  { input:"Pergi mampus.", displayInput:"[Malay death wish]", expect:"block" },
  { input:"Kau babi.", expect:"warning", expectNoRewrite:true },
  { input:"Kamus menerangkan kata bodoh sebagai contoh penghinaan.", expect:"clean" },
  { input:"Anjing itu berlari di taman.", expect:"clean" },

  { input:"Mày ngu.", expect:"warning", expectNoRewrite:true },
  { input:"Cút đi.", expect:"warning", expectRewrite:"Xin hãy để tôi yên." },
  { input:"Địt mẹ mày.", displayInput:"[Vietnamese severe family abuse]", expect:"block" },
  { input:"Chết đi.", displayInput:"[Vietnamese death wish]", expect:"block" },
  { input:"Mày là chó.", expect:"warning", expectNoRewrite:true },
  { input:"Từ điển giải thích từ ngu như một ví dụ xúc phạm.", expect:"clean" },
  { input:"Con chó đang chạy trong công viên.", expect:"clean" },

  { input:"มึงโง่", expect:"warning", expectNoRewrite:true },
  { input:"ไปให้พ้น", expect:"warning", expectRewrite:"กรุณาปล่อยฉันไว้ตามลำพัง" },
  { input:"เย็ดแม่มึง", displayInput:"[Thai severe family abuse]", expect:"block" },
  { input:"ไปตายซะ", displayInput:"[Thai death wish]", expect:"block" },
  { input:"มึงเป็นควาย", expect:"warning", expectNoRewrite:true },
  { input:"พจนานุกรมอธิบายคำว่าโง่เป็นตัวอย่างคำดูหมิ่น", expect:"clean" },
  { input:"ควายกำลังกินหญ้าในทุ่ง", expect:"clean" },

  { input:"Ang bobo mo.", expect:"warning", expectNoRewrite:true },
  { input:"Tumahimik ka.", expect:"warning", expectRewrite:"Pakiusap, bigyan mo muna ako ng espasyo." },
  { input:"Putang ina mo.", displayInput:"[Tagalog severe family abuse]", expect:"block" },
  { input:"Mamatay ka.", displayInput:"[Tagalog death wish]", expect:"block" },
  { input:"Hayop ka.", expect:"warning", expectNoRewrite:true },
  { input:"Ipinaliliwanag ng diksyunaryo ang salitang bobo bilang mapanlait.", expect:"clean" },
  { input:"Ang hayop ay nasa kagubatan.", expect:"clean" },

  { input:"Wewe ni mjinga.", expect:"warning", expectNoRewrite:true },
  { input:"Nyamaza.", expect:"warning", expectRewrite:"Tafadhali niache kwa sasa." },
  { input:"Wewe ni mwana wa mbwa.", displayInput:"[Swahili severe family degradation]", expect:"block" },
  { input:"Nenda ukafe.", displayInput:"[Swahili death wish]", expect:"block" },
  { input:"Wewe ni mnyama.", expect:"warning", expectNoRewrite:true },
  { input:"Kamusi inaeleza neno mjinga kama mfano wa tusi.", expect:"clean" },
  { input:"Mnyama huyo anaishi msituni.", expect:"clean" },

  { input:"አንተ ደደብ ነህ።", expect:"warning", expectNoRewrite:true },
  { input:"ዝም በል።", expect:"warning", expectRewrite:"እባክዎ ብቻዬን ይተዉኝ።" },
  { input:"አንተ የውሻ ልጅ ነህ።", displayInput:"[Amharic severe family degradation]", expect:"block" },
  { input:"ሙት።", displayInput:"[Amharic death wish]", expect:"block" },
  { input:"አንተ ውሻ ነህ።", expect:"warning", expectNoRewrite:true },
  { input:"መዝገበ ቃላት ደደብ የሚለውን ቃል እንደ ስድብ ያብራራል።", expect:"clean" },
  { input:"ውሻው በመናፈሻው ውስጥ ይሮጣል።", expect:"clean" },
];

const EDUCATIONAL = /(?:\b(?:word|term|phrase|dictionary|definition|translation|translate|research|study|analysis|example|policy|history|romanised|romanized|kamus|kata|penelitian|kajian|terjemah|contoh|tu dien|nghien cuu|dich|vi du|salita|diksyunaryo|pananaliksik|salin|halimbawa|neno|kamusi|utafiti|tafsiri|mfano)\b|শব্দ|অভিধান|গবেষণা|অনুবাদ|উদাহরণ|واژه|فرهنگ|پژوهش|ترجمه|مثال|מילה|מילון|מחקר|תרגום|דוגמה|คำ|พจนานุกรม|วิจัย|แปล|ตัวอย่าง|ቃል|መዝገበ|ጥናት|ትርጉም|ምሳሌ)/u;
const RESIDUAL_ATTACK = /(?:\b(?:but|and)\s+you\b|কিন্তু\s+(?:তুমি|তুই)|اما\s+تو|אבל\s+(?:אתה|את)|\b(?:tapi|tetapi)\s+(?:kamu|kau)\b|\bnhung\s+(?:may|ban)\b|แต่(?:มึง|คุณ)|\bpero\s+(?:ikaw|ka)\b|\blakini\s+wewe\b|ግን\s+(?:አንተ|አንቺ))/u;
const COMMON_TARGETS = "you|u|he|she|they|player|athlete|@[a-z0-9_.-]+";

function foldPolicyText(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
    // Keep script-internal combining marks: Bengali and Thai vowel/tone signs
    // are meaningful letters for matching, not disposable punctuation.
    .replace(/[^\p{L}\p{M}\p{N}@]+/gu, " ")
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
  const hit = folded.match(pattern(rule));
  const target = folded.match(targetPattern(rule));
  if (!hit || !target) return false;
  return rule.compact || Math.abs((hit.index || 0) - (target.index || 0)) <= 52;
}

export function moderateNextWaveAbuse(original) {
  const folded = foldPolicyText(original);
  const educational = EDUCATIONAL.test(folded) || EDUCATIONAL.test(original);

  for (const rule of NEXT_WAVE_ABUSE_RULES) {
    const hit = folded.match(pattern(rule));
    if (!hit) continue;
    const targeted = isTargeted(rule, folded);
    if (educational && !RESIDUAL_ATTACK.test(folded)) {
      return {
        outcome:"clean", category:"contextual_safe", reason:"Quoted educational or research context",
        nextWaveRule:rule.id, contextOverride:"educational", policyRationale:rule.rationale,
      };
    }
    if (["targeted", "targeted_prohibited"].includes(rule.mode) && !targeted) continue;

    return {
      outcome:rule.outcome,
      category:rule.mechanism,
      reason:rule.mechanism === "harm" ? "Wishing or encouraging death" : ["sexualised_family_abuse", "sexualised_personal_abuse", "severe_family_degradation"].includes(rule.mechanism) ? "Severe targeted family or sexualised abuse" : rule.mechanism === "dismissive_command" ? "Regional dismissive abuse" : rule.mechanism === "dehumanising_label" ? "Targeted dehumanising label" : "Targeted multilingual personal abuse",
      rewriteSuggestion:rule.rewrite,
      nextWaveRule:rule.id,
      matchedPolicyText:hit[0].trim(),
      targetHint:targeted || ["phrase", "prohibited"].includes(rule.mode) ? { label:"the addressed participant", type:"person", scope:"individual", explicitness:`explicit in ${rule.language}` } : undefined,
      policyRationale:rule.rationale,
    };
  }
  return null;
}

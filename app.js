"use strict";
const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const inl = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const cfg = window.APP_CONFIG || {};
let sb = null, session = null, tool = null, state = null;

/* ---------- 15 ta dizayn ---------- */
const THEMES = {
  "Okean": { bg: "F4F8FC", tt: "0B2A4A", tx: "23384F", ac: "1C7ED6", f: "Calibri" },
  "Zumrad": { bg: "F2FAF6", tt: "0B3D2E", tx: "1F3B31", ac: "12A071", f: "Calibri" },
  "Tong": { bg: "FFF6EC", tt: "5A2A0A", tx: "4A3426", ac: "F08A24", f: "Georgia" },
  "Binafsha": { bg: "F6F2FC", tt: "2F1A5B", tx: "3A2D57", ac: "7E4FD8", f: "Calibri" },
  "Grafit": { bg: "1E2227", tt: "FFFFFF", tx: "D8DEE6", ac: "F2B134", f: "Calibri" },
  "Tungi": { bg: "0F1B33", tt: "FFFFFF", tx: "C9D6EE", ac: "4FC3F7", f: "Calibri" },
  "Qizil": { bg: "FFF3F2", tt: "6B1010", tx: "4D2828", ac: "D63B3B", f: "Georgia" },
  "Mint": { bg: "EFFBF9", tt: "0A4B48", tx: "21423F", ac: "20B2AA", f: "Calibri" },
  "Akademik": { bg: "FFFFFF", tt: "1B2A49", tx: "2B2B2B", ac: "8C1C13", f: "Times New Roman" },
  "Lavanda": { bg: "F3F0FA", tt: "3B3470", tx: "413B63", ac: "9B8AE6", f: "Calibri" },
  "Qum": { bg: "F8F3E8", tt: "4A3A1C", tx: "47402F", ac: "B8860B", f: "Georgia" },
  "Neon": { bg: "12121A", tt: "F5F5FF", tx: "C8C8E0", ac: "00E5A8", f: "Arial" },
  "Toshkent": { bg: "EAF3F8", tt: "083E63", tx: "1D3A4D", ac: "00A3B5", f: "Calibri" },
  "Minimal": { bg: "FAFAFA", tt: "111111", tx: "333333", ac: "111111", f: "Arial" },
  "Quyosh": { bg: "FFFBE8", tt: "5C4300", tx: "4F4423", ac: "F5B800", f: "Calibri" },
};

/* ---------- vositalar ---------- */
const LANGS = ["O'zbek (lotin)", "Ўзбек (кирилл)", "Русский", "English", "Türkçe", "Deutsch"];
const lang = { k: "lang", l: "Til", t: "select", o: LANGS };
const SYS = "Sen o'quvchilar va talabalar uchun yordamchi akademik assistantsan. Aniq, grammatik to'g'ri yoz. Manbalar, iqtiboslar, statistika va havolalarni O'YLAB TOPMA; ishonchsiz joyni ochiq ayt.";
const TOOLS = {
  ppt: { n: "Prezentatsiya", d: "Mavzu yoki matn asosida slaydlar. PPTX va PDF sifatida yuklab olinadi.",
    f: [{ k: "topic", l: "Mavzu", t: "text", req: 1 }, { k: "text", l: "Asos matn (ixtiyoriy)", t: "textarea" },
      { k: "count", l: "Slaydlar soni", t: "number", v: 8, min: 4, max: 15 }, lang,
      { k: "theme", l: "Dizayn", t: "select", o: Object.keys(THEMES) }] },
  course: { n: "Kurs ishi / referat", d: "Universal prompt asosida: ma'lumot → reja (tasdiqlanadi) → bob-bob yozish → Word/PDF.",
    f: [{ k: "topic", l: "Mavzu", t: "text", req: 1 }, { k: "subject", l: "Fan nomi", t: "text" },
      { k: "uni", l: "Universitet", t: "text" }, { k: "faculty", l: "Fakultet, kafedra, yo'nalish", t: "text" },
      { k: "author", l: "Muallif (F.I.O.)", t: "text" }, { k: "teacher", l: "Ilmiy rahbar", t: "text" }, lang,
      { k: "pages", l: "Hajm (betlar soni)", t: "number", v: 20, min: 8, max: 60 },
      { k: "method", l: "Metodik qo'llanma matni (bo'lsa, shunga amal qilinadi; fayldan yuklash mumkin)", t: "textarea" },
      { k: "sources", l: "Siz tekshirgan manbalar ro'yxati (adabiyotlar bo'limiga shu holicha qo'yiladi)", t: "textarea" },
      { k: "custom", l: "Qo'shimcha talablar", t: "textarea" }] },
  essay: { n: "Insho / esse", d: "Mavzu bo'yicha tayyor matn.",
    f: [{ k: "topic", l: "Mavzu", t: "text", req: 1 }, lang, { k: "words", l: "So'z soni", t: "number", v: 400, min: 100, max: 1500 },
      { k: "custom", l: "Qo'shimcha talab", t: "textarea" }] },
  sum: { n: "Matnni qisqartirish", d: "Uzun matndan asosiy fikrlar.",
    f: [{ k: "text", l: "Matn", t: "textarea", req: 1 }, lang] },
  tr: { n: "Tarjimon", d: "Matnni tanlangan tilga tarjima qiladi.",
    f: [{ k: "text", l: "Matn", t: "textarea", req: 1 }, { k: "lang", l: "Qaysi tilga", t: "select", o: LANGS }] },
  quiz: { n: "Test tuzuvchi", d: "Savollar, variantlar va javoblar.",
    f: [{ k: "topic", l: "Mavzu", t: "text" }, { k: "text", l: "Asos matn (ixtiyoriy)", t: "textarea" },
      { k: "count", l: "Savollar soni", t: "number", v: 10, min: 3, max: 30 }, lang] },
  math: { n: "Matematik yordamchi", d: "Masalani bosqichma-bosqich tushuntiradi.",
    f: [{ k: "text", l: "Masala", t: "textarea", req: 1 }, lang] },
};

/* ---------- AI chaqiruvi ---------- */
async function ai(messages, o = {}) {
  const h = { "Content-Type": "application/json" };
  if (session) h.Authorization = "Bearer " + session.access_token;
  for (let i = 0; i < 5; i++) {
    let r, d;
    try {
      r = await fetch("/.netlify/functions/ai", { method: "POST", headers: h,
        body: JSON.stringify({ messages, json: !!o.json, max_tokens: o.max || 3000, temperature: o.temp ?? 0.6 }) });
      d = await r.json().catch(() => ({}));
    } catch { throw new Error("Serverga ulanib bo'lmadi. Internetni tekshiring."); }
    if (r.ok) return d.text || "";
    if (r.status === 429 && i < 4) { await sleep(7000 * (i + 1)); continue; }
    if (r.status === 401) throw new Error(d.error || "Qayta kiring");
    throw new Error(d.error || "Xato " + r.status);
  }
}
const parseJSON = (t) => { const a = t.indexOf("{"), b = t.lastIndexOf("}"); return JSON.parse(t.slice(a, b + 1)); };

/* ---------- ishga tushirish funksiyalari ---------- */
const COURSE_PROMPT = `Sen ilmiy ishlar va kurs ishlari tayyorlash bo'yicha tajribali mutaxassissan.
USLUB: ilmiy-akademik; birinchi shaxsdan («men», «biz») yozma. Boshqa manbadan so'zma-so'z ko'chirma; mazmunni o'z so'zing bilan bayon qil, tahlil va tanqidiy taqqoslash qil, sinonim bilan almashtirish bilan cheklanma.
HALOLLIK: manba, muallif, kitob nomi, qonun moddasi, statistik raqam va faktni HECH QACHON o'ylab topma. Bunday ma'lumot kerak bo'lsa, o'rniga [bu yerga ... ma'lumotini qo'ying] belgisini qo'y (nuqtalar o'rniga aynan nima kerakligini yoz). Matn ichida [1] kabi qavs ishlatma. Antiplagiat tizimini aldaydigan hech qanday usul qo'llama.
JADVAL: faqat foydalanuvchi bergan haqiqiy ma'lumot bo'lsa va mavzuga zarur bo'lsagina; format: | ustun | ustun | qatorlari, jadvaldan KEYIN alohida qatorda "Jadval N – nomi" (uzluksiz raqam), matnda unga havola qil va tahlil qil. Haqiqiy ma'lumot bo'lmasa jadval to'qima.
TUZILMA: Kirish — dolzarblik, ishlanganlik darajasi, maqsad, vazifalar, obyekt, predmet, usullar, ish tuzilmasi. 1-bob — nazariy asoslar, yondashuvlarni tanqidiy taqqoslash, muallif pozitsiyasi. 2-bob va keyingilar — amaliy tahlil, misollar (raqam bo'lsa faqat yuqoridagi qoida bo'yicha). Xulosa — maqsadga erishilganini asosla, har bob bo'yicha xulosa, nazariy va amaliy ahamiyat, keyingi tadqiqot yo'nalishlari.`;
const courseRules = (v) => `${COURSE_PROMPT}\nIsh tili: ${v.lang}.${v.method ? "\nUniversitet metodik qo'llanmasi (FAQAT shunga amal qil):\n" + v.method.slice(0, 6000) : ""}${v.custom ? "\nQo'shimcha talablar: " + v.custom : ""}`;
function parsePlan(t) {
  const u = []; let ch = null;
  for (const raw of t.split("\n")) {
    const l = raw.replace(/^[#*\s]+/, "").replace(/[*\s]+$/, ""); if (!l) continue;
    if (/^kirish/i.test(l)) u.push({ h: 1, title: "Kirish", k: "i" });
    else if (/^xulosa/i.test(l)) u.push({ h: 1, title: "Xulosa", k: "x" });
    else if (/^\d+\s*-?\s*bob/i.test(l)) { ch = { h: 1, title: l, kids: 0, n: parseInt(l), k: "c" }; u.push(ch); }
    else if (/^\d+\.\d+/.test(l)) { if (ch) ch.kids++; u.push({ h: 2, title: l, n: ch ? ch.n : 1, k: "p" }); }
  }
  return u;
}
async function courseWrite(v, planText, st) {
  const u = parsePlan(planText);
  if (u.length < 4) throw new Error("Reja noto'g'ri formatda. Kirish, boblar va Xulosa qatorlari kerak.");
  const pages = Math.min(Math.max(+v.pages || 20, 8), 60), total = Math.max(600, (pages - 4) * 300);
  const body = u.filter((x) => x.h === 2 || (x.k === "c" && !x.kids)), main = Math.round((total * 0.85) / Math.max(body.length, 1));
  const rules = courseRules(v), titles = u.map((x) => x.title).join("; ");
  let out = "", prev = "", i = 0;
  for (const x of u) {
    out += `${x.h === 1 ? "#" : "##"} ${x.title}\n`;
    if (x.k === "c" && x.kids) continue;
    i++; st(`Yozilmoqda: ${i}/${body.length + 2} — ${x.title}`);
    const w = x.k === "i" ? Math.round(total * 0.08) : x.k === "x" ? Math.round(total * 0.07) : main;
    const hint = x.k === "i" ? "Kirish talablariga to'liq amal qil." : x.k === "x" ? "Xulosa talablariga amal qil." : x.n === 1 ? "Bu nazariy bob." : "Bu amaliy/tahliliy bob; raqam va faktlar uchun faqat belgi qo'y.";
    const txt = await ai([{ role: "system", content: rules },
      { role: "user", content: `Reja: ${titles}.\nHozir faqat "${x.title}" qismini yoz, taxminan ${w} so'z. ${hint} Sarlavha yozma. Oldingi qismlarni takrorlama.${prev ? "\nOldingi qism oxiri: " + prev : ""}` }],
      { max: Math.min(7000, Math.round(w * 3.5) + 300) });
    out += txt.trim() + "\n\n"; prev = txt.trim().slice(-500);
  }
  out += "# Adabiyotlar ro'yxati\n" + (v.sources ? v.sources.trim() + "\n" : "[bu yerga o'zingiz tekshirgan manbalar ro'yxatini qo'ying]\n");
  const ph = (out.match(/\[bu yerga/gi) || []).length, words = out.split(/\s+/).length;
  return { type: "doc", text: out, name: v.topic, meta: { title: v.topic, subject: v.subject, uni: v.uni, faculty: v.faculty, author: v.author, teacher: v.teacher },
    note: `Tayyor. Taxminan ${Math.round(words / 300) + 2} bet (aniq sahifa sonini Word'da tekshiring). To'ldirilishi kerak joylar: ${ph} ta [bu yerga …]. Manbalar va faktlar sayt tomonidan tekshirilmagan; antiplagiat natijasi kafolatlanmaydi.${v.method ? " Metodik qo'llanma bor: shrift va formatni Word'da unga moslang." : ""}` };
}

const RUN = {
  async ppt(v, st) {
    const n = Math.min(Math.max(+v.count || 8, 4), 15);
    st("Slaydlar yozilmoqda…");
    const t = await ai([{ role: "system", content: SYS + " Faqat JSON qaytar." },
      { role: "user", content: `Til: ${v.lang}. Mavzu: ${v.topic}. ${v.text ? "Asos matn:\n" + v.text.slice(0, 12000) : ""}
Aynan ${n} ta kontent slaydli prezentatsiya tuz. JSON: {"title":"","subtitle":"","slides":[{"title":"","bullets":["3-5 ta qisqa band"],"notes":"1-2 gap"}]}` }], { json: true, max: 4000 });
    const d = parseJSON(t);
    if (!Array.isArray(d.slides) || !d.slides.length) throw new Error("AI javobi noto'g'ri. Qayta urinib ko'ring.");
    return { type: "ppt", data: d, theme: v.theme, name: v.topic };
  },
  async course(v, st) {
    const pages = Math.min(Math.max(+v.pages || 20, 8), 60), ch = pages >= 30 ? 3 : 2, per = pages >= 30 ? 4 : pages >= 16 ? 3 : 2;
    st("Reja tuzilmoqda…");
    const t = await ai([{ role: "system", content: courseRules(v) },
      { role: "user", content: `Mavzu: ${v.topic}. Fan: ${v.subject || "-"}. Hajm: ${pages} bet.
Batafsil reja tuz: Kirish, ${ch} ta bob (har birida ${per} tadan paragraf), Xulosa. Faqat shu formatda, har qator alohida, boshqa matn yozma:
Kirish
1-bob. Nomi
1.1. Nomi
1.2. Nomi
2-bob. Nomi
2.1. Nomi
Xulosa` }], { max: 1200, temp: 0.4 });
    return { type: "plan", text: t.trim(), v, note: "Rejani ko'rib chiqing, tahrirlang va tasdiqlang." };
  },
  async essay(v, st) {
    st("Insho yozilmoqda…");
    const t = await ai([{ role: "system", content: SYS + ` Til: ${v.lang}.` },
      { role: "user", content: `Mavzu: ${v.topic}. Taxminan ${v.words} so'zli insho yoz: kirish, asosiy qism, xulosa. ${v.custom || ""} Birinchi qatorda # bilan sarlavha.` }], { max: 3500 });
    return { type: "doc", text: t, name: v.topic };
  },
  async sum(v, st) { st("Qisqartirilmoqda…");
    return { type: "doc", name: "Qisqacha mazmun", text: await ai([{ role: "system", content: SYS + ` Til: ${v.lang}.` },
      { role: "user", content: `Matnni qisqartir: avval 2-3 gaplik xulosa, keyin "## Asosiy fikrlar" ostida - bilan bandlar.\n\n${v.text.slice(0, 40000)}` }], { max: 2000 }) }; },
  async tr(v, st) { st("Tarjima qilinmoqda…");
    return { type: "doc", name: "Tarjima", text: await ai([{ role: "system", content: "Sen professional tarjimonsan. Faqat tarjimani qaytar, izoh yozma. Abzaslarni saqla." },
      { role: "user", content: `${v.lang} tiliga tarjima qil:\n\n${v.text.slice(0, 30000)}` }], { max: 6000, temp: 0.2 }) }; },
  async quiz(v, st) { if (!v.topic && !v.text) throw new Error("Mavzu yoki matn kiriting");
    st("Test tuzilmoqda…");
    return { type: "doc", name: "Test", text: await ai([{ role: "system", content: SYS + ` Til: ${v.lang}.` },
      { role: "user", content: `${v.count} ta test tuz. Mavzu: ${v.topic || "-"}. ${v.text ? "Matn:\n" + v.text.slice(0, 12000) : ""}
Format: har savol "### 1. savol matni", keyin 4 ta variant "- A) ..." , "- B) ..." va oxirida "**Javob: B**". Hammasi aniq bitta to'g'ri javobli bo'lsin.` }], { max: 4500 }) }; },
  async math(v, st) { st("Yechilmoqda…");
    return { type: "doc", name: "Masala yechimi", text: await ai([{ role: "system", content: `Sen matematika o'qituvchisisan. Til: ${v.lang}. Bosqichma-bosqich yech, LaTeX ishlatma (oddiy yozuv: x^2, sqrt(x), a/b). Oxirida "**Javob:**" yoz va tekshiruvni ko'rsat.` },
      { role: "user", content: v.text }], { max: 3000, temp: 0.2 }) }; },
};

/* ---------- Markdown -> bloklar ---------- */
function parseBlocks(t) {
  const out = [], L = t.split("\n");
  for (let i = 0; i < L.length; i++) {
    const l = L[i].trim(); if (!l) continue;
    if (l.startsWith("|")) {
      const rows = [];
      while (i < L.length && L[i].trim().startsWith("|")) {
        const c = L[i].trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
        if (!c.every((x) => /^:?-{2,}:?$/.test(x))) rows.push(c); i++;
      }
      i--; out.push({ t: "table", rows }); continue;
    }
    const h = l.match(/^(#{1,3})\s+(.*)/), b = l.match(/^[-*•]\s+(.*)/);
    if (h) out.push({ t: "h", n: h[1].length, s: h[2].replace(/\*\*/g, "") });
    else if (b) out.push({ t: "li", s: b[1] });
    else if (/^(Jadval|Rasm)\s+\d+/i.test(l)) out.push({ t: "cap", s: l });
    else out.push({ t: "p", s: l });
  }
  return out;
}
function md2html(t) {
  let h = "", ul = false;
  for (const b of parseBlocks(t)) {
    if (b.t === "li") { if (!ul) { h += "<ul>"; ul = true; } h += `<li>${inl(b.s)}</li>`; continue; }
    if (ul) { h += "</ul>"; ul = false; }
    if (b.t === "h") h += `<h${b.n}>${inl(b.s)}</h${b.n}>`;
    else if (b.t === "p") h += `<p>${inl(b.s)}</p>`;
    else if (b.t === "cap") h += `<p class="cap">${inl(b.s)}</p>`;
    else h += "<table>" + b.rows.map((r, i) => "<tr>" + r.map((c) => `<${i ? "td" : "th"}>${inl(c)}</${i ? "td" : "th"}>`).join("") + "</tr>").join("") + "</table>";
  }
  return h + (ul ? "</ul>" : "");
}

/* ---------- Hujjat dizaynlari (Word/PDF) ---------- */
const DD = {
  "Klassik (standart)": { font: "Times New Roman", hc: "000000", ac: "000000", sz: 28, line: 360, ha: "center" },
  "Akademik ko'k": { font: "Times New Roman", hc: "1B2A49", ac: "1B2A49", sz: 28, line: 360, ha: "left" },
  "Zamonaviy": { font: "Calibri", hc: "1C4E80", ac: "1C7ED6", sz: 24, line: 312, ha: "left" },
  "Elegant": { font: "Georgia", hc: "6B1F2A", ac: "B8860B", sz: 24, line: 336, ha: "left" },
  "Zumrad": { font: "Cambria", hc: "0B5D46", ac: "12A071", sz: 24, line: 336, ha: "left" },
  "Minimal": { font: "Arial", hc: "222222", ac: "888888", sz: 22, line: 312, ha: "left" },
};
let docDesign = "Klassik (standart)";

/* ---------- Yuklab olish ---------- */
const fname = (n, ext) => (n || "student_ai").replace(/[^\w\- ]+/g, "").trim().slice(0, 50).replace(/\s+/g, "_") + "." + ext;
function dl(blob, n, ext) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fname(n, ext); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }

async function exportDocx(r) {
  const D = window.docx, d = DD[docDesign], F = d.font, m = r.meta, al = D.AlignmentType, course = !!m;
  const run = (s, o = {}) => s.split(/\*\*(.+?)\*\*/).map((p, i) => new D.TextRun({ text: p, bold: i % 2 === 1 || o.bold, font: F, size: o.size || d.sz, color: o.color }));
  const margin = { top: 1134, bottom: 1134, left: 1701, right: 850 }, sections = [];
  if (m) {
    const c = (s, size, bold, after) => new D.Paragraph({ alignment: al.CENTER, spacing: { after }, children: s ? run(s, { size, bold, color: d.hc }) : [] });
    sections.push({ properties: { page: { margin } }, children: [c(m.uni, d.sz, true, 120), c(m.faculty, d.sz, false, 1600), c("KURS ISHI", d.sz + 8, true, 300),
      c(m.subject ? "Fan: " + m.subject : "", d.sz, false, 900), c("Mavzu: " + m.title, d.sz + 6, true, 1800), c(m.author ? "Bajardi: " + m.author : "", d.sz, false, 120),
      c(m.teacher ? "Ilmiy rahbar: " + m.teacher : "", d.sz, false, 1800), c(String(new Date().getFullYear()), d.sz, false, 0)] });
  }
  const kids = [], H = [D.HeadingLevel.HEADING_1, D.HeadingLevel.HEADING_2, D.HeadingLevel.HEADING_3];
  if (course) kids.push(new D.Paragraph({ alignment: al.CENTER, spacing: { after: 240 }, children: run("MUNDARIJA", { bold: true, color: d.hc }) }),
    new D.TableOfContents("Mundarija", { hyperlink: true, headingStyleRange: "1-2" }));
  for (const b of parseBlocks(r.text)) {
    if (b.t === "h") kids.push(new D.Paragraph({ heading: H[b.n - 1], pageBreakBefore: course && b.n === 1, keepNext: true, alignment: b.n === 1 && d.ha === "center" ? al.CENTER : al.LEFT,
      spacing: { before: b.n === 1 ? 0 : 280, after: 200 }, children: [new D.TextRun({ text: b.s, bold: true, font: F, size: d.sz + (b.n === 1 ? 4 : 0), color: d.hc })] }));
    else if (b.t === "li") kids.push(new D.Paragraph({ bullet: { level: 0 }, spacing: { after: 80, line: d.line }, children: run(b.s) }));
    else if (b.t === "cap") kids.push(new D.Paragraph({ alignment: al.CENTER, spacing: { before: 80, after: 240 }, children: run(b.s, { size: d.sz - 2 }) }));
    else if (b.t === "table") kids.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: b.rows.map((row, i) => new D.TableRow({ cantSplit: true, tableHeader: i === 0,
      children: row.map((c) => new D.TableCell({ shading: i === 0 ? { fill: "E8EEF6", type: D.ShadingType.CLEAR, color: "auto" } : undefined,
        children: [new D.Paragraph({ keepNext: true, children: run(c, { size: d.sz - 4, bold: i === 0 }) })] })) })) }));
    else kids.push(new D.Paragraph({ alignment: al.JUSTIFIED, spacing: { after: 60, line: d.line }, indent: { firstLine: 709 }, children: run(b.s) }));
  }
  sections.push({ properties: { page: { margin } }, children: kids,
    footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: al.RIGHT, children: [new D.TextRun({ children: [D.PageNumber.CURRENT], font: F, size: 24 })] })] }) } });
  const doc = new D.Document({ features: { updateFields: course }, sections });
  dl(await D.Packer.toBlob(doc), r.name, "docx");
  if (course) setStatus("Word ochilganda mundarijani yangilash so'ralsa, «Yes/Ha» deng — sahifa raqamlari shunda chiqadi.");
}

function printHTML(body, css) {
  const w = window.open("", "_blank");
  if (!w) return alert("Brauzer yangi oynani blokladi. Ruxsat bering.");
  w.document.write(`<!doctype html><meta charset=utf-8><title>Student AI</title><style>${css}</style>${body}<script>onload=()=>setTimeout(()=>print(),400)<\/script>`);
  w.document.close();
}
function exportPdf(r) {
  if (r.type === "ppt") {
    const t = THEMES[r.theme], d = r.data;
    const pg = (inner) => `<section style="background:#${t.bg};color:#${t.tx}">${inner}</section>`;
    const body = pg(`<h1>${esc(d.title || r.name)}</h1><p>${esc(d.subtitle || "")}</p>`) +
      d.slides.map((s) => pg(`<h2>${esc(s.title)}</h2><ul>${(s.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`)).join("");
    printHTML(body, `@page{size:297mm 167mm;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font-family:${t.f},Arial,sans-serif}
section{width:297mm;height:167mm;padding:22mm 24mm;border-left:9mm solid #${t.ac};page-break-after:always;overflow:hidden}h1{font-size:40pt;color:#${t.tt};margin:30mm 0 6mm}h2{font-size:28pt;color:#${t.tt};margin:0 0 8mm}li{font-size:17pt;margin:0 0 4mm}p{font-size:20pt}`);
    return;
  }
  const d = DD[docDesign], m = r.meta, course = !!m, pt = d.sz / 2;
  const title = m ? `<div class=tp><p>${esc(m.uni || "")}</p><p>${esc(m.faculty || "")}</p><h2>KURS ISHI</h2><p>${esc(m.subject ? "Fan: " + m.subject : "")}</p><h1>${esc(m.title)}</h1><p>${esc(m.author ? "Bajardi: " + m.author : "")}</p><p>${esc(m.teacher ? "Ilmiy rahbar: " + m.teacher : "")}</p><p>${new Date().getFullYear()}</p></div>` : "";
  const toc = course ? `<div class=toc><h1 style="page-break-before:avoid">MUNDARIJA</h1>${parseBlocks(r.text).filter((b) => b.t === "h" && b.n <= 2).map((b) => `<p class="t${b.n}">${esc(b.s)}</p>`).join("")}</div>` : "";
  printHTML(title + toc + `<article>${md2html(r.text)}</article>`, `@page{size:A4;margin:20mm 15mm 20mm 30mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font:${pt}pt/${d.line / 240} "${d.font}",Georgia,serif;color:#111}.tp{text-align:center;page-break-after:always;padding-top:20mm}.tp h1{font-size:${pt + 6}pt;margin:30mm 0;color:#${d.hc}}.tp h2{color:#${d.hc};margin:12mm 0}.tp p{margin:5mm 0}
.toc{page-break-after:always}.toc p{text-indent:0!important;margin:2mm 0}.toc .t2{padding-left:8mm}
h1,h2,h3{color:#${d.hc};page-break-after:avoid}h1{font-size:${pt + 2}pt;text-align:${d.ha};${course ? "page-break-before:always;" : ""}border-bottom:${d.ha === "center" ? 0 : 1.5}px solid #${d.ac};padding-bottom:2mm}h2{font-size:${pt}pt}h3{font-size:${pt}pt}
p{text-align:justify;text-indent:12.5mm;margin:0 0 1mm}li{margin-bottom:2mm}table{border-collapse:collapse;width:100%;page-break-inside:avoid;margin-top:4mm}td,th{border:1px solid #444;padding:2mm;font-size:${pt - 2}pt;text-align:left}th{background:#e8eef6}
.cap{text-align:center;text-indent:0;margin:2mm 0 6mm;font-size:${pt - 1}pt}`);
}

function exportPptx(r) {
  const t = THEMES[r.theme], d = r.data, p = new PptxGenJS();
  p.layout = "LAYOUT_16x9";
  const bar = (s) => s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.3, h: 5.625, fill: { color: t.ac }, line: { color: t.ac } });
  let s = p.addSlide(); s.background = { color: t.bg }; bar(s);
  s.addText(d.title || r.name, { x: 0.9, y: 1.6, w: 8.3, h: 1.4, fontFace: t.f, fontSize: 38, bold: true, color: t.tt, valign: "bottom", fit: "shrink" });
  s.addShape(p.ShapeType.rect, { x: 0.9, y: 3.1, w: 1.2, h: 0.07, fill: { color: t.ac }, line: { color: t.ac } });
  if (d.subtitle) s.addText(d.subtitle, { x: 0.9, y: 3.3, w: 8.3, h: 0.9, fontFace: t.f, fontSize: 18, color: t.tx, valign: "top", fit: "shrink" });
  d.slides.forEach((sl, i) => {
    s = p.addSlide(); s.background = { color: t.bg }; bar(s);
    s.addText(sl.title || "", { x: 0.7, y: 0.4, w: 8.6, h: 0.9, fontFace: t.f, fontSize: 28, bold: true, color: t.tt, fit: "shrink", valign: "middle" });
    s.addText((sl.bullets || []).map((b) => ({ text: b, options: { bullet: { code: "25A0" }, breakLine: true } })),
      { x: 0.7, y: 1.5, w: 8.6, h: 3.5, fontFace: t.f, fontSize: 20, color: t.tx, paraSpaceAfter: 10, valign: "top", fit: "shrink" });
    s.addText(String(i + 2), { x: 9.0, y: 5.2, w: 0.7, h: 0.3, fontSize: 11, color: t.ac, align: "right" });
    if (sl.notes) s.addNotes(sl.notes);
  });
  p.write({ outputType: "blob" }).then((b) => dl(b, r.name, "pptx"));
}

/* ---------- Fayldan matn ---------- */
async function readFile(f, st) {
  const n = f.name.toLowerCase();
  if (n.endsWith(".txt") || n.endsWith(".md")) return f.text();
  if (n.endsWith(".docx")) return (await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value;
  if (n.endsWith(".pptx")) {
    const z = await JSZip.loadAsync(await f.arrayBuffer());
    const names = Object.keys(z.files).filter((x) => /^ppt\/slides\/slide\d+\.xml$/.test(x)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
    let out = "";
    for (const x of names) out += [...(await z.file(x).async("string")).matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(" ") + "\n\n";
    return out.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  }
  if (f.type.startsWith("image/")) { st("Rasmdan matn o'qilmoqda (OCR)…"); return (await Tesseract.recognize(f, "eng+rus+uzb")).data.text; }
  if (n.endsWith(".pdf")) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) t += (await (await pdf.getPage(i)).getTextContent()).items.map((x) => x.str).join(" ") + "\n";
    if (t.trim().length > 40) return t;
    let o = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 8); i++) {
      st(`Skanerlangan PDF, OCR: ${i}-bet…`);
      const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 2 }), c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      o += (await Tesseract.recognize(c, "eng+rus+uzb")).data.text + "\n";
    }
    return o;
  }
  throw new Error("Bu format qo'llab-quvvatlanmaydi");
}

/* ---------- UI ---------- */
function setStatus(m, err) { const e = $("#status"); e.textContent = m || ""; e.className = "msg" + (err ? " err" : ""); }
function renderTabs() {
  $("#tabs").innerHTML = Object.entries(TOOLS).map(([k, t]) => `<button role="tab" data-k="${k}" aria-selected="false">${t.n}</button>`).join("");
  $("#tabs").onclick = (e) => { const k = e.target.dataset.k; if (k) pick(k); };
}
function pick(k) {
  tool = k; const t = TOOLS[k];
  document.querySelectorAll("#tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.k === k));
  $("#toolname").textContent = t.n; $("#tooldesc").textContent = t.d; setStatus("");
  $("#toolform").innerHTML = t.f.map((f) => {
    const id = "f_" + f.k, req = f.req ? " required" : "";
    const inp = f.t === "textarea" ? `<textarea id="${id}"${req}></textarea>`
      : f.t === "select" ? `<select id="${id}">${f.o.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`
      : `<input id="${id}" type="${f.t}"${req}${f.v ? ` value="${f.v}" min="${f.min}" max="${f.max}"` : ""}>`;
    return `<label>${f.l}${inp}</label>`;
  }).join("");
  $("#toolform").className = "";
  $("#toolform").onsubmit = (e) => { e.preventDefault(); run(); };
}
const mk = (l, c, fn) => { const b = document.createElement("button"); b.textContent = l; b.className = c; b.style.margin = 0; b.onclick = fn; return b; };
let lastTA = null;
document.addEventListener("focusin", (e) => { if (e.target.tagName === "TEXTAREA" && e.target.id.startsWith("f_")) lastTA = e.target; });
function renderPpt(r) {
  const t = THEMES[r.theme], res = $("#result"); res.className = "result slides";
  res.innerHTML = [{ title: r.data.title, bullets: [r.data.subtitle || ""] }, ...r.data.slides].map((s) =>
    `<div class="slide" style="background:#${t.bg};color:#${t.tx};--ac:#${t.ac}"><b style="color:#${t.tt}">${esc(s.title || "")}</b><ul>${(s.bullets || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
}
function showResult(r) {
  state = r; $("#resultcard").hidden = false;
  const A = $("#actions"), res = $("#result"); A.innerHTML = "";
  if (r.type === "plan") {
    res.className = "result";
    res.innerHTML = `<p>Reja tayyor. Kerak bo'lsa tahrirlang (format: Kirish / 1-bob. … / 1.1. … / Xulosa), so'ng tasdiqlang.</p><textarea id="plantxt" style="min-height:260px;font-family:Onest,sans-serif"></textarea>`;
    $("#plantxt").value = r.text;
    A.appendChild(mk("Rejani tasdiqlab, yozishni boshlash", "primary", () => writeCourse(r.v, $("#plantxt").value)));
    res.scrollIntoView({ behavior: "smooth", block: "start" }); return;
  }
  const isPpt = r.type === "ppt", sel = document.createElement("select");
  sel.setAttribute("aria-label", "Dizayn tanlash");
  sel.innerHTML = Object.keys(isPpt ? THEMES : DD).map((o) => `<option${(isPpt ? r.theme : docDesign) === o ? " selected" : ""}>${esc(o)}</option>`).join("");
  sel.onchange = () => { if (isPpt) { r.theme = sel.value; renderPpt(r); } else docDesign = sel.value; };
  const lab = document.createElement("label"); lab.textContent = "Dizayn: "; lab.append(sel); A.appendChild(lab);
  if (isPpt) A.append(mk("PPTX yuklab olish", "primary", () => exportPptx(r)), mk("PDF", "ghost", () => exportPdf(r)));
  else A.append(mk("Word (.docx)", "primary", () => exportDocx(r).catch((e) => setStatus(e.message, 1))), mk("PDF", "ghost", () => exportPdf(r)),
    mk("Nusxa olish", "ghost", () => navigator.clipboard.writeText(r.text).then(() => setStatus("Nusxa olindi"))));
  if (isPpt) renderPpt(r); else { res.className = "result"; res.innerHTML = md2html(r.text); }
  res.scrollIntoView({ behavior: "smooth", block: "start" });
}
async function writeCourse(v, plan) {
  const btn = $("#run"); btn.disabled = true;
  try { const r = await courseWrite(v, plan, (m) => setStatus(m)); showResult(r); setStatus(r.note); }
  catch (e) { setStatus(e.message, 1); }
  btn.disabled = false;
}
async function run() {
  const form = $("#toolform"); if (!form.reportValidity()) return;
  const v = {}; TOOLS[tool].f.forEach((f) => (v[f.k] = $("#f_" + f.k).value.trim()));
  const btn = $("#run"); btn.disabled = true;
  try { const r = await RUN[tool](v, (m) => setStatus(m)); showResult(r); setStatus(r.note || "Tayyor"); }
  catch (e) { setStatus(e.message, 1); }
  btn.disabled = false;
}
$("#run").onclick = run;
$("#file").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  const ta = lastTA && $("#toolform").contains(lastTA) ? lastTA : $("#toolform textarea"); if (!ta) return setStatus("Bu vositada matn maydoni yo'q", 1);
  $("#filestatus").textContent = "O'qilmoqda…";
  try { const t = (await readFile(f, (m) => ($("#filestatus").textContent = m))).trim();
    if (!t) throw new Error("Fayldan matn topilmadi"); ta.value = t.slice(0, 60000); $("#filestatus").textContent = f.name + " — " + t.length + " belgi → " + (ta.closest("label")?.firstChild.textContent || ""); }
  catch (err) { $("#filestatus").textContent = ""; setStatus(err.message, 1); }
  e.target.value = "";
};

/* ---------- Autentifikatsiya ---------- */
function gate() {
  const on = !!(sb && session) || !sb;
  $("#auth").hidden = on; $("#app").hidden = !on; $("#userbox").hidden = !(sb && session);
  if (session) $("#useremail").textContent = session.user.email;
}
async function init() {
  renderTabs(); pick("ppt");
  if (cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY && window.supabase) {
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
    session = (await sb.auth.getSession()).data.session;
    sb.auth.onAuthStateChange((_e, s) => { session = s; gate(); });
  }
  gate();
}
const am = (m, e) => { const x = $("#authmsg"); x.textContent = m; x.className = "msg" + (e ? " err" : ""); };
$("#authform").onsubmit = async (e) => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $("#email").value, password: $("#password").value });
  if (error) am(error.message.includes("Invalid") ? "Email yoki parol noto'g'ri" : error.message, 1);
};
$("#signup").onclick = async () => {
  if (!$("#authform").reportValidity()) return;
  const { data, error } = await sb.auth.signUp({ email: $("#email").value, password: $("#password").value, options: { emailRedirectTo: location.origin } });
  if (error) return am(error.message, 1);
  am(data.session ? "Ro'yxatdan o'tdingiz" : "Emailingizga tasdiqlash xati yuborildi.");
};
$("#logout").onclick = () => sb.auth.signOut();
init();

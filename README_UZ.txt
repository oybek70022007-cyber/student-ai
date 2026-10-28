STUDENT AI — O'RNATISH VA DEPLOY (O'ZBEKCHA)

1) TARKIB
index.html, style.css, app.js, config.js, netlify.toml, netlify/functions/ai.mjs

2) SUPABASE
- supabase.com da loyiha oching. Project Settings -> API dan "Project URL" va "anon / publishable" kalitini oling.
- config.js ichiga SUPABASE_URL va SUPABASE_PUBLISHABLE_KEY ni yozing.
  (service_role kalitini HECH QACHON yozmang.)
- Authentication -> URL Configuration: Site URL va Redirect URLs ga Netlify domeningizni kiriting
  (masalan https://sizning-sayt.netlify.app).
- Authentication -> Providers -> Email yoqilgan bo'lsin.
- config.js bo'sh qoldirilsa, sayt kirishsiz (demo) ishlaydi, lekin bunda AI funksiyasini hamma ishlata oladi.

3) GROQ
- console.groq.com dan API kalit oling.

4) NETLIFY
- Saytni Git orqali yoki "Netlify CLI" bilan deploy qiling (oddiy drag&drop Functions ni ishlatmasligi mumkin):
    npm i -g netlify-cli
    netlify login
    netlify deploy --prod
- Site configuration -> Environment variables:
    GROQ_API_KEY     = (Groq kaliti)             <- majburiy
    SUPABASE_URL     = (config.js dagi URL bilan bir xil)   <- tavsiya
    SUPABASE_ANON_KEY= (config.js dagi anon kalit)          <- tavsiya
    GROQ_MODEL       = ixtiyoriy (standart: llama-3.3-70b-versatile)
  SUPABASE_URL va SUPABASE_ANON_KEY berilsa, server faqat tizimga kirgan foydalanuvchilarga javob beradi.
- Env o'zgargach qayta deploy qiling.

5) TEKSHIRISH (production saytda)
- Ro'yxatdan o'tish va kirish
- Har bir vositada AI javobi
- PDF/DOCX/PPTX/rasm yuklash
- PPTX, DOCX, PDF eksporti (PDF: oynada "Save as PDF" ni tanlang)
- Telefonda ko'rinish

6) ESLATMALAR
- Kurs ishida "Sizning promptingiz" maydoniga o'z talabingizni yozing.
- AI manba o'ylab topmasligi uchun adabiyotlar ro'yxati bo'sh qoldiriladi; uni o'zingiz to'ldiring.
- Skaner qilingan PDF/rasm OCR si sifati skan sifatiga bog'liq; PDF uchun dastlabki 8 bet o'qiladi.
- Groq bepul limiti tugasa 429 xato chiqadi; bir oz kutib qayta urining.

7) KURS ISHI (UNIVERSAL PROMPT)
- Jarayon: ma'lumot kiritish -> reja (tahrirlab tasdiqlanadi) -> bo'lim-bo'lim yozish -> Word/PDF.
- Metodik qo'llanmani fayldan yuklab, "Metodik qo'llanma matni" maydoniga qo'ying.
- "Siz tekshirgan manbalar" maydoni to'ldirilsa, adabiyotlar bo'limiga shu holicha qo'yiladi.
- Sayt veb-qidiruv qilmaydi va manbalarni tekshirmaydi: faktlar o'rniga [bu yerga ... ma'lumotini qo'ying] belgisi chiqadi.
- Dizayn natija oynasidagi ro'yxatdan tanlanadi (Word/PDF uchun 6 ta, prezentatsiya uchun 15 ta).
  "Klassik (standart)" dizayn universal promptdagi standart formatga mos (TNR 14, 1,5 interval, 3/1,5/2/2 sm).
- Word faylda mundarija maydon sifatida qo'yiladi: ochganda yangilashga rozilik bering.

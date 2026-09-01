/*
 * Yol nişanları bazasını qurur.
 *
 * Mənbə: `nisanlar/` — dyp.gov.az saytının 10 "yol nişanları" səhifəsinin
 * brauzerlə saxlanmış nüsxəsi (HTML + `<ad>_files/` şəkil qovluğu). Bu qovluq
 * repoda saxlanmır (.gitignore), ona görə skript bir dəfəlik işlədilir və
 * nəticəsi commit olunur:
 *
 *   node tools/build-nisanlar.js
 *     -> assets/nisanlar/<kateqoriya>/<nişan>.gif   (təmizlənmiş adlarla)
 *     -> js/nisanlar-data.js                        (test üçün baza)
 *
 * Nişanın nömrəsi və adı mənbədəki <img alt="..."> mətnindən götürülür,
 * yəni rəsmi mətndir — əl ilə yazılmır.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'nisanlar');
const IMG_OUT = path.join(__dirname, '..', 'assets', 'nisanlar');
const DATA_OUT = path.join(__dirname, '..', 'js', 'nisanlar-data.js');

// Sayt şablonuna aid şəkillər — nişan deyil.
const SKIP = new Set(['logo_az.png', 'lupa.gif', 'phone.gif', 'mail.gif', 'eye-3-32-1.png', 'logo_bottom_az.png']);

// Mənbə səhifə adı -> kateqoriya. Sıra rəsmi nömrələmə ilə eynidir.
// `test: false` olan kateqoriya testdə iştirak etmir: "Yolların nişanlanması"
// nişan deyil, yol xətləridir və adı yox, uzun izahı var — 4 variantlı sualda
// oxunmur. Baza tam qalsın deyə silinmir.
const KATEQORIYALAR = [
  { id: 'xeberdarliq',   fayl: 'Xəbərdarlıq nişanları',                        ad: 'Xəbərdarlıq nişanları',              qisa: 'Xəbərdarlıq',    test: true },
  { id: 'ustunluk',      fayl: 'Üstünlük nişanları',                           ad: 'Üstünlük nişanları',                 qisa: 'Üstünlük',       test: true },
  { id: 'qadagan',       fayl: 'Qadağan nişanları',                            ad: 'Qadağan nişanları',                  qisa: 'Qadağan',        test: true },
  { id: 'mecburi',       fayl: 'Məcburi hərəkət istiqaməti nişanları',         ad: 'Məcburi hərəkət istiqaməti nişanları', qisa: 'Məcburi hərəkət', test: true },
  { id: 'melumatverici', fayl: 'Məlumatverici-göstərici nişanlar',             ad: 'Məlumatverici-göstərici nişanlar',   qisa: 'Məlumatverici',  test: true },
  { id: 'servis',        fayl: 'Servis nişanları',                             ad: 'Servis nişanları',                   qisa: 'Servis',         test: true },
  { id: 'elave-melumat', fayl: 'Əlavə məlumat nişanları (lövhəcikləri)',       ad: 'Əlavə məlumat nişanları (lövhəciklər)', qisa: 'Əlavə məlumat', test: true },
  { id: 'taninma',       fayl: 'Nəqliyyat vasitələrinin tanınma nişanları',    ad: 'Nəqliyyat vasitələrinin tanınma nişanları', qisa: 'Tanınma nişanları', test: true },
  { id: 'yol-isleri',    fayl: 'Yol işlərində istifadə olunan işarələr',       ad: 'Yol işlərində istifadə olunan işarələr', qisa: 'Yol işləri',  test: true },
  { id: 'nisanlanma',    fayl: 'Yolların nişanlanması',                        ad: 'Yolların nişanlanması',              qisa: 'Nişanlanma',     test: false },
];

// Mənbədəki fayl adlarında `+`, boşluq və nöqtə var (`3.17.2++.gif`) — URL-də
// problem çıxarmasın deyə hamısı `-` ilə əvəzlənir.
function temizAd(fayl) {
  const uz = path.extname(fayl).toLowerCase();
  return path.basename(fayl, path.extname(fayl))
    .toLowerCase()
    .replace(/\+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + uz;
}

function metn(s) {
  return s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

const nisanlar = [];
let kopyalanan = 0;

for (const kat of KATEQORIYALAR) {
  const html = fs.readFileSync(path.join(SRC, kat.fayl + '.html'), 'utf8');
  const filesDir = path.join(SRC, kat.fayl + '_files');
  const hedef = path.join(IMG_OUT, kat.id);
  fs.mkdirSync(hedef, { recursive: true });

  const istifade = new Set();

  for (const m of html.matchAll(/<img src="([^"]+)" alt="([^"]*)"[^>]*>/g)) {
    const fayl = decodeURIComponent(m[1].split('/').pop());
    if (SKIP.has(fayl)) continue;

    let alt = metn(m[2]);
    if (!alt) continue;
    alt = alt.replace('baçlanğıcı', 'başlanğıcı'); // mənbədəki yazı səhvi (5.22)

    // "2.1 Baş yol" / "1.1 - əks istiqamətli ..." / nömrəsiz tanınma nişanları
    const p = alt.match(/^(\d+(?:\.\d+)*)\s*-?\s*(.+)$/);
    const n = p ? p[1] : '';
    const ad = p ? p[2].trim() : alt;

    let cixis = temizAd(fayl);
    for (let i = 2; istifade.has(cixis); i++) {
      cixis = cixis.replace(/(\.[a-z0-9]+)$/, '-' + i + '$1');
    }
    istifade.add(cixis);

    fs.copyFileSync(path.join(filesDir, fayl), path.join(hedef, cixis));
    kopyalanan++;

    nisanlar.push({ n: n, ad: ad, kat: kat.id, img: cixis });
  }
}

const sr = s => JSON.stringify(s);

const setirler = nisanlar.map(s =>
  `  { n: ${sr(s.n)}, ad: ${sr(s.ad)}, kat: ${sr(s.kat)}, img: ${sr(s.img)} },`
).join('\n');

const katSetirler = KATEQORIYALAR.map(k =>
  `  { id: ${sr(k.id)}, ad: ${sr(k.ad)}, qisa: ${sr(k.qisa)}, test: ${k.test} },`
).join('\n');

fs.writeFileSync(DATA_OUT,
`/*
 * Yol nişanları bazası — AVTOMATİK YARADILIB, əl ilə redaktə etməyin.
 * Yenidən qurmaq üçün: node tools/build-nisanlar.js
 *
 * Mənbə: Azərbaycan Respublikası Baş Dövlət Yol Polisi İdarəsi — dyp.gov.az
 * Şəkillər: /assets/nisanlar/<kat>/<img>
 * Cəmi ${nisanlar.length} nişan, ${KATEQORIYALAR.length} kateqoriya.
 */
window.NISAN_KATEQORIYALARI = [
${katSetirler}
];

window.NISANLAR = [
${setirler}
];
`, 'utf8');

console.log('şəkil:', kopyalanan, '| nişan:', nisanlar.length);

/*
 * Yol nişanları testi — nisan-testi.html.
 * Baza: js/nisanlar-data.js (window.NISANLAR, window.NISAN_KATEQORIYALARI).
 *
 * Bir sual = təsadüfi nişanın şəkli + 4 ad variantı (biri düzgündür).
 * Cavab seçilən kimi nəticə görünür, "Növbəti sual" yeni sual gətirir.
 */
(function () {
  var quiz = document.getElementById('quiz');
  if (!quiz || !window.NISANLAR || !window.NISAN_KATEQORIYALARI) return;

  var VARIANT = 4;
  var HAMISI = 'hamisi';

  // Testdə yalnız adı olan nişan qrupları iştirak edir (bax: nisanlar-data.js).
  var katlar = window.NISAN_KATEQORIYALARI.filter(function (k) { return k.test; });
  var katAdi = {};
  katlar.forEach(function (k) { katAdi[k.id] = k.ad; });
  var butunNisanlar = window.NISANLAR.filter(function (s) { return katAdi[s.kat]; });

  var el = {
    filters: document.getElementById('quizFilters'),
    img: document.getElementById('quizImg'),
    options: document.getElementById('quizOptions'),
    feedback: document.getElementById('quizFeedback'),
    next: document.getElementById('quizNext'),
    reset: document.getElementById('quizReset'),
    no: document.getElementById('quizNo'),
    right: document.getElementById('quizRight'),
    asked: document.getElementById('quizAsked')
  };

  var seciliKat = HAMISI;
  var novbe = [];          // qarışdırılmış nişan növbəsi — hamısı bitmədən təkrar olmur
  var cari = null;
  var cavablandi = false;
  var sorusulan = 0;
  var duzgun = 0;

  function qarisdir(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function hovuz() {
    if (seciliKat === HAMISI) return butunNisanlar;
    return butunNisanlar.filter(function (s) { return s.kat === seciliKat; });
  }

  function novbetiNisan() {
    if (!novbe.length) {
      novbe = qarisdir(hovuz().slice());
      // Növbə yenidən doldurulanda əvvəlki sual dərhal təkrarlanmasın.
      if (cari && novbe.length > 1 && novbe[novbe.length - 1] === cari) {
        novbe.unshift(novbe.pop());
      }
    }
    return novbe.pop();
  }

  // Yanlış variantlar əvvəlcə eyni kateqoriyadan seçilir (belə daha çətin və
  // faydalıdır); kateqoriyada kifayət qədər fərqli ad yoxdursa, qalanı ümumi
  // bazadan tamamlanır. Adlar təkrarlanmır — eyni ada malik iki variant
  // sualı cavabsız qoyardı.
  function variantlar(dogru) {
    var secilmis = [];
    var gorulen = {};
    gorulen[dogru.ad] = true;

    function doldur(list) {
      for (var i = 0; i < list.length && secilmis.length < VARIANT - 1; i++) {
        var ad = list[i].ad;
        if (gorulen[ad]) continue;
        gorulen[ad] = true;
        secilmis.push(ad);
      }
    }

    doldur(qarisdir(butunNisanlar.filter(function (s) { return s.kat === dogru.kat; })));
    doldur(qarisdir(butunNisanlar.filter(function (s) { return s.kat !== dogru.kat; })));

    return qarisdir(secilmis.concat([dogru.ad]));
  }

  function sualQur() {
    cari = novbetiNisan();
    if (!cari) return;
    cavablandi = false;

    el.img.src = '/assets/nisanlar/' + cari.kat + '/' + cari.img;
    el.img.alt = 'Tanınması tələb olunan yol nişanı';
    el.no.textContent = sorusulan + 1;

    el.feedback.hidden = true;
    el.feedback.className = 'quiz-feedback';
    el.feedback.textContent = '';
    el.next.disabled = true;

    el.options.innerHTML = '';
    variantlar(cari).forEach(function (ad, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';

      var key = document.createElement('span');
      key.className = 'qo-key';
      key.textContent = String(i + 1);

      var text = document.createElement('span');
      text.className = 'qo-text';
      text.textContent = ad;

      b.appendChild(key);
      b.appendChild(text);
      b.addEventListener('click', function () { cavabla(b, ad); });
      el.options.appendChild(b);
    });
  }

  function cavabla(btn, ad) {
    if (cavablandi) return;
    cavablandi = true;
    sorusulan++;

    var dogrudur = ad === cari.ad;
    if (dogrudur) duzgun++;

    Array.prototype.forEach.call(el.options.children, function (b) {
      b.disabled = true;
      var t = b.querySelector('.qo-text').textContent;
      if (t === cari.ad) b.classList.add('is-correct');
      else if (b === btn) b.classList.add('is-wrong');
    });

    el.right.textContent = duzgun;
    el.asked.textContent = sorusulan;

    el.feedback.hidden = false;
    el.feedback.classList.add(dogrudur ? 'is-ok' : 'is-no');
    el.feedback.textContent = (dogrudur ? 'Düzdür! ' : 'Səhvdir. Düzgün cavab: ') +
      (cari.n ? cari.n + ' ' : '') + cari.ad;

    var kat = document.createElement('span');
    kat.className = 'qf-kat';
    kat.textContent = katAdi[cari.kat];
    el.feedback.appendChild(kat);

    el.next.disabled = false;
    el.next.focus();
  }

  function filtrleriQur() {
    var siyahi = [{ id: HAMISI, qisa: 'Hamısı' }].concat(katlar);
    siyahi.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = k.qisa;
      b.setAttribute('aria-pressed', k.id === seciliKat ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (seciliKat === k.id) return;
        seciliKat = k.id;
        novbe = [];
        cari = null;
        Array.prototype.forEach.call(el.filters.children, function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        sualQur();
      });
      el.filters.appendChild(b);
    });
  }

  el.next.addEventListener('click', sualQur);

  el.reset.addEventListener('click', function () {
    sorusulan = 0;
    duzgun = 0;
    novbe = [];
    el.right.textContent = '0';
    el.asked.textContent = '0';
    sualQur();
  });

  document.addEventListener('keydown', function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key >= '1' && e.key <= String(VARIANT)) {
      var b = el.options.children[Number(e.key) - 1];
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    } else if (e.key === 'Enter' && cavablandi) {
      e.preventDefault();
      sualQur();
    }
  });

  filtrleriQur();
  sualQur();
})();

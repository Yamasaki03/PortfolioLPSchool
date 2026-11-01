/* ==========================================================
   Little Hello LP — Vanilla JS
   ========================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 計測(GTM の dataLayer へ送る) ----------
     お名前・メールアドレスなど個人を特定できる情報は送らない */
  const track = (event, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      console.info('[track]', event, params);
    }
  };

  // アニメーションを最初から再生し直す
  const replay = (el, className) => {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  };

  /* ==========================================================
     ヘッダーのメニュー(スマホ)
     ========================================================== */
  const initMenu = () => {
    const toggle = $('.menu-toggle');
    const nav = $('#global-nav');
    const label = $('[data-menu-label]');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      label.textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setOpen(false);
    });
  };

  /* ==========================================================
     スクロールで現れる(ふきだし・点線ルート)
     ========================================================== */
  const initReveal = () => {
    const targets = $$('[data-reveal], .reveal, [data-reveal-group]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-inview'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    targets.forEach((el) => io.observe(el));
  };

  /* ==========================================================
     2. 旅のフレーズカード
     ========================================================== */
  const initPhrase = () => {
    const tabs = $$('.chip-tab');
    const panels = $$('.phrase__panel');
    const icon = $('[data-scene-icon]');
    const cheer = $('[data-phrase-cheer]');
    if (!tabs.length) return;

    let flipCount = 0;

    const selectScene = (scene, { focus = false, animate = true } = {}) => {
      tabs.forEach((tab) => {
        const on = tab.dataset.scene === scene;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      panels.forEach((panel) => {
        const on = panel.dataset.panel === scene;
        panel.hidden = !on;
        if (on) {
          if (icon) {
            icon.src = panel.dataset.icon;
            icon.alt = '';
          }
          if (animate) replay($('.phrase__grid', panel), 'is-entering');
        }
      });
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectScene(tab.dataset.scene));
      // 矢印キーでタブを移動
      tab.addEventListener('keydown', (e) => {
        const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (e.key === 'Home' || e.key === 'End' || dir) {
          e.preventDefault();
          const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + dir + tabs.length) % tabs.length;
          selectScene(tabs[next].dataset.scene, { focus: true });
        }
      });
    });

    // カードをタップすると、くるっと裏返る
    $$('.phrase-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (reducedMotion.matches) return; // 動きを減らす設定では、最初から両面を表示
        const on = card.getAttribute('aria-pressed') !== 'true';
        card.setAttribute('aria-pressed', String(on));
        if (!on) return;

        const scene = card.closest('.phrase__panel').dataset.panel;
        track('phrase_flip', { scene });
        flipCount += 1;
        if (cheer && (flipCount === 2 || flipCount === 4)) {
          cheer.textContent = flipCount === 2
            ? 'その調子!覚え方のコツは、資料にもまとめています'
            : 'いい感じです。場面ごとのフレーズ集は資料で';
          replay(cheer, 'is-cheer');
        }
      });
    });

    // 最初の1枚は裏返しておき、触れることを伝える
    const demo = $('[data-demo-flip]');
    if (demo && !reducedMotion.matches) demo.setAttribute('aria-pressed', 'true');

    selectScene('cafe', { animate: false });
  };

  /* ==========================================================
     5. レベル診断(3問)
     ========================================================== */
  const QUIZ = [
    { q: '英語で「How are you?」と聞かれたら?', o: ['すぐに返せる', '少し考えれば返せる', 'ドキドキして固まってしまう'] },
    { q: '旅先のカフェで注文するとしたら?', o: ['英語でそのまま注文できる', 'メニューを指さしながらなら', 'できれば誰かにお願いしたい'] },
    { q: '英語を話すのは、どれくらいぶり?', o: ['最近も使っている', '数年ぶり', '学生のとき以来'] }
  ];
  const RESULTS = [
    { max: 1, id: 'enjoy', name: '旅を楽しむコース', note: '基本の会話はばっちり。旅先での雑談やトラブル対応まで広げましょう。', level: 'daily' },
    { max: 4, id: 'first-trip', name: '旅のはじめてコース', note: '場面ごとのフレーズを増やして、旅先で自分から話しかけられるように。', level: 'little' },
    { max: 6, id: 'zero', name: 'ゼロからのひとことコース', note: 'あいさつと一言から。日本語の話せる講師と、ゆっくり始めましょう。', level: 'first' }
  ];
  const quizState = { step: 0, answers: [], result: null };

  const initQuiz = () => {
    const root = $('[data-quiz]');
    if (!root) return;
    const play = $('[data-quiz-play]', root);
    const body = $('[data-quiz-body]', root);
    const count = $('[data-quiz-count]', root);
    const bar = $('[data-quiz-bar]', root);
    const result = $('[data-quiz-result]', root);
    const resultName = $('[data-quiz-result-name]', root);
    const resultNote = $('[data-quiz-result-note]', root);

    const setBar = (ratio) => bar.style.setProperty('--p', ratio);

    const renderQuestion = (focus) => {
      const { q, o } = QUIZ[quizState.step];
      count.textContent = `Q${quizState.step + 1} / ${QUIZ.length}`;
      setBar(quizState.step / QUIZ.length);

      body.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'quiz__body slide-in';
      const question = document.createElement('p');
      question.className = 'quiz__q';
      question.tabIndex = -1;
      question.textContent = q;
      const opts = document.createElement('div');
      opts.className = 'quiz__opts';
      opts.setAttribute('role', 'group');
      opts.setAttribute('aria-label', '答えを選ぶ');
      o.forEach((label, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz__opt';
        btn.textContent = label;
        btn.addEventListener('click', () => answer(i, btn));
        opts.appendChild(btn);
      });
      wrap.append(question, opts);
      body.appendChild(wrap);
      if (focus) question.focus({ preventScroll: true });
    };

    let busy = false;
    const answer = (index, btn) => {
      if (busy) return;
      busy = true;
      btn.classList.add('is-picked');
      quizState.answers.push(index);
      quizState.step += 1;
      setBar(quizState.step / QUIZ.length);

      const wait = reducedMotion.matches ? 0 : 320;
      setTimeout(() => {
        busy = false;
        if (quizState.step < QUIZ.length) renderQuestion(true);
        else showResult();
      }, wait);
    };

    const showResult = () => {
      const score = quizState.answers.reduce((a, b) => a + b, 0);
      const res = RESULTS.find((r) => score <= r.max) || RESULTS[RESULTS.length - 1];
      quizState.result = res;
      resultName.textContent = res.name;
      resultNote.textContent = res.note;
      play.hidden = true;
      result.hidden = false;
      resultName.focus({ preventScroll: true });
      track('quiz_complete', { result: res.id });
    };

    $('[data-quiz-retry]', root).addEventListener('click', () => {
      quizState.step = 0;
      quizState.answers = [];
      quizState.result = null;
      result.hidden = true;
      play.hidden = false;
      renderQuestion(true);
    });

    renderQuestion(false);
  };

  /* ==========================================================
     7. 料金プラン
     ========================================================== */
  const PLAN_NAMES = { m4: '月4回', m8: '月8回', daily: '毎日プラン' };
  let currentPlan = 'm8';

  const initPlans = () => {
    const btns = $$('[data-plan-btn]');
    const plans = $$('[data-plan]');
    if (!btns.length) return;

    const select = (id, animate) => {
      currentPlan = id;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.planBtn === id)));
      plans.forEach((p) => {
        const on = p.dataset.plan === id;
        p.hidden = !on;
        // 金額の数字が、上から下へ入れ替わる
        if (on && animate) replay($('.plan__num', p), 'is-rolling');
      });
    };

    btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.planBtn, true)));
    select(currentPlan, false);
  };

  /* ==========================================================
     12. 資料請求フォーム(3ステップ)
     ========================================================== */
  const form = {
    started: false,
    source: 'direct',
    step: 1
  };

  const initForm = () => {
    const el = $('[data-form]');
    if (!el) return;
    el.noValidate = true; // JSが動くときは、やさしい言葉で知らせる

    const steps = $$('[data-step]', el);
    const progress = $('[data-form-progress]');
    const count = $('[data-form-count]');
    const bar = $('[data-form-bar]');
    const done = $('[data-done]');
    const prefill = $('[data-prefill]', el);
    const submitBtn = $('[data-submit]', el);
    const fields = {
      source: $('[data-field-source]', el),
      quiz: $('[data-field-quiz]', el),
      plan: $('[data-field-plan]', el),
      name: el.elements.name,
      email: el.elements.email,
      agree: el.elements.agree,
      website: el.elements.website
    };

    /* --- エラーの表示 --- */
    const showError = (key, message, input) => {
      const box = $(`[data-error="${key}"]`, el);
      if (!box) return;
      box.textContent = message;
      box.hidden = !message;
      if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (message) track('form_error', { field: key });
    };
    const clearError = (key, input) => {
      const box = $(`[data-error="${key}"]`, el);
      if (box) { box.textContent = ''; box.hidden = true; }
      if (input) input.removeAttribute('aria-invalid');
    };

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailMessage = (v) => {
      if (!v) return 'メールアドレスを入力してください。';
      if (!v.includes('@')) return '@が抜けているようです。';
      if (/[\s ]/.test(v)) return 'スペースが入っているようです。';
      if (!EMAIL_RE.test(v)) return 'メールアドレスの形を、もう一度ご確認ください。';
      return '';
    };

    /* --- ステップの切り替え --- */
    const goStep = (n, { focus = true } = {}) => {
      const back = n < form.step;
      form.step = n;
      steps.forEach((s) => {
        const on = Number(s.dataset.step) === n;
        s.hidden = !on;
        if (on) {
          s.classList.remove('slide-fwd', 'slide-back');
          void s.offsetWidth;
          s.classList.add(back ? 'slide-back' : 'slide-fwd');
          if (focus) $('[data-step-heading]', s).focus({ preventScroll: true });
        }
      });
      count.textContent = `${n} / 2`;
      bar.style.setProperty('--p', n / 2);
    };

    /* --- 入力開始 --- */
    const markStart = () => {
      if (form.started) return;
      form.started = true;
      track('form_start', { source: form.source });
    };
    el.addEventListener('change', markStart);
    el.addEventListener('input', markStart);

    el.addEventListener('change', (e) => {
      if (e.target.name === 'level') clearError('level');
    });

    /* --- ステップ1 → 2 --- */
    $('[data-next]', el).addEventListener('click', () => {
      if (!el.elements.level.value) {
        showError('level', 'レベルをひとつ選んでください。');
        el.querySelector('input[name="level"]').focus();
        return;
      }
      markStart(); // 診断から来て、そのまま進んだ場合も入力開始とみなす
      goStep(2);
      track('form_step', { step: 2 });
    });

    // 戻っても、選んだ内容は消えない
    $('[data-back]', el).addEventListener('click', () => goStep(1));

    /* --- その場で確認 --- */
    fields.email.addEventListener('blur', () => {
      const v = fields.email.value.trim();
      if (!v) return; // 何も入れていないときは、まだ知らせない
      const msg = emailMessage(v);
      if (msg) showError('email', msg, fields.email);
    });
    fields.email.addEventListener('input', () => {
      if (fields.email.getAttribute('aria-invalid') === 'true' && !emailMessage(fields.email.value.trim())) {
        clearError('email', fields.email);
      }
    });
    fields.name.addEventListener('input', () => {
      if (fields.name.value.trim()) clearError('name', fields.name);
    });
    fields.agree.addEventListener('change', () => {
      if (fields.agree.checked) clearError('agree', fields.agree);
    });

    /* --- 送信 --- */
    el.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.step !== 2) return;

      const name = fields.name.value.trim();
      const email = fields.email.value.trim();
      const errors = [];

      if (!name) { showError('name', 'お名前を入力してください。ニックネームでも大丈夫です。', fields.name); errors.push(fields.name); }
      const emailMsg = emailMessage(email);
      if (emailMsg) { showError('email', emailMsg, fields.email); errors.push(fields.email); }
      if (!fields.agree.checked) { showError('agree', 'プライバシーポリシーへの同意をお願いします。', fields.agree); errors.push(fields.agree); }
      if (errors.length) { errors[0].focus(); return; }

      submitBtn.disabled = true;
      $('.cta__label', submitBtn).textContent = '送信中…';

      // 制作サンプルのため、実際には送信しない(実装時はここで送信先へ送る)
      const isBot = fields.website.value !== '';
      setTimeout(() => {
        submitBtn.disabled = false;
        $('.cta__label', submitBtn).textContent = '資料を受け取る';
        if (!isBot) {
          const uses = $$('input[name="uses"]:checked', el).map((i) => i.value);
          // 送信に成功した瞬間に送る(個人情報は含めない)
          track('generate_lead', { level: el.elements.level.value, uses: uses.join(','), source: form.source });
        }
        showDone(name, email);
      }, 700);
    });

    /* --- 完了画面 --- */
    const showDone = (name, email) => {
      el.hidden = true;
      progress.hidden = true;
      $('[data-done-name]', done).textContent = name ? `${name}さん、` : '';
      $('[data-done-email]', done).textContent = email || 'ご入力のメールアドレス';
      done.hidden = false;
      done.classList.remove('is-shown');
      void done.offsetWidth;
      done.classList.add('is-shown'); // 紙飛行機が3つ飛んでいく(一度だけ)
      $('[data-done-title]', done).focus({ preventScroll: true });
      $('#form').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    };

    $('[data-download]', done).addEventListener('click', () => {
      track('download_click');
      // 実装時は PDF のダウンロードにつなぐ
      $('[data-download-note]', done).textContent = 'ありがとうございます。制作サンプルのため、実際の資料は配布していません。';
    });
    $('[data-trial]', done).addEventListener('click', (e) => {
      e.preventDefault();
      $('[data-download-note]', done).textContent = '制作サンプルのため、予約ページはありません。';
    });

    $('[data-reset]', done).addEventListener('click', () => {
      el.reset();
      ['level', 'name', 'email', 'agree'].forEach((k) => clearError(k, fields[k]));
      setSource('direct');
      fields.quiz.value = '';
      fields.plan.value = '';
      renderPrefill();
      form.started = false;
      done.hidden = true;
      el.hidden = false;
      progress.hidden = false;
      goStep(1);
    });

    /* --- 診断・料金プランから来たときに、選んだ内容を入れておく --- */
    const setSource = (src) => {
      form.source = src;
      fields.source.value = src;
    };
    const renderPrefill = () => {
      prefill.innerHTML = '';
      const tags = [];
      if (fields.quiz.value && quizState.result) tags.push(`診断結果:${quizState.result.name}`);
      if (fields.plan.value) tags.push(`気になるプラン:${PLAN_NAMES[fields.plan.value]}`);
      tags.forEach((t) => {
        const span = document.createElement('span');
        span.className = 'prefill__tag';
        span.textContent = t;
        prefill.appendChild(span);
      });
      prefill.hidden = tags.length === 0;
    };

    form.applyContext = (ctx) => {
      if (!done.hidden) return; // 完了後は、入力内容をそのままにする
      if (ctx === 'quiz' && quizState.result) {
        setSource('quiz');
        fields.quiz.value = quizState.result.id;
        const radio = el.querySelector(`input[name="level"][value="${quizState.result.level}"]`);
        if (radio) radio.checked = true;
        clearError('level');
      } else if (ctx === 'price') {
        setSource('price');
        fields.plan.value = currentPlan;
      } else {
        return;
      }
      renderPrefill();
      if (form.step !== 1) goStep(1, { focus: false });
    };

    goStep(1, { focus: false });
  };

  /* ==========================================================
     資料請求ボタン(計測+文脈に合わせた引き継ぎ)
     ========================================================== */
  const initCtas = () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('a[data-cta]');
      if (!btn) return;
      const position = btn.dataset.cta;
      const context = position === 'sticky' ? btn.dataset.context || '' : position;
      track('cta_click', { position, ...(context && context !== position ? { context } : {}) });
      if (form.applyContext) form.applyContext(context);
    });

    // フッターの「プライバシーポリシー」で概要を開く
    $$('[data-open-privacy]').forEach((a) => a.addEventListener('click', () => { $('#privacy').open = true; }));
  };

  /* ==========================================================
     スマホ下部の資料請求ボタン
     ファーストビューを過ぎたら出てくる/フォームが見えている間は隠す
     ========================================================== */
  const initSticky = () => {
    const bar = $('[data-sticky-cta]');
    const link = bar && $('a', bar);
    const label = $('[data-sticky-label]');
    const hero = $('#top');
    const header = $('.site-header');
    const formSec = $('#form');
    if (!bar || !hero || !formSec) return;

    const LABELS = {
      phrase: 'フレーズの覚え方を資料で見る',
      quiz: '診断結果に合った資料を受け取る',
      price: '料金の詳しい資料を受け取る'
    };
    const sections = $$('[data-section]');
    let visible = false;
    let ticking = false;

    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const headerH = header ? header.offsetHeight : 0;
      const show = hero.getBoundingClientRect().bottom <= headerH + 4 && formSec.getBoundingClientRect().top > vh;
      if (show !== visible) {
        visible = show;
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', String(!show));
        link.tabIndex = show ? 0 : -1;
      }
      if (!show) return;

      // いま見ているセクションに合わせて、文言を変える
      const mid = vh / 2;
      const current = sections.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= mid && r.bottom > mid;
      });
      let ctx = current ? current.dataset.section : '';
      if (ctx === 'quiz' && !quizState.result) ctx = '';
      const text = LABELS[ctx] || '無料で資料を受け取る';
      if (label.textContent !== text) label.textContent = text;
      link.dataset.context = LABELS[ctx] ? ctx : '';
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  };

  /* ---------- 起動 ---------- */
  initMenu();
  initReveal();
  initPhrase();
  initQuiz();
  initPlans();
  initForm();
  initCtas();
  initSticky();
})();

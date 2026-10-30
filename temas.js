// =====================================================================================
// temas.js — aba TEMAS nas Configurações + o que é "de tema" na partida:
//
//  • Palavras do julgamento: Padrão (MAX 100%), KOOL (KOOL/COOL/GOOD/BAD/MISS) ou Clássico
//    (PERFECT/GREAT/GOOD/BAD/MISS), com o % pequeno embaixo (opcional). Só muda o TEXTO na
//    tela: julgamento, precisão, recordes e ranking continuam iguais.
//  • Animação no fim da música: PERFECT PLAY / MAX COMBO / CLEAR animados por cima da gear
//    (cada pacote de palavras tem o seu estilo). "Simples" = o letreiro de antes.
//  • As opções do FEVER, das animações dentro da gear (pista-fx.js) e do menu animado
//    (menu-tema.js) moram aqui também. Tudo tem o jeito de antes como opção.
// =====================================================================================
(function () {
    const KEY = 'djmaxTemas_v1';
    const DEF = { holdHead: false, fever: 'auto', feverVis: 'sutil', feverSom: true, anel: true, juiz: 'padrao', juizPct: true, fim: 'animado', pulso: true, onda: true, brasa: true, menu: 'animado' };
    const cfg = Object.assign({}, DEF);
    const load = () => { try { Object.assign(cfg, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {} };
    load();
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };
    window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith(KEY)) { load(); aplicarTodos(); } });
    const ouvintes = [];
    function aplicarTodos() { ouvintes.forEach(f => { try { f(cfg); } catch (e) {} }); }
    window.bmTema = (k) => cfg[k];
    window.bmTemaOuvir = (f) => ouvintes.push(f);

    // ---------- palavras do julgamento ----------
    const PACOTES = {
        padrao: { nome: 'Padrão (MAX 100%)' },
        kool: { nome: 'KOOL (KOOL · COOL · GOOD · BAD · MISS)', p: (n) => n >= 100 ? 'KOOL' : n >= 80 ? 'COOL' : n >= 40 ? 'GOOD' : 'BAD', brk: 'MISS', fim: { perfect: 'ALL KOOL', full: 'FULL COMBO', clear: 'CLEAR' } },
        classico: { nome: 'Clássico (PERFECT · GREAT · GOOD · BAD · MISS)', p: (n) => n >= 100 ? 'PERFECT' : n >= 80 ? 'GREAT' : n >= 40 ? 'GOOD' : 'BAD', brk: 'MISS', fim: { perfect: 'ALL PERFECT', full: 'FULL COMBO', clear: 'CLEAR' } }
    };
    PACOTES.padrao.fim = { perfect: 'PERFECT PLAY', full: 'MAX COMBO', clear: 'CLEAR' };
    const pacote = () => PACOTES[cfg.juiz] || PACOTES.padrao;
    window.bmJuizPalavra = function (texto) {
        const P = pacote(); if (!P.p || !texto) return null;
        if (texto === 'BREAK') return { t: P.brk, n: null };
        const m = /^MAX (\d+)%$/.exec(texto);
        return m ? { t: P.p(+m[1]), n: +m[1] } : null;
    };
    let juizOrig = null;
    if (typeof window.hudJudgeStyle === 'function') {
        const o = window.hudJudgeStyle;
        window.hudJudgeStyle = function (text) { return o.call(this, juizOrig != null ? juizOrig : text); };
    }
    if (typeof window.drawGameHud === 'function') {
        const o = window.drawGameHud;
        window.drawGameHud = function (P, W, H) {
            const J = typeof lastJudgment !== 'undefined' ? lastJudgment : null;
            const troca = J && J.text && window.bmJuizPalavra(J.text);
            if (!troca) return o.apply(this, arguments);
            const t0 = J.text, s0 = J.subText;
            juizOrig = t0; J.text = troca.t;
            const comPct = cfg.juizPct && troca.n != null;
            if (comPct) J.subText = '';
            try { o.apply(this, arguments); } finally { J.text = t0; J.subText = s0; juizOrig = null; }
            // "100%" pequeno embaixo da palavra (+ FAST/SLOW, se tiver)
            if (comPct && typeof hudShowFlags === 'function' && hudShowFlags().judge) {
                const S = H - 80, centerHud = typeof hudLayout !== 'undefined' && hudLayout === 'center';
                const arcade = typeof gearProportion !== 'undefined' && gearProportion === 'arcade' && (typeof gameView === 'undefined' || gameView !== 'highway_tilt');
                const k = arcade ? 1 : Math.min(1.15, Math.max(0.6, S / 1000));
                const jy = centerHud ? S * 0.66 : arcade ? S * 0.863 : H * 0.62;
                const fs = s0 && s0 !== 'PERFECT' && s0 !== 'MISSED' && hudShowFlags().fastslow ? s0 : '';
                const txt = troca.n + '%' + (fs && (fs.startsWith('FAST') || fs.startsWith('SLOW')) ? '  ·  ' + fs : '');
                const age = performance.now() - (typeof hudJudgmentAt !== 'undefined' ? hudJudgmentAt : 0);
                P.text(txt, W / 2, jy + (arcade && !centerHud ? 22 : 26 * k), `700 ${Math.round(16 * k)}px "Barlow Condensed", Rajdhani, sans-serif`, fs.startsWith('FAST') ? '#93c5fd' : fs.startsWith('SLOW') ? '#fca5a5' : '#f1f5f9', { alpha: age > 1500 ? 0.4 : 0.85 });
            }
        };
    }

    // ---------- animação no fim da música ----------
    const css = document.createElement('style');
    css.textContent = `
#bm-fim{position:absolute;pointer-events:none;z-index:6;overflow:hidden;font-family:Orbitron,sans-serif}
#bm-fim .dim{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,rgba(0,0,0,.2),rgba(0,0,0,.6));opacity:0;animation:bfDim .4s forwards}
#bm-fim .w{position:absolute;left:0;right:0;top:34%;text-align:center;font-weight:900;line-height:.95;letter-spacing:.02em;white-space:nowrap}
#bm-fim .w span{display:inline-block;opacity:0;animation:bfLetra .42s cubic-bezier(.2,1.6,.4,1) forwards}
#bm-fim .w.grad span{background:var(--g);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
#bm-fim .sub{position:absolute;left:0;right:0;top:57%;text-align:center;font-weight:800;letter-spacing:.25em;opacity:0;animation:bfSub .5s .75s forwards}
#bm-fim .rays{position:absolute;left:50%;top:42%;width:220%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.16) 0 6deg,transparent 6deg 16deg);-webkit-mask:radial-gradient(circle,#000 6%,transparent 52%);mask:radial-gradient(circle,#000 6%,transparent 52%);opacity:0;animation:bfRays 8s linear forwards,bfIn .5s .2s forwards}
#bm-fim .ring{position:absolute;left:50%;top:42%;border-radius:50%;transform:translate(-50%,-50%) scale(.2);opacity:0;animation:bfRing .9s .15s cubic-bezier(.2,1,.3,1) forwards}
#bm-fim .sweep{position:absolute;top:30%;height:26%;width:45%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-20deg);animation:bfSweep .7s 1s ease-in forwards}
#bm-fim .band{position:absolute;left:-20%;right:-20%;top:33%;height:26%;transform:skewY(-8deg) scaleX(0);transform-origin:0 50%;animation:bfBand .35s .05s cubic-bezier(.2,1,.3,1) forwards}
#bm-fim i.sp{position:absolute;width:6px;height:6px;border-radius:1px;opacity:0;animation:bfSp 1.6s ease-out forwards}
@keyframes bfDim{to{opacity:1}}
@keyframes bfIn{to{opacity:1}}
@keyframes bfLetra{0%{opacity:0;transform:translateY(-80%) scale(1.8)}70%{opacity:1}100%{opacity:1;transform:none}}
@keyframes bfSub{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes bfRays{to{transform:translate(-50%,-50%) rotate(60deg)}}
@keyframes bfRing{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}40%{opacity:1}100%{opacity:.85;transform:translate(-50%,-50%) scale(1)}}
@keyframes bfSweep{to{left:120%}}
@keyframes bfBand{to{transform:skewY(-8deg) scaleX(1)}}
@keyframes bfSp{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}`;
    document.head.appendChild(css);

    function letras(t) { return [...t].map((ch, i) => ch === ' ' ? '<br>' : `<span style="animation-delay:${0.06 * i}s">${ch}</span>`).join(''); }
    function faiscas(n, cores) {
        let h = '';
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 45;
            h += `<i class="sp" style="left:${50 + (Math.random() - 0.5) * 30}%;top:${44 + (Math.random() - 0.5) * 18}%;background:${cores[i % cores.length]};box-shadow:0 0 8px ${cores[i % cores.length]};--dx:${Math.cos(a) * d}vh;--dy:${Math.sin(a) * d - 10}vh;animation-delay:${0.3 + Math.random() * 0.5}s"></i>`;
        }
        return h;
    }
    function montarFim(estado) {
        const box = document.getElementById('game-container');
        if (!box) return null;
        const rc = typeof gearRectsCached === 'function' ? gearRectsCached(performance.now()) : null;
        const br = rc ? rc.box : box.getBoundingClientRect();
        const gc = document.getElementById('gameCanvas');
        const gr = rc ? rc.gear : gc && gc.getBoundingClientRect();
        if (!gr || !gr.width) return null;
        const el = document.createElement('div');
        el.id = 'bm-fim';
        el.style.cssText = `left:${gr.left - br.left}px;top:${gr.top - br.top}px;width:${gr.width}px;height:${gr.height * 0.72}px`;
        const P = pacote(), nome = P.fim[estado];
        const fs = Math.max(26, Math.min(gr.width * 0.15, 76));
        const combo = (typeof stats !== 'undefined' && stats.maxCombo) || 0;
        let html = '<div class="dim"></div>';
        if (cfg.juiz === 'kool') {
            const band = estado === 'perfect' ? 'repeating-linear-gradient(115deg,#22d3ee 0 22px,#a855f7 22px 44px,#ec4899 44px 66px)' : estado === 'full' ? 'repeating-linear-gradient(115deg,rgba(236,72,153,.9) 0 22px,rgba(168,85,247,.9) 22px 44px)' : 'repeating-linear-gradient(115deg,rgba(51,65,85,.9) 0 22px,rgba(71,85,105,.9) 22px 44px)';
            html += `<div class="band" style="background:${band};box-shadow:0 0 30px #ec4899"></div>`;
            html += `<div class="w" style="font-size:${fs}px;font-style:italic;color:#fff;text-shadow:0 0 18px #ec4899,0 5px 0 #4c0519">${letras(nome)}</div>`;
            if (estado !== 'clear') html += `<div class="sub" style="font-size:${fs * 0.32}px;color:#fbcfe8;text-shadow:0 0 10px #ec4899">${estado === 'perfect' ? 'FULL COMBO · 100%' : combo + ' COMBO'}</div>`;
            html += faiscas(estado === 'clear' ? 8 : 26, ['#f472b6', '#c084fc', '#fff']);
        } else if (cfg.juiz === 'classico') {
            const c = estado === 'perfect' ? '#22d3ee' : estado === 'full' ? '#fde047' : '#e2e8f0';
            html += `<div class="ring" style="width:${gr.width * 0.95}px;height:${gr.width * 0.95}px;border:3px solid ${c};box-shadow:0 0 30px ${c}"></div>`;
            html += `<div class="w" style="font-size:${fs}px;color:#fff;text-shadow:0 0 14px ${c},0 0 30px ${c},0 4px 0 #0f172a">${letras(nome)}</div>`;
            if (estado !== 'clear') html += `<div class="sub" style="font-size:${fs * 0.32}px;color:#fff;text-shadow:0 0 10px ${c}">${estado === 'perfect' ? '100.00%' : combo + ' COMBO'}</div>`;
            html += faiscas(estado === 'clear' ? 6 : 22, [c, '#fff']);
        } else if (estado === 'perfect') {
            html += `<div class="rays"></div><div class="ring" style="width:${gr.width * 0.92}px;height:${gr.width * 0.92}px;border:3px solid rgba(165,243,252,.75);box-shadow:0 0 40px #22d3ee"></div><div class="ring" style="width:${gr.width * 0.66}px;height:${gr.width * 0.66}px;border:2px solid rgba(244,114,182,.6);animation-delay:.3s"></div>`;
            html += `<div class="w grad" style="--g:linear-gradient(180deg,#fff,#a5f3fc 40%,#f0abfc 75%,#c084fc);font-size:${fs}px;filter:drop-shadow(0 0 14px rgba(34,211,238,.9)) drop-shadow(0 4px 0 #1e1b4b)">${letras(nome)}</div><div class="sweep"></div>`;
            html += `<div class="sub" style="font-size:${fs * 0.36}px;color:#fff;text-shadow:0 0 12px #f472b6">★ 100.00% ★</div>`;
            html += faiscas(24, ['#fde047', '#a5f3fc', '#f0abfc', '#fff']);
        } else if (estado === 'full') {
            html += `<div class="ring" style="width:${gr.width * 1.05}px;height:${gr.width * 0.45}px;border:4px solid rgba(253,224,71,.6);box-shadow:0 0 30px #f59e0b"></div>`;
            html += `<div class="w grad" style="--g:linear-gradient(180deg,#fff7c2,#fde047 45%,#f59e0b 70%,#b45309);font-size:${fs}px;filter:drop-shadow(0 0 12px rgba(245,158,11,.85)) drop-shadow(0 4px 0 #451a03)">${letras(nome)}</div>`;
            html += `<div class="sub" style="font-size:${fs * 0.36}px;color:#fde68a;text-shadow:0 0 10px #f59e0b">◆ ${combo} ◆</div>`;
            html += faiscas(34, ['#fde047', '#f59e0b', '#fff']);
        } else {
            html += `<div class="w" style="font-size:${fs * 0.9}px;color:#fff;text-shadow:0 0 16px #22d3ee,0 4px 0 #0e7490">${letras(nome)}</div>`;
            html += faiscas(8, ['#67e8f9', '#fff']);
        }
        el.innerHTML = html;
        box.appendChild(el);
        return el;
    }
    let fimEl = null, fimVisto = false;
    function fimLoop() {
        requestAnimationFrame(fimLoop);
        const fin = typeof isSongFinished !== 'undefined' && isSongFinished;
        if (!fin) { fimVisto = false; if (fimEl) { fimEl.remove(); fimEl = null; } return; }
        if (fimEl && document.getElementById('stats-overlay') && !document.getElementById('stats-overlay').classList.contains('hidden')) { fimEl.remove(); fimEl = null; }
        if (fimVisto || cfg.fim !== 'animado' || typeof completionBannerText === 'undefined') return;
        const t = completionBannerText;
        const estado = t === '★ PERFECT PLAY ★' ? 'perfect' : t === '◆ MAX COMBO ◆' ? 'full' : t === 'STAGE CLEAR' ? 'clear' : null;
        if (!estado) return;
        fimVisto = true;
        fimEl = montarFim(estado);
        if (fimEl) completionBannerText = ''; // o letreiro antigo do canvas sai de cena
    }
    requestAnimationFrame(fimLoop);

    // ---------- aba TEMAS (config-abas.js chama isto ao montar as Configurações) ----------
    const row = (titulo, desc, ctrl) => {
        const l = document.createElement('label');
        l.className = 'flex items-start justify-between gap-3 cursor-pointer';
        l.innerHTML = `<span><span class="text-xs font-bold text-slate-200 block">${titulo}</span><span class="text-[11px] text-slate-400">${desc}</span></span>${ctrl}`;
        return l;
    };
    const sel = (id, ops) => `<select id="${id}" class="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 shrink-0" style="max-width:15rem;min-width:11rem">${ops.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>`;
    const chk = (id) => `<input type="checkbox" id="${id}" class="accent-cyan-400 w-5 h-5 cursor-pointer shrink-0 mt-0.5">`;
    window.bmTemasUI = function (cartao) {
        if (document.getElementById('tema-fever')) return;
        const C1 = cartao('Partida'), C2 = cartao('Animações dentro da gear'), C3 = cartao('Menu inicial');
        C1.append(
            row('FEVER', 'Acertos enchem a barrinha do FEVER (na lateral direita da gear). Cheia: FEVER x2, depois x3, x4 e x5. BREAK encerra. Só muda a pontuação (SCORE): precisão, recordes e ranking ficam iguais.', sel('tema-fever', [['auto', 'Automático'], ['off', 'Desligado (como antes)']])),
            row('Visual do FEVER', 'Sutil (como no DJMAX): o multiplicador aparece no meio só quando sobe de nível, com o efeito, e some; depois fica só um brilho leve embaixo. Forte: anel e efeito o tempo todo.', sel('tema-fevervis', [['sutil', 'Sutil (recomendado)'], ['forte', 'Forte']])),
            row('Multiplicador na pista', 'O x2…x5 com o anel no meio da pista. Desligado: só a barrinha do lado.', chk('tema-anel')),
            row('Som ao subir o FEVER', 'Um "plim" quando o multiplicador sobe.', chk('tema-feversom')),
            row('Palavras do julgamento', 'Só o texto que aparece na gear. O julgamento e a precisão não mudam.', sel('tema-juiz', Object.entries(PACOTES).map(([k, p]) => [k, p.nome]))),
            row('Mostrar o % embaixo da palavra', 'Nos pacotes KOOL e Clássico: o "100%", "90%"… pequeno embaixo (junto com FAST/SLOW).', chk('tema-juizpct')),
            row('Nota no começo da long note', 'Mostra a nota (no formato da skin de nota) na ponta de baixo da long note até você apertar, como na prévia da Loja.', chk('tema-holdhead')),
            row('Animação no fim da música', 'PERFECT PLAY, MAX COMBO e CLEAR animados por cima da gear (o estilo segue o pacote de palavras).', sel('tema-fim', [['animado', 'Animada'], ['simples', 'Simples (como antes)']]))
        );
        C2.append(
            row('Pulso na batida', 'As divisórias da pista pulsam e um equalizador bem clarinho sobe da linha de julgamento.', chk('tema-pulso')),
            row('Onda a cada 50 de combo', 'Uma onda de luz sobe pela pista.', chk('tema-onda')),
            row('Brasa com 100+ de combo', 'As laterais da pista ficam em brasa (some no BREAK).', chk('tema-brasa'))
        );
        C3.append(
            row('Menu inicial', 'Animado: cada opção tem a sua cor e personagem, a palavra gigante desliza ao fundo e a troca tem transição. Vídeo lo-fi: o menu de antes, com a Arya no vídeo.', sel('tema-menu', [['animado', 'Animado'], ['semtrans', 'Animado, sem transições'], ['lofi', 'Vídeo lo-fi (como antes)']]))
        );
        const liga = (id, k, tipo) => {
            const el = document.getElementById(id); if (!el) return;
            if (tipo === 'chk') el.checked = !!cfg[k]; else el.value = cfg[k];
            el.addEventListener('change', () => { cfg[k] = tipo === 'chk' ? el.checked : el.value; save(); aplicarTodos(); });
        };
        liga('tema-holdhead', 'holdHead', 'chk'); liga('tema-fever', 'fever'); liga('tema-fevervis', 'feverVis'); liga('tema-feversom', 'feverSom', 'chk'); liga('tema-anel', 'anel', 'chk'); liga('tema-juiz', 'juiz'); liga('tema-juizpct', 'juizPct', 'chk'); liga('tema-fim', 'fim');
        liga('tema-pulso', 'pulso', 'chk'); liga('tema-onda', 'onda', 'chk'); liga('tema-brasa', 'brasa', 'chk'); liga('tema-menu', 'menu');
    };
    window.bmTemasSync = function () {
        [['tema-fever', 'fever'], ['tema-fevervis', 'feverVis'], ['tema-juiz', 'juiz'], ['tema-fim', 'fim'], ['tema-menu', 'menu']].forEach(([id, k]) => { const el = document.getElementById(id); if (el) el.value = cfg[k]; });
        [['tema-holdhead', 'holdHead'], ['tema-feversom', 'feverSom'], ['tema-anel', 'anel'], ['tema-juizpct', 'juizPct'], ['tema-pulso', 'pulso'], ['tema-onda', 'onda'], ['tema-brasa', 'brasa']].forEach(([id, k]) => { const el = document.getElementById(id); if (el) el.checked = !!cfg[k]; });
    };
})();

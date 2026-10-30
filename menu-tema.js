// =====================================================================================
// menu-tema.js — MENU INICIAL ANIMADO (Configurações › Temas › Menu inicial).
//
// Cada opção do menu tem a sua cor e a sua personagem (em duas cores, com linhas de tela).
// A palavra da opção, gigante e só no contorno, desliza na diagonal ao fundo. Ao trocar de
// opção: "falha" com as cores separadas → clarão com corte diagonal → a próxima entra com zoom
// (~0,35 s; segurando ←/→ a transição some pra não atrasar). Só CSS (transform/opacity).
// "Vídeo lo-fi (como antes)" volta o menu antigo com o vídeo da Arya.
// =====================================================================================
(function () {
    const TEMA = {
        'LOJA': ['loja', '#f472b6', 'LOJA'],
        'TREINOS': ['treinos', '#22d3ee', 'TREINOS'],
        'MÚSICAS OSU!': ['osu', '#ff66aa', 'MÚSICAS'],
        'DESAFIOS': ['desafios', '#4ade80', 'DESAFIOS'],
        'NUVEM': ['nuvem', '#60a5fa', 'NUVEM'],
        'EDITOR': ['editor', '#fb923c', 'EDITOR'],
        'ANÁLISE': ['analise', '#a78bfa', 'ANÁLISE'],
        'RANKING': ['ranking', '#fbbf24', 'RANKING'],
        'JOGAR': ['osu', '#fbbf24', 'JOGAR'],
        'PERFIL': ['analise', '#a78bfa', 'PERFIL'],
        'NÍVEL': ['treinos', '#c4b5fd', 'NÍVEL'],
        'SKINS': ['desafios', '#4ade80', 'SKINS'],
        'NOVIDADES': ['loja', '#f472b6', 'NOVIDADES'],
        'CONFIG.': ['nuvem', '#60a5fa', 'CONFIG'],
        'BACKUP': ['editor', '#fb923c', 'BACKUP'],
        'SAIR': ['iris2', '#c084fc', 'SAIR']
    };
    const css = document.createElement('style');
    css.textContent = `
#bm-hub .bm-tema{position:absolute;inset:0;z-index:1;overflow:hidden;display:none;pointer-events:none;--c:#22d3ee;background:radial-gradient(ellipse 70% 80% at 32% 58%,color-mix(in srgb,var(--c) 42%,#0a0414),color-mix(in srgb,var(--c) 14%,#05030c) 58%,#04030a);transition:background .25s}
#bm-hub.tema-on .bm-tema{display:block}
#bm-hub.tema-on video.lofi,#bm-hub.tema-on .lofi-g,#bm-hub.tema-on .arya,#bm-hub.tema-on .say,#bm-hub.tema-on > .bg,#bm-hub.tema-on > .grid{display:none!important}
#bm-hub.tema-on .logo .big,#bm-hub.tema-on .logo .sub{display:none}
#bm-hub .bm-tema .kin{position:absolute;left:-40%;top:-30%;width:200%;transform:rotate(-14deg);font:900 clamp(120px,13vw,250px)/.92 Orbitron,monospace;white-space:nowrap;color:transparent;will-change:transform}
#bm-hub .bm-tema .kin div{-webkit-text-stroke:3px color-mix(in srgb,var(--c) 32%,transparent);animation:bmtKin 38s linear infinite}
#bm-hub .bm-tema .kin div:nth-child(2n){-webkit-text-stroke-color:color-mix(in srgb,var(--c) 18%,transparent);animation-direction:reverse;animation-duration:44s}
#bm-hub .bm-tema .kin div:nth-child(3n){color:color-mix(in srgb,var(--c) 9%,transparent)}
@keyframes bmtKin{from{transform:translateX(0)}to{transform:translateX(-33.3%)}}
#bm-hub .bm-tema .art{position:absolute;left:6vw;bottom:-6vh;height:112vh;max-width:none;filter:drop-shadow(0 0 40px color-mix(in srgb,var(--c) 45%,transparent));will-change:transform,opacity}
#bm-hub .bm-tema .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.24) 0 2px,transparent 2px 5px)}
#bm-hub .bm-tema .hud{position:absolute;width:56px;height:56px;border:2px solid color-mix(in srgb,var(--c) 70%,transparent)}
#bm-hub .bm-tema .titulo{position:absolute;right:clamp(220px,18vw,340px);left:40%;top:30vh;text-align:center;font:900 clamp(70px,9vw,180px)/1 Orbitron,monospace;letter-spacing:.04em;color:#fff;text-shadow:0 0 30px var(--c),0 8px 0 color-mix(in srgb,var(--c) 40%,#000);white-space:nowrap}
#bm-hub.tema-on .center{left:40%;top:46vh;height:auto}
#bm-hub.tema-on .card{border-color:var(--c,#22d3ee);box-shadow:0 0 40px color-mix(in srgb,var(--c) 35%,transparent)}
#bm-hub.tema-on .card .k{color:var(--c,#22d3ee)}
#bm-hub.tema-on .t.on{background:linear-gradient(180deg,color-mix(in srgb,var(--c) 70%,#000),color-mix(in srgb,var(--c) 30%,#000));border-color:var(--c);box-shadow:0 0 30px color-mix(in srgb,var(--c) 60%,transparent)}
#bm-hub.tema-on .mini.on,#bm-hub.tema-on .play.on,#bm-hub.tema-on .quit.on{border-color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);box-shadow:0 0 18px color-mix(in srgb,var(--c) 40%,transparent)}
/* transição */
#bm-hub .bm-tema .flash{position:absolute;top:-20%;bottom:-20%;left:-30%;width:22%;background:#fff;transform:skewX(-18deg);opacity:0;box-shadow:0 0 80px #fff}
#bm-hub .bm-tema .velho{position:absolute;inset:0;opacity:0;background:linear-gradient(100deg,var(--cv,#000) 0 40%,transparent 70%)}
#bm-hub .bm-tema.troca .art{animation:bmtArt .38s cubic-bezier(.2,1.3,.4,1)}
#bm-hub .bm-tema.troca .titulo{animation:bmtTit .36s cubic-bezier(.2,1.3,.4,1)}
#bm-hub .bm-tema.troca .flash{animation:bmtFlash .3s ease-in}
#bm-hub .bm-tema.troca .velho{animation:bmtVelho .22s ease-out}
#bm-hub .bm-tema.troca .kin{animation:bmtJit .16s steps(3)}
@keyframes bmtArt{0%{opacity:0;transform:scale(1.12) translateX(-3%)}35%{opacity:.5}100%{opacity:1;transform:none}}
@keyframes bmtTit{0%{opacity:0;transform:scale(1.25);text-shadow:-10px 0 0 rgba(255,0,80,.85),10px 0 0 rgba(0,240,255,.85)}45%{opacity:1;text-shadow:-6px 0 0 rgba(255,0,80,.7),6px 0 0 rgba(0,240,255,.7)}100%{transform:none}}
@keyframes bmtFlash{0%{left:-30%;opacity:.95}100%{left:120%;opacity:.6}}
@keyframes bmtVelho{0%{opacity:.5;transform:translateX(0)}100%{opacity:0;transform:translateX(60%)}}
@keyframes bmtJit{0%{translate:-14px 0}50%{translate:12px 0}100%{translate:0 0}}
@media (prefers-reduced-motion:reduce){#bm-hub .bm-tema .kin div{animation:none}}
@media (max-width:1100px){#bm-hub .bm-tema .art{opacity:.45}#bm-hub .bm-tema .titulo{left:0;right:0}}`;
    document.head.appendChild(css);

    const modo = () => (typeof window.bmTema === 'function' ? window.bmTema('menu') : 'animado') || 'animado';
    let hub = null, L = null, atual = '', ultimaTroca = 0, tTroca = 0;
    const imgs = {};
    function pre(k) { if (!imgs[k]) { const i = new Image(); i.src = `assets/tema-${k}.webp`; imgs[k] = i; } }
    function montar(h) {
        hub = h;
        if (hub.querySelector('.bm-tema')) return;
        L = document.createElement('div');
        L.className = 'bm-tema';
        L.innerHTML = `<div class="kin"></div><img class="art" alt="" draggable="false"><div class="scan"></div>
            <div class="hud" style="left:3vw;top:24vh;border-right:0;border-bottom:0"></div><div class="hud" style="right:3vw;bottom:22vh;border-left:0;border-top:0"></div>
            <div class="titulo"></div><div class="velho"></div><div class="flash"></div>`;
        hub.insertBefore(L, hub.firstChild);
        Object.values(TEMA).forEach(t => pre(t[0]));
        new MutationObserver(sync).observe(hub, { attributes: true, subtree: true, attributeFilter: ['class'] });
        aplicar();
    }
    function chaveDe(el) {
        if (!el) return '';
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase();
        return Object.keys(TEMA).find(k => t.startsWith(k)) || '';
    }
    function sync() {
        if (!hub || !L || !hub.classList.contains('tema-on')) return;
        const el = hub.querySelector('.t.on, .mini.on, .play.on, .quit.on');
        const k = chaveDe(el) || 'TREINOS';
        if (k === atual) return;
        const ant = atual; atual = k;
        const [img, cor, palavra] = TEMA[k];
        const now = performance.now();
        const anim = modo() === 'animado' && ant && now - ultimaTroca > 220;
        ultimaTroca = now;
        if (anim) {
            L.querySelector('.velho').style.setProperty('--cv', getComputedStyle(L).getPropertyValue('--c') || '#000');
            L.classList.remove('troca'); void L.offsetWidth; L.classList.add('troca');
            clearTimeout(tTroca); tTroca = setTimeout(() => L && L.classList.remove('troca'), 420);
        } else L.classList.remove('troca');
        L.style.setProperty('--c', cor);
        hub.style.setProperty('--c', cor);
        const art = L.querySelector('.art');
        art.src = `assets/tema-${img}.webp`;
        L.querySelector('.titulo').textContent = palavra;
        const linha = (palavra + ' ').repeat(6);
        L.querySelector('.kin').innerHTML = Array.from({ length: 7 }, () => `<div>${linha}${linha}${linha}</div>`).join('');
    }
    function aplicar() {
        if (!hub) return;
        const on = modo() !== 'lofi';
        hub.classList.toggle('tema-on', on);
        if (!on) hub.style.removeProperty('--c');
        atual = '';
        sync();
    }
    if (typeof window.bmTemaOuvir === 'function') window.bmTemaOuvir(aplicar);
    window.bmMenuTemaAtivo = () => !!(hub && hub.classList.contains('tema-on'));
    const pegar = () => { const h = document.getElementById('bm-hub'); if (h) { montar(h); return true; } return false; };
    if (!pegar()) {
        const mo = new MutationObserver(() => { if (pegar()) mo.disconnect(); });
        mo.observe(document.body, { childList: true, subtree: true });
    }
})();

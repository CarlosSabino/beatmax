// =====================================================================================
// natal.js — EDIÇÃO DE NATAL (1º de dezembro a 6 de janeiro · ?natal=1 / ?natal=0 forçam)
//
//  • CALENDÁRIO DO ADVENTO: uma porta por dia (1 a 25). A de hoje é grátis; porta de dia
//    perdido abre depois por 20 Beatcoins. Portas 24 e 25 = itens raros. Cada dia uma
//    personagem entrega o presente.
//  • JUICY NA CAIXA: mini-game de ritmo (~1 min). Seis presentes nas teclas S D F J K L; o
//    Beatjuicy pula do presente no tempo da música (melodia de domínio público, sintetizada
//    aqui mesmo). Carvão não se aperta! Os pontos viram até +60 Beatcoins por dia.
//  • LISTA DOS TRAVESSOS: a partir do dia 24 a Echo confere quem jogou no mês → presente.
//  • Botão no menu inicial (tecla N) e faixa na Loja. As personagens das janelas trocam pela
//    roupa de Natal durante o evento (personagens.js).
//  • Dados por perfil em djmaxNatal_v1 (perfis.js / nuvem-progresso.js).
// =====================================================================================
(function () {
    const icHtml = (ic) => ic === '🪙' ? '<i class="bm-coin"></i>' : ic;
    const KEY = 'djmaxNatal_v1';
    const PRECO_PORTA = 20, MAX_MOEDAS_JOGO = 60;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fala = (k, l) => (typeof window.beatmaxFala === 'function' ? window.beatmaxFala(k, l) : l[0]);
    const admin = () => typeof window.bmAdmin === 'function' && window.bmAdmin();
    const pad = (n) => String(n).padStart(2, '0');
    const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

    // ---------- datas ----------
    function forcado() { const m = location.search.match(/[?&]natal=([01])\b/); return m ? m[1] === '1' : null; }
    function ativo() {
        const f = forcado(); if (f !== null) return f;
        if (admin()) return true;   // o Administrador vê o evento antes, pra testar
        const d = new Date(), m = d.getMonth() + 1;
        return m === 12 || (m === 1 && d.getDate() <= 6);
    }
    // depois do primeiro Natal os itens ficam na Loja pra sempre
    const liberado = () => ativo() || Date.now() >= new Date(2026, 11, 1).getTime();
    const temporada = () => { const d = new Date(); return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear(); };
    // que dia do calendário é hoje (1..25; em janeiro todas as portas já "passaram")
    function diaAtual() {
        const q = location.search.match(/[?&]natalDia=(\d+)/); if (q) return Math.max(1, Math.min(26, +q[1]));
        const d = new Date();
        if (d.getMonth() === 11) return Math.min(26, d.getDate());
        if (d.getMonth() === 0) return 26;
        return forcado() || admin() ? 1 : 0;
    }
    window.bmNatalAtivo = ativo;
    window.bmNatalLiberado = liberado;

    // ---------- estado (por perfil) ----------
    let st = null;
    function carregar() {
        try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
        if (!st || st.temp !== temporada()) st = { temp: temporada(), portas: {}, jogou: {}, tempo: {}, mini: {}, recorde: 0, lista: null };
        ['portas', 'jogou', 'tempo', 'mini'].forEach(k => { if (!st[k] || typeof st[k] !== 'object') st[k] = {}; });
        return st;
    }
    function salvar() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
    carregar();

    // ---------- prêmios das portas ----------
    const PREMIOS = {
        1: { t: 'moedas', n: 30 }, 2: { t: 'exp', n: 150 }, 3: { t: 'moedas', n: 30 }, 4: { t: 'moedas', n: 40 }, 5: { t: 'exp', n: 150 },
        6: { t: 'nota', id: 'floco' }, 7: { t: 'moedas', n: 40 }, 8: { t: 'exp', n: 200 }, 9: { t: 'moedas', n: 50 }, 10: { t: 'moedas', n: 40 },
        11: { t: 'exp', n: 200 }, 12: { t: 'torcida' }, 13: { t: 'moedas', n: 50 }, 14: { t: 'nota', id: 'bolinha' }, 15: { t: 'exp', n: 250 },
        16: { t: 'moedas', n: 60 }, 17: { t: 'moedas', n: 50 }, 18: { t: 'torcida' }, 19: { t: 'exp', n: 250 }, 20: { t: 'moedas', n: 60 },
        21: { t: 'moedas', n: 70 }, 22: { t: 'exp', n: 300 }, 23: { t: 'moedas', n: 80 }, 24: { t: 'torcida', raro: 1 }, 25: { t: 'gear', id: 'turma_natal', raro: 1 }
    };
    const ANFITRIAO = ['iris', 'arya', 'echo', 'jade', 'juicy'];
    const quemEntrega = (d) => ANFITRIAO[(d - 1) % ANFITRIAO.length];
    const NOME = { iris: 'Iris', arya: 'Arya', echo: 'Echo', jade: 'Jade', juicy: 'Beatjuicy' };
    const TORC_NATAL = ['arya_natal', 'iris_natal', 'echo_natal', 'jade_natal', 'juicy_natal'];

    function darPremio(d) {
        const p = PREMIOS[d], tit = `🎄 PORTA ${d}`;
        // 🪙 não existe na fonte de emoji do Windows 10: mostra a Beatcoin de verdade
        const moedas = (n, txt) => { window.beatcoinsAdd && window.beatcoinsAdd(n, tit, txt || `<b>+${n}</b> Beatcoins`); return { ic: '🪙', txt: `+${n}`, msg: txt || `<b>+${n} Beatcoins</b>!` }; };
        if (p.t === 'moedas') return moedas(p.n);
        if (p.t === 'exp') { try { window.nivelBonus && window.nivelBonus(p.n, `🎄 Calendário · porta ${d}`); } catch (e) {} return { ic: '⭐', txt: `${p.n} EXP`, msg: `<b>+${p.n} EXP</b> pro seu nível!` }; }
        if (p.t === 'nota') {
            const it = window.lojaDar && window.lojaDar('nota', p.id);
            if (it) return { ic: p.id === 'floco' ? '❄️' : '🔴', txt: 'nota', msg: `Skin de nota <b>${esc(it.name)}</b>! Já está no Personalizar.`, acao: 'nota' };
            return moedas(40, 'Você já tinha a nota — virou <b>+40</b>');
        }
        if (p.t === 'torcida') {
            const cat = window.lojaCatalogo ? window.lojaCatalogo().torcida : [];
            const falta = TORC_NATAL.filter(id => !cat.some(t => t.id === id && t.owned));
            const id = falta[(Math.random() * falta.length) | 0];
            const it = id && window.lojaDar && window.lojaDar('torcida', id);
            if (it) return { ic: '🧑‍🎄', txt: 'torcida', msg: `Torcida 8-bit <b>${esc(it.name)}</b>! Escolha o lado no Personalizar.`, acao: 'torcida' };
            return moedas(60, 'Você já tem toda a torcida de Natal — virou <b>+60</b>');
        }
        if (p.t === 'gear') {
            const it = window.lojaDar && window.lojaDar('gear', p.id);
            if (it) return { ic: '🎄', txt: 'gear', msg: `A <b>${esc(it.name)}</b> é sua! Feliz Natal! 🎄`, acao: 'gear' };
            return moedas(100, 'Você já tinha a Gear de Natal — virou <b>+100</b>');
        }
        return moedas(30);
    }
    function estadoPorta(d) {
        if (st.portas[d]) return 'aberta';
        const hojeD = diaAtual();
        if (admin()) return d === hojeD ? 'hoje' : 'livre';
        if (d === hojeD) return 'hoje';
        if (d < hojeD) return 'perdida';
        return 'futura';
    }

    // ---------- "jogou hoje" (conta pra Lista dos Travessos) ----------
    setInterval(() => {
        if (!ativo() || !(typeof isPlaying !== 'undefined' && isPlaying) || (typeof isPaused !== 'undefined' && isPaused)) return;
        carregar();
        const k = hoje(); st.tempo[k] = (st.tempo[k] || 0) + 5;
        if (st.tempo[k] >= 30 && !st.jogou[k]) st.jogou[k] = 1;
        Object.keys(st.tempo).sort().slice(0, -3).forEach(x => delete st.tempo[x]);
        salvar();
    }, 5000);

    // ---------- som ----------
    let AC = null;
    const actx = () => { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; };
    function sino(t0, f, dur, vol, tipo) {
        const c = actx(); if (!c) return;
        const o = c.createOscillator(), g = c.createGain();
        o.type = tipo || 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function somPorta() { const c = actx(); if (!c) return; const t = c.currentTime; [1046.5, 1318.5, 1568, 2093].forEach((f, i) => sino(t + i * 0.07, f, 0.6, 0.12)); }

    // ---------- estilo ----------
    const css = document.createElement('style');
    css.textContent = `
#nt-ov{position:fixed;inset:0;z-index:160;display:flex;align-items:center;justify-content:center;font-family:Rajdhani,sans-serif;color:#ecfdf5;
  background:radial-gradient(ellipse at 50% 35%,rgba(22,101,52,.55),rgba(3,12,8,.97) 72%);overflow:hidden}
#nt-ov .neve,#nt-jogo .neve{position:absolute;inset:-10% 0 0 0;pointer-events:none;opacity:.7;
  background-image:radial-gradient(2px 2px at 20px 30px,#fff,transparent),radial-gradient(2px 2px at 140px 80px,#fff,transparent),radial-gradient(1.5px 1.5px at 90px 160px,#e0f2fe,transparent),radial-gradient(3px 3px at 220px 120px,#fff9,transparent),radial-gradient(1.5px 1.5px at 300px 40px,#fff,transparent);
  background-size:320px 220px;animation:ntNeve 14s linear infinite}
@keyframes ntNeve{from{background-position:0 0}to{background-position:60px 220px}}
#nt-ov .luzes{position:absolute;left:0;right:0;top:0;height:26px;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 18px,#ef4444 18px 26px,transparent 26px 44px,#facc15 44px 52px,transparent 52px 70px,#22c55e 70px 78px,transparent 78px 96px,#38bdf8 96px 104px);
  -webkit-mask:radial-gradient(circle at 50% 70%,#000 4px,transparent 5px) 0 0/26px 26px;mask:radial-gradient(circle at 50% 70%,#000 4px,transparent 5px) 0 0/26px 26px;filter:drop-shadow(0 0 6px #fde68a);animation:ntPisca 1.2s steps(2) infinite}
@keyframes ntPisca{50%{filter:drop-shadow(0 0 2px #fde68a) brightness(.6)}}
#nt-ov .bx{position:relative;width:min(1000px,94vw);max-height:94vh;overflow:auto;padding:22px 30px;border-radius:22px;background:linear-gradient(180deg,rgba(6,40,22,.95),rgba(3,16,10,.97));border:2px solid #22c55e;box-shadow:0 0 60px rgba(34,197,94,.3),0 0 120px rgba(239,68,68,.18)}
#nt-ov h2{font:900 30px Orbitron,monospace;letter-spacing:.05em;color:#fff;text-shadow:0 0 18px #22c55e,0 3px 0 #7f1d1d;margin:0}
#nt-ov .sub{font:700 16px Rajdhani;color:#bbf7d0;margin-top:2px}
#nt-ov .abas{display:flex;gap:8px;margin:14px 0 12px;flex-wrap:wrap}
#nt-ov .abas button{padding:8px 16px;border-radius:999px;border:1.5px solid #166534;background:#052e16;color:#bbf7d0;font:800 15px Rajdhani;cursor:pointer}
#nt-ov .abas button.on{background:linear-gradient(90deg,#b91c1c,#dc2626);border-color:#fca5a5;color:#fff;box-shadow:0 0 16px rgba(239,68,68,.5)}
#nt-ov .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:9px}
#nt-ov .pt{position:relative;aspect-ratio:1.12;border-radius:10px;border:2px solid #fca5a5;background:linear-gradient(160deg,#b91c1c,#7f1d1d);box-shadow:inset 0 0 0 4px #991b1b;display:flex;align-items:center;justify-content:center;
  font:900 22px Orbitron;color:#fee2e2;cursor:pointer;overflow:hidden;transition:transform .15s}
#nt-ov .pt:nth-child(2n){background:linear-gradient(160deg,#15803d,#14532d);border-color:#86efac;box-shadow:inset 0 0 0 4px #166534}
#nt-ov .pt:before,#nt-ov .pt:after{content:'';position:absolute;background:#facc15;opacity:.85}
#nt-ov .pt:before{left:0;right:0;top:50%;height:7px;margin-top:-3.5px}#nt-ov .pt:after{top:0;bottom:0;left:50%;width:7px;margin-left:-3.5px}
#nt-ov .pt span{position:relative;z-index:1;text-shadow:0 2px 0 #450a0a}
#nt-ov .pt.raro{background:linear-gradient(160deg,#ca8a04,#713f12);border-color:#fde047;box-shadow:inset 0 0 0 4px #a16207}
#nt-ov .pt.hoje{transform:scale(1.07);box-shadow:0 0 0 3px #fde047,0 0 26px #fde047;z-index:2;animation:ntHoje 1.4s ease-in-out infinite}
@keyframes ntHoje{50%{box-shadow:0 0 0 3px #fde047,0 0 40px #fde047}}
#nt-ov .pt.futura{opacity:.45;cursor:default;filter:saturate(.6)}
#nt-ov .pt.perdida{filter:grayscale(.45) brightness(.85)}
#nt-ov .pt.perdida small{position:absolute;bottom:3px;left:0;right:0;text-align:center;font:800 11px Rajdhani;color:#fde68a;z-index:1}
#nt-ov .pt.aberta{background:#0b1a12;border:2px dashed #3f6f52;box-shadow:none;cursor:default;flex-direction:column;font:800 13px Rajdhani;color:#86efac}
#nt-ov .pt.aberta:before,#nt-ov .pt.aberta:after{display:none}
#nt-ov .pt.aberta i{font-style:normal;font-size:24px;line-height:1.1}
#nt-ov .pt.abrindo{animation:ntAbre .5s ease-in forwards}
@keyframes ntAbre{0%{transform:scale(1.07)}40%{transform:scale(1.18) rotate(-4deg)}100%{transform:scale(.2) rotate(12deg);opacity:0}}
#nt-ov .info{margin-top:12px;min-height:58px;border-radius:12px;padding:10px 14px;background:rgba(0,0,0,.3);border:1px solid #166534;font:700 16px Rajdhani;color:#dcfce7;line-height:1.35}
#nt-ov .info b{color:#fde047}
#nt-ov .info.bom{border-color:#facc15;box-shadow:0 0 20px rgba(250,204,21,.25)}
#nt-ov .info .big{display:block;font:900 22px Orbitron;color:#fde047;margin-bottom:2px}
#nt-ov .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
#nt-ov .row button{padding:10px 18px;border-radius:10px;border:1px solid #166534;background:#052e16;color:#ecfdf5;font:800 15px Rajdhani;cursor:pointer}
#nt-ov .row button.pri{background:linear-gradient(90deg,#16a34a,#22c55e);border:0;color:#052e16}
#nt-ov .row button.ver{background:linear-gradient(90deg,#b91c1c,#ef4444);border:0;color:#fff}
#nt-ov .jg{display:grid;grid-template-columns:240px 1fr;gap:22px;align-items:center}
#nt-ov .jg .cx{height:220px;margin:0 auto;background:url(assets/pxn-juicy.webp) no-repeat;image-rendering:pixelated}
#nt-ov .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
#nt-ov .stats div{border-radius:10px;background:rgba(0,0,0,.3);border:1px solid #166534;padding:8px 10px;font:700 13px Rajdhani;color:#86efac}
#nt-ov .stats b{display:block;font:900 20px Orbitron;color:#fff}
#nt-ov .lista{display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:center}
#nt-ov .echo{height:230px;margin:0 auto;background:url(assets/pxn-echo.webp) no-repeat;image-rendering:pixelated}
#nt-ov .prog{height:12px;border-radius:999px;background:#052e16;border:1px solid #166534;overflow:hidden;margin:6px 0 10px}
#nt-ov .prog i{display:block;height:100%;background:linear-gradient(90deg,#ef4444,#facc15,#22c55e)}
#bm-hub .nt-btn{position:absolute;right:2vw;bottom:calc(48px + clamp(110px,14vh,150px) + 70px);z-index:4;display:flex;align-items:center;gap:10px;padding:8px 16px 8px 10px;border-radius:999px;cursor:pointer;
  background:linear-gradient(90deg,#7f1d1d,#14532d);border:2px solid #22c55e;color:#fef9c3;font:900 15px Orbitron;letter-spacing:.04em;box-shadow:0 0 22px rgba(34,197,94,.45);animation:ntPul 2.4s ease-in-out infinite}
#bm-hub .nt-btn i{font-style:normal;font-size:30px;line-height:1;animation:ntBal 1.6s ease-in-out infinite}
#bm-hub .nt-btn small{display:block;font:700 12px Rajdhani;color:#bbf7d0;letter-spacing:0}
#bm-hub .nt-btn .dt{position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:#facc15;box-shadow:0 0 8px #facc15}
#bm-hub.nt-on .hw-btn{display:none!important}
#bm-hub .nt-neve{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
#bm-hub .nt-neve i{position:absolute;left:0;right:0;top:-100%;height:200%;will-change:transform;animation:ntCai linear infinite;
  background-image:radial-gradient(circle at 30px 40px,#fff 0 3.5px,transparent 4.5px),radial-gradient(circle at 160px 120px,#fff 0 2.5px,transparent 3.5px),radial-gradient(circle at 260px 30px,#fff 0 4px,transparent 5.5px),radial-gradient(circle at 90px 190px,#e0f2fe 0 2.5px,transparent 3.5px),radial-gradient(circle at 330px 210px,#fff 0 3px,transparent 4px),radial-gradient(circle at 210px 170px,#fff 0 2px,transparent 3px);background-size:360px 240px}
#bm-hub .nt-neve i:nth-child(1){animation-duration:22s;opacity:.85}
#bm-hub .nt-neve i:nth-child(2){animation-duration:34s;opacity:.55;background-size:240px 170px}
#bm-hub .nt-neve i:nth-child(3){animation-duration:15s;opacity:.9;background-size:520px 340px}
@keyframes ntCai{from{transform:translate(0,0)}to{transform:translate(40px,50%)}}
@media (prefers-reduced-motion:reduce){#bm-hub .nt-neve{display:none}}
@keyframes ntPul{50%{box-shadow:0 0 34px rgba(34,197,94,.75)}}
@keyframes ntBal{50%{transform:rotate(-12deg)}}
.nt-banner{display:flex;align-items:center;gap:16px;margin-top:14px;padding:12px 18px;border-radius:14px;background:linear-gradient(90deg,#7f1d1d,#14532d);border:1.5px solid #22c55e;box-shadow:0 0 22px rgba(34,197,94,.3)}
.nt-banner .e{font-size:34px}.nt-banner .t{display:block;font:900 16px Orbitron;color:#fde047}.nt-banner span b{color:#fde047}.nt-banner span{font:700 14px Rajdhani;color:#dcfce7}
.nt-banner div{flex:1}.nt-banner button{padding:8px 14px;border-radius:10px;border:0;background:#22c55e;color:#052e16;font:800 14px Rajdhani;cursor:pointer;white-space:nowrap}
.nt-banner button+button{background:#fde047}
#nt-jogo{position:fixed;inset:0;z-index:175;background:#05030c;cursor:default}
#nt-jogo canvas{position:absolute;inset:0;width:100%;height:100%}
@media (max-width:760px){#nt-ov .cal{grid-template-columns:repeat(5,1fr)}#nt-ov .jg,#nt-ov .lista{grid-template-columns:1fr}}`;
    document.head.appendChild(css);

    // ---------- janela do evento ----------
    let aba = 'cal', armada = 0, quieto = false;
    function fechar() { const ov = document.getElementById('nt-ov'); if (ov) ov.remove(); document.removeEventListener('keydown', teclaOv, true); atualizarHub(); }
    function teclaOv(e) {
        const ov = document.getElementById('nt-ov');
        if (!ov || document.getElementById('nt-jogo')) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); fechar(); return; }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); e.stopImmediatePropagation();
            if (aba === 'cal') { const p = ov.querySelector('.pt.hoje'); if (p) p.click(); }
            else if (aba === 'jogo') { const b = ov.querySelector('[data-jogar]'); if (b) b.click(); }
            else { const b = ov.querySelector('[data-veredito]'); if (b) b.click(); }
            return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault(); e.stopImmediatePropagation();
            const L = ['cal', 'jogo', 'lista'], i = L.indexOf(aba);
            abrir(L[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]); return;
        }
        e.stopImmediatePropagation();
    }
    function abrir(qual) {
        if (typeof isPlaying !== 'undefined' && isPlaying) return;
        carregar();
        if (qual) aba = qual;
        const velha = document.getElementById('nt-ov');
        if (velha) velha.remove();
        const ov = document.createElement('div'); ov.id = 'nt-ov';
        const dia = diaAtual();
        const titulo = aba === 'cal' ? '🎄 CALENDÁRIO DO ADVENTO' : aba === 'jogo' ? '🎁 JUICY NA CAIXA' : '📜 LISTA DOS TRAVESSOS';
        const sub = aba === 'cal' ? (dia >= 26 ? 'O Natal passou! Ainda dá pra abrir as portas que ficaram fechadas até 6 de janeiro.' : `Uma porta por dia até o Natal · hoje é dia <b>${dia}</b>`)
            : aba === 'jogo' ? 'O Beatjuicy pula do presente no tempo da música. Aperte a tecla do presente certo!' : 'A Echo anotou tudo. Você foi bonzinho este ano?';
        ov.innerHTML = `<div class="neve"></div><div class="luzes"></div><div class="bx">
            <h2>${titulo}</h2><div class="sub">${sub}</div>
            <div class="abas"><button data-aba="cal" class="${aba === 'cal' ? 'on' : ''}">🎄 Calendário</button><button data-aba="jogo" class="${aba === 'jogo' ? 'on' : ''}">🎁 Juicy na Caixa</button><button data-aba="lista" class="${aba === 'lista' ? 'on' : ''}">📜 Lista dos Travessos</button></div>
            <div class="pane"></div>
            <div class="row"><button data-x>Fechar (Esc)</button><span style="flex:1"></span><span style="font:700 13px Rajdhani;color:#4ade80;align-self:center">← → troca de aba</span></div></div>`;
        document.body.appendChild(ov);
        ov.querySelector('[data-x]').onclick = fechar;
        ov.addEventListener('mousedown', (e) => { if (e.target === ov) fechar(); });
        ov.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => abrir(b.dataset.aba));
        document.removeEventListener('keydown', teclaOv, true);
        document.addEventListener('keydown', teclaOv, true);
        const pane = ov.querySelector('.pane');
        if (aba === 'cal') paneCalendario(ov, pane);
        else if (aba === 'jogo') paneJogo(ov, pane);
        else paneLista(ov, pane);
    }
    function personagem(ov, who, txt) {
        if (typeof window.beatmaxPersonagem === 'function') window.beatmaxPersonagem(ov, 'natal_' + who, txt, '1000px', quieto);
        quieto = false;
    }

    // ----- calendário -----
    function paneCalendario(ov, pane) {
        const dia = diaAtual();
        const host = quemEntrega(Math.max(1, Math.min(25, dia)));
        const portas = Array.from({ length: 25 }, (_, i) => {
            const d = i + 1, e = estadoPorta(d), raro = PREMIOS[d].raro ? ' raro' : '';
            if (e === 'aberta') { const a = st.portas[d]; return `<div class="pt aberta"><i>${icHtml(a.ic)}</i>${esc(a.txt)}</div>`; }
            return `<div class="pt ${e}${raro}" data-d="${d}"><span>${d}</span>${e === 'perdida' ? `<small>${PRECO_PORTA} <i class="bm-coin"></i></small>` : ''}</div>`;
        }).join('');
        const abertas = Object.keys(st.portas).length;
        pane.innerHTML = `<div class="cal">${portas}</div>
            <div class="info" id="nt-info">${dia >= 1 && dia <= 25 && !st.portas[dia] ? `Hoje a <b>${NOME[host]}</b> entrega a porta <b>${dia}</b>. Clique nela (ou Enter)!` : `Portas abertas: <b>${abertas}/25</b>.`}
              ${dia > 1 ? ` Porta de dia perdido abre por <b>${PRECO_PORTA} Beatcoins</b>.` : ''} As portas <b>24 e 25</b> (douradas) têm os presentes mais raros.</div>`;
        const info = pane.querySelector('#nt-info');
        pane.querySelectorAll('.pt[data-d]').forEach(el => el.onclick = () => {
            const d = +el.dataset.d, e = estadoPorta(d);
            if (e === 'futura') { info.className = 'info'; info.innerHTML = `A porta <b>${d}</b> só abre no dia ${d} de dezembro. Sem espiar! 👀`; return; }
            if (e === 'aberta') return;
            if (e === 'perdida') {
                const s = typeof window.beatcoinsSaldo === 'function' ? window.beatcoinsSaldo() : 0;
                if (s < PRECO_PORTA) { info.className = 'info'; info.innerHTML = `A porta <b>${d}</b> ficou pra trás. Pra abrir agora custa <b>${PRECO_PORTA} Beatcoins</b> (você tem ${s}).`; return; }
                if (armada !== d) { armada = d; info.className = 'info'; info.innerHTML = `Abrir a porta <b>${d}</b> por <b>${PRECO_PORTA} Beatcoins</b>? Clique de novo nela pra confirmar.`; return; }
                if (!window.beatcoinsTirar || window.beatcoinsTirar(PRECO_PORTA) < PRECO_PORTA) return;
            }
            armada = 0;
            el.classList.add('abrindo'); somPorta();
            setTimeout(() => {
                carregar();
                if (st.portas[d]) return;
                const r = darPremio(d);
                st.portas[d] = { ic: r.ic, txt: r.txt, quando: hoje() };
                salvar();
                quieto = true;
                abrir('cal');
                const i2 = document.querySelector('#nt-info');
                if (i2) { i2.className = 'info bom'; i2.innerHTML = `<span class="big">${icHtml(r.ic)} PORTA ${d}</span>${r.msg}`; }
                const say = document.querySelector('#nt-ov .bm-ch-say');
                if (say) say.innerHTML = `<span class="nm">${NOME[quemEntrega(d)].toUpperCase()}</span>` + fala('nt-porta', ['Feliz Natal! 🎄 Volta amanhã que tem mais!', 'Gostou? Fui eu que embrulhei! 🎁', 'Ho ho ho! Presente entregue! ⭐', 'Amanhã tem outra porta, não esquece!']);
            }, 480);
        });
        const txt = dia >= 1 && dia <= 25 && !st.portas[dia]
            ? fala('nt-cal-' + host, [`Hoje sou eu que entrego! 🎁 Abre a porta <b>${dia}</b>!`, `Psiu… a porta <b>${dia}</b> é minha hoje. Vem ver!`, `Feliz dezembro! Tem presente na porta <b>${dia}</b>. 🎄`])
            : dia >= 26 ? 'O Natal passou, mas as portas que faltaram ainda abrem até 6 de janeiro!' : fala('nt-cal-ok', ['Porta de hoje aberta! Volta amanhã. 🎄', 'Já pegou o presente de hoje! Que tal o <b>Juicy na Caixa</b>?']);
        personagem(ov, dia >= 1 && dia <= 25 ? host : 'iris', txt);
    }

    // ----- Juicy na Caixa (tela inicial) -----
    function paneJogo(ov, pane) {
        const k = hoje(), m = st.mini[k] || { best: 0, moedas: 0 };
        pane.innerHTML = `<div class="jg"><div class="cx" id="nt-cx"></div><div>
            <div style="font:700 16px Rajdhani;color:#dcfce7;line-height:1.4">Seis presentes nas teclas <b style="color:#fde047">S D F J K L</b> (ou clique). Um anel fecha em volta do presente: quando ele encostar, aperte a tecla — o Beatjuicy pula pra fora!
            <br>⚫ <b style="color:#fca5a5">Presente de carvão</b> (escuro, anel vermelho): <b>não aperte</b>. Errou ou apertou o carvão = o combo zera.</div>
            <div class="stats"><div>Recorde de hoje<b>${m.best.toLocaleString('pt-BR')}</b></div><div>Seu recorde<b>${(st.recorde || 0).toLocaleString('pt-BR')}</b></div><div>Moedas de hoje<b>${m.moedas}/${MAX_MOEDAS_JOGO} <i class="bm-coin"></i></b></div></div>
            <div style="font:700 14px Rajdhani;color:#86efac">Os pontos viram Beatcoins (até ${MAX_MOEDAS_JOGO} por dia — vale o seu melhor do dia). Joga quantas vezes quiser!</div>
            <div class="row"><button class="pri" data-jogar>▶ JOGAR (Enter)</button></div></div></div>`;
        // Beatjuicy saindo da caixa na prévia
        const cx = pane.querySelector('#nt-cx'), W = 246, H = 321, sc = 220 / H;
        cx.style.backgroundSize = `${8 * W * sc}px ${H * sc}px`; cx.style.width = `${W * sc}px`;
        let f = 0; const seq = [4, 4, 4, 5, 6, 6, 6, 6, 7, 7, 4];
        const iv = setInterval(() => { if (!cx.isConnected) return clearInterval(iv); cx.style.backgroundPosition = `${-seq[f % seq.length] * W * sc}px 0`; f++; }, 260);
        cx.style.backgroundPosition = `${-4 * W * sc}px 0`;
        pane.querySelector('[data-jogar]').onclick = () => jogo();
        personagem(ov, 'juicy', fala('nt-jg', ['Hehehe… adivinha de qual presente eu vou sair? 🎁', 'Cuidado com o <b>carvão</b>! Esse é pros travessos. Hehe.', 'A música é aquela do sininho. Segue o ritmo que você me pega!']));
    }

    // ----- Lista dos Travessos -----
    function contagem() {
        const dias = Object.keys(st.jogou).filter(k => /-12-/.test(k) || /-01-0[1-6]$/.test(k)).length;
        return { dias, portas: Object.keys(st.portas).length };
    }
    const BONZINHO = (c) => c.dias >= 8 || c.portas >= 12;
    function paneLista(ov, pane) {
        const dia = diaAtual(), c = contagem(), pode = dia >= 24 || admin();
        const pct = Math.min(100, Math.round(Math.max(c.dias / 8, c.portas / 12) * 100));
        let corpo;
        if (st.lista) {
            corpo = st.lista.bom
                ? `<div class="info bom"><span class="big">⭐ LISTA DOS BONZINHOS!</span>Você ganhou <b>+150 Beatcoins</b> da Echo. Feliz Natal! 🎄</div>`
                : `<div class="info"><span class="big" style="color:#fca5a5">📜 TRAVESSO!</span>A Echo te colocou na lista dos travessos… mas deixou <b>+20 Beatcoins</b> de consolo. Ano que vem tem mais! 😅</div>`;
        } else if (!pode) {
            corpo = `<div class="info">A Echo confere a lista a partir do dia <b>24 de dezembro</b>. Até lá ela está anotando tudo… 👀</div>`;
        } else {
            corpo = `<div class="row"><button class="ver" data-veredito>📜 Ver o veredito (Enter)</button></div>`;
        }
        pane.innerHTML = `<div class="lista"><div class="echo" id="nt-echo"></div><div>
            <div style="font:700 16px Rajdhani;color:#dcfce7">Pra entrar na <b style="color:#fde047">lista dos bonzinhos</b>: jogar em <b>8 dias</b> de dezembro <b>ou</b> abrir <b>12 portas</b> do calendário.</div>
            <div class="stats" style="grid-template-columns:1fr 1fr"><div>Dias que você jogou<b>${c.dias}/8</b></div><div>Portas abertas<b>${c.portas}/12</b></div></div>
            <div class="prog"><i style="width:${pct}%"></i></div>${corpo}</div></div>`;
        const ec = pane.querySelector('#nt-echo'), W = 269, H = 323, sc = 230 / H;
        ec.style.backgroundSize = `${12 * W * sc}px ${H * sc}px`; ec.style.width = `${W * sc}px`;
        const fr = st.lista ? (st.lista.bom ? [8, 9, 10, 11] : [6, 7]) : [4, 5, 4, 8];
        let i = 0; const pos = () => { ec.style.backgroundPosition = `${-fr[i % fr.length] * W * sc}px 0`; i++; };
        pos(); const iv = setInterval(() => { if (!ec.isConnected) return clearInterval(iv); pos(); }, 420);
        const v = pane.querySelector('[data-veredito]');
        if (v) v.onclick = () => {
            carregar(); if (st.lista) return;
            const bom = BONZINHO(contagem());
            st.lista = { bom, quando: hoje() }; salvar();
            if (bom) window.beatcoinsAdd && window.beatcoinsAdd(150, '📜 LISTA DOS BONZINHOS', 'A Echo conferiu: <b>+150</b>!', true);
            else window.beatcoinsAdd && window.beatcoinsAdd(20, '📜 LISTA DOS TRAVESSOS', 'Consolo da Echo: <b>+20</b>');
            somPorta(); quieto = true; abrir('lista');
        };
        personagem(ov, 'echo', st.lista ? (st.lista.bom ? 'Conferi duas vezes: <b>bonzinho</b>! ⭐' : 'Os dados não mentem… <b>travesso</b>! 😏') : pode ? 'Terminei a lista. Quer saber o veredito? 📜' : fala('nt-echo', ['Estou anotando <b>tudo</b>. Cada dia que você joga conta. 📜', 'Hmm… jogou hoje? Vou conferir. 👀']));
    }

    // =====================================================================================
    // JUICY NA CAIXA — o mini-game
    // =====================================================================================
    // melodia "Jingle Bells" (James Lord Pierpont, 1857 — domínio público), refrão, em Dó maior
    const MEL = 'E1 E1 E2 E1 E1 E2 E1 G1 C1.5 D.5 E4 F1 F1 F1.5 F.5 F1 E1 E1 E.5 E.5 E1 D1 D1 E1 D2 G2 E1 E1 E2 E1 E1 E2 E1 G1 C1.5 D.5 E4 F1 F1 F1.5 F.5 F1 E1 E1 E.5 E.5 G1 G1 F1 D1 C4'
        .split(' ').map(x => ({ n: x[0], d: parseFloat(x.slice(1)) }));
    const FREQ = { C: 523.25, D: 587.33, E: 659.25, F: 698.46, G: 783.99 };
    const IDX = { C: 0, D: 1, E: 2, F: 3, G: 4 };
    const ACORDE = ['C', 'C', 'C', 'C', 'F', 'C', 'D', 'G', 'C', 'C', 'C', 'C', 'F', 'C', 'G', 'C'];
    const BAIXO = { C: 130.81, D: 146.83, F: 174.61, G: 196 };
    const BPM = 132, BEAT = 60 / BPM, VOLTAS = 2, INTRO = 4, ANTES = 2 * BEAT;
    const TECLAS = ['s', 'd', 'f', 'j', 'k', 'l'];
    const JANELA = { kool: 0.06, cool: 0.105, good: 0.17 };

    function montarFase() {
        const ev = [];
        for (let v = 0; v < VOLTAS; v++) {
            let b = 0, ant = null, antLane = -1;
            MEL.forEach(m => {
                const t = (INTRO + v * 64 + b) * BEAT;
                const inteira = Math.abs(b - Math.round(b)) < 0.01;
                if (v > 0 || inteira) {
                    // a altura da nota escolhe o presente (Dó = 1º … Sol = 5º); nota repetida alterna com o vizinho
                    let lane = IDX[m.n];
                    if (m.n === ant && antLane === lane) lane = lane + 1;
                    if (m.n === 'G' && v > 0) lane = 5;
                    ev.push({ t, lane, carvao: false });
                    ant = m.n; antLane = lane;
                }
                // nota longa: um carvão no meio dela (na 2ª volta sempre; na 1ª só nas inteiras de 4)
                if (m.d >= 2 && (v > 0 || m.d >= 4)) {
                    const tc = t + BEAT * (m.d >= 4 ? 2 : 1);
                    let l = (IDX[m.n] + 2 + ((b * 7) | 0) % 3) % 6;
                    ev.push({ t: tc, lane: l, carvao: true });
                }
                b += m.d;
            });
        }
        ev.sort((a, b) => a.t - b.t);
        return ev;
    }
    // trilha (agendada no relógio do áudio)
    function agendarMusica(c, t0) {
        const mest = c.createGain(); mest.gain.value = 0.85; mest.connect(c.destination);
        const nota = (t, f, dur, vol, tipo) => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = tipo; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(mest); o.start(t); o.stop(t + dur + 0.05);
        };
        // guizo (ruído agudo curtinho)
        const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.08), c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
        const guizo = (t, vol) => {
            const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
            s.buffer = buf; f.type = 'highpass'; f.frequency.value = 6500; g.gain.value = vol;
            s.connect(f); f.connect(g); g.connect(mest); s.start(t);
        };
        const total = INTRO + VOLTAS * 64;
        for (let b = 0; b < total; b += 0.5) guizo(t0 + b * BEAT, Number.isInteger(b) ? (b < INTRO ? 0.5 : 0.32) : 0.14);
        for (let v = 0; v < VOLTAS; v++) {
            let b = 0;
            MEL.forEach(m => { nota(t0 + (INTRO + v * 64 + b) * BEAT, FREQ[m.n], Math.max(0.12, m.d * BEAT * 0.9), 0.11, 'square'); b += m.d; });
            ACORDE.forEach((a, bar) => {
                const tb = t0 + (INTRO + v * 64 + bar * 4) * BEAT, f = BAIXO[a];
                nota(tb, f, BEAT * 1.6, 0.2, 'triangle'); nota(tb + 2 * BEAT, f * 1.5, BEAT * 1.6, 0.16, 'triangle');
            });
        }
        // "hey!" final
        nota(t0 + total * BEAT, 1046.5, 0.5, 0.12, 'square'); nota(t0 + total * BEAT, 1318.5, 0.5, 0.08, 'square');
        return { mest, fim: t0 + (total + 1.2) * BEAT };
    }
    function somAcerto(c, q) { const t = c.currentTime; sino(t, q === 'kool' ? 1568 : 1318.5, 0.18, 0.07); }
    function somErro(c) { const t = c.currentTime; sino(t, 196, 0.25, 0.08, 'sawtooth'); }

    // presente de carvão: a caixa pronta, escurecida
    let cxCarvao = null;
    function caixaCarvao(fo) {
        if (cxCarvao) return cxCarvao;
        const W = 246, H = 321, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const g = cv.getContext('2d'); g.drawImage(fo, 4 * W, 0, W, H, 0, 0, W, H);
        g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(15,15,20,.72)'; g.fillRect(0, 0, W, H);
        return (cxCarvao = cv);
    }

    function jogo() {
        if (document.getElementById('nt-jogo')) return;
        const c = actx();
        const lay = document.createElement('div'); lay.id = 'nt-jogo';
        lay.innerHTML = '<canvas></canvas>';
        document.body.appendChild(lay);
        if (window.bmMenuMusica) window.bmMenuMusica.sync();   // cala a música do menu na hora
        const cv = lay.querySelector('canvas'), g = cv.getContext('2d');
        const fo = new Image(); fo.src = 'assets/pxn-juicy.webp';
        const FW = 246, FH = 321;
        const EV = montarFase();
        const S = { fase: 'pronto', t0: 0, score: 0, combo: 0, maxc: 0, cont: { kool: 0, cool: 0, good: 0, miss: 0, carvao: 0, esquiva: 0 }, juiz: null, pops: [], parts: [], fim: 0, mus: null };
        const lanes = Array.from({ length: 6 }, () => ({ pop: -9, miss: -9, coal: -9, aperto: -9 }));
        const lat = () => (c && (c.outputLatency || c.baseLatency)) || 0;
        const agora = () => c ? c.currentTime - lat() - S.t0 : 0;
        let geo = null;
        function medir() {
            const w = lay.clientWidth, h = lay.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
            if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            const gw = Math.min(w * 0.14, h * 0.2), esp = Math.min((w - gw) / 6.4, gw * 1.35);
            const x0 = w / 2 - esp * 2.5, base = h * 0.78;
            geo = { w, h, gw, esp, x0, base };
        }
        function comecar() {
            Object.assign(S, { fase: 'jogo', score: 0, combo: 0, maxc: 0, cont: { kool: 0, cool: 0, good: 0, miss: 0, carvao: 0, esquiva: 0 }, juiz: null, pops: [], parts: [] });
            EV.forEach(e => { e.feito = false; });
            lanes.forEach(l => Object.assign(l, { pop: -9, miss: -9, coal: -9, aperto: -9 }));
            if (!c) return;
            S.t0 = c.currentTime + 0.6;
            S.mus = agendarMusica(c, S.t0);
            S.fim = S.mus.fim - S.t0;
        }
        function julgar(lane) {
            if (S.fase !== 'jogo') return;
            const t = agora();
            lanes[lane].aperto = t;
            let melhor = null, dm = 9;
            for (const e of EV) { if (e.feito || e.lane !== lane) continue; const d = Math.abs(e.t - t); if (d < dm) { dm = d; melhor = e; } if (e.t - t > 0.4) break; }
            if (!melhor || dm > JANELA.good) return;
            melhor.feito = true;
            if (melhor.carvao) {
                S.cont.carvao++; S.combo = 0; S.score = Math.max(0, S.score - 200);
                lanes[lane].coal = t; S.juiz = { txt: 'CARVÃO!', cor: '#94a3b8', t };
                fumaca(lane); if (c) somErro(c); return;
            }
            const q = dm <= JANELA.kool ? 'kool' : dm <= JANELA.cool ? 'cool' : 'good';
            S.cont[q]++; S.combo++; S.maxc = Math.max(S.maxc, S.combo);
            S.score += Math.round({ kool: 300, cool: 200, good: 100 }[q] * (1 + Math.min(S.combo, 100) / 100));
            lanes[lane].pop = t;
            S.juiz = { txt: q.toUpperCase() + '!', cor: q === 'kool' ? '#fde047' : q === 'cool' ? '#67e8f9' : '#86efac', t };
            confete(lane); if (c) somAcerto(c, q);
        }
        const cx = (lane) => geo.x0 + lane * geo.esp;
        function confete(lane) {
            const CO = ['#ef4444', '#22c55e', '#facc15', '#38bdf8', '#f472b6', '#a855f7'];
            for (let i = 0; i < 16; i++) { const a = -Math.PI * (0.1 + Math.random() * 0.8), v = (180 + Math.random() * 260) * geo.gw / 160; S.parts.push({ x: cx(lane), y: geo.base - geo.gw * 1.1, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: CO[i % CO.length], life: 1, r: Math.random() * 6, k: 'c' }); }
        }
        function fumaca(lane) { for (let i = 0; i < 10; i++) S.parts.push({ x: cx(lane) + (Math.random() - 0.5) * geo.gw * 0.5, y: geo.base - geo.gw * 0.5, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 80, c: '#475569', life: 1, r: 8 + Math.random() * 14, k: 'f' }); }
        function sair() {
            try { if (S.mus) { S.mus.mest.gain.setTargetAtTime(0, c.currentTime, 0.05); setTimeout(() => S.mus && S.mus.mest.disconnect(), 400); } } catch (e) {}
            S.fase = 'saiu'; lay.remove(); document.removeEventListener('keydown', tecla, true);
            if (window.bmMenuMusica) setTimeout(() => window.bmMenuMusica.sync(), 50);
            abrir('jogo');
        }
        function terminar() {
            S.fase = 'fim';
            carregar();
            const k = hoje(), m = st.mini[k] || { best: 0, moedas: 0 };
            const vale = Math.min(MAX_MOEDAS_JOGO, Math.floor(S.score / 600));
            const ganho = Math.max(0, vale - m.moedas);
            const novoRec = S.score > (st.recorde || 0);
            m.best = Math.max(m.best, S.score); m.moedas = Math.max(m.moedas, vale);
            st.mini[k] = m; st.recorde = Math.max(st.recorde || 0, S.score);
            Object.keys(st.mini).sort().slice(0, -10).forEach(x => delete st.mini[x]);
            salvar();
            S.res = { ganho, vale, novoRec, hojeMoedas: m.moedas };
            if (ganho > 0) setTimeout(() => window.beatcoinsAdd && window.beatcoinsAdd(ganho, '🎁 JUICY NA CAIXA', `<b>${S.score.toLocaleString('pt-BR')}</b> pontos → <b>+${ganho}</b>`), 700);
        }
        function tecla(e) {
            if (!lay.isConnected) return;
            const k = (e.key || '').toLowerCase();
            if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); sair(); return; }
            if ((e.key === 'Enter' || e.key === ' ') && (S.fase === 'pronto' || S.fase === 'fim')) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) comecar(); return; }
            const i = TECLAS.indexOf(k);
            if (i >= 0) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) julgar(i); return; }
            e.stopImmediatePropagation();
        }
        document.addEventListener('keydown', tecla, true);
        lay.addEventListener('mousedown', (e) => {
            if (S.fase !== 'jogo') { if (S.fase === 'pronto' || S.fase === 'fim') comecar(); return; }
            const r = lay.getBoundingClientRect(), x = e.clientX - r.left;
            const lane = Math.round((x - geo.x0) / geo.esp);
            if (lane >= 0 && lane < 6) julgar(lane);
        });

        let ultimo = 0;
        function quadro(ts) {
            if (!lay.isConnected) return;
            requestAnimationFrame(quadro);
            const dt = ultimo ? Math.min(0.05, (ts - ultimo) / 1000) : 0.016; ultimo = ts;
            medir();
            const { w, h, gw, base } = geo;
            const t = S.fase === 'jogo' ? agora() : -1;
            // fundo
            const bg = g.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.35, Math.max(w, h) * 0.8);
            bg.addColorStop(0, '#3b0764'); bg.addColorStop(0.55, '#1e1b4b'); bg.addColorStop(1, '#05030c');
            g.fillStyle = bg; g.fillRect(0, 0, w, h);
            // neve
            g.fillStyle = 'rgba(255,255,255,.7)';
            for (let i = 0; i < 70; i++) { const x = ((i * 137.5) % w + Math.sin(ts / 1500 + i) * 20 + w) % w, y = ((i * 89 + ts / (14 + (i % 5) * 4)) % (h + 20)) - 10; g.fillRect(x, y, 1.5 + (i % 3), 1.5 + (i % 3)); }
            // pisca-pisca no alto
            const fase = Math.floor((S.fase === 'jogo' ? Math.max(0, t) : ts / 1000) / BEAT);
            const LZ = ['#ef4444', '#facc15', '#22c55e', '#38bdf8'];
            for (let x = 12, i = 0; x < w; x += 26, i++) { g.globalAlpha = (i + fase) % 2 ? 1 : 0.35; g.fillStyle = LZ[i % 4]; g.beginPath(); g.arc(x, 16 + Math.sin(x * 0.05) * 4, 4.5, 0, Math.PI * 2); g.fill(); }
            g.globalAlpha = 1;
            // palco
            const pg = g.createLinearGradient(0, base - 6, 0, h); pg.addColorStop(0, '#2e1065'); pg.addColorStop(1, '#0b0a23');
            g.fillStyle = pg; g.fillRect(0, base - 4, w, h - base + 4);
            g.fillStyle = '#a855f7'; g.fillRect(0, base - 4, w, 3);
            g.imageSmoothingEnabled = false;
            const ok = fo.complete && fo.naturalWidth;
            const sc = gw / 150;   // o presente fechado tem ~150px de largura na folha
            for (let L = 0; L < 6; L++) {
                const x = cx(L), ln = lanes[L];
                // próximo evento desta tecla
                let prox = null;
                if (S.fase === 'jogo') for (const e of EV) { if (e.feito || e.lane !== L) continue; if (e.t < t - JANELA.good) { e.feito = true; if (e.carvao) { S.cont.esquiva++; S.score += 50; S.juiz = { txt: 'ESQUIVOU!', cor: '#cbd5e1', t }; } else { S.cont.miss++; S.combo = 0; ln.miss = t; S.juiz = { txt: 'MISS', cor: '#f87171', t }; } continue; } prox = e; break; }
                const falta = prox ? prox.t - t : 9;
                const vem = prox && falta <= ANTES;
                // quadro do Beatjuicy/caixa
                let f = 4, rot = 0, img = fo, cinza = false;
                if (t - ln.pop < 0.08 && t >= ln.pop) f = 5; else if (t - ln.pop < 0.5 && t >= ln.pop) f = 6;
                else if (t - ln.miss < 0.7 && t >= ln.miss) f = 7;
                if (f === 4 && vem) { rot = Math.sin(ts / 30) * 0.08 * (1 - falta / ANTES); if (prox.carvao) cinza = true; }
                if (ok) {
                    g.save(); g.translate(x, base); g.rotate(rot);
                    const dw = FW * sc, dh = FH * sc;
                    if (cinza) g.drawImage(caixaCarvao(fo), -123 * sc, -dh, dw, dh);
                    else g.drawImage(img, f * FW, 0, FW, FH, -123 * sc, -dh, dw, dh);
                    g.restore();
                }
                // anel de aproximação
                if (vem) {
                    const p = Math.max(0, falta / ANTES), r = gw * (0.55 + 0.7 * p);
                    g.globalAlpha = 0.35 + 0.65 * (1 - p); g.strokeStyle = prox.carvao ? '#ef4444' : '#fde047'; g.lineWidth = 4;
                    g.beginPath(); g.arc(x, base - gw * 0.48, r, 0, Math.PI * 2); g.stroke();
                    g.globalAlpha = 0.5; g.lineWidth = 1.5; g.beginPath(); g.arc(x, base - gw * 0.48, gw * 0.55, 0, Math.PI * 2); g.stroke();
                    g.globalAlpha = 1;
                }
                // tecla
                const kw = Math.max(34, gw * 0.34), aceso = t - ln.aperto < 0.12 && t >= ln.aperto;
                g.fillStyle = aceso ? '#fde047' : '#0f172a'; g.strokeStyle = aceso ? '#fde047' : '#64748b'; g.lineWidth = 2;
                g.beginPath(); if (g.roundRect) g.roundRect(x - kw / 2, base + 22, kw, kw, 8); else g.rect(x - kw / 2, base + 22, kw, kw); g.fill(); g.stroke();
                g.fillStyle = aceso ? '#0f172a' : '#e2e8f0'; g.font = `900 ${Math.round(kw * 0.5)}px Orbitron, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
                g.fillText(TECLAS[L].toUpperCase(), x, base + 22 + kw / 2 + 1);
            }
            // partículas
            let j = 0;
            for (const p of S.parts) {
                p.life -= dt * (p.k === 'f' ? 0.9 : 0.8); if (p.life <= 0) continue;
                p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.k === 'f' ? -10 : 420) * dt; p.r += dt * (p.k === 'f' ? 18 : 6);
                g.globalAlpha = Math.min(1, p.life * 1.5) * (p.k === 'f' ? 0.5 : 1); g.fillStyle = p.c;
                if (p.k === 'f') { g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
                else { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-4, -2, 8, 4); g.restore(); }
                S.parts[j++] = p;
            }
            S.parts.length = j; g.globalAlpha = 1;
            // HUD
            g.textAlign = 'right'; g.textBaseline = 'top';
            g.fillStyle = '#e9d5ff'; g.font = '700 16px Rajdhani, sans-serif'; g.fillText('PONTOS', w - 28, 44);
            g.fillStyle = '#fff'; g.font = `900 ${Math.round(Math.min(46, w * 0.035))}px Orbitron, monospace`; g.fillText(S.score.toLocaleString('pt-BR'), w - 28, 62);
            if (S.combo > 1) { g.fillStyle = '#fde047'; g.font = '900 22px Orbitron, monospace'; g.fillText(`COMBO ${S.combo}`, w - 28, 116); }
            if (S.fase === 'jogo') {
                const resta = Math.max(0, S.fim - t), p = Math.min(1, Math.max(0, t / S.fim));
                g.fillStyle = '#cbd5e1'; g.font = '700 16px Rajdhani, sans-serif'; g.fillText(`⏱ 0:${pad(Math.ceil(resta))}`, w - 28, 146);
                g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, h - 6, w, 6); g.fillStyle = '#22c55e'; g.fillRect(0, h - 6, w * p, 6);
                if (t < 0) { // contagem
                    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.font = `900 ${Math.round(h * 0.1)}px Orbitron, monospace`;
                    g.fillText('PRONTO?', w / 2, h * 0.35);
                } else if (t < INTRO * BEAT) {
                    const n = INTRO - Math.floor(t / BEAT);
                    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fde047'; g.font = `900 ${Math.round(h * 0.14)}px Orbitron, monospace`;
                    g.fillText(n > 1 ? String(n - 1) : 'VAI!', w / 2, h * 0.35);
                }
                if (t > S.fim) terminar();
            }
            // julgamento
            if (S.juiz && t - S.juiz.t < 0.5 && S.fase === 'jogo') {
                const k = (t - S.juiz.t) / 0.5;
                g.globalAlpha = 1 - k * k; g.textAlign = 'center'; g.textBaseline = 'middle';
                g.fillStyle = S.juiz.cor; g.font = `900 ${Math.round(h * 0.06 * (1.15 - 0.15 * k))}px Orbitron, monospace`;
                g.fillText(S.juiz.txt, w / 2, h * 0.3); g.globalAlpha = 1;
            }
            // título / telas
            g.textAlign = 'center'; g.textBaseline = 'top';
            g.fillStyle = '#fff'; g.font = `900 ${Math.round(Math.min(34, w * 0.026))}px Orbitron, monospace`; g.fillText('🎁 JUICY NA CAIXA', w / 2, 40);
            if (S.fase === 'pronto' || S.fase === 'fim') {
                g.fillStyle = 'rgba(5,3,12,.78)'; g.fillRect(0, h * 0.18, w, h * 0.42);
                g.textBaseline = 'middle';
                if (S.fase === 'pronto') {
                    g.fillStyle = '#fde047'; g.font = `900 ${Math.round(h * 0.055)}px Orbitron, monospace`; g.fillText('APERTE ENTER PRA COMEÇAR', w / 2, h * 0.3);
                    g.fillStyle = '#e9d5ff'; g.font = `700 ${Math.round(h * 0.03)}px Rajdhani, sans-serif`;
                    g.fillText('Teclas S D F J K L · quando o anel encostar no presente · não aperte o carvão · Esc sai', w / 2, h * 0.4);
                    g.fillText('Põe o som! A música é o ritmo. 🔔', w / 2, h * 0.46);
                } else {
                    const R = S.res || {};
                    g.fillStyle = '#fff'; g.font = `900 ${Math.round(h * 0.06)}px Orbitron, monospace`; g.fillText(`${S.score.toLocaleString('pt-BR')} PONTOS${R.novoRec ? ' · RECORDE!' : ''}`, w / 2, h * 0.26);
                    g.fillStyle = '#c4b5fd'; g.font = `700 ${Math.round(h * 0.03)}px Rajdhani, sans-serif`;
                    g.fillText(`KOOL ${S.cont.kool} · COOL ${S.cont.cool} · GOOD ${S.cont.good} · MISS ${S.cont.miss} · carvão ${S.cont.carvao} · combo máx. ${S.maxc}`, w / 2, h * 0.35);
                    g.fillStyle = '#fde047'; g.font = `800 ${Math.round(h * 0.034)}px Rajdhani, sans-serif`;
                    g.fillText(R.ganho > 0 ? `+${R.ganho} Beatcoins! (hoje: ${R.hojeMoedas}/${MAX_MOEDAS_JOGO})` : R.hojeMoedas >= MAX_MOEDAS_JOGO ? `Você já levou as ${MAX_MOEDAS_JOGO} moedas de hoje — agora é pelo recorde!` : `Seu melhor de hoje ainda vale mais (${R.hojeMoedas} moedas). Tenta de novo!`, w / 2, h * 0.43);
                    g.fillStyle = '#e9d5ff'; g.font = `700 ${Math.round(h * 0.028)}px Rajdhani, sans-serif`; g.fillText('Enter: jogar de novo · Esc: voltar', w / 2, h * 0.51);
                }
            }
        }
        requestAnimationFrame(quadro);
    }

    // ---------- botão no menu inicial / faixa na Loja ----------
    function portaHojeFechada() { const d = diaAtual(); return d >= 1 && d <= 25 && !st.portas[d]; }
    function atualizarHub() {
        const hub = document.getElementById('bm-hub'); if (!hub) return;
        let b = hub.querySelector('.nt-btn');
        const on = ativo();
        hub.classList.toggle('nt-on', on);
        // neve caindo no menu inicial (Configurações › Temas pode desligar)
        const querNeve = on && !(typeof window.bmTema === 'function' && window.bmTema('neve') === false);
        let nv = hub.querySelector('.nt-neve');
        if (querNeve && !nv) { nv = document.createElement('div'); nv.className = 'nt-neve'; nv.innerHTML = '<i></i><i></i><i></i>'; hub.appendChild(nv); }
        else if (!querNeve && nv) nv.remove();
        if (!on) { if (b) b.remove(); return; }
        carregar();
        if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'nt-btn'; b.addEventListener('click', (e) => { e.stopPropagation(); abrir('cal'); }); hub.appendChild(b); }
        const tem = portaHojeFechada();
        b.innerHTML = `<i>🎄</i><span>NATAL BEATMAX<small>${tem ? `porta ${diaAtual()} te esperando! (N)` : 'calendário e Juicy na Caixa (N)'}</small></span>${tem ? '<span class="dt"></span>' : ''}`;
    }
    setInterval(atualizarHub, 2000);
    setTimeout(atualizarHub, 600);
    window.bmNatalAbrir = (q) => abrir(q === 'jogo' || q === 'lista' ? q : 'cal');
    window.bmNatalBanner = () => {
        if (!ativo()) return '';
        carregar();
        return `<div class="nt-banner"><span class="e">🎄</span><div><b class="t">NATAL BEATMAX</b><span>${portaHojeFechada() ? `A porta <b>${diaAtual()}</b> do Calendário do Advento está esperando!` : 'Calendário do Advento, Juicy na Caixa e a Lista dos Travessos.'} Itens de Natal na Loja até o fim do evento — e depois também.</span></div>
            <button data-nt="cal">🎄 Calendário</button><button data-nt="jogo">🎁 Juicy na Caixa</button></div>`;
    };
})();

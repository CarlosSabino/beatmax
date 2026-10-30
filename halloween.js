// =====================================================================================
// halloween.js — ROLETA MACABRA (evento de Halloween, 24/out a 3/nov).
//
//  • 1 giro grátis por dia; giro extra custa 25 Beatcoins.
//  • Prêmios: item aleatório da Loja (que você ainda não tem), +50 Beatcoins, ou a nota
//    exclusiva ABÓBORA (só sai na roleta).
//  • Travessuras: BOO! (susto e nada mais), -20 Beatcoins, ou uma MALDIÇÃO por 3 partidas:
//    fantasma passeando pela gear, morcegos voando ou teias nos cantos. As maldições são só
//    visuais (não mexem no julgamento, na precisão nem no ranking).
//  • Entra pelo menu inicial (abóbora no canto) e pela Loja (faixa do evento). Quem cuida é o Beatjuicy.
//  • Fora do período some sozinho. Pra testar: ?halloween=1 na URL.
// =====================================================================================
(function () {
    const KEY = 'djmaxHalloween_v1';
    const PRECO_EXTRA = 25;
    const st = { spins: {}, curse: null, total: 0 };
    const load = () => { try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {} };
    load();
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
    window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith(KEY)) load(); });
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = (n) => String(n).padStart(2, '0');
    const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    function ativo() {
        if (/[?&]halloween=1\b/.test(location.search)) return true;
        if (/[?&]halloween=0\b/.test(location.search)) return false;
        const d = new Date(), m = d.getMonth() + 1, dia = d.getDate();
        return (m === 10 && dia >= 24) || (m === 11 && dia <= 3);
    }
    window.bmHalloweenAtivo = ativo;
    const gratisHoje = () => (typeof window.bmAdmin === 'function' && window.bmAdmin()) || !(st.spins[hoje()] > 0);
    const fala = (k, l) => (typeof window.beatmaxFala === 'function' ? window.beatmaxFala(k, l) : l[0]);

    // ---------- as fatias ----------
    // Halloween: doces e travessuras · Fora do evento: roleta comum do Beatjuicy (só prêmio, sem travessura)
    const FATIAS_HW = [
        { id: 'item', ic: '🎁', t: 'ITEM DA LOJA', cor: '#7c2d12', bom: true, peso: 12 },
        { id: 'boo', ic: '👻', t: 'BOO!', cor: '#1e0b36', bom: false, peso: 16 },
        { id: 'moedas', ic: '🪙', t: '+50 MOEDAS', cor: '#9a3412', bom: true, peso: 16 },
        { id: 'fantasma', ic: '👻', t: 'FANTASMA', cor: '#2e1065', bom: false, peso: 12 },
        { id: 'abobora', ic: '🎃', t: 'NOTA ABÓBORA', cor: '#c2410c', bom: true, peso: 8 },
        { id: 'perde', ic: '💀', t: '-20 MOEDAS', cor: '#1e0b36', bom: false, peso: 14 },
        { id: 'morcegos', ic: '🦇', t: 'MORCEGOS', cor: '#3b0764', bom: false, peso: 12 },
        { id: 'teia', ic: '🕸️', t: 'TEIAS', cor: '#2e1065', bom: false, peso: 10 },
        { id: 'juicy', ic: '🧟', t: 'JUICY 8-BIT', cor: '#3f6212', bom: true, peso: 8 }
    ];
    const FATIAS_NRM = [
        { id: 'item', ic: '🎁', t: 'ITEM DA LOJA', cor: '#365314', bom: true, peso: 8 },
        { id: 'm10', ic: '🪙', t: '+10 MOEDAS', cor: '#3b0764', bom: true, peso: 24 },
        { id: 'exp', ic: '⭐', t: '+150 EXP', cor: '#4d7c0f', bom: true, peso: 16 },
        { id: 'quase', ic: '👻', t: 'QUASE!', cor: '#2e1065', bom: false, peso: 20 },
        { id: 'm20', ic: '💰', t: '+20 MOEDAS', cor: '#3f6212', bom: true, peso: 20 },
        { id: 'moedas', ic: '🪙', t: '+50 MOEDAS', cor: '#581c87', bom: true, peso: 12 }
    ];
    let FATIAS = FATIAS_HW;
    const doMomento = () => (FATIAS = ativo() ? FATIAS_HW : FATIAS_NRM);
    const MALDICAO = { fantasma: 'um fantasma passeando pela gear', morcegos: 'morcegos voando pela tela', teia: 'teias de aranha nos cantos da gear' };
    function sortear() {
        const tot = FATIAS.reduce((a, f) => a + f.peso, 0);
        let r = Math.random() * tot;
        for (let i = 0; i < FATIAS.length; i++) { r -= FATIAS[i].peso; if (r <= 0) return i; }
        return 0;
    }

    // ---------- som (tudo sintetizado, sem arquivo) ----------
    let actx = null;
    function ctx() { try { actx = actx || (typeof audio !== 'undefined' && audio.ctx) || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {} return actx; }
    const vol = () => (typeof musicVolume === 'number' ? musicVolume : 0.7) * 0.18;
    function tique() {
        const c = ctx(); if (!c) return;
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
        o.type = 'square'; o.frequency.value = 1400;
        g.gain.setValueAtTime(vol() * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.05);
    }
    function somFim(bom) {
        const c = ctx(); if (!c) return;
        const t = c.currentTime;
        const notas = bom ? [523.25, 659.25, 783.99, 1046.5] : [220, 207.65, 196, 155.56];
        notas.forEach((f, i) => {
            const o = c.createOscillator(), g = c.createGain(), t0 = t + i * (bom ? 0.09 : 0.16);
            o.type = bom ? 'triangle' : 'sawtooth'; o.frequency.value = f;
            if (!bom) o.frequency.exponentialRampToValueAtTime(f * 0.94, t0 + 0.4);
            g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol() * (bom ? 1 : 0.6), t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i === notas.length - 1 ? 0.9 : 0.3));
            o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 1);
        });
    }
    function somBoo() {
        const c = ctx(); if (!c) return;
        const t = c.currentTime, n = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
        n.buffer = b;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.6); f.Q.value = 2;
        const g = c.createGain(); g.gain.value = vol() * 2.2;
        n.connect(f); f.connect(g); g.connect(c.destination); n.start(t);
        const o = c.createOscillator(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.6);
        og.gain.setValueAtTime(vol() * 0.8, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.65); o.connect(og); og.connect(c.destination); o.start(t); o.stop(t + 0.7);
    }

    // ---------- estilo ----------
    const css = document.createElement('style');
    css.textContent = `
#hw-ov{position:fixed;inset:0;z-index:160;display:flex;align-items:center;justify-content:center;font-family:Rajdhani,sans-serif;color:#fde68a;
  background:radial-gradient(ellipse at 50% 40%,rgba(88,28,135,.55),rgba(10,2,20,.96) 70%);overflow:hidden}
#hw-ov .neb{position:absolute;inset:-20%;background:radial-gradient(ellipse 40% 25% at 20% 80%,rgba(249,115,22,.18),transparent 70%),radial-gradient(ellipse 50% 30% at 85% 20%,rgba(126,34,206,.25),transparent 70%);animation:hwNeb 14s ease-in-out infinite alternate;pointer-events:none}
@keyframes hwNeb{to{transform:translate(4%,-3%) scale(1.06)}}
#hw-ov .bat{position:absolute;font-size:28px;filter:drop-shadow(0 0 6px #000);animation:hwBat linear infinite;pointer-events:none}
@keyframes hwBat{0%{transform:translate(0,0) scaleX(1)}25%{transform:translate(25vw,-6vh) scaleX(.6)}50%{transform:translate(50vw,4vh) scaleX(1)}75%{transform:translate(75vw,-4vh) scaleX(.6)}100%{transform:translate(110vw,2vh) scaleX(1)}}
#hw-ov .bx{position:relative;width:min(1000px,94vw);display:grid;grid-template-columns:auto 1fr;gap:34px;align-items:center;padding:28px 34px;border-radius:22px;
  background:linear-gradient(180deg,rgba(30,10,46,.94),rgba(12,4,22,.96));border:2px solid #f97316;box-shadow:0 0 60px rgba(249,115,22,.35),0 0 120px rgba(126,34,206,.35)}
#hw-ov h2{font:900 34px Orbitron,monospace;letter-spacing:.06em;color:#fb923c;text-shadow:0 0 18px rgba(249,115,22,.7),0 3px 0 #431407;margin:0}
#hw-ov .sub{font:700 16px Rajdhani;color:#d8b4fe;margin-top:4px}
#hw-ov .whl{position:relative;width:min(470px,60vh,80vw);aspect-ratio:1}
#hw-ov .whl canvas{width:100%;height:100%;display:block;filter:drop-shadow(0 0 24px rgba(249,115,22,.4))}
#hw-ov .pin{position:absolute;left:50%;top:-8px;transform:translateX(-50%);width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:38px solid #fde047;filter:drop-shadow(0 3px 0 #713f12) drop-shadow(0 0 10px #f59e0b);z-index:2}
#hw-ov .cent{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26%;aspect-ratio:1;border-radius:50%;border:none;cursor:pointer;
  background:radial-gradient(circle at 40% 35%,#fdba74,#ea580c 55%,#7c2d12);box-shadow:0 0 0 5px #1e0b36,0 0 30px rgba(249,115,22,.8);font:900 clamp(14px,2.2vh,20px) Orbitron;color:#1c0a00;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1}
#hw-ov .cent:disabled{cursor:default;filter:grayscale(.4) brightness(.8)}
#hw-ov .side{display:flex;flex-direction:column;gap:12px;min-width:0}
#hw-ov .info{font:700 17px Rajdhani;color:#e9d5ff;line-height:1.35}
#hw-ov .info b{color:#fde047}
#hw-ov .lst{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font:700 15px Rajdhani;color:#c4b5fd}
#hw-ov .lst span.b{color:#86efac}#hw-ov .lst span.m{color:#fca5a5}
#hw-ov .res{min-height:96px;border-radius:14px;padding:12px 16px;background:rgba(0,0,0,.35);border:1px solid #581c87;font:700 17px Rajdhani;color:#f5f3ff}
#hw-ov .res .big{display:block;font:900 26px Orbitron;margin-bottom:4px}
#hw-ov .res.bom{border-color:#22c55e;box-shadow:0 0 22px rgba(34,197,94,.3)}#hw-ov .res.bom .big{color:#86efac}
#hw-ov .res.mau{border-color:#ef4444;box-shadow:0 0 22px rgba(239,68,68,.3)}#hw-ov .res.mau .big{color:#fca5a5}
#hw-ov .row{display:flex;gap:10px;flex-wrap:wrap}
#hw-ov .row button{padding:10px 18px;border-radius:10px;border:1px solid #7e22ce;background:#2e1065;color:#f5f3ff;font:800 15px Rajdhani;cursor:pointer}
#hw-ov .row button.pri{background:linear-gradient(90deg,#ea580c,#f59e0b);border:0;color:#1c0a00}
#hw-ov .row button:disabled{opacity:.45;cursor:default}
#hw-boo{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;background:#000;pointer-events:none;animation:hwBoo .9s ease-out forwards}
#hw-boo div{font-size:min(60vh,60vw);line-height:1;animation:hwBooF .9s cubic-bezier(.2,1.8,.4,1) forwards;filter:drop-shadow(0 0 60px #fff)}
@keyframes hwBoo{0%{opacity:1}70%{opacity:1}100%{opacity:0}}
@keyframes hwBooF{0%{transform:scale(.2) rotate(-20deg)}40%{transform:scale(1.15) rotate(6deg)}100%{transform:scale(1) rotate(0)}}
#bm-hub .hw-btn{position:absolute;right:2vw;bottom:calc(48px + clamp(110px,14vh,150px) + 70px);z-index:4;display:flex;align-items:center;gap:10px;padding:8px 16px 8px 10px;border-radius:999px;cursor:pointer;
  background:linear-gradient(90deg,#431407,#7c2d12);border:2px solid #f97316;color:#fde68a;font:900 15px Orbitron;letter-spacing:.04em;box-shadow:0 0 22px rgba(249,115,22,.45);animation:hwPul 2.4s ease-in-out infinite}
#bm-hub .hw-btn i{font-style:normal;font-size:30px;line-height:1;animation:hwBalanca 1.6s ease-in-out infinite}
#bm-hub .hw-btn small{display:block;font:700 12px Rajdhani;color:#fdba74;letter-spacing:0}
#bm-hub .hw-btn .dt{position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e}
@keyframes hwPul{50%{box-shadow:0 0 34px rgba(249,115,22,.75)}}
@keyframes hwBalanca{50%{transform:rotate(-12deg)}}
.hw-banner{display:flex;align-items:center;gap:16px;margin-top:14px;padding:12px 18px;border-radius:14px;background:linear-gradient(90deg,#2e1065,#7c2d12);border:1.5px solid #f97316;box-shadow:0 0 22px rgba(249,115,22,.3)}
.hw-banner .e{font-size:40px}.hw-banner b{display:block;font:900 18px Orbitron;color:#fb923c}.hw-banner span{font:700 14px Rajdhani;color:#e9d5ff}
.hw-banner button,#bc-ov .hw-banner button{margin-left:auto;width:auto;padding:10px 18px;border-radius:10px;border:0;background:linear-gradient(90deg,#ea580c,#f59e0b);color:#1c0a00;font:900 14px Orbitron;cursor:pointer}
#hw-ov.nrm{background:radial-gradient(ellipse at 50% 40%,rgba(63,98,18,.45),rgba(6,10,4,.96) 70%)}
#hw-ov.nrm .bx{border-color:#84cc16;box-shadow:0 0 60px rgba(132,204,22,.3),0 0 120px rgba(126,34,206,.3)}
#hw-ov.nrm h2{color:#a3e635;text-shadow:0 0 18px rgba(132,204,22,.7),0 3px 0 #1a2e05}
#hw-ov.nrm .pin{border-top-color:#a3e635}
#hw-ov.nrm .cent{background:radial-gradient(circle at 40% 35%,#d9f99d,#65a30d 55%,#1a2e05)}
#bm-hub .hw-btn.nrm{background:linear-gradient(90deg,#1a2e05,#3b0764);border-color:#84cc16;color:#d9f99d;box-shadow:0 0 22px rgba(132,204,22,.4)}
.hw-banner.nrm{background:linear-gradient(90deg,#1a2e05,#3b0764);border-color:#84cc16}.hw-banner.nrm b{color:#a3e635}
#hw-tag{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:190;padding:8px 18px;border-radius:999px;background:linear-gradient(90deg,#2e1065,#7c2d12);border:1px solid #f97316;color:#fde68a;font:800 15px Rajdhani;pointer-events:none;transition:opacity .6s}`;
    document.head.appendChild(css);

    // ---------- roleta ----------
    let girando = false, ang = 0;
    function desenharRoda(cv, a, destaque) {
        const g = cv.getContext('2d'), S = cv.width, c = S / 2, R = c - 8, n = FATIAS.length, fat = Math.PI * 2 / n;
        g.clearRect(0, 0, S, S);
        g.save(); g.translate(c, c); g.rotate(a);
        FATIAS.forEach((f, i) => {
            const a0 = -Math.PI / 2 - fat / 2 + i * fat;
            g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a0, a0 + fat); g.closePath();
            const gr = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
            gr.addColorStop(0, '#0a0212'); gr.addColorStop(1, f.cor);
            g.fillStyle = gr; g.fill();
            if (destaque === i) { g.fillStyle = 'rgba(253,224,71,.25)'; g.fill(); }
            g.strokeStyle = ativo() ? '#f97316' : '#84cc16'; g.lineWidth = 3; g.stroke();
            g.save(); g.rotate(a0 + fat / 2);
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.font = `${Math.round(S * 0.07)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
            g.translate(R * 0.74, 0); g.rotate(Math.PI / 2);
            g.fillText(f.ic, 0, 0);
            g.font = `900 ${Math.round(S * 0.026)}px Orbitron, sans-serif`; g.fillStyle = f.bom ? '#fde68a' : '#e9d5ff';
            g.fillText(f.t, 0, S * 0.062);
            g.restore();
        });
        // aro com "lâmpadas"
        g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.strokeStyle = '#1e0b36'; g.lineWidth = 10; g.stroke();
        for (let i = 0; i < 24; i++) {
            const a1 = i * Math.PI / 12;
            g.beginPath(); g.arc(Math.cos(a1) * R, Math.sin(a1) * R, 4, 0, Math.PI * 2);
            g.fillStyle = (i + Math.floor(performance.now() / 160)) % 2 ? '#fde047' : '#7c2d12'; g.fill();
        }
        g.restore();
    }
    function itemAleatorio() {
        const k = typeof window.lojaCatalogo === 'function' ? window.lojaCatalogo() : null;
        if (!k) return null;
        const pool = [];
        k.gears.filter(x => !x.owned).forEach(x => pool.push({ kind: 'gear', id: x.id, name: 'Gear ' + x.name }));
        k.notes.filter(x => !x.owned && x.id !== 'abobora').forEach(x => pool.push({ kind: 'nota', id: x.id, name: 'Nota ' + x.name }));
        (k.torcida || []).filter(x => !x.owned).forEach(x => pool.push({ kind: 'torcida', id: x.id, name: x.name + ' (torcida)' }));
        (k.fever || []).filter(x => !x.owned).forEach(x => pool.push({ kind: 'fever', id: x.id, name: 'FEVER ' + x.name }));
        return pool.length ? pool[(Math.random() * pool.length) | 0] : null;
    }
    // aplica o resultado e devolve { bom, titulo, texto, acao? }
    function aplicar(f) {
        st.total = (st.total || 0) + 1;
        if (f.id === 'item') {
            const it = itemAleatorio();
            if (it && window.lojaDar && window.lojaDar(it.kind, it.id)) return { bom: true, titulo: '🎁 PRESENTE!', texto: `Você ganhou <b>${esc(it.name)}</b>! Já está na sua coleção (veja no Personalizar).`, acao: it.kind === 'torcida' ? 'torcida' : it.kind === 'fever' ? 'fever' : it.kind === 'nota' ? 'nota' : 'gear' };
            window.beatcoinsAdd && window.beatcoinsAdd(80, '🎃 ROLETA MACABRA', 'Você já tem tudo da Loja! Leva <b>+80</b>');
            return { bom: true, titulo: '🎁 COLEÇÃO COMPLETA', texto: 'Você já tem tudo da Loja… então a roleta pagou <b>+80 Beatcoins</b>!' };
        }
        if (f.id === 'juicy') {
            if (window.lojaDar && window.lojaDar('torcida', 'juicy')) return { bom: true, titulo: '🧟 TORCIDA BEATJUICY!', texto: 'Eu mesmo vou torcer por você do lado da gear! <b>Beatjuicy 8-bit</b> — exclusivo da roleta no Halloween. Hehehe…', acao: 'torcida' };
            window.beatcoinsAdd && window.beatcoinsAdd(40, '🎃 ROLETA MACABRA', 'Torcida repetida vira <b>+40</b>');
            return { bom: true, titulo: '🧟 JÁ TEM O JUICY', texto: 'Você já tem a minha torcida — virou <b>+40 Beatcoins</b>.' };
        }
        if (f.id === 'm10' || f.id === 'm20') { const n = f.id === 'm10' ? 10 : 20; window.beatcoinsAdd && window.beatcoinsAdd(n, '👻 ROLETA DO BEATJUICY', `<b>+${n}</b>`); return { bom: true, titulo: `🪙 +${n} BEATCOINS`, texto: `<b>+${n} Beatcoins</b> pro bolso.` }; }
        if (f.id === 'exp') { try { window.nivelBonus && window.nivelBonus(150, '👻 Roleta do Beatjuicy'); } catch (e) {} return { bom: true, titulo: '⭐ +150 EXP', texto: 'Um empurrãozinho no seu nível: <b>+150 EXP</b>.' }; }
        if (f.id === 'quase') return { bom: false, titulo: '👻 QUASE!', texto: 'Passou raspando… dessa vez não veio nada. Amanhã tem outro giro grátis!' };
        if (f.id === 'moedas') { window.beatcoinsAdd && window.beatcoinsAdd(50, '🎃 ROLETA MACABRA', 'Doce! <b>+50</b>'); return { bom: true, titulo: '🪙 DOCE!', texto: '<b>+50 Beatcoins</b> direto pro bolso.' }; }
        if (f.id === 'abobora') {
            if (window.lojaDar && window.lojaDar('nota', 'abobora')) return { bom: true, titulo: '🎃 NOTA ABÓBORA!', texto: 'A skin de nota <b>exclusiva do Halloween</b> é sua! Abóboras com olhos brilhando e doces voando a cada acerto.', acao: 'abobora' };
            window.beatcoinsAdd && window.beatcoinsAdd(30, '🎃 ROLETA MACABRA', 'Abóbora repetida vira <b>+30</b>');
            return { bom: true, titulo: '🎃 ABÓBORA REPETIDA', texto: 'Você já tem a Nota Abóbora — virou <b>+30 Beatcoins</b>.' };
        }
        if (f.id === 'boo') { setTimeout(boo, 150); return { bom: false, titulo: '👻 BOO!', texto: 'Só um susto mesmo. Nada aconteceu… dessa vez. 😈' }; }
        if (f.id === 'perde') { const n = window.beatcoinsTirar ? window.beatcoinsTirar(20) : 0; return { bom: false, titulo: '💀 TRAVESSURA!', texto: n ? `As moedas foram amaldiçoadas: <b>-${n} Beatcoins</b>.` : 'Ia tirar 20 Beatcoins… mas o seu bolso estava vazio. Escapou! 😅' }; }
        st.curse = { tipo: f.id, runs: 3 }; save();
        return { bom: false, titulo: `${f.ic} MALDIÇÃO!`, texto: `Nas próximas <b>3 partidas</b>: ${MALDICAO[f.id]}. Só visual — o julgamento não muda.` };
    }
    function boo() {
        somBoo();
        const b = document.createElement('div'); b.id = 'hw-boo'; b.innerHTML = '<div>👻</div>';
        document.body.appendChild(b); setTimeout(() => b.remove(), 950);
    }
    function abrir() {
        if (typeof isPlaying !== 'undefined' && isPlaying) return;
        document.getElementById('hw-ov')?.remove();
        doMomento();
        const hw = ativo();
        const ov = document.createElement('div'); ov.id = 'hw-ov'; if (!hw) ov.className = 'nrm';
        const bats = Array.from({ length: 7 }, (_, i) => `<span class="bat" style="left:-8vw;top:${8 + i * 12}vh;animation-duration:${9 + i * 2.3}s;animation-delay:${-i * 3.1}s;font-size:${20 + (i % 3) * 8}px">🦇</span>`).join('');
        ov.innerHTML = `<div class="neb"></div>${hw ? bats : ''}<div class="bx">
            <div class="whl"><div class="pin"></div><canvas width="940" height="940"></canvas><button class="cent" id="hw-girar">GIRAR</button></div>
            <div class="side"><div><h2>${hw ? '🎃 ROLETA MACABRA' : '👻 ROLETA DO BEATJUICY'}</h2><div class="sub">${hw ? 'Doce ou travessura? Evento de Halloween até 3 de novembro.' : 'Um giro grátis por dia. Só prêmio — as travessuras voltam no próximo Halloween.'}</div></div>
              <div class="info" id="hw-info"></div>
              ${hw ? '<div class="lst"><span class="b">🎁 Item da Loja</span><span class="m">👻 BOO! (susto)</span><span class="b">🪙 +50 Beatcoins</span><span class="m">💀 -20 Beatcoins</span><span class="b">🎃 Nota Abóbora (só aqui!)</span><span class="m">🦇👻🕸️ Maldição (3 partidas)</span><span class="b">🧟 Torcida Beatjuicy (só aqui!)</span></div>' : '<div class="lst"><span class="b">🎁 Item da Loja</span><span class="b">⭐ +150 EXP</span><span class="b">🪙 +10 / +20 / +50 Beatcoins</span><span class="m">👻 Quase! (nada)</span></div>'}
              <div class="res" id="hw-res">Gire e descubra o seu destino…</div>
              <div class="row" id="hw-row"><button data-x>Fechar</button></div></div></div>`;
        document.body.appendChild(ov);
        const cv = ov.querySelector('canvas');
        let destaque = -1;
        const loop = () => { if (!ov.isConnected) return; if (!girando) desenharRoda(cv, ang, destaque); requestAnimationFrame(loop); };
        loop();
        const info = () => {
            const s = typeof window.beatcoinsSaldo === 'function' ? window.beatcoinsSaldo() : 0;
            const c = st.curse && st.curse.runs > 0 ? `<br>Maldição ativa: <b>${esc(MALDICAO[st.curse.tipo] || st.curse.tipo)}</b> (faltam ${st.curse.runs} partida${st.curse.runs > 1 ? 's' : ''}).` : '';
            ov.querySelector('#hw-info').innerHTML = (gratisHoje() ? 'Você tem <b>1 giro grátis</b> hoje!' : `Giro grátis de hoje já foi. Giro extra: <b>${PRECO_EXTRA} Beatcoins</b> (você tem ${s}).`) + c;
            const b = ov.querySelector('#hw-girar');
            b.textContent = gratisHoje() ? 'GIRAR' : `GIRAR ${PRECO_EXTRA}🪙`;
            b.disabled = girando || (!gratisHoje() && s < PRECO_EXTRA);
        };
        info();
        const fechar = () => { if (girando) return; ov.remove(); document.removeEventListener('keydown', key, true); };
        const key = (e) => {
            if (!ov.isConnected) return;
            if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); fechar(); return; }
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); ov.querySelector('#hw-girar').click(); return; }
            e.stopImmediatePropagation();
        };
        document.addEventListener('keydown', key, true);
        ov.querySelector('[data-x]').onclick = fechar;
        ov.addEventListener('mousedown', (e) => { if (e.target === ov) fechar(); });
        ov.querySelector('#hw-girar').onclick = () => {
            if (girando) return;
            if (!gratisHoje()) {
                const s = typeof window.beatcoinsSaldo === 'function' ? window.beatcoinsSaldo() : 0;
                if (s < PRECO_EXTRA || !window.beatcoinsTirar || window.beatcoinsTirar(PRECO_EXTRA) < PRECO_EXTRA) return;
            }
            st.spins[hoje()] = (st.spins[hoje()] || 0) + 1;
            Object.keys(st.spins).sort().slice(0, -15).forEach(k => delete st.spins[k]);
            save();
            girando = true; destaque = -1; info();
            ctx();
            const i = sortear(), n = FATIAS.length, fat = Math.PI * 2 / n;
            // a fatia i fica embaixo do ponteiro (topo) quando ang = -i*fat (mod 2π)
            const alvo = -i * fat + (Math.random() - 0.5) * fat * 0.7;
            const voltas = 6 + Math.floor(Math.random() * 3);
            const a0 = ang;
            const fim = a0 - (Math.PI * 2 * voltas + (((a0 - alvo) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
            const dur = 4800, t0 = performance.now();
            let ultimo = Math.floor(a0 / fat);
            const res = ov.querySelector('#hw-res'); res.className = 'res'; res.innerHTML = '<span class="big">🌀 Girando…</span>As abóboras estão decidindo o seu destino.';
            ov.querySelector('#hw-row').innerHTML = '<button data-x disabled>Fechar</button>';
            const anima = (now) => {
                const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
                ang = a0 + (fim - a0) * e;
                const s = Math.floor(ang / fat); if (s !== ultimo) { ultimo = s; tique(); }
                desenharRoda(cv, ang, -1);
                if (p < 1) { requestAnimationFrame(anima); return; }
                girando = false; destaque = i;
                const f = FATIAS[i], r = aplicar(f); save();
                somFim(r.bom);
                res.className = 'res ' + (r.bom ? 'bom' : 'mau');
                res.innerHTML = `<span class="big">${r.titulo}</span>${r.texto}`;
                const row = ov.querySelector('#hw-row');
                row.innerHTML = (r.acao === 'abobora' ? '<button class="pri" data-usar>🎃 Usar a Nota Abóbora</button>' : r.acao ? '<button class="pri" data-ver>Ver no Personalizar</button>' : '') + '<button data-x>Fechar</button>';
                row.querySelector('[data-x]').onclick = fechar;
                const u = row.querySelector('[data-usar]');
                if (u) u.onclick = () => { const sel = document.getElementById('main-note-shape'); if (sel && [...sel.options].some(o => o.value === 'sk_abobora')) { sel.value = 'sk_abobora'; sel.dispatchEvent(new Event('change', { bubbles: true })); } u.disabled = true; u.textContent = '✔ Em uso!'; };
                const v = row.querySelector('[data-ver]');
                if (v) v.onclick = () => { fechar(); window.openColecao && window.openColecao(r.acao === 'nota' ? 'nota' : r.acao === 'gear' ? 'gear' : r.acao); };
                info(); atualizarHub();
                const iris = document.querySelector('#hw-ov .bm-ch-say');
                if (iris) iris.innerHTML = '<span class="nm">BEATJUICY</span>' + (r.bom ? fala('hw-bom', ['Hehehe… a sorte sorriu pra você. Por enquanto. 🎃', 'Doce! Aproveita antes que eu mude de ideia. 👻', 'Tsc… dessa vez você escapou.']) : fala('hw-mau', ['HAHAHA! Travessura! Eu avisei que era macabra… 😈', 'BOO! Gostou? Quer girar de novo? Hehehe…', 'Ops… acho que a batida ficou assombrada. 👻']));
            };
            requestAnimationFrame(anima);
        };
        if (typeof window.beatmaxPersonagem === 'function') window.beatmaxPersonagem(ov, window.beatmaxTemPersonagem && window.beatmaxTemPersonagem('juicy') ? 'juicy' : 'iris', (hw ? fala('hw-oi', ['Hehehe… eu sou o <b>Beatjuicy</b>, o fantasma da batida. Bem-vindo à minha <b>Roleta Macabra</b>! 🎃', 'Gira aí… tem presente da Loja. E umas surpresinhas assustadoras. 👻', 'Dizem que a <b>Nota Abóbora</b> só aparece pra quem tem coragem. Você tem? 🎃', 'Doce… ou travessura? Hehehe…', 'Psiu… a minha <b>torcida 8-bit</b> só sai aqui durante o Halloween. 🧟']) : fala('bj-oi', ['Eae! O Halloween passou, mas eu continuo por aqui. Gira aí, hoje é só prêmio. 👻', 'Um giro grátis por dia, sem travessura… prometo. Hehehe.', 'Voltei pra assombrar a sua sorte. Bora girar?'])), '1000px');
    }
    window.bmRoletaAbrir = abrir;
    window.bmHalloweenBanner = () => ativo() ? `<div class="hw-banner"><span class="e">🎃</span><div><b>ROLETA MACABRA</b><span>${gratisHoje() ? 'Seu giro grátis de hoje está esperando!' : `Giro extra por ${PRECO_EXTRA} Beatcoins`} · item da Loja, Beatcoins, a Nota Abóbora, a torcida do Beatjuicy… ou uma travessura.</span></div><button data-hw>GIRAR</button></div>`
        : `<div class="hw-banner nrm"><span class="e">👻</span><div><b>ROLETA DO BEATJUICY</b><span>${gratisHoje() ? 'Seu giro grátis de hoje está esperando!' : `Giro extra por ${PRECO_EXTRA} Beatcoins`} · item da Loja, EXP ou Beatcoins.</span></div><button data-hw>GIRAR</button></div>`;
    window.bmRoletaAtiva = () => true;

    // ---------- botão no menu inicial ----------
    function atualizarHub() {
        const hub = document.getElementById('bm-hub'); if (!hub) return;
        let b = hub.querySelector('.hw-btn');
        if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'hw-btn'; b.addEventListener('click', (e) => { e.stopPropagation(); abrir(); }); hub.appendChild(b); }
        const hw = ativo();
        b.classList.toggle('nrm', !hw);
        // fora do evento só aparece quando tem giro grátis (não fica poluindo o menu)
        b.style.display = hw || gratisHoje() ? '' : 'none';
        b.innerHTML = `<i>${hw ? '🎃' : '👻'}</i><span>${hw ? 'ROLETA MACABRA' : 'ROLETA DO JUICY'}<small>${gratisHoje() ? 'giro grátis hoje! (H)' : 'doce ou travessura? (H)'}</small></span>${gratisHoje() ? '<span class="dt"></span>' : ''}`;
    }
    setInterval(atualizarHub, 4000);
    setTimeout(atualizarHub, 1200);

    // ---------- maldições durante a partida (só visual) ----------
    const M = { cv: null, g: null, last: 0, t0: 0, bats: [], tagAt: 0, run: false };
    // fantasma e teia: desenhados uma vez (com brilho) e depois só carimbados — antes o brilho
    // era recalculado a cada quadro e pesava
    const SPRH = {};
    function sprFantasma(s, t2) {
        const S = Math.round(s * 10) / 10, k = 'f|' + S + '|' + t2;
        if (SPRH[k]) return SPRH[k];
        const P = Math.ceil(S * 130), cv = document.createElement('canvas'); cv.width = P; cv.height = P;
        const g = cv.getContext('2d'); g.translate(P / 2, P * 0.45); g.scale(S, S);
        g.shadowColor = '#c4b5fd'; g.shadowBlur = 24; g.fillStyle = 'rgba(245,243,255,.92)';
        g.beginPath(); g.arc(0, -10, 34, Math.PI, 0); g.lineTo(34, 34);
        for (let i = 0; i < 4; i++) { const x0 = 34 - i * 17; g.quadraticCurveTo(x0 - 4, 44 + (t2 ? 6 : -6) * (i % 2 ? 1 : -1), x0 - 8.5, 34); g.quadraticCurveTo(x0 - 13, 24, x0 - 17, 34); }
        g.closePath(); g.fill(); g.shadowBlur = 0;
        g.fillStyle = '#1e0b36'; g.beginPath(); g.ellipse(-12, -12, 6, 9, 0, 0, Math.PI * 2); g.ellipse(12, -12, 6, 9, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(0, 10, 8, t2 ? 12 : 9, 0, 0, Math.PI * 2); g.fill();
        return (SPRH[k] = cv);
    }
    function desenharFantasma(g, x, y, s, a, t) {
        const im = sprFantasma(s, Math.floor(t / 300) % 2);
        g.globalAlpha = a; g.drawImage(im, x - im.width / 2, y - im.height * 0.45); g.globalAlpha = 1;
    }
    function desenharMorcego(g, x, y, s, t, dir) {
        g.save(); g.translate(x, y); g.scale(s * dir, s);
        const f = Math.sin(t / 60) * 0.8;
        g.fillStyle = '#0b0614'; g.strokeStyle = '#7e22ce'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0, 0);
        g.quadraticCurveTo(-14, -14 * f - 6, -30, -4 * f); g.quadraticCurveTo(-22, 2, -18, 8); g.quadraticCurveTo(-10, 4, 0, 6);
        g.quadraticCurveTo(10, 4, 18, 8); g.quadraticCurveTo(22, 2, 30, -4 * f); g.quadraticCurveTo(14, -14 * f - 6, 0, 0);
        g.fill(); g.stroke();
        g.fillStyle = '#fde047'; g.fillRect(-4, 0, 2, 2); g.fillRect(2, 0, 2, 2);
        g.restore();
    }
    function teiaSpr(r) {
        const R = Math.round(r), k = 't|' + R;
        if (SPRH[k]) return SPRH[k];
        const cv = document.createElement('canvas'); cv.width = R + 4; cv.height = R + 4;
        const g = cv.getContext('2d');
        g.strokeStyle = 'rgba(226,232,240,.5)'; g.lineWidth = 1.2;
        for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke(); }
        for (let kk = 1; kk <= 5; kk++) {
            const rr = R * kk / 5.5; g.beginPath();
            for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2, px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (!i) g.moveTo(px, py); else { const am = (i - 0.5) / 6 * Math.PI / 2; g.quadraticCurveTo(Math.cos(am) * rr * 0.86, Math.sin(am) * rr * 0.86, px, py); } }
            g.stroke();
        }
        return (SPRH[k] = cv);
    }
    function desenharTeia(g, x, y, r, flipX, flipY) {
        const im = teiaSpr(r);
        g.save(); g.translate(x, y); g.scale(flipX, flipY); g.drawImage(im, 0, 0); g.restore();
    }
    function frame(ts) {
        requestAnimationFrame(frame);
        const playing = typeof isPlaying !== 'undefined' && isPlaying;
        const c = st.curse && st.curse.runs > 0 ? st.curse : null;
        const teste = typeof window.bmTestandoVisual === 'function' && window.bmTestandoVisual();
        if (!playing || !c || teste) { if (M.cv) M.cv.style.display = 'none'; if (M.run) { M.run = false; document.getElementById('hw-tag')?.remove(); } return; }
        const box = document.getElementById('game-container'); if (!box) return;
        if (!M.cv) { M.cv = document.createElement('canvas'); M.cv.id = 'hw-layer'; M.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4'; box.appendChild(M.cv); }
        if (!M.run) {
            M.run = true; M.t0 = ts; M.bats = [];
            const tag = document.createElement('div'); tag.id = 'hw-tag';
            tag.textContent = `🎃 Maldição: ${MALDICAO[c.tipo] || c.tipo} · ${c.runs === 1 ? 'última partida' : `faltam ${c.runs} partidas`}`;
            document.body.appendChild(tag); setTimeout(() => { tag.style.opacity = '0'; setTimeout(() => tag.remove(), 700); }, 4000);
        }
        const cv = M.cv; cv.style.display = '';
        const rc = typeof gearRectsCached === 'function' ? gearRectsCached(ts) : null;
        const br = rc ? rc.box : box.getBoundingClientRect();
        const gc = document.getElementById('gameCanvas');
        const gr = rc ? rc.gear : gc && gc.getBoundingClientRect();
        if (!gr) return;
        const w = Math.round(br.width), h = Math.round(br.height);
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
        const g = M.g || (M.g = cv.getContext('2d'));
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
        const gx = gr.left - br.left, gy = gr.top - br.top, gw = gr.width, gh = gr.height, t = ts - M.t0;
        const sc = Math.max(0.6, gh / 1000);
        if (c.tipo === 'fantasma') {
            // passeia em volta da gear e de vez em quando atravessa por cima (bem transparente)
            const per = 14000, p = (t % per) / per, a = p * Math.PI * 2;
            const x = gx + gw / 2 + Math.cos(a) * (gw / 2 + 110 * sc), y = gy + gh * 0.42 + Math.sin(a * 2) * gh * 0.28;
            const sobre = Math.abs(Math.cos(a)) < 0.35;
            desenharFantasma(g, x, y, 1.3 * sc, sobre ? 0.28 : 0.85, ts);
        } else if (c.tipo === 'morcegos') {
            if (M.bats.length < 6 && Math.random() < 0.02) {
                const dir = Math.random() < 0.5 ? 1 : -1;
                M.bats.push({ x: dir > 0 ? -40 : w + 40, y: Math.random() * h * 0.7 + 30, vx: dir * (120 + Math.random() * 140), dir, s: (1.6 + Math.random() * 1.2) * sc, ph: Math.random() * 6 });
            }
            const dt = M.last ? Math.min(0.05, (ts - M.last) / 1000) : 0.016;
            M.bats = M.bats.filter(b => {
                b.x += b.vx * dt; b.y += Math.sin(ts / 300 + b.ph) * 40 * dt;
                const naGear = b.x > gx && b.x < gx + gw;
                g.globalAlpha = naGear ? 0.35 : 0.95;
                desenharMorcego(g, b.x, b.y, b.s, ts + b.ph * 100, b.dir);
                g.globalAlpha = 1;
                return b.x > -60 && b.x < w + 60;
            });
        } else if (c.tipo === 'teia') {
            const r = Math.min(gw * 0.32, 170 * sc);
            desenharTeia(g, gx, gy, r, 1, 1); desenharTeia(g, gx + gw, gy, r, -1, 1);
            desenharTeia(g, gx, gy + gh, r * 0.45, 1, -1); desenharTeia(g, gx + gw, gy + gh, r * 0.45, -1, -1);
            // aranha descendo no cantinho
            const ay = gy + 30 + (Math.sin(ts / 1400) * 0.5 + 0.5) * r * 0.9, ax = gx + gw - r * 0.35;
            g.strokeStyle = 'rgba(226,232,240,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ax, gy); g.lineTo(ax, ay); g.stroke();
            g.fillStyle = '#0b0614'; g.beginPath(); g.arc(ax, ay + 8 * sc, 9 * sc, 0, Math.PI * 2); g.fill();
            g.strokeStyle = '#0b0614'; g.lineWidth = 2;
            for (let i = 0; i < 4; i++) { const yy = ay + (4 + i * 3) * sc; g.beginPath(); g.moveTo(ax - 18 * sc, yy - 4 + i * 2); g.lineTo(ax, yy); g.lineTo(ax + 18 * sc, yy - 4 + i * 2); g.stroke(); }
            g.fillStyle = '#ef4444'; g.fillRect(ax - 4 * sc, ay + 5 * sc, 2.5, 2.5); g.fillRect(ax + 2 * sc, ay + 5 * sc, 2.5, 2.5);
        }
        M.last = ts;
    }
    requestAnimationFrame(frame);
    // cada partida que termina gasta uma da maldição
    if (typeof window.afterRunFinished === 'function') {
        const o = window.afterRunFinished;
        window.afterRunFinished = function () {
            const r = o.apply(this, arguments);
            try {
                const teste = typeof window.bmTestandoVisual === 'function' && window.bmTestandoVisual();
                if (!teste && st.curse && st.curse.runs > 0) { st.curse.runs--; if (st.curse.runs <= 0) st.curse = null; save(); }
            } catch (e) {}
            return r;
        };
    }
})();

// =====================================================================================
// fim-estilos.js — ESTILOS DE FIM DE MÚSICA (MAX COMBO / PERFECT PLAY) com a cara do BEATMAX.
//
//   arcade   → o padrão (raio, letreiro, estrela e coroa) — fica em temas.js
//   neon     → Neon BEATMAX (grátis, presente): neon ciano/rosa, falha digital, equalizador, carimbo
//   cutin    → Cut-in da Turma: faixa diagonal + a personagem da sua gear/torcida entrando
//   jackpot  → Jackpot de Beatcoins: caça-níquel MAX · COMBO · 🪙 e chuva de moedas
//   pixel    → Fanfarra 8-bit: letreiro pixelado, fogos de pixel, turma 8-bit e caixinha de RPG
//   disco    → Disco de Ouro: vinil com scratch que vira um quadro de disco de ouro (platina no PERFECT)
//
// window.bmFimMontar(el, estilo, estado, nome, W, H, fy, {mudo, combo}) monta a animação dentro de
// `el` (já posicionado em cima da gear, W×H, fy = altura da linha de julgamento 0..1). Tudo em CSS
// (transform/opacity) + sons sintetizados no Web Audio. Dura ~4,3 s.
// Compra na Loja (desafio.js, chave fimfx_<id>) e escolha no Personalizar (colecao.js, parte FIM DE MÚSICA).
// =====================================================================================
(function () {
    const FINS = [
        { id: 'arcade', name: 'Arcade', price: 0, padrao: true, desc: 'O padrão: raio, letreiro gigante e o selo com estrela e coroa.' },
        { id: 'neon', name: 'Neon BEATMAX', price: 0, presente: true, desc: 'Presente! Tubos de neon ciano e rosa, falha digital, equalizador explodindo da linha e o carimbo ✓ BEATMAX.' },
        { id: 'cutin', name: 'Cut-in da Turma', price: 180, desc: 'Uma faixa corta a gear e a personagem da sua gear/torcida entra comemorando, como golpe especial.' },
        { id: 'jackpot', name: 'Jackpot de Beatcoins', price: 150, desc: 'Uma caça-níquel para em MAX · COMBO · moeda e chove Beatcoin.' },
        { id: 'pixel', name: 'Fanfarra 8-bit', price: 120, desc: 'Letreiro pixelado, fogos de pixel, a turma 8-bit dançando e a caixinha de RPG com o placar.' },
        { id: 'disco', name: 'Disco de Ouro', price: 200, desc: 'Vinil com scratch que vira um quadro de disco de ouro (de platina no PERFECT PLAY).' }
    ];
    window.BM_FINS = FINS;
    window.BM_FIM_QUEM = [['auto', 'Automático (gear/torcida)'], ['aleatoria', 'Aleatório'], ['arya', 'Arya'], ['iris', 'Iris'], ['echo', 'Echo'], ['jade', 'Jade'], ['juicy', 'Beatjuicy'], ['garnet', 'Garnet']];
    const esc = (t) => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const R = (a, b) => a + Math.random() * (b - a);

    // ---------------- estilo ----------------
    const css = document.createElement('style');
    css.textContent = `
.bmf{overflow:hidden!important}
.bmf *{box-sizing:border-box}
.bmf.parado,.bmf.parado *{animation-delay:-3.3s!important;animation-play-state:paused!important}
.bmf .a{position:absolute}
.bmf .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 2px,transparent 2px 4px);pointer-events:none;z-index:9}
.bmf .flash{position:absolute;inset:0;background:#fff;opacity:0;animation:bmfFlash .35s ease-out}
@keyframes bmfFlash{0%{opacity:.8}100%{opacity:0}}
@keyframes bmfIn{from{opacity:0}to{opacity:1}}
@keyframes bmfOut{to{opacity:0}}
@keyframes bmfShake{0%,100%{transform:none}20%{transform:translate(-4px,3px)}40%{transform:translate(5px,-2px)}60%{transform:translate(-3px,-3px)}80%{transform:translate(3px,2px)}}
/* ---- NEON ---- */
.bmf.neon .bg{position:absolute;inset:0;opacity:0;animation:bmfIn .4s forwards}
.bmf.neon .eq{position:absolute;left:6%;right:6%;display:flex;gap:4%;align-items:flex-end;opacity:1;animation:bmfOut .4s 1.6s forwards}
.bmf.neon .eq i{flex:1;border-radius:3px 3px 0 0;transform-origin:50% 100%;transform:scaleY(0);animation:bmfEq .5s cubic-bezier(.2,1.6,.4,1) forwards}
@keyframes bmfEq{0%{transform:scaleY(0)}60%{transform:scaleY(1.1)}80%{transform:scaleY(.75)}100%{transform:scaleY(var(--h))}}
.bmf.neon .hex{position:absolute;left:50%;transform:translate(-50%,-50%) scale(.2) rotate(-60deg);opacity:0;animation:bmfHex .6s .25s cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes bmfHex{60%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}}
.bmf.neon .t{position:absolute;left:-10%;right:-10%;text-align:center;font-family:Orbitron,sans-serif;font-weight:900;line-height:1.02;white-space:nowrap}
.bmf.neon .t.o{color:transparent;animation:bmfNeon 1s .1s steps(1) forwards;opacity:0}
@keyframes bmfNeon{0%{opacity:1}8%{opacity:0}14%{opacity:1}22%{opacity:.2}28%{opacity:1}50%{opacity:1}100%{opacity:0}}
.bmf.neon .t.f{opacity:0;animation:bmfIn .25s .65s forwards}
.bmf.neon .t.g{opacity:0;mix-blend-mode:screen;animation:bmfGlitch .5s .2s steps(5) 1,bmfGlitch .35s 1.55s steps(4) 1}
@keyframes bmfGlitch{0%{opacity:.9;transform:translate(-6%,0);clip-path:inset(10% 0 70% 0)}25%{transform:translate(5%,0);clip-path:inset(55% 0 20% 0)}50%{transform:translate(-3%,0);clip-path:inset(30% 0 45% 0)}75%{transform:translate(7%,0);clip-path:inset(75% 0 5% 0)}100%{opacity:0;transform:none}}
.bmf.neon .bar{position:absolute;left:0;right:0;height:5%;opacity:0;animation:bmfBar .3s 1.55s steps(3) 1}
@keyframes bmfBar{0%{opacity:.6;transform:translateX(-30%)}100%{opacity:0;transform:translateX(30%)}}
.bmf.neon .stamp{position:absolute;left:50%;padding:.25em .7em;border-radius:.3em;font-family:Orbitron,sans-serif;font-weight:900;letter-spacing:.12em;white-space:nowrap;
  transform:translate(-50%,-50%) rotate(-6deg) scale(3);opacity:0;animation:bmfStamp .22s 1.9s cubic-bezier(.5,0,.8,.4) forwards}
@keyframes bmfStamp{to{opacity:1;transform:translate(-50%,-50%) rotate(-6deg) scale(1)}}
.bmf.neon .cmb{position:absolute;left:0;right:0;text-align:center;font-family:Orbitron,sans-serif;font-weight:800;opacity:0;animation:bmfIn .4s 2.2s forwards}
.bmf.neon .tremer{position:absolute;inset:0;animation:bmfShake .3s 1.92s}
/* ---- CUT-IN ---- */
.bmf.cutin .band{position:absolute;left:-40%;right:-40%;transform:rotate(-14deg) translateX(-130%);animation:bmfBand .28s cubic-bezier(.2,1,.3,1) forwards}
@keyframes bmfBand{to{transform:rotate(-14deg) translateX(0)}}
.bmf.cutin .band .luz{position:absolute;inset:0;background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.7) 50%,transparent 70%);transform:translateX(-100%);animation:bmfLuz .5s .25s ease-in forwards}
@keyframes bmfLuz{to{transform:translateX(100%)}}
.bmf.cutin .janela{position:absolute;left:-15%;right:-15%;overflow:hidden;transform:rotate(-14deg)}
.bmf.cutin .janela img{position:absolute;transform:rotate(14deg) translateX(80%);opacity:0;animation:bmfCut 1.25s .3s cubic-bezier(.2,1,.3,1) forwards}
@keyframes bmfCut{0%{opacity:1;transform:rotate(14deg) translateX(80%)}22%{transform:rotate(14deg) translateX(0)}80%{opacity:1;transform:rotate(14deg) translateX(-4%)}100%{opacity:0;transform:rotate(14deg) translateX(-120%)}}
.bmf.cutin .fala{position:absolute;padding:.35em .6em;border-radius:.6em;background:#fff;font-family:Orbitron,sans-serif;font-weight:900;line-height:1;white-space:nowrap;transform:rotate(-8deg) scale(0);animation:bmfFala .3s .55s cubic-bezier(.2,1.8,.4,1) forwards,bmfOut .2s 1.45s forwards}
@keyframes bmfFala{to{transform:rotate(-8deg) scale(1)}}
.bmf.cutin .txt{position:absolute;left:-20%;right:-20%;text-align:center;font-family:Rajdhani,sans-serif;font-weight:700;color:#fff;white-space:nowrap;transform:rotate(-14deg) skewX(-8deg) scale(2.2);opacity:0;animation:bmfCutT .35s 1.55s cubic-bezier(.2,1.5,.35,1) forwards}
@keyframes bmfCutT{to{opacity:1;transform:rotate(-14deg) skewX(-8deg) scale(1)}}
.bmf.cutin .px{position:absolute;left:50%;image-rendering:pixelated;transform:translate(-50%,0);opacity:0;animation:bmfIn .2s 1.7s forwards,bmfPula .5s 1.7s steps(2) infinite}
@keyframes bmfPula{0%{margin-bottom:0}50%{margin-bottom:6%}}
.bmf.cutin .esc{position:absolute;inset:0;opacity:0;animation:bmfIn .4s 1.5s forwards}
/* ---- JACKPOT ---- */
.bmf.jackpot .maq{position:absolute;left:7%;right:7%;border-radius:.5em;transform:translateY(-160%);animation:bmfMaq .45s cubic-bezier(.3,1.5,.5,1) forwards,bmfMaqSai .35s 2.15s ease-in forwards}
@keyframes bmfMaq{to{transform:none}}
@keyframes bmfMaqSai{to{transform:translateY(-30%) scale(.6);opacity:0}}
.bmf.jackpot .luzes{position:absolute;inset:-.35em;border-radius:.7em;border:.28em dotted #fde047;animation:bmfPiscaL .3s steps(2) infinite}
@keyframes bmfPiscaL{50%{border-color:#ef4444}}
.bmf.jackpot .rolos{position:absolute;inset:12% 5%;display:flex;gap:4%}
.bmf.jackpot .rolo{flex:1;background:#fff;border-radius:.25em;overflow:hidden;position:relative;box-shadow:inset 0 .4em .4em rgba(0,0,0,.35),inset 0 -.4em .4em rgba(0,0,0,.35)}
.bmf.jackpot .fita{position:absolute;left:0;right:0;top:0;animation:bmfGira var(--d) .25s cubic-bezier(.12,.75,.2,1) forwards}
@keyframes bmfGira{0%{transform:translateY(0);filter:blur(2px)}85%{filter:blur(1px)}100%{transform:translateY(var(--y));filter:none}}
.bmf.jackpot .fita div{display:flex;align-items:center;justify-content:center;font-family:Orbitron,sans-serif;font-weight:900;color:#dc2626}
.bmf.jackpot .fita img{width:62%}
.bmf.jackpot .jp{position:absolute;left:0;right:0;text-align:center;font-family:Orbitron,sans-serif;font-weight:900;color:#fde047;text-shadow:0 0 .4em #f59e0b;animation:bmfPiscaJ .4s steps(2) 1.6s 4}
@keyframes bmfPiscaJ{50%{color:#fff;transform:scale(1.15)}}
.bmf.jackpot .moeda{position:absolute;top:-12%;opacity:0;animation:bmfMoeda var(--d) var(--t) linear forwards}
@keyframes bmfMoeda{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:1;transform:translateY(var(--y)) rotate(var(--r))}}
.bmf.jackpot .big{position:absolute;left:-10%;right:-10%;text-align:center;font-family:Orbitron,sans-serif;font-weight:900;line-height:1;transform:scale(0);animation:bmfBig .45s 2.3s cubic-bezier(.2,1.7,.4,1) forwards}
@keyframes bmfBig{to{transform:scale(1)}}
.bmf.jackpot .bg{position:absolute;inset:0;opacity:0;animation:bmfIn .5s 1.6s forwards}
/* ---- PIXEL ---- */
.bmf.pixel canvas{image-rendering:pixelated;position:absolute;left:50%}
.bmf.pixel .tit{transform:translate(-50%,-260%);animation:bmfCai .5s steps(5) forwards}
@keyframes bmfCai{to{transform:translate(-50%,0)}}
.bmf.pixel .tit.arco{animation:bmfCai .5s steps(5) forwards,bmfArco .6s steps(6) .5s infinite}
@keyframes bmfArco{to{filter:hue-rotate(360deg)}}
.bmf.pixel .fogo{position:absolute;width:1px;height:1px;opacity:0;animation:bmfFogo .7s var(--t) steps(4) forwards}
@keyframes bmfFogo{0%{opacity:1;transform:scale(.3)}75%{opacity:1}100%{opacity:0;transform:scale(1.2)}}
.bmf.pixel .turma{position:absolute;left:4%;right:4%;display:flex;justify-content:space-around;align-items:flex-end;transform:translateY(120%);animation:bmfSobe .4s .6s steps(4) forwards}
@keyframes bmfSobe{to{transform:none}}
.bmf.pixel .turma img{image-rendering:pixelated;animation:bmfPulo .4s steps(2) infinite}
.bmf.pixel .turma img:nth-child(2n){animation-delay:.2s}
@keyframes bmfPulo{50%{transform:translateY(-22%)}}
.bmf.pixel .caixa{position:absolute;left:9%;right:9%;padding:.6em .5em;background:#1e1b4b;border:.3em solid #fff;box-shadow:0 0 0 .3em #000,.4em .4em 0 .3em #000;font-family:'JetBrains Mono',monospace,monospace;font-weight:800;text-align:center;line-height:1.4;transform:scale(0);animation:bmfCx .3s 2s steps(3) forwards}
@keyframes bmfCx{to{transform:none}}
.bmf.pixel .caixa .seta{animation:bmfPisca .5s steps(2) infinite}
@keyframes bmfPisca{50%{opacity:0}}
/* ---- DISCO ---- */
.bmf.disco .luzes{position:absolute;inset:0;opacity:0;animation:bmfIn .6s .9s forwards}
.bmf.disco .luzes i{position:absolute;left:50%;bottom:-10%;width:30%;height:140%;transform-origin:50% 100%;background:linear-gradient(0deg,rgba(253,224,71,.35),transparent 80%);clip-path:polygon(45% 100%,55% 100%,100% 0,0 0);animation:bmfHolofote 2.4s ease-in-out infinite alternate}
@keyframes bmfHolofote{from{transform:translateX(-50%) rotate(-28deg)}to{transform:translateX(-50%) rotate(28deg)}}
.bmf.disco .vinil{position:absolute;left:50%;border-radius:50%;transform:translate(60%,-120%) scale(.6);animation:bmfVem .45s cubic-bezier(.2,1,.3,1) forwards,bmfVinilSai .4s 1.95s ease-in forwards}
@keyframes bmfVem{to{transform:translate(-50%,-50%) scale(1)}}
@keyframes bmfVinilSai{to{transform:translate(-50%,-50%) scale(.2);opacity:0}}
.bmf.disco .gira{position:absolute;inset:0;border-radius:50%;animation:bmfGiraV .45s linear 3,bmfScratch .55s .45s ease-in-out 1,bmfGiraV 1s 1s linear infinite}
@keyframes bmfGiraV{to{transform:rotate(360deg)}}
@keyframes bmfScratch{0%{transform:rotate(0)}20%{transform:rotate(-55deg)}40%{transform:rotate(20deg)}60%{transform:rotate(-45deg)}80%{transform:rotate(25deg)}100%{transform:rotate(0)}}
.bmf.disco .preto,.bmf.disco .ouro{position:absolute;inset:0;border-radius:50%}
.bmf.disco .ouro{opacity:0;animation:bmfIn .35s 1.05s forwards}
.bmf.disco .rot{position:absolute;left:50%;top:50%;width:42%;height:42%;transform:translate(-50%,-50%);border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Orbitron,sans-serif;font-weight:900;line-height:1}
.bmf.disco .wk{position:absolute;font-family:Rajdhani,sans-serif;font-weight:700;color:#fde047;transform:rotate(-12deg) scale(0);animation:bmfFala .25s .5s cubic-bezier(.2,1.8,.4,1) forwards,bmfOut .2s 1.05s forwards}
.bmf.disco .quadro{position:absolute;left:10%;right:10%;border:.45em solid #1c1917;background:#0c0a09;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5%;transform:scale(0) rotate(-6deg);animation:bmfQuadro .5s 2.15s cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes bmfQuadro{to{transform:none}}
.bmf.disco .quadro .d{border-radius:50%}
.bmf.disco .quadro .brilho{position:absolute;inset:0;overflow:hidden}
.bmf.disco .quadro .brilho:after{content:'';position:absolute;top:-20%;bottom:-20%;width:30%;left:-50%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:skewX(-20deg);animation:djShine .8s 2.8s ease-in-out forwards}
@keyframes djShine{to{left:130%}}`;
    document.head.appendChild(css);

    // ---------------- som ----------------
    let ctxS = null;
    function audioCtx() {
        const A0 = typeof audio !== 'undefined' ? audio : null;
        const c = (A0 && A0.ctx) || ctxS || (ctxS = new (window.AudioContext || window.webkitAudioContext)());
        if (c.state === 'suspended') c.resume();
        const vol = ((A0 && A0.volume != null) ? A0.volume : 0.7);
        const out = c.createGain(); out.gain.value = vol * 0.45; out.connect(c.destination);
        return { c, out, t: c.currentTime + 0.02 };
    }
    function kit(S) {
        const { c, out } = S;
        const env = (g, t0, a, pico, dur) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(pico, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); };
        const tom = (t0, f, dur, pico, tipo, f2) => { const o = c.createOscillator(), g = c.createGain(); o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur); env(g, t0, 0.005, pico, dur); o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + 0.05); };
        let nb = null;
        const ruido = (t0, dur, pico, tipo, f1, f2, q) => {
            if (!nb) { nb = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
            const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = nb; f.type = tipo || 'bandpass'; f.Q.value = q || 1;
            f.frequency.setValueAtTime(f1, t0); if (f2) f.frequency.exponentialRampToValueAtTime(f2, t0 + dur); env(g, t0, 0.005, pico, dur);
            s.connect(f); f.connect(g); g.connect(out); s.start(t0); s.stop(t0 + dur + 0.05);
        };
        const sino = (t0, f, pico, dur) => { tom(t0, f, dur || 1.2, pico || 0.12, 'triangle'); tom(t0, f * 2.01, (dur || 1.2) * 0.7, (pico || 0.12) * 0.3); };
        const bumbo = (t0, pico) => { tom(t0, 140, 0.5, pico || 0.9, 'sine', 40); ruido(t0, 0.25, 0.4, 'lowpass', 1500, 200); };
        return { env, tom, ruido, sino, bumbo };
    }
    const SONS = {
        neon(S, perf) {
            const k = kit(S), t = S.t;
            [261.6, 329.6, 392, 523.3].forEach(f => k.tom(t + 0.08, f, 0.9, 0.06, 'sawtooth'));
            for (let i = 0; i < 6; i++) k.tom(t + 0.2 + i * 0.05, R(400, 2400), 0.04, 0.06, 'square');
            k.ruido(t + 0.9, 1.0, 0.3, 'bandpass', 300, 5000, 1.5);
            for (let i = 0; i < 4; i++) k.tom(t + 1.55 + i * 0.05, R(300, 1800), 0.04, 0.05, 'square');
            k.bumbo(t + 1.9, 1); k.ruido(t + 1.9, 0.15, 0.5, 'highpass', 3000);
            (perf ? [1046.5, 1318.5, 1568, 2093] : [1318.5, 1568]).forEach((f, i) => k.sino(t + 2.0 + i * 0.07, f, 0.1, 1.3));
        },
        cutin(S, perf) {
            const k = kit(S), t = S.t;
            k.ruido(t, 0.3, 0.5, 'bandpass', 600, 4000, 1.2);
            k.bumbo(t + 0.28, 0.7);
            // "Ha!" (vozinha sintetizada: serra com filtro de vogal e altura caindo)
            { const o = S.c.createOscillator(), f = S.c.createBiquadFilter(), g = S.c.createGain(), t0 = t + 0.55; o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t0); o.frequency.exponentialRampToValueAtTime(330, t0 + 0.25); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 4; k.env(g, t0, 0.01, 0.35, 0.3); o.connect(f); f.connect(g); g.connect(S.out); o.start(t0); o.stop(t0 + 0.35); }
            k.ruido(t + 1.45, 0.15, 0.4, 'bandpass', 4000, 800, 1);
            k.bumbo(t + 1.55, 1); k.ruido(t + 1.55, 0.2, 0.5, 'highpass', 2500);
            (perf ? [523.3, 659.3, 784, 1046.5] : [523.3, 659.3, 784]).forEach(f => k.tom(t + 1.55, f, 1.2, 0.06, 'sawtooth'));
        },
        jackpot(S, perf) {
            const k = kit(S), t = S.t, paradas = [1.15, 1.45, 1.75].map(x => x - 0.5);
            for (let x = 0.25; x < paradas[2]; x += 0.055) k.tom(t + x, 1800, 0.02, 0.04, 'square');
            paradas.forEach((p, i) => k.sino(t + p, [1568, 1760, 2093][i], 0.14, 0.8));
            [1046.5, 1318.5, 1568, 2093, 2637].forEach((f, i) => k.tom(t + 1.6 + i * 0.07, f, 0.5, 0.09, 'square'));
            for (let i = 0; i < 26; i++) k.tom(t + 1.75 + R(0, 1.6), R(2600, 4200), 0.12, 0.04, 'sine');
            if (perf) [2093, 2637, 3136].forEach((f, i) => k.sino(t + 2.3 + i * 0.08, f, 0.08, 1.2));
        },
        pixel(S, perf) {
            const k = kit(S), t = S.t, q = (t0, f, d, v) => k.tom(t0, f, d, v || 0.07, 'square');
            // fanfarra de vitória (chiptune)
            const n = [[0, 523.3, 0.12], [0.13, 523.3, 0.12], [0.26, 523.3, 0.12], [0.39, 523.3, 0.35], [0.78, 415.3, 0.35], [1.17, 466.2, 0.35], [1.56, 523.3, 0.2], [1.82, 466.2, 0.12], [1.95, 523.3, 0.8]];
            n.forEach(([x, f, d]) => { q(t + x, f, d); q(t + x, f / 2, d, 0.04); });
            [0.3, 0.7, 1.1].forEach(x => k.tom(t + x, 1800, 0.3, 0.05, 'square', 300));
            for (let i = 0; i < 14; i++) q(t + 2.05 + i * 0.045, 1200 + (i % 3) * 200, 0.02, 0.03);
            if (perf) [1046.5, 1318.5, 1568, 2093].forEach((f, i) => q(t + 2.8 + i * 0.08, f, 0.25, 0.06));
        },
        disco(S, perf) {
            const k = kit(S), t = S.t;
            k.ruido(t, 0.5, 0.18, 'lowpass', 400, 900);
            // scratch: ruído com o filtro indo e voltando
            [0.5, 0.62, 0.74, 0.86].forEach((x, i) => k.ruido(t + x, 0.11, 0.55, 'bandpass', i % 2 ? 2600 : 500, i % 2 ? 500 : 2600, 3));
            k.tom(t + 1.0, 900, 0.35, 0.15, 'sawtooth', 120);
            k.sino(t + 1.05, 1318.5, 0.08, 1);
            // gongo dourado
            [110, 220.5, 331, 443].forEach((f, i) => k.tom(t + 2.15, f, 2.2 - i * 0.3, [0.4, 0.15, 0.08, 0.05][i], 'sine'));
            (perf ? [1568, 2093, 2637, 3136] : [1568, 2093]).forEach((f, i) => k.sino(t + 2.2 + i * 0.06, f, 0.08, 1.4));
        }
    };

    // ---------------- montagem ----------------
    function palavras(nome) { const [a, ...b] = String(nome).split(' '); return [a, b.join(' ')]; }
    const TURMA = { arya: { cor: '#22d3ee', cor2: '#0891b2', img: 'assets/arya-oi.webp', px: 'assets/px-arya.webp', fala: 'MANDOU BEM!!' },
        iris: { cor: '#f472b6', cor2: '#db2777', img: 'assets/iris.webp', px: 'assets/px-iris.webp', fala: 'PERFEITO! ♥' },
        echo: { cor: '#a78bfa', cor2: '#7c3aed', img: 'assets/echo.webp', px: 'assets/px-echo.webp', fala: '100% CONFIRMADO' },
        jade: { cor: '#4ade80', cor2: '#16a34a', img: 'assets/jade.webp', px: 'assets/px-jade.webp', fala: 'ARRASOU!' },
        juicy: { cor: '#84cc16', cor2: '#7e22ce', img: 'assets/juicy.webp', px: 'assets/px-juicy.webp', fala: 'HEHEHE… NADA MAL!' },
        garnet: { cor: '#a855f7', cor2: '#0e7490', img: 'assets/garnet.webp', px: 'assets/px-garnet.webp', fala: 'MISSÃO CUMPRIDA!', semNatal: true } };
    function quem() {
        // escolha do Personalizar (FIM DE MÚSICA › Cut-in): auto | aleatoria | arya | iris | echo | jade | juicy
        const q = typeof window.bmFimQuem === 'function' ? window.bmFimQuem() : 'auto';
        if (TURMA[q]) return q;
        if (q === 'aleatoria') { const l = Object.keys(TURMA); return l[(Math.random() * l.length) | 0]; }
        const g = typeof gearSkin === 'string' ? gearSkin : '';
        const m = g.match(/^shop_turma_(arya|iris|echo|jade|juicy|garnet)/); if (m) return m[1];
        try { const t = window.bmTorcida ? window.bmTorcida() : {}; const id = (t.L || t.R || '').replace('_natal', ''); if (TURMA[id]) return id; } catch (e) {}
        const l = Object.keys(TURMA); return l[(Math.random() * l.length) | 0];
    }
    function natalImg(who, src) { return !(TURMA[who] && TURMA[who].semNatal) && typeof window.bmNatalAtivo === 'function' && window.bmNatalAtivo() ? `assets/natal-${who}.webp` : src; }
    // texto em pixel de verdade: desenhado pequeno num canvas e ampliado sem suavizar
    function pixelTexto(linhas, cor, sombra, escala) {
        const cv = document.createElement('canvas'), g = cv.getContext('2d'), fs = 9;
        g.font = `bold ${fs}px monospace`;
        const w = Math.ceil(Math.max(...linhas.map(l => g.measureText(l).width))) + 4, h = linhas.length * (fs + 2) + 4;
        cv.width = w; cv.height = h;
        g.font = `bold ${fs}px monospace`; g.textBaseline = 'top'; g.textAlign = 'center';
        linhas.forEach((l, i) => { g.fillStyle = sombra; g.fillText(l, w / 2 + 1, 2 + i * (fs + 2) + 1); g.fillStyle = cor; g.fillText(l, w / 2, 2 + i * (fs + 2)); });
        // limiar: tira a suavização da fonte (fica pixel "duro")
        const im = g.getImageData(0, 0, w, h), d = im.data;
        for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
        g.putImageData(im, 0, 0);
        cv.style.width = (w * escala) + 'px'; cv.style.height = (h * escala) + 'px';
        return cv;
    }

    const MONTA = {
        neon(el, perf, l1, l2, W, H, yJ, combo) {
            const nL = Math.max(l1.length, l2.length), c1 = perf ? '#fde047' : '#22d3ee', c2 = '#ff2bd6', fs = Math.min(W * 0.2, 110, W * 0.92 / (nL * 0.86)), ty = H * 0.2;
            const txt = esc(l1) + (l2 ? '<br>' + esc(l2) : '');
            let h = `<div class="tremer"><div class="bg" style="background:radial-gradient(ellipse at 50% 35%,${perf ? 'rgba(250,204,21,.22)' : 'rgba(34,211,238,.2)'},rgba(30,27,75,.55) 55%,rgba(2,6,23,.4))"></div><div class="flash"></div>`;
            h += `<div class="eq" style="bottom:${H - yJ}px;height:${H * 0.42}px">${Array.from({ length: 9 }, (_, i) => `<i style="--h:${R(0.35, 1).toFixed(2)};background:linear-gradient(0deg,${c1},${c2});box-shadow:0 0 12px ${i % 2 ? c1 : c2};animation-delay:${(0.03 * i + R(0, 0.05)).toFixed(2)}s"></i>`).join('')}</div>`;
            const hx = Math.min(W * 0.78, H * 0.42), pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 6 + k * Math.PI / 3; return `${(50 + 48 * Math.cos(a)).toFixed(1)},${(50 + 48 * Math.sin(a)).toFixed(1)}`; }).join(' ');
            h += `<svg class="hex" viewBox="0 0 100 100" style="opacity:.75;top:${ty + fs}px;width:${hx}px;height:${hx}px;overflow:visible"><polygon points="${pts}" fill="none" stroke="${c1}" stroke-width="1.6" style="filter:drop-shadow(0 0 4px ${c1})"/><polygon points="${pts}" fill="none" stroke="${c2}" stroke-width=".8" transform="rotate(30 50 50) scale(.82) translate(11 11)" opacity=".8"/></svg>`;
            h += `<div class="t o" style="top:${ty}px;font-size:${fs}px;-webkit-text-stroke:2px ${c1};filter:drop-shadow(0 0 8px ${c1})">${txt}</div>`;
            h += `<div class="t f" style="top:${ty}px;font-size:${fs}px;color:#fff;text-shadow:0 0 6px #fff,0 0 18px ${c1},0 0 40px ${c1},0 0 70px ${c2}">${txt}</div>`;
            h += `<div class="t g" style="top:${ty}px;font-size:${fs}px;color:${c2}">${txt}</div><div class="t g" style="top:${ty}px;font-size:${fs}px;color:${c1};animation-delay:.26s,1.6s">${txt}</div>`;
            h += `<div class="bar" style="top:${ty + fs * 0.6}px;background:${c2}"></div><div class="bar" style="top:${ty + fs * 1.4}px;background:${c1};animation-delay:1.62s"></div>`;
            h += `<div class="stamp" style="top:${ty + fs * 2.45}px;font-size:${Math.max(13, fs * 0.36)}px;color:${c2};border:3px solid ${c2};box-shadow:0 0 18px ${c2},inset 0 0 12px ${c2};background:rgba(15,10,30,.65)">✓ BEATMAX</div>`;
            h += `<div class="cmb" style="top:${ty + fs * 3.05}px;font-size:${Math.max(12, fs * 0.3)}px;color:${perf ? '#fef08a' : '#a5f3fc'};text-shadow:0 0 10px ${c1}">${perf ? '★ 100.00% ★' : combo.toLocaleString('pt-BR') + ' COMBO'}</div>`;
            h += `<div class="scan"></div></div>`;
            el.innerHTML = h;
        },
        cutin(el, perf, l1, l2, W, H, yJ) {
            const who = quem(), T = TURMA[who], bh = H * 0.3, by = H * 0.24;
            const stripes = perf ? 'repeating-linear-gradient(90deg,#f472b6 0 34px,#a855f7 34px 68px,#22d3ee 68px 102px,#fde047 102px 136px)' : `repeating-linear-gradient(90deg,${T.cor} 0 34px,${T.cor2} 34px 68px)`;
            const fs = Math.min(W * 0.2, 100, W * 1.05 / (((l1 + ' ' + l2).trim().length) * 0.48));
            let h = `<div class="esc" style="background:linear-gradient(180deg,rgba(2,6,23,.15),${T.cor2}55)"></div>`;
            h += `<div class="band" style="top:${by}px;height:${bh}px;background:${stripes};box-shadow:0 0 30px ${T.cor}"><div class="luz"></div></div>`;
            h += `<div class="janela" style="top:${by}px;height:${bh}px"><img src="${natalImg(who, T.img)}" style="left:${W * 0.18}px;top:${-bh * 0.15}px;height:${bh * 2.1}px"></div>`;
            h += `<div class="fala" style="right:4%;top:${by - bh * 0.25}px;font-size:${Math.max(12, W * 0.06)}px;color:${T.cor2};box-shadow:0 .2em 0 ${T.cor2}">${esc(T.fala)}</div>`;
            h += `<div class="txt" style="top:${by + bh * 0.5 - fs * 0.55}px;font-size:${fs}px;text-shadow:0 0 18px ${T.cor},0 5px 0 ${T.cor2}">${esc(l1)} ${esc(l2)}</div>`;
            h += `<img class="px" src="${T.px}" style="bottom:${H - yJ}px;height:${H * 0.15}px">`;
            el.innerHTML = h;
        },
        jackpot(el, perf, l1, l2, W, H, yJ) {
            const mh = H * 0.24, my = H * 0.22, sym = mh * 0.76, reelW = W * 0.86 * 0.9 * 0.92 / 3;
            const finais = perf ? [l1, l2 || '★', '★'] : [l1, l2 || '🪙', '🪙'];
            const SIM = ['7', '★', '🪙', '♪', '7', '★', '🪙', '♪', '7', '★'];
            const coin = '<img src="assets/beatcoin.png" alt="">';
            const cel = (s) => `<div style="height:${sym}px;font-size:${Math.min(sym * 0.34, reelW * 1.25 / Math.max(1, s.length))}px">${s === '🪙' ? coin : esc(s)}</div>`;
            const rolo = (fim, i) => { const lista = SIM.concat(SIM).concat([fim]); return `<div class="rolo"><div class="fita" style="--d:${(0.9 + i * 0.3).toFixed(2)}s;--y:${-(lista.length - 1) * sym}px">${lista.map(cel).join('')}</div></div>`; };
            let h = `<div class="bg" style="background:radial-gradient(ellipse at 50% 30%,${perf ? 'rgba(236,72,153,.35)' : 'rgba(180,83,9,.45)'},transparent 70%)"></div>`;
            h += `<div class="jp" style="top:${my - mh * 0.42}px;font-size:${Math.max(13, W * 0.07)}px">★ JACKPOT ★</div>`;
            h += `<div class="maq" style="top:${my}px;height:${mh}px;font-size:${Math.max(10, W * 0.05)}px;background:linear-gradient(${perf ? '#831843,#3b0764' : '#7c2d12,#431407'});border:.22em solid #facc15;box-shadow:0 0 30px #f59e0b"><div class="luzes"></div>
                <div class="rolos">${finais.map(rolo).join('')}</div></div>`;
            for (let i = 0; i < 24; i++) { const s = W * R(0.08, 0.14); h += `<img class="moeda" src="assets/beatcoin.png" style="left:${R(-5, 95)}%;width:${s}px;--d:${R(1, 1.8).toFixed(2)}s;--t:${(1.7 + R(0, 1.3)).toFixed(2)}s;--y:${H * 1.3}px;--r:${R(-540, 540) | 0}deg">`; }
            const fs = Math.min(W * 0.19, 100, W * 0.95 / (Math.max(l1.length, l2.length) * 0.86));
            h += `<div class="big" style="top:${H * 0.24}px;font-size:${fs}px;color:${perf ? '#fff' : '#fde047'};text-shadow:0 0 18px ${perf ? '#ec4899' : '#f59e0b'},0 5px 0 ${perf ? '#831843' : '#78350f'}">${esc(l1)}${l2 ? '<br>' + esc(l2) : ''}</div>`;
            el.innerHTML = h;
        },
        pixel(el, perf, l1, l2, W, H, yJ, combo) {
            el.innerHTML = '';
            const esc1 = Math.max(2, Math.min(Math.floor(W * 0.11 / 9 * 2.2), Math.floor(W * 0.9 / (Math.max(l1.length, l2.length) * 5.6 + 4))));
            const tit = pixelTexto([l1, l2].filter(Boolean), perf ? '#fde047' : '#fde047', perf ? '#db2777' : '#b45309', esc1);
            tit.className = 'tit' + (perf ? ' arco' : ''); tit.style.top = (H * 0.18) + 'px';
            el.appendChild(tit);
            const CO = ['#f472b6', '#22d3ee', '#fde047', '#4ade80', '#fff'];
            for (let i = 0; i < 7; i++) {
                const f = document.createElement('i'), c = CO[i % CO.length], P = Math.max(4, Math.round(W * 0.018));
                f.className = 'fogo'; f.style.cssText = `left:${R(10, 90)}%;top:${R(6, 55)}%;width:${P}px;height:${P}px;background:${c};--t:${(0.25 + i * 0.28).toFixed(2)}s;box-shadow:${[[2, 0], [-2, 0], [0, 2], [0, -2], [1.5, 1.5], [-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [4, 0], [-4, 0], [0, 4], [0, -4]].map(([x, y], k) => `${x * P * 1.4}px ${y * P * 1.4}px ${k < 4 || k > 7 ? c : '#fff'}`).join(',')}`;
                el.appendChild(f);
            }
            const tm = document.createElement('div'); tm.className = 'turma'; tm.style.bottom = (H - yJ) + 'px';
            tm.innerHTML = ['arya', 'iris', 'jade', 'echo'].map(w => `<img src="assets/px-${w}.webp" style="height:${H * 0.13}px">`).join('');
            el.appendChild(tm);
            const cx = document.createElement('div'); cx.className = 'caixa';
            cx.style.cssText = `top:${H * 0.18 + tit.height * esc1 + H * 0.03}px;font-size:${Math.max(11, W * 0.055)}px;color:#fff`;
            cx.innerHTML = `<div style="color:#fde047;font-size:1.35em"></div><div></div><div style="color:#f472b6"></div>`;
            el.appendChild(cx);
            // máquina de escrever na caixinha
            const linhas = [`${l1} ${l2}`.trim(), perf ? '100.00% · ALL PERFECT' : `${combo} HITS`, perf ? '★ FLAWLESS! ★' : '▶ GAME CLEAR!'];
            if (el.classList.contains('parado')) { linhas.forEach((t, i) => { cx.children[i].textContent = t; }); return; }
            let li = 0, ci = 0;
            setTimeout(function esc2() {
                if (!cx.isConnected || li >= linhas.length) return;
                const d = cx.children[li]; ci++; d.textContent = linhas[li].slice(0, ci);
                if (ci >= linhas[li].length) { li++; ci = 0; }
                setTimeout(esc2, 40);
            }, 2300);
        },
        disco(el, perf, l1, l2, W, H, yJ, combo) {
            const D = Math.min(W * 0.85, H * 0.45), cy = H * 0.34;
            const ouro = perf ? 'repeating-radial-gradient(circle,#cbd5e1 0 2px,#f8fafc 2px 4px)' : 'repeating-radial-gradient(circle,#92400e 0 2px,#fbbf24 2px 4px)';
            const brilhoOuro = perf ? 'conic-gradient(from 0deg,rgba(244,114,182,.35),rgba(34,211,238,.35),rgba(253,224,71,.35),rgba(244,114,182,.35))' : 'conic-gradient(from 20deg,transparent 0 30deg,rgba(255,255,255,.35) 45deg,transparent 60deg,transparent 210deg,rgba(255,255,255,.3) 225deg,transparent 240deg)';
            let h = `<div class="luzes"><i></i><i style="animation-delay:-1.2s"></i></div>`;
            h += `<div class="vinil" style="top:${cy}px;width:${D}px;height:${D}px;box-shadow:0 10px 30px #000"><div class="gira">
                <div class="preto" style="background:repeating-radial-gradient(circle,#1c1917 0 2px,#292524 2px 4px)"></div>
                <div class="ouro" style="background:${ouro};box-shadow:0 0 40px ${perf ? '#e2e8f0' : '#f59e0b'}"></div>
                <div class="preto" style="background:${brilhoOuro};opacity:.9"></div>
                <div class="rot" style="background:radial-gradient(circle,#000 0 5%,${perf ? '#fff' : '#fff7c2'} 6%,${perf ? '#cbd5e1' : '#fde047'} 75%);font-size:${D * 0.065}px;color:${perf ? '#334155' : '#78350f'}">${esc(l1)}<br>${esc(l2)}</div></div></div>`;
            h += `<div class="wk" style="left:6%;top:${cy - D * 0.62}px;font-size:${Math.max(14, W * 0.09)}px">wikka-wikka!</div>`;
            const q = Math.min(W * 0.5, H * 0.24);
            h += `<div class="quadro" style="top:${H * 0.1}px;height:${H * 0.5}px;box-shadow:0 0 0 3px ${perf ? '#e2e8f0' : '#fde047'},0 0 34px ${perf ? '#cbd5e1' : '#f59e0b'}">
                <div class="d" style="width:${q}px;height:${q}px;background:${ouro};box-shadow:0 0 20px ${perf ? '#e2e8f0' : '#f59e0b'}"></div>
                <div style="font:900 ${Math.max(13, W * 0.075)}px Orbitron;color:${perf ? '#f8fafc' : '#fde047'};text-align:center;line-height:1">${esc(l1)} ${esc(l2)}</div>
                <div style="font:700 ${Math.max(9, W * 0.036)}px Orbitron;color:#d6d3d1;letter-spacing:.1em;text-align:center">${perf ? 'DISCO DE PLATINA' : 'DISCO DE OURO'} · BEATMAX</div>
                <div style="font:800 ${Math.max(10, W * 0.042)}px Orbitron;color:${perf ? '#f0abfc' : '#fbbf24'}">${perf ? '100.00%' : combo.toLocaleString('pt-BR') + ' COMBO'}</div>
                <div class="brilho"></div></div>`;
            el.innerHTML = h;
        }
    };

    window.bmFimMontar = function (el, estilo, estado, nome, W, H, fy, opts) {
        opts = opts || {};
        const f = MONTA[estilo]; if (!f) return false;
        const perf = estado === 'perfect';
        const [l1, l2] = palavras(nome);
        el.classList.add('bmf', estilo);
        el.style.height = H + 'px';
        const combo = opts.combo != null ? opts.combo : ((typeof stats !== 'undefined' && stats.maxCombo) || 0);
        f(el, perf, l1, l2, W, H, H * fy, combo);
        if (!opts.mudo && SONS[estilo]) { try { SONS[estilo](audioCtx(), perf); } catch (e) {} }
        return true;
    };

    // ---------- miniaturas na Loja ----------
    // Paradas (um "retrato" do fim da animação) e só animam com o mouse em cima. Antes as 5 rodavam
    // juntas e eram refeitas ao mesmo tempo a cada 5 s — a Loja chegava a travar 1–2 s.
    function miniatura(box, vivo) {
        const W = box.clientWidth, H = box.clientHeight; if (!W) return;
        box._n = (box._n || 0) + 1;
        const estado = vivo && box._n % 2 === 0 ? 'perfect' : 'full';
        const nome = window.bmFimNome ? window.bmFimNome(estado) : (estado === 'perfect' ? 'PERFECT PLAY' : 'MAX COMBO');
        box.innerHTML = '<div style="position:absolute;inset:0"></div>';
        const el = box.firstChild;
        if (!vivo) el.classList.add('parado');
        if (!window.bmFimMontar(el, box.dataset.fim, estado, nome, W, H, 0.84, { mudo: true, combo: 1284, parado: !vivo })) box.innerHTML = '';
    }
    setInterval(() => {
        const host = document.getElementById('bc-ov'); if (!host) return;
        host.querySelectorAll('[data-fim]').forEach(box => {
            if (box._ok) { if (box._vivo && performance.now() - box._t > 4800) { box._t = performance.now(); miniatura(box, true); } return; }
            box._ok = 1; miniatura(box, false);
            const card = box.closest('.item') || box;
            card.addEventListener('mouseenter', () => { box._vivo = 1; box._t = performance.now(); miniatura(box, true); });
            card.addEventListener('mouseleave', () => { box._vivo = 0; miniatura(box, false); });
        });
    }, 400);
})();

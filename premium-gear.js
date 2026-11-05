// =====================================================================================
// premium-gear.js — ITENS PREMIUM: animação ABAIXO DA LINHA DE JULGAMENTO.
//
//  ⭐ Teclado Gamer (600): a parte de baixo da gear vira um teclado mecânico RGB. As teclas
//    configuradas pra cada lane afundam e acendem na cor da nota; cada acerto espalha luz
//    pelas outras teclas; a cada 25 de combo uma tecla salta; FEVER deixa tudo dourado;
//    BREAK fica vermelho e treme. Telinha com combo/equalizador e uma faixa fina com
//    SPEED · score · modo no pé (o painel de baixo fica coberto).
//    Opções (Personalizar › ABAIXO DA LINHA): luz Reativa / Onda / Respiração ·
//    tema RGB / Iris / Jade / Echo · som de tecla mecânica (liga/desliga).
//
//  window.bmPremiumDesenhar(g, box, est, now, id, opts) desenha em qualquer canvas (jogo,
//  prévia do Personalizar, miniatura da Loja). Desenho fixo (teclado, letras) fica pronto
//  num canvas guardado; a cada quadro só entram as luzes e as teclas apertadas.
// =====================================================================================
(function () {
    const ITENS = [
        { id: 'teclado', name: 'Teclado Gamer', price: 250, desc: 'PREMIUM · Abaixo da linha: um teclado mecânico RGB que reage às suas teclas. Luz que se espalha a cada acerto, tecla que salta no combo, FEVER dourado e BREAK vermelho.' }
    ];
    window.BM_PREMIUM = ITENS;
    window.BM_PREMIUM_OPC = {
        luz: [['reativo', 'Reativa (espalha a cada acerto)'], ['onda', 'Onda colorida'], ['respira', 'Respiração (no ritmo)']],
        tema: [['rgb', 'RGB arco-íris'], ['iris', 'Iris (branco e rosa)'], ['jade', 'Jade (preto e verde)'], ['echo', 'Echo (roxo)']]
    };
    const TEMAS = {
        rgb: { corpo: '#0b0f1a', cap: '#1a2233', leg: '#94a3b8', luz: null },
        iris: { corpo: '#f1f5f9', cap: '#e2e8f0', leg: '#be185d', luz: ['#f472b6', '#c084fc'], borda: '#f9a8d4' },
        jade: { corpo: '#050505', cap: '#141414', leg: '#4ade80', luz: ['#4ade80', '#a3e635'], borda: '#22c55e' },
        echo: { corpo: '#17143a', cap: '#262152', leg: '#c4b5fd', luz: ['#a78bfa', '#60a5fa'], borda: '#8b5cf6' }
    };
    // fileiras do teclado (código da tecla, rótulo, largura em "unidades")
    const L1 = 'QWERTYUIOP'.split('').map(c => ['Key' + c, c, 1]);
    const L2 = 'ASDFGHJKL'.split('').map(c => ['Key' + c, c, 1]).concat([['Semicolon', ';', 1]]);
    const L3 = 'ZXCVBNM'.split('').map(c => ['Key' + c, c, 1]).concat([['Comma', ',', 1], ['Period', '.', 1], ['Slash', '/', 1]]);
    const L4 = [['ShiftLeft', 'SHIFT', 2.3], ['Space', '', 5.4], ['ShiftRight', 'SHIFT', 2.3]];
    const FILAS = [L1, L2, L3, L4];
    const OURO = '#fde047', VERM = '#ef4444';
    const HUE = Array.from({ length: 36 }, (_, i) => `hsl(${i * 10},95%,60%)`);   // cores do arco-íris prontas
    const hexRgb = (h) => { h = String(h || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
    const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
    function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }

    // ---------- geometria (em unidades da caixa) ----------
    function geometria(box) {
        const { w, h } = box;
        const corpo = { x0t: w * 0.11, x1t: w * 0.89, x0b: w * 0.03, x1b: w * 0.97, y0: h * 0.04, y1: h * 0.97 };
        const topoH = h * 0.15; // logo + telinha
        const yRows = corpo.y0 + topoH, hRows = corpo.y1 - h * 0.03 - yRows, rowH = hRows / 4;
        const teclas = [];
        FILAS.forEach((fila, ri) => {
            const k = 0.8 + ri * 0.065, cw = w * 0.84 * k, x0 = (w - cw) / 2;
            const tot = fila.reduce((s, f) => s + f[2], 0), u = cw / tot;
            let x = x0;
            fila.forEach(([code, rot, uw]) => { teclas.push({ code, rot, x: x + 2, y: yRows + ri * rowH + 2, w: uw * u - 4, h: rowH - 5, ri }); x += uw * u; });
        });
        const tela = { x: w * 0.52, y: corpo.y0 + topoH * 0.18, w: w * 0.3, h: topoH * 0.68 };
        return { corpo, teclas, tela, topoH, rowH };
    }
    // ---------- parte fixa (pronta uma vez por tamanho e tema) ----------
    const CACHE = new Map();
    function fixo(box, tema, esc, op) {
        op = op == null ? 1 : op;
        const k = `${Math.round(box.w)}x${Math.round(box.h)}|${tema}|${esc}|${op}`;
        let c = CACHE.get(k); if (c) return c;
        const G = geometria(box), T = TEMAS[tema] || TEMAS.rgb;
        const cv = document.createElement('canvas'); cv.width = Math.round(box.w * esc); cv.height = Math.round(box.h * esc);
        const g = cv.getContext('2d'); g.scale(esc, esc);
        const { corpo: C } = G;
        g.globalAlpha = op; g.fillStyle = T.corpo; g.beginPath(); g.moveTo(C.x0b, C.y1); g.lineTo(C.x1b, C.y1); g.lineTo(C.x1t, C.y0); g.lineTo(C.x0t, C.y0); g.closePath(); g.fill(); g.globalAlpha = 1;
        if (!T.semTopo) {
        // logo
        g.fillStyle = rgba(T.leg, 0.7); g.font = `900 ${G.topoH * 0.32}px Orbitron, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText('BEATMAX', C.x0t + box.w * 0.04, C.y0 + G.topoH * 0.52);
        // telinha (fundo)
        g.fillStyle = '#020617'; g.strokeStyle = rgba(T.leg, 0.4); g.lineWidth = 1.5; rr(g, G.tela.x, G.tela.y, G.tela.w, G.tela.h, 4); g.fill(); g.stroke();
        }
        // teclas
        G.teclas.forEach(t => {
            const gr = g.createLinearGradient(0, t.y, 0, t.y + t.h); gr.addColorStop(0, shade(T.cap, 0.12)); gr.addColorStop(1, shade(T.cap, -0.35));
            g.fillStyle = shade(T.cap, -0.5); rr(g, t.x, t.y + 3, t.w, t.h, 4); g.fill();
            g.fillStyle = gr; rr(g, t.x, t.y, t.w, t.h - 2, 4); g.fill();
            g.fillStyle = rgba('#ffffff', tema === 'iris' ? 0.5 : 0.07); rr(g, t.x + t.w * 0.12, t.y + 2, t.w * 0.76, t.h * 0.22, 3); g.fill();
            if (t.rot) { g.fillStyle = rgba(T.leg, 0.75); g.font = `800 ${Math.min(t.h * 0.42, t.w * (t.rot.length > 1 ? 0.2 : 0.45))}px Orbitron, sans-serif`; g.textAlign = 'center'; g.fillText(t.rot, t.x + t.w / 2, t.y + t.h * 0.5); }
        });
        c = { cv, G, esc };
        CACHE.set(k, c); if (CACHE.size > 8) CACHE.delete(CACHE.keys().next().value);
        return c;
    }
    function shade(hex, p) { const [r, g, b] = hexRgb(hex), f = (v) => Math.max(0, Math.min(255, Math.round(p >= 0 ? v + (255 - v) * p : v * (1 + p)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
    // brilho embaixo do teclado: forma borrada pronta (branca), tingida a cada quadro num canvas pequeno
    const GLOW = new Map();
    // Fica no tamanho final em pixels: carimbar 1:1 é ~5x mais barato que esticar um canvas pequeno.
    function glowBase(box, esc) {
        const k = `${Math.round(box.w)}x${Math.round(box.h)}|${esc}`;
        let c = GLOW.get(k); if (c) return c;
        const s = 0.25, mini = document.createElement('canvas'); mini.width = Math.ceil(box.w * s); mini.height = Math.ceil(box.h * s);
        const g = mini.getContext('2d'); g.scale(s, s); g.filter = 'blur(4px)'; g.fillStyle = '#fff';
        g.beginPath(); g.moveTo(box.w * 0.02, box.h * 0.99); g.lineTo(box.w * 0.98, box.h * 0.99); g.lineTo(box.w * 0.9, box.h * 0.02); g.lineTo(box.w * 0.1, box.h * 0.02); g.fill();
        const cv = document.createElement('canvas'); cv.width = Math.round(box.w * 1.04 * esc); cv.height = Math.round(box.h * esc);
        cv.getContext('2d').drawImage(mini, 0, 0, cv.width, cv.height);   // estica uma vez só
        const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height;
        c = { cv, t }; GLOW.set(k, c); if (GLOW.size > 6) GLOW.delete(GLOW.keys().next().value);
        return c;
    }
    // carimba um canvas pronto pixel a pixel (sem esticar) na posição (x, y) da caixa
    function blit(g, cv, x, y, w, h, exato) {
        if (!exato) { g.drawImage(cv, x, y, w, h); return; }
        const m = g.getTransform(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
        g.drawImage(cv, Math.round(m.a * x + m.c * y + m.e), Math.round(m.b * x + m.d * y + m.f)); g.restore();
    }

    // ---------- sprites prontos (texto em canvas é caro: desenha uma vez e só carimba) ----------
    const SPR = new Map();
    function spriteTecla(k, cor, on, esc) {
        const key = `${k.code}|${cor}|${on ? 1 : 0}|${Math.round(k.w)}x${Math.round(k.h)}|${esc}`;
        let c = SPR.get(key); if (c) return c;
        c = document.createElement('canvas'); c.width = Math.ceil((k.w + 12) * esc); c.height = Math.ceil((k.h + 12) * esc);
        const g = c.getContext('2d'); g.scale(esc, esc); g.translate(k.w / 2 + 6, k.h / 2 + 6);
        if (on) {
            g.globalAlpha = 0.35; g.fillStyle = cor; rr(g, -k.w / 2 - 4, -k.h / 2 - 4, k.w + 8, k.h + 6, 7); g.fill(); g.globalAlpha = 1;
            g.fillStyle = cor; rr(g, -k.w / 2, -k.h / 2, k.w, k.h - 2, 4); g.fill();
            g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, -k.w * 0.38, -k.h / 2 + 2, k.w * 0.76, k.h * 0.22, 3); g.fill();
            g.fillStyle = '#0f172a';
        } else {
            g.strokeStyle = cor; g.lineWidth = 2; rr(g, -k.w / 2 + 1, -k.h / 2 + 1, k.w - 2, k.h - 4, 4); g.stroke();
            g.fillStyle = cor;
        }
        if (k.rot) { g.font = `900 ${Math.min(k.h * 0.42, k.w * (k.rot.length > 1 ? 0.2 : 0.45))}px Orbitron, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k.rot, 0, -1); }
        SPR.set(key, c); if (SPR.size > 120) SPR.delete(SPR.keys().next().value);
        return c;
    }
    function spriteTexto(F, txt, cor, tl) {
        const key = txt + '|' + cor;
        if (F.txtK === key) return F.txtCv;
        const esc = F.esc, w = tl.w * 0.66, h = tl.h;
        const c = F.txtCv || (F.txtCv = document.createElement('canvas'));
        const cw = Math.ceil(w * esc), chh = Math.ceil(h * esc); if (c.width !== cw || c.height !== chh) { c.width = cw; c.height = chh; }
        const g = c.getContext('2d'); g.setTransform(esc, 0, 0, esc, 0, 0); g.clearRect(0, 0, w, h);
        g.fillStyle = cor; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `900 ${h * 0.5}px Orbitron, sans-serif`;
        g.fillText(txt, tl.w * 0.05, h / 2 + 1, tl.w * 0.6);
        F.txtK = key; return c;
    }
    // faixa do HUD pronta; só redesenha quando speed/score/modo mudam
    const HUDC = { cv: null, k: '' };

    // ---------- som de tecla mecânica ----------
    let actx = null, ultClack = 0;
    function clack(vol) {
        const agora = performance.now(); if (agora - ultClack < 25) return; ultClack = agora;
        try {
            const A0 = typeof audio !== 'undefined' ? audio : null;
            const c = (A0 && A0.ctx) || actx || (actx = new (window.AudioContext || window.webkitAudioContext)());
            const t = c.currentTime;
            if (!clack.buf || clack.ctx !== c) {   // ruído pronto uma vez (não cria buffer a cada nota)
                const n = Math.floor(c.sampleRate * 0.05); clack.buf = c.createBuffer(1, n, c.sampleRate); clack.ctx = c;
                const d = clack.buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
            }
            const b = clack.buf;
            const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = 3200 + Math.random() * 800; f.Q.value = 1.2;
            g.gain.value = 0.5 * vol; s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
            const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.05);
            og.gain.setValueAtTime(0.25 * vol, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); o.connect(og); og.connect(c.destination); o.start(t); o.stop(t + 0.08);
        } catch (e) {}
    }

    // ---------- desenho ----------
    // est: { keysOn: Set(code), hits: [{code, cor}], combo, brk (bool, aconteceu agora), fever (0..5), cores: {code: cor}, hud: {speed, score, modo} }
    function estado() { return { ondas: [], pop: null, brkT: -9, ultCombo: 0 }; }
    window.bmPremiumEstado = estado;
    // os outros itens premium moram em premium-itens.js (window.BM_PREMIUM_REND[id])
    window.bmPremiumDesenhar = function (g, box, est, now, id, opts, S) {
        if (id !== 'teclado') { const R = window.BM_PREMIUM_REND && window.BM_PREMIUM_REND[id]; if (R) R(g, box, est, now, opts || {}, S || (window.__bmPremS = window.__bmPremS || estado())); return; }
        opts = opts || {}; S = S || (window.__bmPremS = window.__bmPremS || estado());
        S.anim = false;
        const tema = TEMAS[opts.tema] ? opts.tema : 'rgb', T = TEMAS[tema], luzModo = opts.luz || 'reativo';
        // escala do desenho fixo = escala da tela (desenha 1:1, sem redimensionar a cada quadro)
        // escala real do canvas (pra carimbar 1:1); se tiver rotação/escala torta, cai no modo esticado
        const m0 = g.getTransform(), escR = Math.hypot(m0.a, m0.b), exato = Math.abs(m0.b) < 1e-6 && Math.abs(m0.c) < 1e-6 && Math.abs(m0.a - m0.d) < 1e-6 && escR >= 0.4 && escR <= 2.5;
        const t = now / 1000, esc = exato ? Math.round(escR * 1000) / 1000 : Math.round(Math.min(2.5, Math.max(0.4, opts.esc || 1)) * 20) / 20;
        const F = fixo(box, tema, esc, opts.op), G = F.G;
        const porCode = {}; G.teclas.forEach(k => { porCode[k.code] = k; });
        // eventos
        (est.hits || []).forEach(h => { const k = porCode[h.code]; if (k) { S.ondas.push({ x: k.x + k.w / 2, y: k.y + k.h / 2, t0: t, cor: h.cor }); if (opts.som) clack(opts.vol == null ? 0.6 : opts.vol); } });
        if (S.ondas.length > 24) S.ondas.splice(0, S.ondas.length - 24);
        const combo = est.combo || 0;
        if (combo > 0 && combo % 25 === 0 && combo !== S.ultCombo && est.hits && est.hits.length) S.pop = { code: est.hits[est.hits.length - 1].code, t0: t };
        S.ultCombo = combo;
        if (est.brk) S.brkT = t;
        const brk = Math.max(0, 1 - (t - S.brkT) / 0.8), fev = Math.min(1, Math.max(0, ((est.fever || 0) - 1) / 4));
        const pulso = Math.exp(-((t * (est.bpm || 128) / 60) % 1) * 5);
        g.save();
        g.translate(box.x + (brk ? (Math.random() - 0.5) * 8 * brk : 0), box.y);
        // cor da luz (por posição) conforme o tema/modo
        const corLuz = (x, i) => {
            if (brk > 0.15) return VERM;
            if (fev > 0.5) return OURO;
            if (T.luz) return T.luz[i % 2];
            return HUE[Math.floor(((t * 70) + x / box.w * 300) / 10) % 36];
        };
        // brilho de baixo
        const gb = glowBase(box, esc), c5 = [0, 1, 2, 3, 4].map(i => corLuz(box.w * i / 4, i)), ck = c5.join();
        if (gb.k !== ck) {   // só retinge quando as cores mudam (no RGB ~7x por segundo)
            gb.k = ck; const tg = gb.t.getContext('2d');
            tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, gb.t.width, gb.t.height); tg.drawImage(gb.cv, 0, 0);
            tg.globalCompositeOperation = 'source-in';
            const lg = tg.createLinearGradient(0, 0, gb.t.width, 0);
            c5.forEach((c, i) => lg.addColorStop(i / 4, c));
            tg.fillStyle = lg; tg.fillRect(0, 0, gb.t.width, gb.t.height);
        }
        g.globalAlpha = 0.35 + 0.35 * pulso; blit(g, gb.t, -box.w * 0.02, 0, box.w * 1.04, box.h, exato); g.globalAlpha = 1;
        // teclado fixo
        blit(g, F.cv, 0, 0, box.w, box.h, exato);
        // borda do corpo na cor da luz
        const C = G.corpo, fixa = T.borda && !brk && fev < 0.5, bk = fixa ? T.borda : ck;
        if (F.bk !== bk) { F.bk = bk; if (fixa) F.lb = T.borda; else { F.lb = g.createLinearGradient(0, 0, box.w, 0); c5.forEach((c, i) => F.lb.addColorStop(i / 4, c)); } }
        g.strokeStyle = F.lb; g.lineWidth = 2.5; g.beginPath(); g.moveTo(C.x0b, C.y1); g.lineTo(C.x1b, C.y1); g.lineTo(C.x1t, C.y0); g.lineTo(C.x0t, C.y0); g.closePath(); g.stroke();
        // luz em cada tecla
        g.globalCompositeOperation = tema === 'iris' ? 'source-over' : 'lighter';
        G.teclas.forEach((k, i) => {
            const cx = k.x + k.w / 2, cy = k.y + k.h / 2;
            let a = luzModo === 'onda' ? 0.18 + 0.22 * Math.sin(t * 3 - cx / box.w * 8) : luzModo === 'respira' ? 0.08 + 0.32 * pulso : 0.07;
            let cor = corLuz(cx, k.ri + i);
            for (const o of S.ondas) {
                const dt = t - o.t0; if (dt > 0.7 || dt < 0) continue;
                const d = Math.hypot(cx - o.x, (cy - o.y) * 1.6), fr = dt * box.w * 1.1;
                const v = Math.max(0, 1 - Math.abs(d - fr) / (k.h * 1.4)) * (1 - dt / 0.7);
                if (v > a) { a = v; cor = brk > 0.15 ? VERM : fev > 0.5 ? OURO : o.cor; }
            }
            if (brk > 0.15) a = Math.max(a, 0.35 * brk);
            if (fev > 0.5) a = Math.max(a, 0.2 + 0.15 * Math.sin(t * 6 + i));
            if (a > 0.02) { g.globalAlpha = Math.min(1, a) * (tema === 'iris' ? 0.55 : 0.75); g.fillStyle = cor; g.fillRect(k.x + 1, k.y + 1, k.w - 2, k.h - 4); }
        });
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        S.ondas = S.ondas.filter(o => t - o.t0 < 0.7);
        // teclas das lanes: marcador na cor da lane + apertadas (afundam e acendem)
        const cores = Object.assign({}, est.cores || {}, est.coresSide || {});   // no teclado, as teclas SIDE (Shift…) também ficam marcadas
        Object.keys(cores).forEach(code => {
            const k = porCode[code]; if (!k) return;
            const on = est.keysOn && est.keysOn.has(code), cor = cores[code];
            let y = k.y + (on ? 3 : 0), rot = 0;
            if (S.pop && S.pop.code === code) { const p = Math.min(1, (t - S.pop.t0) / 0.5); if (p >= 1) S.pop = null; else { y -= Math.sin(p * Math.PI) * box.h * 0.32; rot = p * Math.PI * 2; } }
            const sp = spriteTecla(k, cor, on || !!rot, F.esc);
            if (rot) { g.save(); g.translate(k.x + k.w / 2, y + k.h / 2); g.rotate(rot); g.drawImage(sp, -k.w / 2 - 6, -k.h / 2 - 6, k.w + 12, k.h + 12); g.restore(); }
            else blit(g, sp, k.x - 6, y - 6, k.w + 12, k.h + 12, exato);
        });
        // telinha: combo e equalizador
        const tl = G.tela, txtCor = brk > 0.15 ? VERM : fev > 0.5 ? OURO : (T.luz ? T.luz[0] : '#67e8f9');
        const txt = brk > 0.15 ? 'BREAK' : fev > 0.5 ? `x${est.fever} · ${combo}` : `${combo} COMBO`;
        blit(g, spriteTexto(F, txt, txtCor, tl), tl.x, tl.y, tl.w * 0.66, tl.h, exato);
        g.fillStyle = txtCor;
        for (let i = 0; i < 8; i++) { const v = 0.2 + 0.8 * Math.abs(Math.sin(t * 9 + i * 1.7)) * (0.3 + 0.7 * pulso); g.fillRect(tl.x + tl.w * 0.7 + i * tl.w * 0.035, tl.y + tl.h - 3 - v * (tl.h - 6), tl.w * 0.025, v * (tl.h - 6)); }
        g.restore();
        // véu vermelho no BREAK
        if (brk > 0.05) { g.fillStyle = `rgba(239,68,68,${0.22 * brk})`; g.fillRect(box.x, box.y, box.w, box.h); }
    };
    // faixa fina com SPEED · score · modo (o painel de baixo fica coberto pelo teclado)
    window.bmPremiumHud = function (g, x, y, w, h, hud) {
        const tr = g.getTransform(), esc = Math.round(Math.hypot(tr.a, tr.b) * 1000) / 1000 || 1;
        const k = `${hud.speed}|${hud.score}|${hud.modo}|${w}x${h}|${esc}|${hud.cor || ''}|${hud.op == null ? 1 : hud.op}`;
        if (HUDC.k !== k) {
            HUDC.k = k; const c = HUDC.cv || (HUDC.cv = document.createElement('canvas'));
            const cw = Math.ceil(w * esc), chh = Math.ceil(h * esc); if (c.width !== cw || c.height !== chh) { c.width = cw; c.height = chh; }
            const q = c.getContext('2d'); q.setTransform(esc, 0, 0, esc, 0, 0); hudDesenha(q, 0, 0, w, h, hud);
        }
        const m = g.getTransform();
        if (Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(HUDC.cv, Math.round(m.a * x + m.e), Math.round(m.d * y + m.f)); g.restore(); }
        else g.drawImage(HUDC.cv, x, y, w, h);
    };
    function hudDesenha(g, x, y, w, h, hud) {
        g.save();
        const cor = hud.cor || '#94a3b8', op = Math.max(0.45, hud.op == null ? 1 : hud.op);
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, rgba(shadeHex(cor, -0.82), 0.95 * op)); gr.addColorStop(1, `rgba(2,6,23,${0.95 * op})`);
        g.fillStyle = gr; g.fillRect(x, y, w, h);
        g.fillStyle = rgba(cor, 0.55); g.fillRect(x, y, w, 1.5);
        g.textBaseline = 'middle'; g.font = `800 ${h * 0.46}px Orbitron, sans-serif`;
        g.fillStyle = hud.cor ? shadeHex(cor, 0.25) : '#94a3b8'; g.textAlign = 'left'; g.fillText('SPEED', x + w * 0.03, y + h / 2);
        g.fillStyle = '#fff'; g.fillText(hud.speed, x + w * 0.03 + g.measureText('SPEED ').width, y + h / 2);
        g.textAlign = 'center'; g.font = `900 ${h * 0.56}px Orbitron, sans-serif`; g.fillText(hud.score, x + w / 2, y + h / 2);
        g.textAlign = 'right'; g.font = `800 ${h * 0.46}px Orbitron, sans-serif`; g.fillStyle = '#cbd5e1'; g.fillText(hud.modo, x + w * 0.97, y + h / 2);
        g.restore();
    }

    function shadeHex(hex, p) { const [r, g, b] = hexRgb(hex), f = (v) => Math.max(0, Math.min(255, Math.round(p >= 0 ? v + (255 - v) * p : v * (1 + p)))); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join(''); }

    // ---------- FUNDO de cada item: ocupa a parte de baixo inteira (sem canto preto) ----------
    // cor principal (a, b = degradê), enfeite e cor de destaque (também usada no placar)
    const FUNDOS = {
        teclado: { a: '#0d1424', b: '#04060c', deco: 'grade', c: '#22d3ee' },
        dj: { a: '#21170f', b: '#0b0705', deco: 'madeira', c: '#67e8f9' },
        arcade: { a: '#22093a', b: '#0a0418', deco: 'estrelas', c: '#fde047' },
        launchpad: { a: '#0e0e1a', b: '#05050a', deco: 'leds', c: '#a78bfa' },
        gatinho: { a: '#2d1b10', b: '#120a05', deco: 'madeira', c: '#fb923c' },
        synth: { a: '#120f36', b: '#05061a', deco: 'grade', c: '#22d3ee' },
        show: { a: '#3a0a18', b: '#12030a', deco: 'cortina', c: '#f472b6' },
        alvos: { a: '#1d0f38', b: '#0a0618', deco: 'faixas', c: '#c084fc' }
    };
    const FCACHE = new Map();
    function fundoCv(id, w, h, esc) {
        const D = FUNDOS[id] || FUNDOS.teclado, k = `${id}|${Math.round(w)}x${Math.round(h)}|${esc}`;
        let c = FCACHE.get(k); if (c) return c;
        c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * esc)); c.height = Math.max(1, Math.round(h * esc));
        const q = c.getContext('2d'); q.scale(esc, esc);
        const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, D.a); gr.addColorStop(1, D.b); q.fillStyle = gr; q.fillRect(0, 0, w, h);
        let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        if (D.deco === 'grade') {
            q.strokeStyle = rgba(D.c, 0.07); q.lineWidth = 1;
            for (let x = 12; x < w; x += 24) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x, h); q.stroke(); }
            for (let y = 12; y < h; y += 24) { q.beginPath(); q.moveTo(0, y); q.lineTo(w, y); q.stroke(); }
        } else if (D.deco === 'madeira') {
            const tab = Math.max(18, h / 6);
            for (let y = 0; y < h; y += tab) {
                q.fillStyle = 'rgba(0,0,0,.35)'; q.fillRect(0, y, w, 1.5);
                q.strokeStyle = 'rgba(255,214,170,.035)'; q.lineWidth = 1;
                for (let k2 = 0; k2 < 3; k2++) { const yy = y + tab * (0.25 + k2 * 0.25) + rnd() * 3; q.beginPath(); q.moveTo(0, yy); for (let x = 0; x <= w; x += 40) q.lineTo(x, yy + Math.sin(x * 0.03 + k2) * 1.5); q.stroke(); }
            }
        } else if (D.deco === 'estrelas') {
            for (let i = 0; i < w * h / 900; i++) { q.fillStyle = rgba(i % 3 ? '#ffffff' : '#f472b6', 0.15 + rnd() * 0.35); const s = rnd() < 0.15 ? 2 : 1; q.fillRect(rnd() * w, rnd() * h, s, s); }
            [[0, '#ec4899'], [w - 3, '#22d3ee']].forEach(([x, cc]) => { const g2 = q.createLinearGradient(x === 0 ? 0 : w, 0, x === 0 ? 26 : w - 26, 0); g2.addColorStop(0, rgba(cc, 0.35)); g2.addColorStop(1, rgba(cc, 0)); q.fillStyle = g2; q.fillRect(x === 0 ? 0 : w - 26, 0, 26, h); });
        } else if (D.deco === 'leds') {
            for (let y = 7; y < h; y += 14) for (let x = 7; x < w; x += 14) { q.fillStyle = rgba(D.c, 0.06 + 0.05 * ((x + y) % 28 === 0)); q.fillRect(x - 1, y - 1, 2, 2); }
        } else if (D.deco === 'cortina') {
            for (let x = 0; x < w; x += 16) { const g2 = q.createLinearGradient(x, 0, x + 16, 0); g2.addColorStop(0, 'rgba(0,0,0,.28)'); g2.addColorStop(0.5, 'rgba(255,255,255,.04)'); g2.addColorStop(1, 'rgba(0,0,0,.28)'); q.fillStyle = g2; q.fillRect(x, 0, 16, h); }
        } else if (D.deco === 'faixas') {
            q.strokeStyle = rgba(D.c, 0.06); q.lineWidth = 6;
            for (let x = -h; x < w; x += 22) { q.beginPath(); q.moveTo(x, h); q.lineTo(x + h, 0); q.stroke(); }
        }
        // filete de luz no topo, na cor do item
        const gt = q.createLinearGradient(0, 0, 0, 14); gt.addColorStop(0, rgba(D.c, 0.32)); gt.addColorStop(1, rgba(D.c, 0)); q.fillStyle = gt; q.fillRect(0, 0, w, 14);
        q.fillStyle = rgba(D.c, 0.7); q.fillRect(0, 0, w, 1.5);
        FCACHE.set(k, c); if (FCACHE.size > 12) FCACHE.delete(FCACHE.keys().next().value);
        return c;
    }
    // g já com a escala aplicada; op = opacidade (Configurações › Opacidade da pista)
    window.bmPremiumFundo = function (g, x, y, w, h, id, op, esc) {
        if (op <= 0.01) return;
        const m = g.getTransform(), e = esc || Math.round(Math.hypot(m.a, m.b) * 1000) / 1000 || 1;
        g.globalAlpha = Math.min(1, op); blit(g, fundoCv(id, w, h, e), x, y, w, h, Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6); g.globalAlpha = 1;
    };
    window.bmPremiumCor = (id) => (FUNDOS[id] || FUNDOS.teclado).c;

    // peças compartilhadas com premium-itens.js
    window.__bmPrem = { TEMAS, HUE, OURO, VERM, hexRgb, rgba, shade, rr, blit, fixo, geometria, spriteTecla, estado };

    // ---------- no jogo ----------
    const GJ = { cv: null, g: null, S: estado(), seen: new WeakSet(), brk: 0, luz: [] };
    function lanesCodes(mode) {
        const keys = (typeof KEY_CONFIGS !== 'undefined' && KEY_CONFIGS[mode]) || [];
        return keys;
    }
    function coresLanes(mode, gear) {
        try { return getKeyColorScheme(mode, gear); } catch (e) { return []; }
    }
    // botões que aparecem no item: só os que você aperta de verdade no modo (4B = 4, 5B = 5,
    // 6B = 6, 8B = 8), na ordem da tela. As SIDE (Shift/Ctrl) ficam à parte (coresSide).
    function coresPorLane(mode, codes, corL) {
        let ordem = codes.map((_, i) => i), kinds = [];
        try { ordem = getVisualOrder(mode); kinds = getLaneKinds(mode); } catch (e) {}
        const cores = {}, coresSide = {};
        ordem.forEach(i => { const c = codes[i]; if (!c) return; (kinds[i] === 'side' ? coresSide : cores)[c] = corL[i] || '#e2e8f0'; });
        return { cores, coresSide };
    }
    window.bmPremiumCores = coresPorLane;
    function idAtivo() {
        const id = (typeof window.bmPremiumId === 'function' ? window.bmPremiumId() : '') || (typeof gearSkin !== 'undefined' && gearSkin === 'shop_turma_garnet' ? 'alvos' : '');
        const playing = typeof isPlaying !== 'undefined' && isPlaying;
        const plano = typeof gameView === 'undefined' || gameView !== 'highway_tilt';
        const moldura = typeof getGearLayout !== 'function' || getGearLayout().frame;
        return id && playing && plano && moldura ? id : '';
    }
    // o jogo pergunta isso pra NÃO desenhar o próprio painel/teclas embaixo da linha (o item
    // ocupa esse espaço; com a pista transparente, aparece o fundo da tela atrás)
    window.bmPremiumCobre = () => !!idAtivo();
    const LUZ = 56;   // luz da lane que "vaza" pra cima da linha a cada acerto
    function frame(ts) {
        requestAnimationFrame(frame);
        const id = idAtivo();
        if (!id) { if (GJ.cv) GJ.cv.style.display = 'none'; GJ.brk = (typeof stats !== 'undefined' && stats.judgments) ? stats.judgments.break : 0; return; }
        const box = document.getElementById('game-container'); if (!box) return;
        // fica logo acima da gear (z 1) e abaixo da animação da gear exclusiva (z 2), que assim
        // pode descer por cima dos pilares até o painel ("efeito cobre a gear inteira")
        if (!GJ.cv) { GJ.cv = document.createElement('canvas'); GJ.cv.id = 'premium-layer'; GJ.cv.style.cssText = 'position:absolute;pointer-events:none;z-index:1'; box.appendChild(GJ.cv); GJ.g = GJ.cv.getContext('2d', { alpha: true }); }
        const cv = GJ.cv; cv.style.display = '';
        const rc = typeof gearRectsCached === 'function' ? gearRectsCached(ts) : null;
        const br = rc ? rc.box : box.getBoundingClientRect();
        const gc = typeof palcoGearCanvas === 'function' ? palcoGearCanvas() : document.getElementById('gameCanvas');
        const gr = rc ? rc.gear : gc && gc.getBoundingClientRect(); if (!gr || !gr.width) return;
        // tem que vir DEPOIS do canvas da gear (mesmo z-index): se o jogo trocou de renderizador, reposiciona
        if (gc && gc.parentNode === box && (gc.compareDocumentPosition(cv) & Node.DOCUMENT_POSITION_PRECEDING)) box.appendChild(cv);
        const L = typeof getGearLayout === 'function' ? getGearLayout() : null; if (!L) return;
        const strike = typeof getGameStrikeY === 'function' ? getGameStrikeY() : L.H - 80;
        const hudH = 36, top = strike + 8, F = L.F || 0, y0 = top - 2 - LUZ;
        // a camada cobre SÓ a parte de baixo da gear (+ uma faixa acima pra luz que vaza)
        const dpr = Math.min(2, window.devicePixelRatio || 1), k = gr.height / L.totalH;
        const cssL = gr.left - br.left, cssT = gr.top - br.top + y0 * k, cssW = gr.width, cssH = (L.totalH - y0) * k;
        const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
        let mudou = false;
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; mudou = true; }
        if (GJ.pos !== `${cssL}|${cssT}|${cssW}|${cssH}`) { mudou = true; GJ.pos = `${cssL}|${cssT}|${cssW}|${cssH}`; Object.assign(cv.style, { left: cssL + 'px', top: cssT + 'px', width: cssW + 'px', height: cssH + 'px' }); }
        const g = GJ.g, s = k * dpr;
        g.setTransform(s, 0, 0, s, 0, -y0 * s);
        // acertos novos → tecla da lane
        const mode = typeof currentMode !== 'undefined' ? currentMode : '4K';
        const codes = lanesCodes(mode), cols = typeof getGameplayColumnLayout === 'function' ? getGameplayColumnLayout(mode, L.W) : [];
        const corL = coresLanes(mode, typeof gearSkin !== 'undefined' ? gearSkin : '');
        const { cores, coresSide } = coresPorLane(mode, codes, corL);
        const hits = [];
        if (typeof hitFlashes !== 'undefined') for (const f of hitFlashes) {
            if (GJ.seen.has(f)) continue; GJ.seen.add(f);
            let lane = -1;
            if (f.wide && f.wide > 140 && typeof getSideLaneIndices === 'function') { const si = getSideLaneIndices(mode); if (si) lane = si[f.x < L.W / 2 ? 0 : 1]; }
            else cols.forEach((c, i) => { if (f.x >= c.x && f.x <= c.x + c.width && lane < 0) lane = i; });
            if (lane >= 0 && codes[lane]) { hits.push({ code: codes[lane], cor: f.color || cores[codes[lane]] }); if (cols[lane]) GJ.luz[lane] = { v: 1, cor: f.color || cores[codes[lane]] || '#ffffff' }; }
        }
        const keysOn = new Set(); if (typeof keyState !== 'undefined') keyState.forEach((on, i) => { if (on && codes[i]) keysOn.add(codes[i]); });
        const nb = (typeof stats !== 'undefined' && stats.judgments) ? stats.judgments.break : 0, brk = nb > GJ.brk; GJ.brk = nb;
        const fv = typeof window.bmFever === 'function' ? window.bmFever().lvl || 0 : 0;
        // Sem acerto/tecla/onda/BREAK acontecendo, só a luz ambiente anda: redesenha a 30 fps
        // (o quadro anterior continua na tela). Com ação, desenha todo quadro.
        const kSig = Array.from(keysOn).join(), combo = (typeof stats !== 'undefined' && stats.combo) || 0;
        const op = typeof laneOpacityPct === 'number' ? Math.max(0, Math.min(1, laneOpacityPct / 100)) : 1;
        if (op !== GJ.op) { GJ.op = op; mudou = true; }
        const luzViva = GJ.luz.some(l => l && l.v > 0.03);
        const ativo = mudou || hits.length || brk || luzViva || kSig !== GJ.kSig || combo !== GJ.combo || fv !== GJ.fv || GJ.S.ondas.length || GJ.S.pop || GJ.S.anim || ts / 1000 - GJ.S.brkT < 0.85;
        if (!ativo && ts - (GJ.ult || 0) < 32) return;
        const dtL = Math.min(0.1, (ts - (GJ.ult || ts)) / 1000);
        GJ.ult = ts; GJ.kSig = kSig; GJ.combo = combo; GJ.fv = fv;
        const o = typeof window.bmPremiumOpc === 'function' ? window.bmPremiumOpc() : {};
        o.vol = typeof hitSoundVolume === 'number' ? hitSoundVolume : 0.6;
        o.esc = s;
        o.exato = true; o.op = Math.round(op * 10) / 10;
        g.clearRect(0, y0, L.totalW, L.totalH - y0);
        // luz que vaza pra cima da linha, na cor da lane acertada
        GJ.luz.forEach((l, i) => {
            if (!l || l.v <= 0.03 || !cols[i]) return;
            const c = cols[i], x = F + c.x, gr2 = g.createLinearGradient(0, top - 2, 0, top - 2 - LUZ * (0.5 + 0.5 * l.v));
            gr2.addColorStop(0, rgba(l.cor, 0.38 * l.v)); gr2.addColorStop(1, rgba(l.cor, 0));
            g.fillStyle = gr2; g.fillRect(x + 2, y0, c.width - 4, top - 2 - y0);
            l.v *= Math.exp(-dtL * 7);
        });
        // fundo do item de ponta a ponta (respeita a opacidade da pista)
        window.bmPremiumFundo(g, 0, top - 2, L.totalW, L.totalH - top + 2 - hudH, id, op, Math.round(s * 1000) / 1000);
        const fxFull = typeof window.bmGearFxFull === 'function' && window.bmGearFxFull() && typeof window.bmGearFxId === 'function' && window.bmGearFxId();
        const mx = fxFull ? F : F * 0.3;   // com o efeito da gear descendo nos pilares, o item fica entre eles
        window.bmPremiumDesenhar(g, { x: mx, y: top, w: L.totalW - mx * 2, h: L.totalH - top - hudH }, { keysOn, hits, combo: (typeof stats !== 'undefined' && stats.combo) || 0, brk, fever: fv, cores, coresSide, bpm: typeof bpm === 'number' ? bpm : 128 }, ts, id, o, GJ.S);
        const score = typeof totalPossibleScore !== 'undefined' && totalPossibleScore > 0 ? Math.max(0, Math.round(1e6 * (currentEarnedScore || 0) / totalPossibleScore)) : 0;
        const modo = (typeof getModeDisplayName === 'function' ? getModeDisplayName(mode) : mode) + ' · ' + (typeof difficultyLabel === 'function' ? difficultyLabel() : (typeof currentDifficulty !== 'undefined' ? currentDifficulty : ''));
        window.bmPremiumHud(g, 0, L.totalH - hudH, L.totalW, hudH, { speed: (typeof scrollSpeed === 'number' ? scrollSpeed : 0).toFixed(1), score: String(score).padStart(7, '0'), modo, cor: window.bmPremiumCor(id), op });
    }
    requestAnimationFrame(frame);

    // ---------- miniatura na Loja (simula teclas 4B; só anima o que está na tela) ----------
    setInterval(() => {
        const host = document.getElementById('bc-ov'); if (!host) return;
        host.querySelectorAll('canvas[data-premium]:not(.on)').forEach(cv => { cv.classList.add('on'); vitrine(cv, cv.dataset.premium); });
    }, 400);
    function vitrine(cv, id) {
        const S = estado(), codes = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], cores = { KeyD: '#e2e8f0', KeyF: '#22d3ee', KeyJ: '#22d3ee', KeyK: '#e2e8f0' };
        let ult = 0, prox = 0, n = 0, on = new Set(), solta = 0;
        function loop(ts) {
            if (!cv.isConnected) return;
            requestAnimationFrame(loop);
            const r = cv.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight || ts - ult < 32) return; ult = ts;
            const w = Math.round(r.width), h = Math.round(r.height); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
            const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); window.bmPremiumFundo(g, 0, 0, w, h, id, 1, 1);
            const hits = [];
            if (ts > prox) { prox = ts + 234; n++; const c = codes[(n * 7 + (n >> 2)) % 4]; on = new Set([c]); solta = ts + 110; hits.push({ code: c, cor: cores[c] }); }
            if (ts > solta) on = new Set();
            const o = Object.assign({}, typeof window.bmPremiumOpc === 'function' ? window.bmPremiumOpc() : {}, { som: false });
            window.bmPremiumDesenhar(g, { x: 0, y: 4, w, h: h - 4 }, { keysOn: on, hits, combo: n % 60, brk: n % 60 === 59, fever: n % 60 > 40 ? 5 : 0, cores }, ts, id, o, S);
        }
        requestAnimationFrame(loop);
    }
})();

// =====================================================================================
// premium-itens.js — os outros itens ⭐ PREMIUM "abaixo da linha" (o Teclado Gamer está em
// premium-gear.js). Todos usam o mesmo esquema leve: a parte fixa fica pronta num canvas
// guardado (por tamanho e escala) e é carimbada 1:1; a cada quadro só entram as luzes e o que
// se mexe. Sem shadowBlur, sem filtros, sem fillText por quadro (texto vira sprite pronto).
//
//  Mesa de DJ · Fliperama · Launchpad Neon · Gatinho no Teclado · Sintetizador da Echo ·
//  Show da Turma
//
//  Cada desenhador recebe X (ver prep) e marca S.anim = true enquanto tiver efeito andando
//  (o jogo redesenha a 60 fps com ação e a 30 fps quando só a luz ambiente anda).
// =====================================================================================
(function () {
    const P = window.__bmPrem; if (!P) return;
    const NOVOS = [
        { id: 'dj', name: 'Mesa de DJ', price: 250, desc: 'PREMIUM · Abaixo da linha: dois toca-discos e um mixer. Os discos giram no ritmo, fazem scratch nas notas longas, o crossfader corre pro lado do acerto e os medidores pulam.' },
        { id: 'arcade', name: 'Fliperama', price: 250, desc: 'PREMIUM · Abaixo da linha: painel de arcade com alavanca e um botão por lane. Os botões afundam e acendem, a alavanca balança no ritmo e no FEVER sai 1UP! e moedinha.' },
        { id: 'launchpad', name: 'Launchpad Neon', price: 250, desc: 'PREMIUM · Abaixo da linha: uma grade de pads de luz. Cada acerto espalha luz a partir da coluna da nota; no combo alto vêm ondas e o BEATMAX passa rolando.' },
        { id: 'gatinho', name: 'Gatinho no Teclado', price: 250, desc: 'PREMIUM · Abaixo da linha: um gato deitado no teclado bate as patinhas nas suas teclas. No BREAK ele se espreguiça em cima de tudo e no combo dá um miau!' },
        { id: 'synth', name: 'Sintetizador da Echo', price: 250, desc: 'PREMIUM · Abaixo da linha: um teclado de piano com osciloscópio. As teclas descem com as notas, os botões giram e a onda verde desenha o ritmo.' },
        { id: 'alvos', name: 'Stand de Tiro', price: 250, desc: 'PREMIUM · Abaixo da linha: o estande de tiro da Garnet. Um alvo por botão que leva tiro quando você aperta: furo, recuo e faísca. Nota longa vira rajada, FEVER deixa os alvos dourados e no BREAK o tiro erra.' },
        { id: 'show', name: 'Show da Turma', price: 250, desc: 'PREMIUM · Abaixo da linha: um palquinho 8-bit com a turma tocando. Iris na guitarra, Jade na bateria, Arya no vocal e Echo no teclado, cada uma nas lanes dela.' }
    ];
    if (window.BM_PREMIUM) NOVOS.forEach(it => { if (!window.BM_PREMIUM.some(x => x.id === it.id)) window.BM_PREMIUM.push(it); });
    const REND = window.BM_PREMIUM_REND = window.BM_PREMIUM_REND || {};
    const { rr, blit, OURO, VERM, HUE } = P;

    // ---------- caches ----------
    const CC = new Map();
    function cache(key, w, h, esc, fn) {
        const k = `${key}|${Math.round(w)}x${Math.round(h)}|${esc}`;
        let c = CC.get(k); if (c) return c;
        c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * esc)); c.height = Math.max(1, Math.round(h * esc));
        const q = c.getContext('2d'); q.scale(esc, esc); fn(q);
        CC.set(k, c); if (CC.size > 220) CC.delete(CC.keys().next().value);
        return c;
    }
    // texto pronto: { cv, w, h } em unidades da caixa
    const MED = document.createElement('canvas').getContext('2d');
    function texto(str, cor, px, esc, peso) {
        const font = `${peso || 900} ${px}px Orbitron, sans-serif`;
        MED.font = font; const w = Math.ceil(MED.measureText(str).width) + 4, h = Math.ceil(px * 1.3);
        return { cv: cache('tx' + str + cor + font, w, h, esc, q => { q.font = font; q.fillStyle = cor; q.textBaseline = 'middle'; q.textAlign = 'left'; q.fillText(str, 2, h / 2 + 1); }), w, h };
    }
    function txt(X, str, cor, px, x, y, al) { // al: 'c' centro, 'r' direita, 'l' esquerda
        const T = texto(str, cor, px, X.esc); const dx = al === 'r' ? x - T.w : al === 'l' ? x : x - T.w / 2;
        blit(X.g, T.cv, dx, y - T.h / 2, T.w, T.h, X.exato);
    }
    function comboTxt(X) { return X.brk > 0.15 ? 'BREAK' : X.fev > 0.5 ? `FEVER x${X.fevLvl} · ${X.combo}` : `${X.combo} COMBO`; }
    function corEstado(X, normal) { return X.brk > 0.15 ? VERM : X.fev > 0.5 ? OURO : normal; }

    function prep(g, box, est, now, opts, S, id) {
        const m0 = g.getTransform(), escR = Math.hypot(m0.a, m0.b);
        const exato = Math.abs(m0.b) < 1e-6 && Math.abs(m0.c) < 1e-6 && Math.abs(m0.a - m0.d) < 1e-6 && escR >= 0.4 && escR <= 2.5;
        const esc = exato ? Math.round(escR * 1000) / 1000 : Math.round(Math.min(2.5, Math.max(0.4, opts.esc || 1)) * 20) / 20;
        const t = now / 1000, R = S['_' + id] || (S['_' + id] = { lt: t });
        const dt = Math.min(0.1, Math.max(0, t - R.lt)); R.lt = t;
        const cores = est.cores || {}, codes = Object.keys(cores), n = Math.max(1, codes.length);
        const lanes = codes.map(c => ({ code: c, cor: cores[c], on: !!(est.keysOn && est.keysOn.has(c)) }));
        const hits = (est.hits || []).map(h => ({ lane: codes.indexOf(h.code), code: h.code, cor: h.cor || cores[h.code] })).filter(h => h.lane >= 0);
        if (est.brk) S.brkT = t;
        const brk = Math.max(0, 1 - (t - (S.brkT == null ? -9 : S.brkT)) / 0.8);
        const fev = Math.min(1, Math.max(0, ((est.fever || 0) - 1) / 4));
        const bpm = est.bpm || 128, beat = t * bpm / 60, pulso = Math.exp(-(beat % 1) * 5), combo = est.combo || 0;
        const marco = combo > 0 && combo % 25 === 0 && combo !== R.ultCombo && hits.length > 0; R.ultCombo = combo;
        S.anim = false;
        const op = opts.op == null ? 1 : Math.max(0, Math.min(1, opts.op));   // opacidade da pista: vale pro "chão" de cada item
        return { g, box, est, t, dt, esc, exato, R, S, n, lanes, hits, brk, brkAgora: !!est.brk, fev, fevLvl: est.fever || 0, bpm, beat, pulso, combo, marco, opts, op };
    }
    function registra(id, fn) {
        REND[id] = function (g, box, est, now, opts, S) {
            const X = prep(g, box, est, now, opts, S, id);
            g.save(); g.translate(box.x + (X.brk ? (Math.random() - 0.5) * 8 * X.brk : 0), box.y);
            fn(X, box.w, box.h);
            g.restore();
            if (X.brk > 0.05) { g.fillStyle = `rgba(239,68,68,${0.2 * X.brk})`; g.fillRect(box.x, box.y, box.w, box.h); }
            if (X.brk > 0.02) S.anim = true;
        };
    }
    const lado = (X, l) => ((l + 0.5) < X.n / 2 ? 0 : 1);

    // =================================================================================
    // MESA DE DJ
    // =================================================================================
    registra('dj', (X, w, h) => {
        const { g, R, dt, t, n, lanes } = X;
        const r = Math.min(w * 0.155, h * 0.4), dk = [{ x: w * 0.2, y: h * 0.52, cor: '#22d3ee' }, { x: w * 0.8, y: h * 0.52, cor: '#f472b6' }];
        const mx = { x: w * 0.375, y: h * 0.06, w: w * 0.25, h: h * 0.88 };
        const vu = { x: mx.x + mx.w * 0.1, y: mx.y + mx.h * 0.27, w: mx.w * 0.8, h: mx.h * 0.34 };
        const pad = { y: mx.y + mx.h * 0.65, h: mx.h * 0.08 }, cw = vu.w / n;
        const F = cache('dj' + n + '|' + X.op, w, h, X.esc, q => {
            q.globalAlpha = X.op; q.fillStyle = '#0b0f1a'; rr(q, w * 0.01, h * 0.02, w * 0.98, h * 0.96, 10); q.fill(); q.globalAlpha = 1; q.strokeStyle = '#1e293b'; q.lineWidth = 2; q.stroke();
            dk.forEach(d => {
                q.fillStyle = '#111827'; rr(q, d.x - r * 1.22, d.y - r * 1.18, r * 2.44, r * 2.36, 8); q.fill(); q.strokeStyle = '#273449'; q.lineWidth = 1.5; q.stroke();
                q.fillStyle = '#1f2937'; q.beginPath(); q.arc(d.x, d.y, r * 1.05, 0, 7); q.fill();
                q.fillStyle = '#334155'; q.beginPath(); q.arc(d.x + r * 0.98, d.y - r * 0.92, r * 0.13, 0, 7); q.fill();
            });
            q.fillStyle = '#0f172a'; rr(q, mx.x, mx.y, mx.w, mx.h, 8); q.fill(); q.strokeStyle = '#334155'; q.lineWidth = 1.5; q.stroke();
            q.fillStyle = '#020617'; rr(q, mx.x + mx.w * 0.08, mx.y + mx.h * 0.05, mx.w * 0.84, mx.h * 0.16, 4); q.fill();
            for (let l = 0; l < n; l++) for (let s = 0; s < 8; s++) { q.fillStyle = '#1e293b'; q.fillRect(vu.x + l * cw + cw * 0.18, vu.y + vu.h - (s + 1) * vu.h / 8 + 1, cw * 0.64, vu.h / 8 - 2); }
            for (let l = 0; l < n; l++) { q.fillStyle = '#1e293b'; rr(q, vu.x + l * cw + cw * 0.12, pad.y, cw * 0.76, pad.h, 3); q.fill(); }
            q.fillStyle = 'rgba(148,163,184,.55)'; q.font = `900 ${h * 0.055}px Orbitron, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('BEATMAX DJ', w / 2, mx.y + mx.h * 0.8);
            q.fillStyle = '#020617'; rr(q, mx.x + mx.w * 0.12, mx.y + mx.h * 0.87, mx.w * 0.76, mx.h * 0.045, 3); q.fill();
        });
        blit(g, F, 0, 0, w, h, X.exato);
        R.ang = R.ang || [0, 1.3]; R.vel = R.vel || [1, 1]; R.hold = R.hold || [0, 0]; R.vu = R.vu || [];
        if (R.xf == null) { R.xf = 0.5; R.xfA = 0.5; }
        X.hits.forEach(hh => { const s = lado(X, hh.lane); R.vel[s] += 0.7; R.vu[hh.lane] = 1; R.xfA = s ? 0.88 : 0.12; });
        const alvo = X.brk > 0.15 ? 0 : X.fev > 0.5 ? 1.7 : 1;
        let anda = false;
        dk.forEach((d, s) => {
            const segura = lanes.some((ln, l) => ln.on && lado(X, l) === s);
            R.hold[s] = segura ? R.hold[s] + dt : 0;
            const scr = R.hold[s] > 0.12;
            R.vel[s] += (alvo - R.vel[s]) * Math.min(1, dt * 4); if (Math.abs(R.vel[s] - alvo) > 0.02) anda = true;
            R.ang[s] += dt * 3.4 * R.vel[s];
            const a = R.ang[s] + (scr ? Math.sin(t * 26) * 0.55 : 0);
            const cor = corEstado(X, d.cor);
            // luz do prato
            g.globalAlpha = 0.25 + 0.5 * X.pulso; g.strokeStyle = cor; g.lineWidth = 3; g.beginPath(); g.arc(d.x, d.y, r * 1.06, 0, 7); g.stroke(); g.globalAlpha = 1;
            const vin = cache('vinil' + d.cor, r * 2, r * 2, X.esc, q => {
                q.fillStyle = '#050505'; q.beginPath(); q.arc(r, r, r, 0, 7); q.fill();
                q.strokeStyle = 'rgba(255,255,255,.07)'; q.lineWidth = 1;
                for (let k = 0.42; k < 0.97; k += 0.07) { q.beginPath(); q.arc(r, r, r * k, 0, 7); q.stroke(); }
                q.strokeStyle = 'rgba(255,255,255,.22)'; q.lineWidth = 2; q.beginPath(); q.arc(r, r, r * 0.8, -0.5, 0.2); q.stroke();
                q.fillStyle = d.cor; q.beginPath(); q.arc(r, r, r * 0.33, 0, 7); q.fill();
                q.fillStyle = '#0f172a'; q.fillRect(r - r * 0.33, r - r * 0.04, r * 0.66, r * 0.08);
                q.font = `900 ${r * 0.17}px Orbitron, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('BM', r, r - r * 0.16);
                q.fillStyle = '#e2e8f0'; q.beginPath(); q.arc(r, r, r * 0.04, 0, 7); q.fill();
            });
            g.save(); g.translate(d.x, d.y); g.rotate(a); g.drawImage(vin, -r, -r, r * 2, r * 2); g.restore();
            if (scr) { // risquinhos do scratch
                anda = true; g.strokeStyle = cor; g.lineWidth = 2.5; g.globalAlpha = 0.8;
                for (let k = 0; k < 2; k++) { const b = t * 9 + k * Math.PI; g.beginPath(); g.arc(d.x, d.y, r * (1.12 + 0.06 * k), b, b + 0.7); g.stroke(); }
                g.globalAlpha = 1;
            }
            // braço da agulha
            const bx = d.x + r * 0.98, by = d.y - r * 0.92, ex = d.x + r * 0.52, ey = d.y - r * 0.05 + (scr ? Math.sin(t * 26) * r * 0.03 : 0);
            g.strokeStyle = '#cbd5e1'; g.lineWidth = Math.max(2, r * 0.06); g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - r * 0.05, ey - r * 0.3); g.lineTo(ex, ey); g.stroke(); g.lineCap = 'butt';
            g.fillStyle = '#94a3b8'; g.fillRect(ex - r * 0.07, ey - r * 0.05, r * 0.14, r * 0.12);
        });
        // medidores e pads
        for (let l = 0; l < n; l++) {
            const ln = lanes[l]; R.vu[l] = Math.max(0, (R.vu[l] || 0) - dt * 2.2);
            const v = ln.on ? Math.max(R.vu[l], 0.55 + 0.15 * Math.sin(t * 30 + l)) : R.vu[l]; if (v > 0.01) anda = true;
            const seg = Math.ceil(v * 8);
            for (let s = 0; s < seg; s++) { g.fillStyle = s >= 7 ? '#ef4444' : s >= 5 ? '#fde047' : corEstado(X, ln.cor); g.fillRect(vu.x + l * cw + cw * 0.18, vu.y + vu.h - (s + 1) * vu.h / 8 + 1, cw * 0.64, vu.h / 8 - 2); }
            if (ln.on) { g.fillStyle = ln.cor; rr(g, vu.x + l * cw + cw * 0.12, pad.y, cw * 0.76, pad.h, 3); g.fill(); }
            else { g.fillStyle = ln.cor; g.globalAlpha = 0.35; g.fillRect(vu.x + l * cw + cw * 0.3, pad.y + pad.h * 0.4, cw * 0.4, pad.h * 0.2); g.globalAlpha = 1; }
        }
        // crossfader
        R.xf += (R.xfA - R.xf) * Math.min(1, dt * 10); if (Math.abs(R.xfA - R.xf) > 0.01) anda = true;
        const fx = mx.x + mx.w * (0.14 + 0.72 * R.xf), fy = mx.y + mx.h * 0.89;
        g.fillStyle = '#e2e8f0'; rr(g, fx - mx.w * 0.05, fy - mx.h * 0.05, mx.w * 0.1, mx.h * 0.1, 3); g.fill();
        g.fillStyle = '#0f172a'; g.fillRect(fx - 1, fy - mx.h * 0.04, 2, mx.h * 0.08);
        txt(X, comboTxt(X), corEstado(X, '#67e8f9'), h * 0.07, w / 2, mx.y + mx.h * 0.13, 'c');
        if (anda) X.S.anim = true;
    });

    // =================================================================================
    // FLIPERAMA
    // =================================================================================
    function posBotoes(n, w, h) {
        const larga = w / h > 2.6, um = n <= 6 || (larga && n <= 8), m1 = um ? n : Math.ceil(n / 2), x0 = w * (larga ? 0.27 : 0.33), x1 = w * 0.93, rb = Math.min((x1 - x0) / m1 * 0.36, h * (um ? (larga ? 0.165 : 0.13) : 0.1));
        const P2 = [];
        for (let i = 0; i < n; i++) {
            const row = um || i < m1 ? 0 : 1, idx = row ? i - m1 : i, m = row ? n - m1 : m1;
            const x = x0 + (x1 - x0) * (idx + 0.5 + (row ? 0.3 : 0)) / (m1 + (row ? 0.3 : 0));
            const arco = m > 1 ? Math.sin(Math.PI * idx / (m - 1)) * h * 0.05 : 0;
            const y = (um ? h * 0.6 : row ? h * 0.74 : h * 0.5) - arco;
            P2.push({ x, y, rb });
        }
        return P2;
    }
    registra('arcade', (X, w, h) => {
        const { g, R, dt, t, n, lanes } = X;
        const BT = posBotoes(n, w, h), js = { x: w * (w / h > 2.6 ? 0.15 : 0.165), y: h * 0.62, r: h * 0.12 };
        const F = cache('arc' + n, w, h, X.esc, q => {
            q.fillStyle = '#1a1033'; q.beginPath(); q.moveTo(w * 0.01, h * 0.98); q.lineTo(w * 0.99, h * 0.98); q.lineTo(w * 0.94, h * 0.24); q.lineTo(w * 0.06, h * 0.24); q.closePath(); q.fill();
            q.strokeStyle = '#7c3aed'; q.lineWidth = 2; q.stroke();
            q.fillStyle = 'rgba(236,72,153,.18)'; q.beginPath(); q.moveTo(w * 0.01, h * 0.98); q.lineTo(w * 0.12, h * 0.98); q.lineTo(w * 0.14, h * 0.24); q.lineTo(w * 0.06, h * 0.24); q.fill();
            q.beginPath(); q.moveTo(w * 0.99, h * 0.98); q.lineTo(w * 0.88, h * 0.98); q.lineTo(w * 0.86, h * 0.24); q.lineTo(w * 0.94, h * 0.24); q.fill();
            q.fillStyle = '#0b0620'; rr(q, w * 0.06, h * 0.02, w * 0.88, h * 0.18, 6); q.fill(); q.strokeStyle = '#ec4899'; q.lineWidth = 1.5; q.stroke();
            q.fillStyle = '#fde047'; q.font = `900 ${h * 0.09}px Orbitron, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('BEATMAX ARCADE', w / 2, h * 0.115);
            q.fillStyle = '#05030c'; q.beginPath(); q.arc(js.x, js.y, js.r, 0, 7); q.fill(); q.strokeStyle = '#475569'; q.lineWidth = 2; q.stroke();
            q.fillStyle = '#111'; q.beginPath(); q.arc(js.x, js.y, js.r * 0.35, 0, 7); q.fill();
            BT.forEach(b => { q.fillStyle = '#05030c'; q.beginPath(); q.arc(b.x, b.y, b.rb * 1.18, 0, 7); q.fill(); q.strokeStyle = '#334155'; q.lineWidth = 1.5; q.stroke(); });
            q.fillStyle = 'rgba(148,163,184,.6)'; q.font = `800 ${h * 0.05}px Orbitron, sans-serif`; q.textAlign = 'left'; q.fillText('1P', w * 0.14, h * 0.32);
            q.fillStyle = '#020617'; rr(q, w * 0.44, h * 0.86, w * 0.36, h * 0.09, 3); q.fill();
        });
        blit(g, F, 0, 0, w, h, X.exato);
        R.coins = R.coins || []; R.push = R.push || 0; R.up = R.up || -9;
        X.hits.forEach(hh => { R.push = lado(X, hh.lane) ? 0.35 : -0.35; if (X.fev > 0.5) { const b = BT[hh.lane]; if (b) R.coins.push({ x: b.x, y: b.y, t0: t, vx: (Math.random() - 0.5) * w * 0.15 }); if (t - R.up > 1.2) R.up = t; } });
        if (X.marco) R.up = t;
        // lâmpadas do letreiro
        const nb = 16, cor = X.brk > 0.15 ? VERM : X.fev > 0.5 ? OURO : '#fde047', fase = Math.floor(X.beat * 2);
        for (let i = 0; i < nb; i++) {
            const x = w * 0.08 + (w * 0.84) * (i + 0.5) / nb, on = (i + fase) % 2 === 0;
            g.fillStyle = on ? cor : '#3b3416'; g.fillRect(x - 2, h * 0.035 - 2, 4, 4); g.fillRect(x - 2, h * 0.185 - 2, 4, 4);
        }
        // alavanca
        R.push *= Math.exp(-dt * 6); if (Math.abs(R.push) > 0.01) X.S.anim = true;
        const a = Math.sin(X.beat * Math.PI) * 0.28 + R.push, len = h * 0.3;
        const tx = js.x + Math.sin(a) * len, ty = js.y - Math.cos(a) * len * 0.85;
        g.strokeStyle = '#cbd5e1'; g.lineWidth = Math.max(3, h * 0.03); g.lineCap = 'round'; g.beginPath(); g.moveTo(js.x, js.y); g.lineTo(tx, ty); g.stroke(); g.lineCap = 'butt';
        const rbJ = h * 0.075, bola = cache('bola', rbJ * 2, rbJ * 2, X.esc, q => {
            q.fillStyle = '#dc2626'; q.beginPath(); q.arc(rbJ, rbJ, rbJ, 0, 7); q.fill();
            q.fillStyle = 'rgba(255,255,255,.45)'; q.beginPath(); q.ellipse(rbJ * 0.7, rbJ * 0.62, rbJ * 0.38, rbJ * 0.24, -0.5, 0, 7); q.fill();
        });
        blit(g, bola, tx - rbJ, ty - rbJ, rbJ * 2, rbJ * 2, X.exato);
        // botões
        BT.forEach((b, i) => {
            const ln = lanes[i]; if (!ln) return; const on = ln.on, rb = b.rb, sz = rb * 2.8;
            const sp = cache('btn' + ln.cor + (on ? 1 : 0), sz, sz, X.esc, q => {
                const c = sz / 2;
                if (on) { q.globalAlpha = 0.35; q.fillStyle = ln.cor; q.beginPath(); q.arc(c, c, rb * 1.35, 0, 7); q.fill(); q.globalAlpha = 1; }
                q.fillStyle = P.shade(ln.cor, -0.55); q.beginPath(); q.arc(c, c + (on ? rb * 0.08 : rb * 0.22), rb, 0, 7); q.fill();
                q.fillStyle = on ? P.shade(ln.cor, 0.25) : P.shade(ln.cor, -0.15); q.beginPath(); q.arc(c, c + (on ? rb * 0.06 : 0), rb, 0, 7); q.fill();
                q.fillStyle = `rgba(255,255,255,${on ? 0.55 : 0.3})`; q.beginPath(); q.ellipse(c - rb * 0.2, c - rb * 0.3 + (on ? rb * 0.06 : 0), rb * 0.45, rb * 0.25, -0.3, 0, 7); q.fill();
            });
            blit(g, sp, b.x - sz / 2, b.y - sz / 2, sz, sz, X.exato);
        });
        // moedinhas e 1UP
        if (R.coins.length) {
            X.S.anim = true; const rc = h * 0.04;
            const moeda = cache('moeda', rc * 2, rc * 2, X.esc, q => { q.fillStyle = '#b45309'; q.beginPath(); q.arc(rc, rc, rc, 0, 7); q.fill(); q.fillStyle = '#fde047'; q.beginPath(); q.arc(rc, rc, rc * 0.8, 0, 7); q.fill(); q.fillStyle = '#b45309'; q.fillRect(rc * 0.85, rc * 0.45, rc * 0.3, rc * 1.1); });
            R.coins = R.coins.filter(c => { const a2 = t - c.t0; if (a2 > 0.9) return false; g.globalAlpha = 1 - a2 / 0.9; blit(g, moeda, c.x + c.vx * a2 - rc, c.y - a2 * h * 0.7 + a2 * a2 * h * 0.3 - rc, rc * 2, rc * 2, X.exato); return true; });
            g.globalAlpha = 1;
        }
        if (t - R.up < 1.1) { X.S.anim = true; const a2 = (t - R.up) / 1.1; g.globalAlpha = 1 - a2 * a2; txt(X, '1UP!', '#4ade80', h * 0.12, w / 2, h * 0.3 - a2 * h * 0.08, 'c'); g.globalAlpha = 1; }
        if (X.brk > 0.15) { g.fillStyle = '#0b0620'; g.fillRect(w * 0.08, h * 0.05, w * 0.84, h * 0.13); txt(X, 'CONTINUE?', VERM, h * 0.09, w / 2, h * 0.115, 'c'); }
        txt(X, comboTxt(X), corEstado(X, '#f472b6'), h * 0.06, w * 0.62, h * 0.905, 'c');
    });

    // =================================================================================
    // LAUNCHPAD NEON
    // =================================================================================
    const FONTE = {
        B: ['11110', '10001', '11110', '10001', '11110'], E: ['11111', '10000', '11110', '10000', '11111'], A: ['01110', '10001', '11111', '10001', '10001'],
        T: ['11111', '00100', '00100', '00100', '00100'], M: ['10001', '11011', '10101', '10001', '10001'], X: ['10001', '01010', '00100', '01010', '10001']
    };
    const PALAVRA = (() => { const cols = []; 'BEATMAX'.split('').forEach(ch => { for (let c = 0; c < 5; c++) cols.push(FONTE[ch].map(r => r[c] === '1')); cols.push([0, 0, 0, 0, 0]); }); return cols; })();
    registra('launchpad', (X, w, h) => {
        const { g, R, dt, t, n, lanes } = X;
        // a grade se ajusta ao espaço: pad quadrado pelo tamanho da altura e tantas colunas
        // quantas couberem (na proporção Clássica, que é baixinha, fica larga em vez de um bloquinho)
        const gx0 = w * 0.07, gx1 = w * 0.87, gy0 = h * 0.07, gy1 = h * 0.93;
        const RW = h < 220 ? 7 : 8, C = Math.max(16, Math.min(44, Math.floor((gx1 - gx0) / ((gy1 - gy0) / RW))));
        const ps = Math.min((gx1 - gx0) / C, (gy1 - gy0) / RW), ox = gx0 + ((gx1 - gx0) - ps * C) / 2, oy = gy0 + ((gy1 - gy0) - ps * RW) / 2, gap = ps * 0.12;
        const F = cache('lp' + C + 'x' + RW + '|' + X.op, w, h, X.esc, q => {
            q.globalAlpha = X.op; q.fillStyle = '#0a0a12'; rr(q, w * 0.03, h * 0.02, w * 0.94, h * 0.96, 10); q.fill(); q.globalAlpha = 1; q.strokeStyle = '#27272a'; q.lineWidth = 2; q.stroke();
            for (let r = 0; r < RW; r++) for (let c = 0; c < C; c++) { q.fillStyle = '#16161f'; rr(q, ox + c * ps + gap / 2, oy + r * ps + gap / 2, ps - gap, ps - gap, 2); q.fill(); }
            for (let r = 0; r < RW; r++) { q.fillStyle = '#1c1c27'; q.beginPath(); q.arc(w * 0.915, oy + (r + 0.5) * ps, ps * 0.3, 0, 7); q.fill(); }
        });
        blit(g, F, 0, 0, w, h, X.exato);
        if (!R.I || R.I.length !== C * RW) { R.I = new Float32Array(C * RW); R.K = new Array(C * RW).fill('#fff'); R.rip = []; if (R.txt == null) R.txt = -99; }
        const I = R.I, K = R.K, dec = Math.exp(-dt * 5);
        let vivo = false;
        for (let i = 0; i < I.length; i++) { I[i] *= dec; if (I[i] > 0.04) vivo = true; }
        X.hits.forEach(hh => R.rip.push({ c0: (hh.lane + 0.5) / n * C - 0.5, t0: t, cor: hh.cor }));
        if (X.marco && X.combo >= 50) R.txt = t;
        R.rip = R.rip.filter(rp => {
            const a = t - rp.t0; if (a > 0.6) return false; const rad = a * C * 0.9, f = 1 - a / 0.6, cor = corEstado(X, rp.cor);
            for (let r = 0; r < RW; r++) for (let c = 0; c < C; c++) { const d = Math.hypot(c - rp.c0, RW - 1 - r), v = Math.max(0, 1 - Math.abs(d - rad) / 1.3) * f; const i = r * C + c; if (v > I[i]) { I[i] = v; K[i] = cor; } }
            return true;
        });
        if (R.rip.length || vivo) X.S.anim = true;
        const amb = X.combo >= 50 || X.fev > 0.5, ta = t - R.txt, rolando = ta < (C + PALAVRA.length) / 14;
        if (rolando) X.S.anim = true;
        const desl = Math.floor(C - ta * 14);
        for (let r = 0; r < RW; r++) for (let c = 0; c < C; c++) {
            const i = r * C + c; let v = I[i], cor = K[i];
            const lc = lanes[Math.min(n - 1, Math.floor(c * n / C))], base = r === RW - 1 ? 0.2 : 0.07;   // brilho de repouso na cor da lane
            if (lc && base > v) { v = base; cor = lc.cor; }
            if (amb) { const a = 0.16 * (0.5 + 0.5 * Math.sin(c * 0.7 - X.beat * Math.PI + r * 0.5)); if (a > v) { v = a; cor = X.fev > 0.5 ? OURO : HUE[(c * 2 + Math.floor(t * 8)) % 36]; } }
            if (rolando && r >= 1 && r <= 5) { const pc = c - desl; if (pc >= 0 && pc < PALAVRA.length && PALAVRA[pc][r - 1]) { v = 1; cor = X.fev > 0.5 ? OURO : '#ffffff'; } }
            if (X.brk > 0.15 && (Math.abs(c * RW / C - r) < 0.7 || Math.abs((C - 1 - c) * RW / C - r) < 0.7)) { v = Math.max(v, X.brk); cor = VERM; }
            if (v > 0.04) { g.globalAlpha = Math.min(1, v); g.fillStyle = cor; g.fillRect(ox + c * ps + gap / 2, oy + r * ps + gap / 2, ps - gap, ps - gap); }
        }
        g.globalAlpha = 1;
        // coluna apertada: dois pads de baixo acesos
        lanes.forEach((ln, l) => {
            if (!ln.on) return; const c0 = Math.floor(l * C / n), c1 = Math.max(c0 + 1, Math.floor((l + 1) * C / n)); g.fillStyle = ln.cor;
            for (let c = c0; c < c1; c++) for (let r = RW - 2; r < RW; r++) g.fillRect(ox + c * ps + gap / 2, oy + r * ps + gap / 2, ps - gap, ps - gap);
        });
        // botões do lado acendem no ritmo
        g.fillStyle = corEstado(X, '#a78bfa'); g.globalAlpha = 0.3 + 0.6 * X.pulso;
        const rb = Math.floor(X.beat) % RW; g.beginPath(); g.arc(w * 0.915, oy + (rb + 0.5) * ps, ps * 0.3, 0, 7); g.fill(); g.globalAlpha = 1;
    });

    // =================================================================================
    // GATINHO NO TECLADO — simples: uma tecla grande por lane (4B = 4 teclas; mais lanes,
    // mais teclas) e um gatão deitado em cima batendo as patinhas.
    // =================================================================================
    const LAR = '#f59e0b', LAR2 = '#d97706', CREME = '#fff7ed';
    const gatoGeo = (w, h) => ({ bx: w * 0.45, by: h * 0.42, rx: w * 0.165, ry: h * 0.21, hx: w * 0.615, hy: h * 0.3, hr: h * 0.17 });
    function gatoCorpo(q, w, h) {
        const { bx, by, rx, ry, hx, hy, hr } = gatoGeo(w, h);
        q.fillStyle = LAR; q.beginPath(); q.ellipse(bx, by, rx, ry, 0, 0, 7); q.fill();
        q.fillStyle = CREME; q.beginPath(); q.ellipse(bx + rx * 0.1, by + ry * 0.55, rx * 0.62, ry * 0.32, 0, 0, 7); q.fill();
        q.strokeStyle = LAR2; q.lineWidth = h * 0.028; q.lineCap = 'round';
        for (let i = 0; i < 4; i++) { const x = bx + (i - 1.5) * rx * 0.24; q.beginPath(); q.moveTo(x, by - ry * 0.8); q.quadraticCurveTo(x + rx * 0.06, by - ry * 0.55, x, by - ry * 0.25); q.stroke(); }   // 4 listras centradas no corpo
        // orelhas
        q.fillStyle = LAR; q.beginPath(); q.moveTo(hx - hr * 0.95, hy - hr * 0.35); q.lineTo(hx - hr * 0.7, hy - hr * 1.3); q.lineTo(hx - hr * 0.15, hy - hr * 0.8); q.fill();
        q.beginPath(); q.moveTo(hx + hr * 0.95, hy - hr * 0.35); q.lineTo(hx + hr * 0.7, hy - hr * 1.3); q.lineTo(hx + hr * 0.15, hy - hr * 0.8); q.fill();
        q.fillStyle = '#f9a8d4'; q.beginPath(); q.moveTo(hx - hr * 0.75, hy - hr * 0.5); q.lineTo(hx - hr * 0.66, hy - hr * 1.05); q.lineTo(hx - hr * 0.35, hy - hr * 0.72); q.fill();
        q.beginPath(); q.moveTo(hx + hr * 0.75, hy - hr * 0.5); q.lineTo(hx + hr * 0.66, hy - hr * 1.05); q.lineTo(hx + hr * 0.35, hy - hr * 0.72); q.fill();
        // cabeça
        q.fillStyle = LAR; q.beginPath(); q.ellipse(hx, hy, hr * 1.05, hr * 0.92, 0, 0, 7); q.fill();
        q.fillStyle = CREME; q.beginPath(); q.ellipse(hx, hy + hr * 0.42, hr * 0.55, hr * 0.38, 0, 0, 7); q.fill();
        q.strokeStyle = LAR2; q.lineWidth = h * 0.02; q.beginPath(); q.moveTo(hx, hy - hr * 0.85); q.lineTo(hx, hy - hr * 0.5); q.stroke();
        q.beginPath(); q.moveTo(hx - hr * 0.25, hy - hr * 0.8); q.lineTo(hx - hr * 0.2, hy - hr * 0.55); q.stroke(); q.beginPath(); q.moveTo(hx + hr * 0.25, hy - hr * 0.8); q.lineTo(hx + hr * 0.2, hy - hr * 0.55); q.stroke();
        [-1, 1].forEach(s => { q.fillStyle = '#16a34a'; q.beginPath(); q.ellipse(hx + s * hr * 0.42, hy - hr * 0.02, hr * 0.2, hr * 0.24, 0, 0, 7); q.fill(); q.fillStyle = '#111'; q.beginPath(); q.ellipse(hx + s * hr * 0.42, hy - hr * 0.02, hr * 0.07, hr * 0.19, 0, 0, 7); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(hx + s * hr * 0.37, hy - hr * 0.12, hr * 0.06, 0, 7); q.fill(); });
        q.fillStyle = '#f472b6'; q.beginPath(); q.moveTo(hx - hr * 0.1, hy + hr * 0.25); q.lineTo(hx + hr * 0.1, hy + hr * 0.25); q.lineTo(hx, hy + hr * 0.36); q.fill();
        q.strokeStyle = '#7c2d12'; q.lineWidth = h * 0.01; q.beginPath(); q.moveTo(hx, hy + hr * 0.36); q.quadraticCurveTo(hx - hr * 0.12, hy + hr * 0.52, hx - hr * 0.24, hy + hr * 0.42); q.moveTo(hx, hy + hr * 0.36); q.quadraticCurveTo(hx + hr * 0.12, hy + hr * 0.52, hx + hr * 0.24, hy + hr * 0.42); q.stroke();
        q.strokeStyle = 'rgba(255,255,255,.8)'; q.lineWidth = h * 0.006;
        [-1, 1].forEach(s => { for (let k = -1; k <= 1; k++) { q.beginPath(); q.moveTo(hx + s * hr * 0.45, hy + hr * 0.38); q.lineTo(hx + s * hr * 1.25, hy + hr * (0.3 + k * 0.14)); q.stroke(); } });
        q.lineCap = 'butt';
    }
    registra('gatinho', (X, w, h) => {
        const { g, R, dt, t, n, lanes } = X, GG = gatoGeo(w, h);
        // teclado: uma tecla por lane
        const bd = { x: w * 0.09, y: h * 0.585, w: w * 0.82, h: h * 0.345 }, pad = w * 0.03, gap = w * 0.018;
        const kw = (bd.w - pad * 2 - gap * (n - 1)) / n, ky = h * 0.665, kh = h * 0.19;
        const kx = (l) => bd.x + pad + l * (kw + gap);
        const F = cache('gatoBase' + n, w, h, X.esc, q => {
            q.fillStyle = '#1f2937'; rr(q, bd.x, bd.y, bd.w, bd.h, 8); q.fill(); q.strokeStyle = '#475569'; q.lineWidth = 1.5; q.stroke();
            for (let l = 0; l < n; l++) { q.fillStyle = '#0f172a'; rr(q, kx(l), ky + 3, kw, kh, 5); q.fill(); q.fillStyle = '#334155'; rr(q, kx(l), ky, kw, kh, 5); q.fill(); q.fillStyle = 'rgba(255,255,255,.06)'; rr(q, kx(l) + kw * 0.08, ky + 2, kw * 0.84, kh * 0.25, 3); q.fill(); }
        });
        blit(g, F, 0, 0, w, h, X.exato);
        R.fl = R.fl || [];
        X.hits.forEach(hh => { R.fl[hh.lane] = 1; });
        lanes.forEach((ln, l) => {
            const x = kx(l), f = R.fl[l] = Math.max(0, (R.fl[l] || 0) - dt * 4); if (f > 0.01) X.S.anim = true;
            const cor = corEstado(X, ln.cor);
            if (ln.on) { g.fillStyle = cor; rr(g, x, ky + 3, kw, kh, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; rr(g, x + kw * 0.08, ky + 5, kw * 0.84, kh * 0.22, 3); g.fill(); }
            else {
                if (f > 0.01) { g.globalAlpha = f * 0.6; g.fillStyle = cor; rr(g, x, ky, kw, kh, 5); g.fill(); g.globalAlpha = 1; }
                g.fillStyle = cor; g.globalAlpha = 0.75; g.fillRect(x + kw * 0.3, ky + kh * 0.78, kw * 0.4, kh * 0.08); g.globalAlpha = 1;
            }
        });
        // rabo (atrás do corpo)
        const sw = Math.sin(t * 2.4) * (X.fev > 0.5 ? 1.8 : 1);
        const tx0 = GG.bx - GG.rx * 0.85, ty0 = GG.by + GG.ry * 0.2, tx1 = w * (0.17 + sw * 0.03), ty1 = h * (0.16 + Math.abs(sw) * 0.03);
        g.strokeStyle = LAR; g.lineWidth = h * 0.07; g.lineCap = 'round';
        g.beginPath(); g.moveTo(tx0, ty0); g.bezierCurveTo(GG.bx - GG.rx * 1.5, ty0 + h * 0.05, w * 0.16, h * 0.4, tx1, ty1); g.stroke();
        g.strokeStyle = LAR2; g.beginPath(); g.moveTo(tx1, ty1); g.lineTo(tx1 + w * 0.002, ty1 - h * 0.012); g.stroke();
        // corpo pronto — no BREAK ele estica
        const esp = X.brk > 0.2, gc = cache('gato2', w, h * 0.64, X.esc, q => gatoCorpo(q, w, h));
        if (esp) { const k = 1 + 0.3 * X.brk; g.drawImage(gc, GG.bx * (1 - k), 0, w * k, h * 0.64); }
        else blit(g, gc, 0, 0, w, h * 0.64, X.exato);
        // piscar
        if ((t % 3.7) < 0.13 || esp) {
            const { hy, hr } = GG, hx = esp ? GG.bx + (GG.hx - GG.bx) * (1 + 0.3 * X.brk) : GG.hx; g.fillStyle = LAR; const kk = esp ? 1 + 0.3 * X.brk : 1;
            [-1, 1].forEach(s => { g.beginPath(); g.ellipse(hx + s * hr * 0.42 * kk, hy - hr * 0.02, hr * 0.25 * kk, hr * 0.28, 0, 0, 7); g.fill(); });
            g.strokeStyle = '#7c2d12'; g.lineWidth = 1.5; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(hx + (s * 0.42 - 0.18) * hr * kk, hy); g.lineTo(hx + (s * 0.42 + 0.18) * hr * kk, hy); g.stroke(); });
        }
        // patinhas: a mais perto vai na tecla
        const ombro = [{ x: GG.bx - GG.rx * 0.35, y: GG.by + GG.ry * 0.75 }, { x: GG.bx + GG.rx * 0.5, y: GG.by + GG.ry * 0.75 }];
        R.pata = R.pata || ombro.map(o => ({ x: o.x, y: h * 0.62, alvo: null, t0: -9 }));
        X.hits.forEach(hh => { const cx = kx(hh.lane) + kw / 2, p = R.pata[Math.abs(cx - ombro[0].x) <= Math.abs(cx - ombro[1].x) ? 0 : 1]; p.alvo = { x: cx, y: ky + kh * 0.5, lane: hh.lane }; p.t0 = t; });
        g.lineCap = 'round';
        R.pata.forEach((p, i) => {
            const o = ombro[i]; let tx = o.x, ty = h * 0.62;
            if (esp) { tx = i ? kx(n - 1) + kw * 0.8 : kx(0) + kw * 0.2; ty = ky + kh * 0.5; }
            else if (p.alvo) { const seg = lanes[p.alvo.lane] && lanes[p.alvo.lane].on; if (seg || t - p.t0 < 0.14) { tx = p.alvo.x; ty = p.alvo.y; } else p.alvo = null; }
            p.x += (tx - p.x) * Math.min(1, dt * 28); p.y += (ty - p.y) * Math.min(1, dt * 28);
            if (Math.hypot(tx - p.x, ty - p.y) > 1) X.S.anim = true;
            g.strokeStyle = LAR; g.lineWidth = h * 0.09; g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(p.x, p.y); g.stroke();
            g.fillStyle = CREME; g.beginPath(); g.ellipse(p.x, p.y, h * 0.062, h * 0.047, 0, 0, 7); g.fill();
            g.fillStyle = '#f9a8d4'; for (let d = -1; d <= 1; d++) { g.beginPath(); g.arc(p.x + d * h * 0.028, p.y + h * 0.016, h * 0.011, 0, 7); g.fill(); }
        });
        g.lineCap = 'butt';
        // miau!
        if (X.marco && X.combo % 50 === 0) R.miau = t;
        if (t - (R.miau || -9) < 1.3) {
            X.S.anim = true; const bx = Math.min(w * 0.88, GG.hx + GG.hr * 2.2), by = GG.hy - GG.hr * 0.8;
            g.fillStyle = '#fff'; rr(g, bx - w * 0.07, by - h * 0.07, w * 0.14, h * 0.14, 8); g.fill();
            g.beginPath(); g.moveTo(bx - w * 0.05, by + h * 0.06); g.lineTo(bx - w * 0.08, by + h * 0.11); g.lineTo(bx - w * 0.02, by + h * 0.06); g.fill();
            txt(X, 'miau!', '#c2410c', h * 0.08, bx, by, 'c');
        }
        txt(X, comboTxt(X), corEstado(X, '#fdba74'), h * 0.06, w * 0.985, h * 0.07, 'r');
    });
    // =================================================================================
    // SINTETIZADOR DA ECHO
    // =================================================================================
    const PRETA = [1, 1, 0, 1, 1, 1, 0]; // tem tecla preta depois da branca (C D E F G A B)
    registra('synth', (X, w, h) => {
        const { g, R, dt, t, n, lanes } = X;
        const WN = 14, kx0 = w * 0.04, kx1 = w * 0.96, ky0 = h * 0.45, ky1 = h * 0.93, kw = (kx1 - kx0) / WN, kh = ky1 - ky0;
        const sc = { x: w * 0.05, y: h * 0.08, w: w * 0.36, h: h * 0.3 }, kn = [0, 1, 2, 3, 4].map(i => ({ x: w * (0.49 + i * 0.075), y: h * 0.17, r: h * 0.06 }));
        const pretas = []; for (let i = 0; i < WN - 1; i++) if (PRETA[i % 7]) pretas.push({ x: kx0 + (i + 1) * kw - kw * 0.3, w: kw * 0.6, i });
        const F = cache('syn|' + X.op, w, h, X.esc, q => {
            q.globalAlpha = X.op; q.fillStyle = '#17143a'; rr(q, w * 0.02, h * 0.03, w * 0.96, h * 0.94, 10); q.fill(); q.globalAlpha = 1; q.strokeStyle = '#8b5cf6'; q.lineWidth = 2; q.stroke();
            q.fillStyle = '#02130a'; rr(q, sc.x, sc.y, sc.w, sc.h, 5); q.fill(); q.strokeStyle = '#334155'; q.lineWidth = 1.5; q.stroke();
            q.strokeStyle = 'rgba(74,222,128,.12)'; q.lineWidth = 1;
            for (let i = 1; i < 6; i++) { q.beginPath(); q.moveTo(sc.x + sc.w * i / 6, sc.y); q.lineTo(sc.x + sc.w * i / 6, sc.y + sc.h); q.stroke(); }
            for (let i = 1; i < 4; i++) { q.beginPath(); q.moveTo(sc.x, sc.y + sc.h * i / 4); q.lineTo(sc.x + sc.w, sc.y + sc.h * i / 4); q.stroke(); }
            kn.forEach(k => { q.fillStyle = '#0b0920'; q.beginPath(); q.arc(k.x, k.y, k.r * 1.25, 0, 7); q.fill(); q.fillStyle = '#2e2a5c'; q.beginPath(); q.arc(k.x, k.y, k.r, 0, 7); q.fill(); });
            q.fillStyle = '#c4b5fd'; q.font = `900 ${h * 0.055}px Orbitron, sans-serif`; q.textAlign = 'left'; q.textBaseline = 'middle'; q.fillText('ECHO SYNTH', w * 0.47, h * 0.33);
            q.fillStyle = '#0b0920'; rr(q, w * 0.82, h * 0.08, w * 0.14, h * 0.13, 4); q.fill();
            q.fillStyle = '#000'; q.fillRect(kx0 - 2, ky0 - 3, kx1 - kx0 + 4, kh + 5);
            for (let i = 0; i < WN; i++) { q.fillStyle = '#f8fafc'; q.fillRect(kx0 + i * kw + 1, ky0, kw - 2, kh); q.fillStyle = 'rgba(15,23,42,.12)'; q.fillRect(kx0 + i * kw + 1, ky1 - kh * 0.08, kw - 2, kh * 0.08); }
            pretas.forEach(p => { q.fillStyle = '#0f0f1a'; q.fillRect(p.x, ky0, p.w, kh * 0.6); q.fillStyle = 'rgba(255,255,255,.12)'; q.fillRect(p.x + p.w * 0.15, ky0, p.w * 0.7, kh * 0.05); });
        });
        blit(g, F, 0, 0, w, h, X.exato);
        R.en = R.en || 0; R.kick = R.kick || 0;
        X.hits.forEach(() => { R.en = Math.min(1.5, R.en + 0.45); R.kick = 1; });
        R.en = Math.max(0, R.en - dt * 1.6); R.kick = Math.max(0, R.kick - dt * 3);
        if (R.en > 0.02 || R.kick > 0.02) X.S.anim = true;
        const idx = (l) => Math.max(0, Math.min(WN - 1, Math.round((l + 0.5) / n * WN - 0.5)));
        lanes.forEach((ln, l) => {
            const i = idx(l), x = kx0 + i * kw;
            if (ln.on) {
                g.fillStyle = ln.cor; g.globalAlpha = 0.85; g.fillRect(x + 1, ky0 + 2, kw - 2, kh - 2); g.globalAlpha = 1;
                g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 1, ky0 + 2, kw - 2, kh * 0.06);
                g.fillStyle = ln.cor; g.fillRect(x + 1, ky0 - h * 0.035, kw - 2, h * 0.02);
                pretas.forEach(p => { if (p.x < x + kw && p.x + p.w > x) { g.fillStyle = '#0f0f1a'; g.fillRect(p.x, ky0, p.w, kh * 0.6); } });
            } else { g.fillStyle = ln.cor; g.fillRect(x + kw * 0.3, ky1 - kh * 0.16, kw * 0.4, kh * 0.06); }
        });
        // botões girando
        kn.forEach((k, i) => {
            const a = -2.3 + (0.5 + 0.5 * Math.sin(t * 0.6 + i * 1.3)) * 3 + R.kick * (i % 2 ? 0.7 : -0.7);
            g.strokeStyle = corEstado(X, i % 2 ? '#a78bfa' : '#60a5fa'); g.lineWidth = 2.5; g.beginPath(); g.arc(k.x, k.y, k.r * 1.12, -2.3 - Math.PI / 2, a - Math.PI / 2); g.stroke();
            g.strokeStyle = '#e9d5ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(k.x, k.y); g.lineTo(k.x + Math.sin(a) * k.r * 0.8, k.y - Math.cos(a) * k.r * 0.8); g.stroke();
        });
        // osciloscópio
        const cy = sc.y + sc.h / 2, ciclos = 1.5 + X.bpm / 80, amp = sc.h * (0.08 + 0.3 * Math.min(1, R.en)), cor = corEstado(X, '#4ade80');
        g.beginPath();
        for (let i = 0; i <= 56; i++) {
            const u = i / 56, ph = u * ciclos * Math.PI * 2 - X.beat * Math.PI * 2;
            const y = X.brk > 0.15 ? cy + (Math.random() - 0.5) * sc.h * 0.12 * X.brk : cy + Math.sin(ph) * amp * (1 + 0.3 * Math.sin(ph * 3 + t * 2));
            const x = sc.x + 3 + u * (sc.w - 6); i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = cor; g.globalAlpha = 0.25; g.lineWidth = 5; g.stroke(); g.globalAlpha = 1; g.lineWidth = 2; g.stroke();
        txt(X, X.brk > 0.15 ? 'BREAK' : String(X.combo), corEstado(X, '#c4b5fd'), h * 0.07, w * 0.89, h * 0.145, 'c');
    });

    // =================================================================================
    // SHOW DA TURMA (usa as folhas 8-bit da Torcida)
    // =================================================================================
    const SLOTS = [
        { id: 'iris', x: 0.15, inst: 'guitarra', toca: [2, 3, 4, 5, 4, 3], fps: 8, para: [1], acerto: [0, 2], brk: [1] },
        { id: 'jade', x: 0.39, inst: 'bateria', toca: [4, 5, 6, 5], fps: 6, para: [0, 1, 0, 7], acerto: [9, 10], brk: [21, 16] },
        { id: 'arya', x: 0.62, inst: 'mic', toca: [9, 10, 9, 11], fps: 4, para: [10], acerto: [9], brk: [5, 11] },
        { id: 'echo', x: 0.86, inst: 'teclado', toca: [4, 5, 6, 7], fps: 9, para: [0, 2, 3, 0], acerto: [4, 6], brk: [1] }
    ];
    const IMG = {};
    function folha(id) {
        if (IMG[id]) return IMG[id];
        const sp = window.TORCIDA_API && window.TORCIDA_API.SPR[id]; if (!sp) return null;
        const im = new Image(); im.src = sp.src; IMG[id] = im; return im;
    }
    function notaSpr(X, cor, s) {
        return cache('nota' + cor, s, s, X.esc, q => { const u = s / 8; q.fillStyle = cor; q.fillRect(5 * u, 0, u, 6 * u); q.fillRect(5 * u, 0, 3 * u, u); q.fillRect(6 * u, u, 2 * u, u); q.fillRect(2 * u, 5 * u, 4 * u, 3 * u); });
    }
    function instrumento(q, tipo, s) { // desenhado num canvas s x s, "chão" em baixo
        const u = s / 32;
        if (tipo === 'bateria') {
            q.fillStyle = '#7f1d1d'; q.beginPath(); q.arc(16 * u, 22 * u, 9 * u, 0, 7); q.fill(); q.fillStyle = '#f1f5f9'; q.beginPath(); q.arc(16 * u, 22 * u, 7 * u, 0, 7); q.fill();
            q.fillStyle = '#7f1d1d'; q.font = `900 ${5 * u}px Orbitron, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('BM', 16 * u, 22.5 * u);
            q.fillStyle = '#991b1b'; q.fillRect(4 * u, 13 * u, 7 * u, 5 * u); q.fillRect(21 * u, 13 * u, 7 * u, 5 * u);
            q.fillStyle = '#e5e7eb'; q.fillRect(4 * u, 12 * u, 7 * u, u); q.fillRect(21 * u, 12 * u, 7 * u, u);
            q.fillStyle = '#94a3b8'; q.fillRect(2 * u, 9 * u, u, 22 * u); q.fillRect(29 * u, 9 * u, u, 22 * u);
        } else if (tipo === 'teclado') {
            q.fillStyle = '#4c1d95'; q.fillRect(2 * u, 14 * u, 28 * u, 6 * u); q.fillStyle = '#f8fafc'; q.fillRect(3 * u, 15 * u, 26 * u, 3 * u);
            q.fillStyle = '#111'; for (let i = 0; i < 9; i++) if (i % 3 !== 2) q.fillRect((4.5 + i * 2.8) * u, 15 * u, 1.4 * u, 1.8 * u);
            q.fillStyle = '#64748b'; q.fillRect(7 * u, 20 * u, u, 11 * u); q.fillRect(24 * u, 20 * u, u, 11 * u); q.fillRect(5 * u, 30 * u, 22 * u, u);
        } else if (tipo === 'mic') {
            q.fillStyle = '#64748b'; q.fillRect(15.5 * u, 10 * u, u, 21 * u); q.fillRect(11 * u, 30 * u, 10 * u, u);
            q.fillStyle = '#1f2937'; q.fillRect(14 * u, 6 * u, 4 * u, 5 * u); q.fillStyle = '#9ca3af'; q.fillRect(14.5 * u, 6.5 * u, 3 * u, 2 * u);
        } else if (tipo === 'guitarra') {
            q.save(); q.translate(16 * u, 18 * u); q.rotate(-0.6);
            q.fillStyle = '#ec4899'; q.beginPath(); q.ellipse(-3 * u, 2 * u, 5 * u, 4 * u, 0, 0, 7); q.fill(); q.beginPath(); q.ellipse(1 * u, 2 * u, 3.5 * u, 3 * u, 0, 0, 7); q.fill();
            q.fillStyle = '#111'; q.beginPath(); q.arc(-1.5 * u, 2 * u, 1.2 * u, 0, 7); q.fill();
            q.fillStyle = '#78350f'; q.fillRect(3 * u, 1.3 * u, 12 * u, 1.4 * u); q.fillStyle = '#1f2937'; q.fillRect(14 * u, 0.6 * u, 3 * u, 2.8 * u);
            q.restore();
        }
    }
    registra('show', (X, w, h) => {
        const { g, R, dt, t, n } = X;
        const chao = h * 0.86;
        const F = cache('show|' + X.op, w, h, X.esc, q => {
            const gr = q.createLinearGradient(0, 0, 0, chao); gr.addColorStop(0, '#1e1040'); gr.addColorStop(1, '#0b0717'); q.fillStyle = gr; q.globalAlpha = X.op; q.fillRect(0, 0, w, chao); q.globalAlpha = 1;
            q.fillStyle = '#7f1d1d'; for (let x = 0; x < w * 0.05; x += 4) { q.fillStyle = x % 8 ? '#991b1b' : '#7f1d1d'; q.fillRect(x, 0, 4, chao); q.fillRect(w - x - 4, 0, 4, chao); }
            q.fillStyle = '#991b1b'; q.fillRect(0, 0, w, h * 0.06); q.fillStyle = '#7f1d1d'; for (let x = 0; x < w; x += 12) q.fillRect(x, h * 0.06, 8, 4);
            q.fillStyle = 'rgba(253,224,71,.85)'; q.font = `900 ${h * 0.07}px Orbitron, sans-serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('BEATMAX', w / 2, h * 0.14);
            q.fillStyle = '#2a1a0e'; q.fillRect(0, chao, w, h - chao); q.fillStyle = '#3b2414';
            for (let y = chao; y < h; y += 5) q.fillRect(0, y, w, 3);
            q.fillStyle = '#f59e0b'; q.fillRect(0, chao, w, 2);
            q.fillStyle = '#111827'; q.fillRect(w * 0.035, chao - h * 0.2, w * 0.07, h * 0.2); q.fillStyle = '#374151'; q.fillRect(w * 0.042, chao - h * 0.18, w * 0.056, h * 0.13);
        });
        blit(g, F, 0, 0, w, h, X.exato);
        R.st = R.st || SLOTS.map(() => ({ an: 'para', t0: 0, fl: 0 })); R.notas = R.notas || [];
        const grp = (l) => Math.min(3, Math.floor(l * 4 / n));
        X.hits.forEach(hh => { const s = R.st[grp(hh.lane)]; if (s.an !== 'brk') { s.an = 'acerto'; s.t0 = t; } s.fl = 1; const sl = SLOTS[grp(hh.lane)]; if (R.notas.length < 30) R.notas.push({ x: w * sl.x + (Math.random() - 0.5) * w * 0.05, y: h * 0.4, t0: t, cor: hh.cor }); });
        if (X.brkAgora) R.st.forEach(s => { s.an = 'brk'; s.t0 = t; });
        // holofotes
        g.globalCompositeOperation = 'lighter';
        SLOTS.forEach((sl, i) => {
            const s = R.st[i]; s.fl = Math.max(0, s.fl - dt * 3); const cx = w * sl.x;
            const a = 0.07 + 0.25 * s.fl + (X.fev > 0.5 ? 0.08 : 0);
            g.globalAlpha = a; g.fillStyle = corEstado(X, ['#f472b6', '#4ade80', '#22d3ee', '#a78bfa'][i]);
            g.beginPath(); g.moveTo(cx - w * 0.02, 0); g.lineTo(cx + w * 0.02, 0); g.lineTo(cx + w * 0.09, chao); g.lineTo(cx - w * 0.09, chao); g.fill();
            if (s.fl > 0.02) X.S.anim = true;
        });
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        // a turma
        const Hc = h * 0.6, smooth = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
        SLOTS.forEach((sl, i) => {
            const sp = window.TORCIDA_API && window.TORCIDA_API.SPR[sl.id], im = folha(sl.id), s = R.st[i];
            const cx = w * sl.x;
            if (sp && im && im.complete && im.naturalWidth) {
                let lista = sl.para, fps = 2, um = false;
                if (s.an === 'acerto') { lista = sl.acerto; fps = 8; um = true; }
                else if (s.an === 'brk') { lista = sl.brk; fps = 2.5; um = true; }
                else if (X.fev > 0.5 || X.combo >= 30) { lista = sl.toca; fps = sl.fps; }
                const el = t - s.t0; let k = Math.floor(el * fps);
                if (um && k >= lista.length) { s.an = 'para'; k = 0; lista = X.fev > 0.5 || X.combo >= 30 ? sl.toca : sl.para; fps = sl.fps; k = Math.floor(t * fps) % lista.length; }
                else if (!um) k = Math.floor(t * fps) % lista.length;
                if (um) X.S.anim = true;
                const fr = lista[Math.min(k, lista.length - 1)], esc = Hc / sp.base, dw = sp.w * esc, dh = sp.h * esc, dy = chao - sp.base * esc;
                const quer = cx < w / 2 ? 1 : -1, vira = (sp.face || 1) !== quer;
                if (vira) { g.save(); g.translate(cx, 0); g.scale(-1, 1); g.drawImage(im, fr * sp.w, 0, sp.w, sp.h, -sp.ax * esc, dy, dw, dh); g.restore(); }
                else g.drawImage(im, fr * sp.w, 0, sp.w, sp.h, cx - sp.ax * esc, dy, dw, dh);
            }
            // instrumento na frente
            const isz = sl.inst === 'bateria' ? h * 0.42 : sl.inst === 'guitarra' ? h * 0.3 : h * 0.4;
            const ic = cache('inst' + sl.inst, isz, isz, X.esc, q => instrumento(q, sl.inst, isz));
            const iy = sl.inst === 'guitarra' ? chao - Hc * 0.62 : chao - isz, ix = sl.inst === 'guitarra' ? cx - isz * 0.55 : sl.inst === 'mic' ? cx - isz * 0.5 + w * 0.035 : cx - isz / 2;
            const tremeu = sl.inst === 'bateria' && s.fl > 0.3 ? (Math.random() - 0.5) * 2 : 0;
            g.imageSmoothingEnabled = true; blit(g, ic, ix + tremeu, iy, isz, isz, X.exato); g.imageSmoothingEnabled = false;
            if (sl.inst === 'mic' && s.fl > 0.05) { g.strokeStyle = '#22d3ee'; g.globalAlpha = s.fl; g.lineWidth = 2; for (let k2 = 1; k2 <= 2; k2++) { g.beginPath(); g.arc(ix + isz * 0.5, iy + isz * 0.25, isz * 0.12 * k2 + (1 - s.fl) * isz * 0.1, -0.8, 0.8); g.stroke(); } g.globalAlpha = 1; }
        });
        g.imageSmoothingEnabled = smooth;
        // notinhas
        if (R.notas.length) {
            X.S.anim = true; const ns = h * 0.07;
            R.notas = R.notas.filter(nt => { const a = t - nt.t0; if (a > 1) return false; g.globalAlpha = 1 - a; blit(g, notaSpr(X, nt.cor, ns), nt.x + Math.sin(a * 6) * w * 0.01, nt.y - a * h * 0.3, ns, ns, X.exato); return true; });
            g.globalAlpha = 1;
        }
        txt(X, comboTxt(X), corEstado(X, '#fde047'), h * 0.05, w * 0.93, h * 0.14, 'r');
    });

    // =================================================================================
    // ALVOS (abaixo da linha da Gear da Turma: Garnet) — um estande de tiro: um alvo por
    // botão; apertar = tiro no alvo da lane (furo, recuo e faísca). Segurar nota longa =
    // rajada. BREAK = tiro que erra e o estande fica vermelho; FEVER = alvos dourados.
    // =================================================================================
    function alvoSpr(X, cor, r, ouro) {
        return cache('alvo' + cor + (ouro ? 'o' : ''), r * 2 + 4, r * 2 + 4, X.esc, q => {
            const c = r + 2, aneis = ouro ? ['#facc15', '#fff7d6', '#ca8a04', '#fff7d6', '#ef4444'] : [cor, '#f8fafc', P.shade(cor, -0.35), '#f8fafc', '#ef4444'];
            q.fillStyle = '#0f0a1a'; q.beginPath(); q.arc(c, c, r + 1.5, 0, 7); q.fill();
            aneis.forEach((k, i) => { q.fillStyle = k; q.beginPath(); q.arc(c, c, r * (1 - i * 0.19), 0, 7); q.fill(); });
            q.strokeStyle = 'rgba(15,10,26,.35)'; q.lineWidth = 1; q.beginPath(); q.moveTo(c - r, c); q.lineTo(c + r, c); q.moveTo(c, c - r); q.lineTo(c, c + r); q.stroke();
        });
    }
    registra('alvos', (X, w, h) => {
        const { g, R, dt, t, n, lanes } = X;
        const cx = (l) => w * (0.08 + 0.84 * (l + 0.5) / n), cy = h * 0.47;
        const r = Math.max(8, Math.min(w * 0.84 / n * 0.36, h * 0.24)), balc = h * 0.8;
        const F = cache('alvosBg' + n + '|' + X.op, w, h, X.esc, q => {
            const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a0b2e'); gr.addColorStop(1, '#0b0614'); q.fillStyle = gr; P.rr(q, w * 0.01, h * 0.02, w * 0.98, h * 0.96, 10); q.globalAlpha = X.op; q.fill(); q.globalAlpha = 1;
            q.strokeStyle = '#a855f7'; q.lineWidth = 2; q.stroke();
            q.strokeStyle = 'rgba(34,211,238,.10)'; q.lineWidth = 1;
            for (let x = w * 0.04; x < w * 0.96; x += w / 24) { q.beginPath(); q.moveTo(x, h * 0.16); q.lineTo(x, balc); q.stroke(); }
            q.fillStyle = '#2e1065'; q.fillRect(w * 0.03, h * 0.04, w * 0.94, h * 0.1);
            q.fillStyle = '#22d3ee'; q.fillRect(w * 0.03, h * 0.14, w * 0.94, 2);
            for (let l = 0; l < n; l++) { const x = cx(l); q.fillStyle = '#3b2a55'; q.fillRect(x - 2, cy, 4, balc - cy); q.fillStyle = '#4c1d95'; q.fillRect(x - r * 0.5, balc - 5, r, 5); }
            const g2 = q.createLinearGradient(0, balc, 0, h); g2.addColorStop(0, '#3b0764'); g2.addColorStop(1, '#1e0436'); q.fillStyle = g2; q.fillRect(w * 0.02, balc, w * 0.96, h * 0.97 - balc);
            q.fillStyle = '#a855f7'; q.fillRect(w * 0.02, balc, w * 0.96, 2);
            q.fillStyle = 'rgba(196,181,253,.55)'; q.font = `800 ${h * 0.055}px Orbitron, sans-serif`; q.textAlign = 'left'; q.textBaseline = 'middle'; q.fillText('STAND DE TIRO · GARNET', w * 0.05, h * 0.09);
        });
        blit(g, F, 0, 0, w, h, X.exato);
        R.a = R.a || []; R.furos = R.furos || []; R.tiros = R.tiros || []; R.vira = R.vira || -9;
        const ouro = X.fev > 0.5;
        const tiro = (l, erra) => {
            const a = R.a[l] = R.a[l] || { k: 0 };
            a.k = 1;
            const ang = Math.random() * 6.28, d = erra ? r * (1.2 + Math.random() * 0.6) : Math.random() * r * 0.42;
            R.tiros.push({ l, t0: t, x: cx(l) + Math.cos(ang) * d, y: cy + Math.sin(ang) * d, erra });
            if (!erra) { R.furos.push({ l, dx: Math.cos(ang) * d, dy: Math.sin(ang) * d, t0: t }); if (R.furos.length > n * 4) R.furos.shift(); }
        };
        X.hits.forEach(hh => tiro(hh.lane, false));
        if (X.brkAgora) tiro(Math.floor(Math.random() * n), true);
        lanes.forEach((ln, l) => { const a = R.a[l] = R.a[l] || { k: 0, ult: 0 }; if (ln.on && t - (a.ult || 0) > 0.09) { a.ult = t; if (a.seg) tiro(l, false); a.seg = true; } if (!ln.on) a.seg = false; });
        if (X.marco) R.vira = t;
        // alvos
        const vira = t - R.vira < 0.6 ? Math.cos((t - R.vira) / 0.6 * Math.PI * 2) : 1;
        let anda = vira !== 1;
        lanes.forEach((ln, l) => {
            const a = R.a[l]; a.k = Math.max(0, (a.k || 0) - dt * 5); if (a.k > 0.01) anda = true;
            const sp = alvoSpr(X, ln.cor, r, ouro), x = cx(l), sw = Math.sin(t * 2 + l) * 0.04 * X.pulso;
            g.save(); g.translate(x, cy); g.rotate(sw + (X.brk > 0.15 ? Math.sin(t * 40 + l) * 0.15 * X.brk : 0)); g.scale(vira * (1 - a.k * 0.12), 1 - a.k * 0.28);
            g.drawImage(sp, -r - 2, -r - 2, r * 2 + 4, r * 2 + 4);
            // furos (somem devagar)
            for (const f of R.furos) if (f.l === l) { const v = Math.max(0, 1 - (t - f.t0) / 3); if (v <= 0) continue; g.globalAlpha = v; g.fillStyle = '#0b0614'; g.beginPath(); g.arc(f.dx, f.dy, Math.max(1.5, r * 0.09), 0, 7); g.fill(); g.globalAlpha = v * 0.6; g.strokeStyle = '#fde68a'; g.lineWidth = 1; g.stroke(); }
            g.globalAlpha = 1; g.restore();
            if (ln.on) { g.strokeStyle = ln.cor; g.globalAlpha = 0.6; g.lineWidth = 2; g.beginPath(); g.arc(x, cy, r + 4, 0, 7); g.stroke(); g.globalAlpha = 1; }
        });
        R.furos = R.furos.filter(f => t - f.t0 < 3);
        // tiros: rastro, clarão no balcão e faísca no impacto
        R.tiros = R.tiros.filter(s => {
            const k = (t - s.t0) / 0.18; if (k >= 1) return false; anda = true;
            const x0 = cx(s.l), cor = s.erra ? VERM : ouro ? OURO : '#fde047';
            g.globalAlpha = 1 - k; g.strokeStyle = cor; g.lineWidth = 2;
            g.beginPath(); g.moveTo(x0, balc + 4); g.lineTo(x0 + (s.x - x0) * Math.min(1, k * 3), balc + 4 + (s.y - balc - 4) * Math.min(1, k * 3)); g.stroke();
            g.fillStyle = '#fff7d6'; g.beginPath(); g.arc(x0, balc + 2, (1 - k) * r * 0.35, 0, 7); g.fill();
            if (k > 0.3) { g.strokeStyle = cor; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a2 = i * 1.05 + s.t0; g.beginPath(); g.moveTo(s.x + Math.cos(a2) * r * 0.1, s.y + Math.sin(a2) * r * 0.1); g.lineTo(s.x + Math.cos(a2) * r * (0.1 + 0.35 * k), s.y + Math.sin(a2) * r * (0.1 + 0.35 * k)); g.stroke(); } }
            g.globalAlpha = 1; return true;
        });
        if (anda) X.S.anim = true;
        txt(X, comboTxt(X), corEstado(X, '#22d3ee'), h * 0.06, w * 0.95, h * 0.09, 'r');
    });
})();

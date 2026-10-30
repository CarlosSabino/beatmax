// =====================================================================================
// pista-fx.js — FEVER e animações DENTRO da gear (atrás das notas).
//
//  FEVER (automático, como nos jogos de teclas mais novos):
//   • cada acerto enche a barrinha do FEVER (MAX 100% enche mais; notas fracas, menos) — ela
//     fica na lateral DIREITA da gear, de baixo pra cima;
//   • cheia: entra FEVER x2 por 12 s. Enchendo de novo durante o FEVER: x3, x4 e x5 (o tempo
//     recomeça a cada nível). Acabou o tempo: volta ao normal. BREAK encerra na hora;
//   • durante o FEVER cada acerto vale um bônus no SCORE (+10% por nível acima de x1).
//     PRECISÃO, recordes, EXP e ranking NÃO mudam — é só a pontuação e o visual;
//   • anel no meio da pista com x2…x5 (raio no x5), desenhado atrás das notas.
//  Animações na pista (Configurações › Temas): pulso na batida + equalizador, onda de luz a
//  cada 50 de combo e brasa nas laterais com 100+. Gears da Turma: teclas em losango.
// =====================================================================================
(function () {
    const tema = (k) => (typeof window.bmTema === 'function' ? window.bmTema(k) : null);
    const feverOn = () => tema('fever') === 'auto';
    const COR_NIVEL = { 2: '#22d3ee', 3: '#a3e635', 4: '#f472b6', 5: '#fde047' };
    const F = { ref: null, j: null, gauge: 0, lvl: 1, until: 0, at: 0, bonus: 0, earned: 0, last: 0, waveAt: -1e9, ms: 0, bolt: null, boltAt: 0 };
    function reset() {
        F.ref = typeof stats !== 'undefined' ? stats : null;
        F.j = F.ref ? Object.assign({}, F.ref.judgments) : null;
        F.gauge = 0; F.lvl = 1; F.until = 0; F.bonus = 0; F.earned = typeof currentEarnedScore !== 'undefined' ? currentEarnedScore : 0; F.ms = 0; F.waveAt = -1e9;
    }
    window.bmFeverBonus = () => (feverOn() ? Math.round(F.bonus) : 0);
    window.bmFever = () => ({ lvl: F.lvl, gauge: F.gauge, bonus: Math.round(F.bonus) });

    function tick(ts) {
        requestAnimationFrame(tick);
        const dt = F.last ? Math.min(250, ts - F.last) : 16; F.last = ts;
        if (typeof stats === 'undefined' || !stats || !stats.judgments) return;
        if (stats !== F.ref) reset();
        const playing = typeof isPlaying !== 'undefined' && isPlaying;
        if (!playing) return;
        if (typeof isPaused !== 'undefined' && isPaused) { F.until += dt; return; }
        const j = stats.judgments, p = F.j || {};
        const d100 = Math.max(0, (j.max100 || 0) - (p.max100 || 0)), d90 = Math.max(0, (j.max90 || 0) - (p.max90 || 0));
        const dlow = Math.max(0, (j.lower || 0) - (p.lower || 0)), dbrk = Math.max(0, (j.break || 0) - (p.break || 0));
        F.j = Object.assign({}, j);
        const earned = typeof currentEarnedScore !== 'undefined' ? currentEarnedScore : 0;
        const dE = earned - F.earned; F.earned = earned;
        // onda de luz a cada 50 de combo
        const c = stats.combo || 0, m = Math.floor(c / 50);
        if (m > F.ms && c >= 50) F.waveAt = ts;
        F.ms = m;
        if (!feverOn()) { F.lvl = 1; F.gauge = 0; F.bonus = 0; return; }
        if (dbrk) { F.lvl = 1; F.gauge = 0; F.until = 0; return; }
        if (F.lvl >= 2 && dE > 0 && typeof totalPossibleScore !== 'undefined' && totalPossibleScore > 0) F.bonus += 1e6 * dE / totalPossibleScore * (F.lvl - 1) * 0.1;
        F.gauge += d100 * 0.045 + d90 * 0.034 + dlow * 0.016;
        while (F.gauge >= 1) {
            F.gauge -= 1;
            F.lvl = F.lvl < 2 ? 2 : Math.min(5, F.lvl + 1);
            F.until = ts + 12000; F.at = ts; somFever(F.lvl);
            if (F.lvl === 5) F.gauge = Math.min(F.gauge, 0.999);
        }
        if (F.lvl >= 2 && ts > F.until) { F.lvl = 1; }
    }
    requestAnimationFrame(tick);

    const A = (c, a) => (typeof glWithAlpha === 'function' ? glWithAlpha(c, a) : c);
    function anelSpec(col, r) {
        const R = Math.round(r), S = R * 2 + 80;
        return {
            key: `fvR|${col}|${R}`, lw: S, lh: S, ax: S / 2, ay: S / 2,
            draw: (b) => {
                const c = S / 2;
                b.shadowColor = col; b.shadowBlur = 26; b.strokeStyle = col; b.lineWidth = 6;
                b.beginPath(); b.arc(c, c, R, 0, Math.PI * 2); b.stroke();
                b.shadowBlur = 0; b.globalAlpha = 0.55; b.lineWidth = 2; b.setLineDash([10, 8]);
                b.beginPath(); b.arc(c, c, R * 0.8, 0, Math.PI * 2); b.stroke();
                b.setLineDash([]); b.globalAlpha = 0.18;
                const g = b.createRadialGradient(c, c, R * 0.2, c, c, R);
                g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
                b.fillStyle = g; b.beginPath(); b.arc(c, c, R, 0, Math.PI * 2); b.fill();
            }
        };
    }

    // ---------- opções por skin (Editor de skins › Tema da gear) ----------
    // th.tema = { lv:[x2,x3,x4,x5], anelEstilo, anelForca, anelTam, ondaCor, ondaForca, pulsoCor, pulsoForca, brasaForca, x5, x5Cor, teclas }
    const TEMA_PAD = { anelEstilo: 'duplo', anelForca: 55, anelTam: 80, ondaForca: 60, pulsoForca: 35, brasaForca: 70, x5: 'auto', teclas: 'auto' };
    function temaDe(th) { return Object.assign({}, TEMA_PAD, (th && th.tema) || {}); }
    function corNivel(T, n) { const l = T.lv; return (l && l[n - 2]) || COR_NIVEL[n] || '#22d3ee'; }
    window.bmTemaPadrao = () => Object.assign({ lv: [COR_NIVEL[2], COR_NIVEL[3], COR_NIVEL[4], COR_NIVEL[5]] }, TEMA_PAD);
    window.FEVER_FX_LIST = ['raio', 'chama', 'aurora', 'petalas', 'galaxia'];
    function efeitoX5(T) {
        if (T.x5 && T.x5 !== 'auto' && window.FEVER_FX_LIST.includes(T.x5)) return T.x5;
        return typeof window.bmFeverFx === 'function' ? window.bmFeverFx() : 'raio';
    }

    function anelSpec(col, r, estilo) {
        const R = Math.round(r), S = R * 2 + 80;
        return {
            key: `fvR|${col}|${R}|${estilo || 'duplo'}`, lw: S, lh: S, ax: S / 2, ay: S / 2,
            draw: (b) => {
                const c = S / 2;
                b.shadowColor = col; b.shadowBlur = 26; b.strokeStyle = col; b.lineWidth = estilo === 'fino' ? 3 : 6;
                if (estilo === 'hex') { b.beginPath(); for (let i = 0; i <= 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; b[i ? 'lineTo' : 'moveTo'](c + Math.cos(a) * R, c + Math.sin(a) * R); } b.stroke(); }
                else { b.beginPath(); b.arc(c, c, R, 0, Math.PI * 2); b.stroke(); }
                b.shadowBlur = 0;
                if (estilo !== 'fino') { b.globalAlpha = 0.55; b.lineWidth = 2; b.setLineDash([10, 8]); b.beginPath(); b.arc(c, c, R * 0.8, 0, Math.PI * 2); b.stroke(); b.setLineDash([]); }
                b.globalAlpha = 0.18;
                const g = b.createRadialGradient(c, c, R * 0.2, c, c, R);
                g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
                b.fillStyle = g; b.beginPath(); b.arc(c, c, R, 0, Math.PI * 2); b.fill();
            }
        };
    }
    function cssA(h, a) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; }
    // texturas dos efeitos do FEVER (assadas uma vez)
    const chamaSpec = { key: 'fvChama', lw: 80, lh: 220, ax: 40, ay: 220, draw: (b) => {
        const g = b.createLinearGradient(0, 0, 0, 220);
        g.addColorStop(0, 'rgba(239,68,68,0)'); g.addColorStop(0.45, 'rgba(249,115,22,.55)'); g.addColorStop(0.85, 'rgba(253,224,71,.85)'); g.addColorStop(1, 'rgba(255,255,255,.9)');
        b.fillStyle = g; b.beginPath(); b.moveTo(4, 220); b.quadraticCurveTo(6, 120, 40, 4); b.quadraticCurveTo(74, 120, 76, 220); b.closePath(); b.fill();
    } };
    const auroraSpec = (col) => ({ key: 'fvAur|' + col, lw: 40, lh: 260, ax: 20, ay: 0, draw: (b) => {
        const g = b.createLinearGradient(0, 0, 0, 260);
        g.addColorStop(0, cssA(col, 0)); g.addColorStop(0.25, cssA(col, 0.5)); g.addColorStop(1, cssA(col, 0));
        const h = b.createLinearGradient(0, 0, 40, 0); b.fillStyle = g; b.fillRect(0, 0, 40, 260);
        b.globalCompositeOperation = 'destination-in'; h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, '#000'); h.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = h; b.fillRect(0, 0, 40, 260);
    } });
    const petalaSpec = (col) => ({ key: 'fvPet|' + col, lw: 30, lh: 20, ax: 15, ay: 10, draw: (b) => {
        b.fillStyle = col; b.beginPath(); b.ellipse(15, 10, 12, 7, 0, 0, Math.PI * 2); b.fill();
        b.fillStyle = 'rgba(255,255,255,.45)'; b.beginPath(); b.ellipse(11, 8, 5, 2.5, -0.3, 0, Math.PI * 2); b.fill();
    } });
    const brilhoSpec = (col) => ({ key: 'fvGlow|' + col, lw: 200, lh: 200, ax: 100, ay: 100, draw: (b) => {
        const g = b.createRadialGradient(100, 100, 2, 100, 100, 100);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, cssA(col, 0.75)); g.addColorStop(1, cssA(col, 0));
        b.fillStyle = g; b.fillRect(0, 0, 200, 200);
    } });
    const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }; // pseudo-aleatório fixo por índice

    // efeito do FEVER na pista. força: 1 no x5, ~0.35 nos outros níveis (o Raio só aparece no x5)
    function desenharEfeito(P, fx, W, sy, cx, cy, r, col, forca, now, lvl) {
        if (fx === 'raio') {
            if (lvl < 5) return;
            if (!F.bolt || now - F.boltAt > 90) {
                F.boltAt = now; F.bolt = [];
                let x = cx + (Math.random() - 0.5) * W * 0.2;
                for (let k = 0; k <= 10; k++) { F.bolt.push([x, sy * k / 10]); x = cx + (Math.random() - 0.5) * W * 0.32; }
            }
            for (let k = 0; k < F.bolt.length - 1; k++) {
                const [x0, y0] = F.bolt[k], [x1, y1] = F.bolt[k + 1];
                P.glowLine(x0, y0, x1, y1, 5, col, 14, 0.55);
                P.line(x0, y0, x1, y1, 4, A(col, 0.85));
                P.line(x0, y0, x1, y1, 1.5, A('#ffffff', 0.95));
            }
            return;
        }
        if (fx === 'chama') {
            P.additive(() => {
                const n = 9;
                for (let i = 0; i < n; i++) {
                    const x = (i + 0.5) * W / n, h = (0.55 + 0.45 * Math.abs(Math.sin(now / (260 + i * 37) + i * 1.3))) * sy * (0.35 + 0.4 * forca);
                    P.sprite(chamaSpec, x, sy, { alpha: 0.55 * forca + 0.1, sx: (W / n) / 60, sy: h / 220 });
                }
                for (let i = 0; i < 26 * forca; i++) {
                    const t = ((now / 2600) + rnd(i)) % 1, x = rnd(i + 50) * W + Math.sin(now / 400 + i) * 12, y = sy - t * sy * 0.9;
                    P.circle(x, y, 1.6 + rnd(i + 9) * 1.6, A('#fde68a', (1 - t) * 0.9));
                }
            });
            return;
        }
        if (fx === 'aurora') {
            P.additive(() => {
                const cores = ['#4ade80', '#a78bfa', '#22d3ee'];
                for (let k = 0; k < 3; k++) for (let i = 0; i < 14; i++) {
                    const x = (i + 0.5) * W / 14, y = sy * (0.08 + 0.12 * k) + Math.sin(now / 900 + i * 0.6 + k * 2) * sy * 0.06;
                    P.sprite(auroraSpec(cores[k]), x, y, { alpha: 0.5 * forca + 0.08, sx: (W / 14) / 40 * 1.8, sy: sy * 0.55 / 260 });
                }
            });
            return;
        }
        if (fx === 'petalas') {
            const cores = ['#f9a8d4', '#fbcfe8', '#f472b6'];
            const n = Math.round(10 + 34 * forca), boom = Math.max(0, 1 - (now - F.at) / 700);
            for (let i = 0; i < n; i++) {
                const t = ((now / (5200 + rnd(i) * 3000)) + rnd(i + 3)) % 1;
                let x = rnd(i + 7) * W + Math.sin(now / 700 + i) * 22, y = t * sy;
                if (boom > 0) { const a = rnd(i + 11) * Math.PI * 2; x += Math.cos(a) * boom * 90; y += Math.sin(a) * boom * 90; }
                P.sprite(petalaSpec(cores[i % 3]), x, y, { alpha: 0.85 * (0.45 + 0.55 * forca), rot: now / (500 + rnd(i) * 600) + i, sx: 0.7 + rnd(i + 2) * 0.6, sy: 0.7 + rnd(i + 2) * 0.6 });
            }
            return;
        }
        if (fx === 'galaxia') {
            P.additive(() => {
                P.sprite(brilhoSpec(col), cx, cy, { alpha: 0.35 + 0.4 * forca, sx: r * 0.9 / 100, sy: r * 0.9 / 100 });
                const n = Math.round(40 + 70 * forca);
                for (let i = 0; i < n; i++) {
                    const rr = r * (0.2 + 0.85 * rnd(i)), a = rnd(i + 5) * Math.PI * 2 + now / (1400 + rr * 12);
                    P.circle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92, 0.9 + rnd(i + 8) * 1.8, A(i % 5 ? '#e9d5ff' : '#67e8f9', 0.45 + 0.5 * rnd(i + 4)));
                }
            });
        }
    }

    // ---------- demonstração (prévias do Personalizar e do Editor de skins) ----------
    // window.__bmPistaDemo = { fx?: id }  → roda o FEVER sozinho x2→x5 a cada 3 s
    function estadoDemo(now) {
        const k = Math.floor(now / 3000) % 4;
        return { lvl: 2 + k, at: Math.floor(now / 3000) * 3000, until: Math.floor(now / 3000) * 3000 + 12000 - (now % 3000) * 0, combo: 160, wave: (now % 6000) < 900 ? Math.floor(now / 6000) * 6000 : -1e9 };
    }

    // ---------- desenhado logo antes da linha de julgamento = atrás das notas ----------
    if (typeof window.drawGearStrikeLine === 'function') {
        const orig = window.drawGearStrikeLine;
        window.drawGearStrikeLine = function (P, L, mainColor) {
            try { if (L && L.W && ((typeof isPlaying !== 'undefined' && isPlaying) || window.__bmPistaDemo)) desenharPista(P, L); } catch (e) { /* nunca atrapalha a partida */ }
            return orig.apply(this, arguments);
        };
    }
    function desenharPista(P, L) {
        const W = L.W, sy = typeof getGameStrikeY === 'function' ? getGameStrikeY() : L.H - 80;
        const acc = (L.theme && L.theme.accent) || '#22d3ee';
        const T = temaDe(L.theme);
        const now = performance.now();
        const demo = window.__bmPistaDemo && !(typeof isPlaying !== 'undefined' && isPlaying) ? window.__bmPistaDemo : null;
        const D = demo ? estadoDemo(now) : null;
        const bp = demo ? Math.exp(-((now / 500) % 1) * 6) : (typeof beatPulse !== 'undefined' ? Math.max(0, Math.min(1, beatPulse)) : 0);
        const combo = D ? D.combo : ((typeof stats !== 'undefined' && stats.combo) || 0);
        const lvl = D ? D.lvl : F.lvl, at = D ? D.at : F.at, until = D ? now + 6000 : F.until, waveAt = D ? D.wave : F.waveAt;
        // brasa nas laterais (100+)
        if (tema('brasa') && combo >= 100 && T.brasaForca > 0) {
            const a = Math.min(1, 0.45 + (combo - 100) / 120) * (0.8 + 0.2 * Math.sin(now / 90)) * (T.brasaForca / 70);
            P.rectV(0, 0, 16, sy, A('#f59e0b', 0), A('#f97316', Math.min(1, 0.55 * a)));
            P.rectV(W - 16, 0, 16, sy, A('#f59e0b', 0), A('#f97316', Math.min(1, 0.55 * a)));
            P.rectV(0, 0, 5, sy, A('#ec4899', 0), A('#fde047', Math.min(1, 0.75 * a)));
            P.rectV(W - 5, 0, 5, sy, A('#ec4899', 0), A('#fde047', Math.min(1, 0.75 * a)));
            P.rectV(0, sy - 46, W, 46, A('#f97316', 0), A('#f97316', Math.min(1, 0.22 * a)));
        }
        // pulso nas divisórias + equalizador
        if (tema('pulso') && T.pulsoForca > 0) {
            const pc = T.pulsoCor || acc, pf = T.pulsoForca / 35;
            const cols = typeof getGameplayColumnLayout === 'function' ? getGameplayColumnLayout(currentMode, W) : [];
            for (let i = 1; i < cols.length; i++) {
                const x = cols[i].x;
                P.rectV(x - 1, sy * 0.2, 2, sy * 0.8, A(pc, 0), A(pc, Math.min(1, (0.1 + 0.42 * bp) * pf)));
            }
            const N = 20, bw = W / N;
            for (let i = 0; i < N; i++) {
                const h = (0.25 + 0.75 * Math.abs(Math.sin(now / 340 * (1 + i * 0.37) + i * 1.7))) * (0.35 + 0.65 * bp) * sy * 0.15;
                P.rectV(i * bw + 2, sy - h, bw - 4, h, A(pc, 0), A(pc, Math.min(1, 0.15 * pf)));
            }
        }
        // onda de luz (a cada 50)
        if (tema('onda') && T.ondaForca > 0) {
            const oc = T.ondaCor || acc, of = T.ondaForca / 60;
            const p = (now - waveAt) / 900;
            if (p >= 0 && p < 1) {
                const e = 1 - Math.pow(1 - p, 2), y = sy - (sy + 140) * e, a = 0.5 * (1 - p) * of;
                P.rectV(0, y, W, 70, A('#ffffff', 0), A(oc, Math.min(1, a)));
                P.rectV(0, y + 70, W, 8, A('#ffffff', Math.min(1, a * 1.2)), A('#ffffff', Math.min(1, a * 0.4)));
                P.rectV(0, y + 78, W, 30, A(oc, Math.min(1, a * 0.6)), A(oc, 0));
            }
        }
        // FEVER — jeito DJMAX (padrão "sutil"): o multiplicador aparece no meio só ao subir de nível
        // (~1,4 s, com som), o efeito escolhido acompanha esse momento, e depois fica só um brilho
        // fraquinho subindo da linha de julgamento na cor do nível + a barrinha do lado.
        // "forte" = o de antes (anel e efeito o tempo todo).
        if ((demo || feverOn()) && lvl >= 2) {
            const col = corNivel(T, lvl);
            const cx = W / 2, cy = sy * 0.52, r = W * 0.4 * (T.anelTam / 80);
            const fx = demo && demo.fx ? demo.fx : efeitoX5(T);
            const fcol = fx === 'raio' ? (T.x5Cor || corNivel(T, 5)) : (T.x5Cor || col);
            const forte = tema('feverVis') === 'forte';
            const POP = 1400, idade = now - at, pop = idade < POP ? idade / POP : 1;
            // brilho de fundo bem leve (só a parte de baixo da pista)
            P.rectV(0, sy * 0.55, W, sy * 0.45, A(col, 0), A(col, (forte ? 0.16 : 0.1) + 0.04 * bp));
            if (forte) desenharEfeito(P, fx, W, sy, cx, cy, r, fcol, lvl >= 5 ? 1 : 0.35, now, lvl);
            else if (pop < 1) desenharEfeito(P, fx, W, sy, cx, cy, r, fcol, (lvl >= 5 ? 0.7 : 0.3) * (1 - pop), now, fx === 'raio' ? (lvl >= 5 ? 5 : 0) : lvl);
            if (tema('anel') && T.anelForca > 0 && (forte || pop < 1)) {
                const fa = T.anelForca / 55;
                const ent = Math.min(1, idade / 220), sai = forte ? 1 : Math.max(0, Math.min(1, (1 - pop) / 0.35));
                const s = (0.7 + 0.3 * (1 - Math.pow(1 - ent, 3))) * (forte ? 1 + 0.035 * bp : 1 + 0.12 * pop);
                P.sprite(anelSpec(col, r, T.anelEstilo), cx, cy, { alpha: Math.min(1, (forte ? 0.5 + 0.25 * bp : 0.55) * fa * sai), sx: s, sy: s });
                P.text('x' + lvl, cx, cy + r * 0.12, `italic 900 ${Math.round(r * 0.6)}px Orbitron, sans-serif`, col, {
                    gradient: [[0, '#ffffff'], [0.5, col], [1, col]], stroke: { color: 'rgba(0,0,0,0.45)', width: 4 }, alpha: Math.min(1, (forte ? 0.5 : 0.7) * fa * sai), sx: s, sy: s
                });
                P.text('FEVER', cx, cy + r * 0.38, `800 ${Math.round(r * 0.13)}px Orbitron, sans-serif`, col, { alpha: Math.min(1, 0.75 * fa * sai) });
                if (forte) {
                    const rem = Math.max(0, Math.min(1, (until - now) / 12000));
                    P.rect(cx - r * 0.32, cy + r * 0.5, r * 0.64, 4, A('#000000', 0.45));
                    P.rect(cx - r * 0.32, cy + r * 0.5, r * 0.64 * rem, 4, A(col, 0.85));
                }
            }
        }
    }
    // som ao subir de nível do FEVER (sintetizado, sem arquivo)
    let sfxCtx = null;
    function somFever(lvl) {
        if (tema('feverSom') === false) return;
        try {
            const A0 = typeof audio !== 'undefined' ? audio : null;
            const c = (A0 && A0.ctx) || sfxCtx || (sfxCtx = new (window.AudioContext || window.webkitAudioContext)());
            const vol = ((A0 && A0.volume != null) ? A0.volume : 0.7) * 0.1, t = c.currentTime;
            const base = 440 * Math.pow(2, (lvl - 2) * 2 / 12);
            [1, 1.25, 1.5, 2].forEach((m, i) => {
                const o = c.createOscillator(), g = c.createGain(), t0 = t + i * 0.045;
                o.type = 'triangle'; o.frequency.value = base * m;
                g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i === 3 ? 0.55 : 0.18));
                o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 0.6);
            });
        } catch (e) {}
    }
    // vitrine da Loja: um canvas pequeno com a pista, o anel x5 e o efeito
    window.bmFeverVitrine = function (cv, fx) {
        if (!cv || typeof make2DPainter !== 'function') return;
        const g = cv.getContext('2d'), W = cv.width, H = cv.height, P = make2DPainter(g), now = performance.now(), sy = H - 22;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
        g.fillStyle = '#0d1016'; g.fillRect(0, 0, W, H);
        for (let i = 1; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(i * W / 4, 0, 1, sy); }
        const lvl = 2 + Math.floor(now / 2500) % 4, col = corNivel({}, lvl), cx = W / 2, cy = sy * 0.5, r = Math.min(W, sy) * 0.42;
        const salvo = F.at; if (Math.floor(now / 2500) !== F.vit) { F.vit = Math.floor(now / 2500); F.vitAt = now; } F.at = F.vitAt;
        try { desenharEfeito(P, fx, W, sy, cx, cy, r, fx === 'raio' ? corNivel({}, 5) : col, lvl >= 5 ? 1 : 0.4, now, fx === 'raio' ? 5 : lvl); } finally { F.at = salvo; }
        P.sprite(anelSpec(col, r, 'duplo'), cx, cy, { alpha: 0.7 });
        P.text('x' + lvl, cx, cy + r * 0.14, `italic 900 ${Math.round(r * 0.62)}px Orbitron, sans-serif`, col, { alpha: 0.6 });
        g.fillStyle = '#fff'; g.fillRect(0, sy, W, 3); g.fillStyle = '#08090b'; g.fillRect(0, sy + 3, W, H - sy);
    };

    // ---------- barrinha do FEVER (pilar direito) + SCORE com o bônus ----------
    if (typeof window.drawGearFrameDynamic === 'function') {
        const orig = window.drawGearFrameDynamic;
        window.drawGearFrameDynamic = function (P, L, currentTime) {
            const bonus = feverOn() ? F.bonus : 0;
            const tot = typeof totalPossibleScore !== 'undefined' ? totalPossibleScore : 0;
            let ok = false;
            if (bonus > 0 && tot > 0) { currentEarnedScore += bonus * tot / 1e6; ok = true; }
            try { orig.apply(this, arguments); } finally { if (ok) currentEarnedScore -= bonus * tot / 1e6; }
            try {
                if (!feverOn() || !(typeof isPlaying !== 'undefined' && isPlaying) || !L || !L.frame) return;
                const hpH = L.H - 154, h = hpH * 0.5, x = (L.totalW || (L.W + L.F * 2)) - 19, y0 = 72 + hpH - h;
                const TT = temaDe(L.theme), col = F.lvl >= 2 ? corNivel(TT, Math.min(5, F.lvl + 1)) : corNivel(TT, 2);
                P.rect(x, y0, 8, h, A('#000000', 0.55));
                const fh = h * Math.max(0, Math.min(1, F.gauge));
                if (fh > 0.5) { P.rectV(x, y0 + h - fh, 8, fh, A('#ffffff', 0.9), col); P.glowRect(x, y0 + h - fh, 8, fh, col, 5, 0.35); }
                if (F.lvl >= 2) {
                    const cl = corNivel(TT, F.lvl);
                    P.glowRect(x - 2, y0 - 2, 12, h + 4, cl, 8, 0.4 + 0.3 * Math.sin(performance.now() / 120));
                }
            } catch (e) {}
        };
    }

    // ---------- teclas em losango (Gears da Turma) ----------
    function losangoSpec(color, pressed, s, circ) {
        const S = Math.round(s), T = S * 2 + 30;
        return {
            key: `tD|${color}|${pressed ? 1 : 0}|${S}|${circ ? 'c' : 'd'}`, lw: T, lh: T, ax: T / 2, ay: T / 2,
            draw: (b) => {
                const c = T / 2;
                if (circ) {
                    const q = S * 0.82;
                    b.beginPath(); b.arc(c, c, q, 0, Math.PI * 2);
                    if (pressed) { b.shadowColor = color; b.shadowBlur = 22; b.fillStyle = color; b.fill(); b.shadowBlur = 0; b.strokeStyle = '#fff'; }
                    else { b.fillStyle = '#081420'; b.fill(); b.strokeStyle = typeof shadeColor === 'function' ? shadeColor(color, -0.35) : color; }
                    b.lineWidth = 3; b.stroke();
                    b.globalAlpha = pressed ? 0.9 : 0.35; b.fillStyle = '#fff'; b.beginPath(); b.arc(c, c, q * 0.32, 0, Math.PI * 2); b.fill();
                    return;
                }
                b.translate(c, c); b.rotate(Math.PI / 4);
                const q = S * 0.72;
                if (pressed) { b.shadowColor = color; b.shadowBlur = 22; b.fillStyle = color; b.fillRect(-q, -q, q * 2, q * 2); b.shadowBlur = 0; b.strokeStyle = '#fff'; }
                else { b.fillStyle = '#081420'; b.fillRect(-q, -q, q * 2, q * 2); b.strokeStyle = typeof shadeColor === 'function' ? shadeColor(color, -0.35) : color; }
                b.lineWidth = 3; b.strokeRect(-q, -q, q * 2, q * 2);
                b.globalAlpha = pressed ? 0.9 : 0.35; b.fillStyle = '#fff'; b.fillRect(-q * 0.3, -q * 0.3, q * 0.6, q * 0.6);
            }
        };
    }
    if (typeof window.drawGearKeyPanel === 'function') {
        const orig = window.drawGearKeyPanel;
        window.drawGearKeyPanel = function (P, L, currentTime) {
            const tk = L && L.theme ? temaDe(L.theme).teclas : 'auto';
            const forma = tk === 'auto' ? (L && L.theme && L.theme.turma ? 'losango' : 'padrao') : tk;
            if (forma === 'padrao') return orig.apply(this, arguments);
            const sy = getGameStrikeY();
            const cols = getGameplayColumnLayout(currentMode, L.W);
            const colors = getKeyColorScheme(currentMode, gearSkin);
            const keys = KEY_CONFIGS[currentMode] || [];
            const y = sy + 12, h = L.H - sy - 20;
            const la = typeof getGameKeyLabelAlpha === 'function' ? getGameKeyLabelAlpha(currentTime) : 0;
            P.rectV(0, sy + 6, L.W, L.H - sy - 6, '#04070e', '#0a1020');
            cols.forEach((col, i) => {
                const pressed = !!(keyState && keyState[i]);
                const s = Math.min(col.width * 0.36, h * 0.42);
                P.sprite(losangoSpec(colors[i], pressed, s, forma === 'circulo'), col.x + col.width / 2, y + h * 0.46);
                if (la > 0.01) P.text(keys[i] ? formatKeyCode(keys[i]) : String(i + 1), col.x + col.width / 2, y + h - 5, '700 12px Orbitron, monospace', '#f8fafc', { alpha: la });
            });
        };
    }
    // miniaturas da Loja (só procura com a Loja aberta)
    (function vitrines() {
        const loop = () => {
            requestAnimationFrame(loop);
            const host = document.getElementById('bc-ov'); if (!host) return;
            host.querySelectorAll('canvas[data-fever-prev]').forEach(cv => { try { window.bmFeverVitrine(cv, cv.dataset.feverPrev); } catch (e) {} });
        };
        requestAnimationFrame(loop);
    })();
})();

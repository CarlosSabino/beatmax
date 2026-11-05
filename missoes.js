// =====================================================================================
// missoes.js — MODO MISSÕES (Fase 1: tudo no próprio PC).
//
//  Pack = capítulo com 3 a 6 músicas da biblioteca (charts do editor / osu!). Cada música é uma
//  missão com até 2 objetivos; uma pode ser o 💀 CHEFÃO e a última pode ser o ✦ ENCORE (que
//  ganha um desafio extra escondido até a música começar). Desbloqueio em sequência ou
//  "começa com N liberadas". Pack pode ser a continuação de outro (Capítulo 2 só abre depois
//  do 1).
//
//  Confirmação: o criador precisa passar em cada missão (com os objetivos atuais e o chart
//  atual) — mudou objetivo ou chart, volta a "não testada".
//  Recompensa: EXP uma vez só por missão, e só em pack de OUTRA pessoa.
//  Na missão: sem modo sem falha, sem mudar a velocidade da música; random só OFF ou MIRROR.
//
//  Guardado no PC: packs em djmaxMissoesPacks_v1 (do aparelho: os outros perfis veem como
//  "Recebidos") e o progresso em djmaxMissoesProg_v1 (de cada perfil, ver perfis.js).
//  Música do menu de Missões: "Military" — kulakovka (Pixabay, ID 278462).
// =====================================================================================
(function () {
    const PACKS_KEY = 'djmaxMissoesPacks_v1', PROG_KEY = 'djmaxMissoesProg_v1';
    const MIN_MUS = 3, MAX_MUS = 6, MAX_OBJ = 2;
    const EXP = { normal: 150, chefao: 300, encore: 400 };
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const uid = () => 'pk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    // ---------- perfil ----------
    function eu() {
        try { const a = window.perfis && window.perfis.active; if (a) return { id: a.id, nome: a.name || 'Jogador' }; } catch (e) {}
        return { id: 'p1', nome: 'Jogador 1' };
    }
    const meu = (p) => !!(p && p.autor && p.autor.id === eu().id && !p.importado);

    // ---------- packs e progresso ----------
    const packs = () => lsGet(PACKS_KEY, []);
    const salvarPacks = (l) => lsSet(PACKS_KEY, l);
    const packPorId = (id) => packs().find(p => p.id === id) || null;
    function gravarPack(p) { const l = packs(); const i = l.findIndex(x => x.id === p.id); p.atualizado = Date.now(); if (i >= 0) l[i] = p; else l.push(p); salvarPacks(l); }
    const prog = () => lsGet(PROG_KEY, {});
    function progDe(packId) { const g = prog(); return g[packId] || { feitas: {}, premio: {} }; }
    function gravarProg(packId, pr) { const g = prog(); g[packId] = pr; lsSet(PROG_KEY, g); }

    // ---------- charts ----------
    const charts = () => (typeof customCharts !== 'undefined' && Array.isArray(customCharts)) ? customCharts : [];
    const acharChart = (id) => (typeof findCustomChart === 'function' ? findCustomChart(id) : null) || null;
    function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
    function chartSig(c) {
        if (!c) return '';
        return hashStr(JSON.stringify([(c.notes || []).map(n => [Math.round(n.time), n.lane, n.holdEnd != null ? Math.round(n.holdEnd) : null]), c.mode, Math.round(c.songEndMs || 0)]));
    }
    function infoChart(c) {
        if (!c) return null;
        const sp = typeof splitOsuTitle === 'function' ? splitOsuTitle(c.title) : { title: c.title, artist: '', version: '' };
        const artista = (c.osu && c.osu.artist) || c.artist || sp.artist || '';
        let dif = '';
        try { if (typeof chartDifficulty === 'function' && typeof diffLabel === 'function') dif = diffLabel(chartDifficulty(c)); } catch (e) {}
        if (!dif && sp.version) dif = sp.version;
        const ns = c.notes || [];
        const fim = ns.reduce((m, n) => Math.max(m, n.time || 0, n.holdEnd || 0), 0);
        const dur = c.songEndMs > 0 ? c.songEndMs : fim;
        return {
            id: c.id, titulo: sp.title || c.title || 'Sem título', artista, modo: c.mode || '4K', dif,
            notas: ns.length, holds: ns.filter(n => n.holdEnd != null).length, dur, bpm: Math.round(+c.bpm || 0), sig: chartSig(c)
        };
    }
    const modoTxt = (m) => (typeof getModeDisplayName === 'function' ? getModeDisplayName(m) : String(m || '').replace('K', 'B'));
    const tempo = (ms) => { const s = Math.round((ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

    // ---------- objetivos ----------
    // x = número, y = % (só no "acertos abaixo de")
    const OBJ = {
        erros: { ic: '❌', menu: 'Errar no máximo X notas', x: 10, txt: o => `No máximo ${o.x} erros (BREAK)`, dica: o => `no ${o.x + 1}º erro a missão falha` },
        baixos: { ic: '🎚', menu: 'No máximo X acertos abaixo de Y%', x: 20, y: 70, txt: o => `No máximo ${o.x} acertos abaixo de ${o.y}%`, dica: o => `passou de ${o.x}, falha` },
        combo: { ic: '🎯', menu: 'Fazer um combo de X', x: 200, txt: o => `Faça um combo de ${o.x}`, dica: () => 'falha quando não sobrarem notas pra chegar lá' },
        prec: { ic: '📈', menu: 'Terminar com precisão acima de X%', x: 95, txt: o => `Termine com ${o.x}% ou mais de precisão`, dica: () => 'falha quando não der mais pra chegar lá' },
        sobreviver: { ic: '💀', menu: 'Sobreviver até o fim', txt: () => 'Sobreviva até o fim da música', dica: () => 'se o HP zerar, falha' },
        maxcombo: { ic: '👑', menu: 'MAX COMBO (sem errar nada)', txt: () => 'MAX COMBO: não erre nenhuma nota', dica: () => 'qualquer BREAK falha' },
        longas: { ic: '➖', menu: 'Acertar X notas longas', x: 10, txt: o => `Acerte ${o.x} notas longas`, dica: () => 'falha quando não sobrarem longas suficientes' },
        longas0: { ic: '➖', menu: 'Não errar nenhuma nota longa', txt: () => 'Não erre nenhuma nota longa', dica: () => 'errou ou soltou cedo uma longa, falha' }
    };
    const OBJ_ORDEM = ['erros', 'baixos', 'combo', 'prec', 'sobreviver', 'maxcombo', 'longas', 'longas0'];
    const objTxt = (o) => (OBJ[o.t] ? OBJ[o.t].txt(o) : '?');
    // pra o Encore: objetivos que valem como "desafio extra"
    const EXTRA_OPC = [{ t: 'maxcombo' }, { t: 'prec', x: 98 }, { t: 'erros', x: 3 }, { t: 'longas0' }];
    const objsDa = (m) => (m.objs || []).concat(m.encore && m.extra ? [Object.assign({ extra: true }, m.extra)] : []);
    const cfgSig = (m, c) => hashStr(JSON.stringify([m.chartId, chartSig(c), m.objs || [], m.encore ? m.extra || null : null, !!m.chefao, !!m.encore]));
    const confirmada = (m) => { const c = acharChart(m.chartId); return !!(c && m.conf && m.conf === cfgSig(m, c)); };
    const packConfirmado = (p) => (p.musicas || []).length >= MIN_MUS && p.musicas.every(confirmada);

    // ---------- desbloqueio ----------
    // devolve, pra cada música, 'feita' | 'livre' | 'bloq' (+ motivo)
    function estadoMusicas(p, pr) {
        const ms = p.musicas || [], feita = (i) => !!pr.feitas[ms[i].chartId];
        const normais = ms.map((m, i) => i).filter(i => !ms[i].chefao && !ms[i].encore);
        const nFeitasNormais = normais.filter(feita).length;
        return ms.map((m, i) => {
            if (feita(i)) return { st: 'feita' };
            if (m.encore) { const ok = ms.every((x, j) => j === i || x.encore || feita(j)); return ok ? { st: 'livre' } : { st: 'bloq', por: 'aparece depois de vencer o chefão' }; }
            if (m.chefao) { const ok = normais.every(feita); return ok ? { st: 'livre' } : { st: 'bloq', por: 'conclua as outras missões pra enfrentar' }; }
            const pos = normais.indexOf(i);
            if (p.desbloqueio && p.desbloqueio.tipo === 'n') { const n = Math.max(1, +p.desbloqueio.n || 2); return pos < n + nFeitasNormais ? { st: 'livre' } : { st: 'bloq', por: 'conclua mais uma missão pra liberar' }; }
            if (pos <= 0 || feita(normais[pos - 1])) return { st: 'livre' };
            return { st: 'bloq', por: `conclua a ${normais[pos - 1] + 1} pra liberar` };
        });
    }
    const packConcluido = (p, pr) => (p.musicas || []).filter(m => !m.encore).every(m => pr.feitas[m.chartId]);
    function packLiberado(p) {
        if (!p.cont) return true;
        const ant = packPorId(p.cont);
        return !ant || packConcluido(ant, progDe(ant.id));
    }

    // ================================================================================
    // INTERFACE
    // ================================================================================
    const css = document.createElement('style');
    css.textContent = `
#ms-ov{position:fixed;inset:0;z-index:150;background:rgba(2,6,23,.92);display:flex;align-items:center;justify-content:center;font-family:Rajdhani,sans-serif;color:#e2e8f0}
#ms-ov .bx{width:min(1500px,97vw);height:min(880px,94vh);display:flex;flex-direction:column;background:linear-gradient(180deg,#0f1729,#0a1020);border:1px solid #334155;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)}
#ms-ov.bm-ch .bx{height:min(860px,92vh)}
#ms-ov .hd{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid #1e293b;flex-wrap:wrap}
#ms-ov .hd h2{font:900 24px Orbitron,monospace;letter-spacing:.08em;color:#fff}
#ms-ov .hd .sub{font:700 14px Rajdhani;color:#94a3b8}
#ms-ov .hd .r{margin-left:auto;display:flex;gap:10px;align-items:center}
#ms-ov button{font-family:Rajdhani,sans-serif;cursor:pointer}
#ms-ov .btn{padding:8px 15px;border-radius:10px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;font:800 14px Rajdhani;white-space:nowrap}
#ms-ov .btn:hover:not(:disabled),#ms-ov .btn:focus-visible{border-color:#22d3ee;outline:none}
#ms-ov .btn.pri{background:linear-gradient(90deg,#22d3ee,#6366f1);border:0;color:#020617;font:900 14px Orbitron;letter-spacing:.04em}
#ms-ov .btn.gold{background:linear-gradient(90deg,#f59e0b,#facc15);border:0;color:#1c1917;font:900 14px Orbitron}
#ms-ov .btn.red{border-color:#ef4444;color:#fca5a5}
#ms-ov .btn.on{border:2px solid #fbbf24;color:#fff}
#ms-ov .btn:disabled{opacity:.4;cursor:default}
#ms-ov .btn.mini{padding:5px 10px;font-size:13px}
#ms-ov .tabs{display:flex;gap:8px;padding:12px 22px 0;border-bottom:1px solid #1e293b}
#ms-ov .tabs button{padding:8px 16px;border-radius:10px 10px 0 0;font:800 13px Orbitron;letter-spacing:.06em;color:#94a3b8;border:1px solid #1e293b;border-bottom:0;background:#0b1222}
#ms-ov .tabs button.on{color:#fff;background:#13203a;border-color:#22d3ee}
#ms-ov .tabs button:disabled{opacity:.45;cursor:default}
#ms-ov .corpo{flex:1;min-height:0;overflow:auto}
#ms-ov .ft{display:flex;gap:20px;padding:9px 22px;border-top:1px solid #1e293b;background:#0b1222;font:700 13px Rajdhani;color:#94a3b8;align-items:center;flex-wrap:wrap}
#ms-ov .ft kbd{font:800 11px Orbitron;padding:2px 7px;border-radius:5px;background:#e2e8f0;color:#0f172a;margin-right:6px}
#ms-ov .chip{display:inline-flex;align-items:center;gap:5px;font:800 11px Orbitron;letter-spacing:.04em;padding:3px 9px;border-radius:999px;border:1px solid #334155;color:#cbd5e1;white-space:nowrap}
#ms-ov .chip.ok{color:#86efac;border-color:#166534;background:rgba(22,101,52,.25)}
#ms-ov .chip.warn{color:#fcd34d;border-color:#854d0e;background:rgba(133,77,14,.25)}
#ms-ov .chip.boss{color:#fca5a5;border-color:#991b1b;background:rgba(153,27,27,.25)}
#ms-ov .chip.enc{color:#f0abfc;border-color:#86198f;background:rgba(134,25,143,.25)}
#ms-ov .bar{height:9px;border-radius:99px;background:#1e293b;overflow:hidden}#ms-ov .bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#22d3ee,#a78bfa)}
#ms-ov .lbl{font:800 12px Orbitron;letter-spacing:.12em;color:#a5b4fc}
#ms-ov small.m{font:600 13px Rajdhani;color:#64748b}
#ms-ov input,#ms-ov select{background:#020617;border:1px solid #334155;border-radius:8px;padding:6px 10px;color:#e2e8f0;font:700 15px Rajdhani}
#ms-ov input:focus,#ms-ov select:focus{border-color:#22d3ee;outline:none}
#ms-ov .vazio{padding:40px;text-align:center;color:#64748b;font:700 17px Rajdhani}
/* lista de packs */
#ms-ov .packs{padding:18px 22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;align-content:start}
#ms-ov .pk{border:1px solid #334155;border-radius:14px;overflow:hidden;background:#0f172a;cursor:pointer;text-align:left;padding:0;color:inherit;display:flex;flex-direction:column}
#ms-ov .pk:hover,#ms-ov .pk:focus-visible{border-color:#22d3ee;outline:none;box-shadow:0 0 16px rgba(34,211,238,.25)}
#ms-ov .pk .cap{height:110px;position:relative;padding:12px}
#ms-ov .pk .cap .nm{position:absolute;left:12px;right:70px;bottom:10px;font:900 20px Orbitron;color:#fff;line-height:1.1;text-shadow:0 2px 8px rgba(0,0,0,.5)}
#ms-ov .pk .cap .n{position:absolute;right:12px;bottom:12px;font:800 13px Orbitron;color:#fff}
#ms-ov .pk .inf{padding:11px 14px;display:flex;flex-direction:column;gap:7px}
#ms-ov .pk .inf .l{display:flex;justify-content:space-between;font:800 12px Orbitron;color:#94a3b8}
#ms-ov .pk.novo{border:2px dashed #334155;align-items:center;justify-content:center;min-height:230px;color:#64748b;gap:6px}
#ms-ov .pk.novo b{font:900 38px Orbitron;color:#334155}
/* capítulo */
#ms-ov .capg{display:grid;grid-template-columns:minmax(380px,520px) 1fr;height:100%}
#ms-ov .set{padding:16px 20px;border-right:1px solid #1e293b;display:flex;flex-direction:column;gap:9px;overflow:auto}
#ms-ov .mi{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:12px;border:1px solid #1e293b;background:#0f172a;cursor:pointer;text-align:left;color:inherit;width:100%}
#ms-ov .mi .ic{font:900 20px Orbitron;width:30px;text-align:center}
#ms-ov .mi b{font:800 17px Rajdhani;color:#fff;display:block}
#ms-ov .mi.feita{border-color:#166534;background:rgba(22,101,52,.14)}#ms-ov .mi.feita .ic{color:#86efac}
#ms-ov .mi.livre .ic{color:#fde047}
#ms-ov .mi.bloq{opacity:.55}
#ms-ov .mi.chefao{border-color:#7f1d1d;background:rgba(127,29,29,.14)}
#ms-ov .mi.encore{border-color:#86198f;background:linear-gradient(90deg,rgba(134,25,143,.22),rgba(15,23,42,.6))}
#ms-ov .mi.sel{border:2px solid #fbbf24;box-shadow:0 0 16px rgba(251,191,36,.22)}
#ms-ov .det{padding:18px 24px;display:flex;flex-direction:column;gap:12px;overflow:auto}
#ms-ov .det .tt{font:900 32px Orbitron;color:#fff;line-height:1.1}
#ms-ov .ob{display:flex;gap:14px;align-items:center;padding:13px 15px;border-radius:12px;background:#0f172a;border:1px solid #334155}
#ms-ov .ob .i{font-size:26px;width:34px;text-align:center}
#ms-ov .ob b{font:800 19px Rajdhani;color:#fff;display:block}
#ms-ov .box3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
#ms-ov .box3 > div{padding:11px 13px;border-radius:12px;border:1px solid #1e293b;background:#0b1222}
#ms-ov .box3 .v{font:900 20px Orbitron;margin-top:4px}
/* criador */
#ms-ov .campos{display:flex;gap:16px;padding:12px 22px;border-bottom:1px solid #1e293b;align-items:center;flex-wrap:wrap}
#ms-ov .campos label{display:flex;gap:8px;align-items:center;font:700 15px Rajdhani;color:#94a3b8}
#ms-ov .cr{display:grid;grid-template-columns:1fr 1fr;height:100%}
#ms-ov .cr > div{padding:14px 20px;display:flex;flex-direction:column;gap:9px;min-height:0}
#ms-ov .cr > div:first-child{border-right:1px solid #1e293b}
#ms-ov .lista{display:flex;flex-direction:column;gap:7px;overflow:auto;min-height:0;flex:1}
#ms-ov .li{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;background:#0f172a;border:1px solid #334155}
#ms-ov .li .t{flex:1;min-width:0}
#ms-ov .li .t b{font:800 16px Rajdhani;color:#fff;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ms-ov .li.chefao{background:rgba(127,29,29,.18);border-color:#991b1b}
#ms-ov .li.encore{background:rgba(134,25,143,.18);border-color:#86198f}
#ms-ov .li .n{font:900 15px Orbitron;color:#67e8f9;width:24px;text-align:center}
#ms-ov .chips{display:flex;gap:6px;flex-wrap:wrap}
#ms-ov .chips button{padding:4px 11px;border-radius:999px;border:1px solid #334155;background:none;color:#cbd5e1;font:800 12px Orbitron}
#ms-ov .chips button.on{border-color:#22d3ee;color:#67e8f9}
#ms-ov .cr2{display:grid;grid-template-columns:300px 1fr 340px;height:100%}
#ms-ov .cr2 > div{padding:14px 18px;display:flex;flex-direction:column;gap:9px;min-height:0;overflow:auto}
#ms-ov .cr2 > div:not(:last-child){border-right:1px solid #1e293b}
#ms-ov .ms2{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:#0f172a;border:1px solid #334155;cursor:pointer;color:inherit;text-align:left;font:800 15px Rajdhani}
#ms-ov .ms2.sel{border:2px solid #fbbf24;background:rgba(251,191,36,.07)}
#ms-ov .obed{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;background:#0f172a;border:1px solid #334155;font:700 17px Rajdhani;flex-wrap:wrap}
#ms-ov .obed input{width:78px}
#ms-ov .menuobj{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden}
#ms-ov .menuobj button{padding:10px 13px;background:#0b1222;border:0;color:#e2e8f0;font:700 15px Rajdhani;text-align:left}
#ms-ov .menuobj button:hover:not(:disabled){background:#13203a}
#ms-ov .menuobj button:disabled{opacity:.35;cursor:default}
#ms-ov .aviso{padding:13px 15px;border-radius:12px;background:rgba(133,77,14,.18);border:1px solid #854d0e;font:700 15px Rajdhani;color:#fde68a;line-height:1.35}
#ms-ov .msg{min-height:20px;font:700 15px Rajdhani;color:#fca5a5}
/* painel na partida e resultado */
#ms-hud{position:fixed;z-index:60;width:300px;padding:13px 15px;border-radius:14px;background:rgba(8,12,28,.86);border:1px solid #fbbf24;box-shadow:0 0 22px rgba(251,191,36,.18);font-family:Rajdhani,sans-serif;color:#e2e8f0;pointer-events:none}
#ms-hud .h{padding-right:58px;font:900 12px Orbitron;letter-spacing:.12em;color:#fde047;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ms-hud .o{margin-top:11px}
#ms-hud .o .l{display:flex;justify-content:space-between;gap:8px;font:800 16px Rajdhani;color:#fff}
#ms-hud .o .l span:last-child{font-family:Orbitron;font-size:14px}
#ms-hud .bar{height:7px;border-radius:99px;background:#1e293b;overflow:hidden;margin-top:5px}#ms-hud .bar i{display:block;height:100%;border-radius:99px;transition:width .2s}
#ms-hud small{display:block;font:600 13px Rajdhani;margin-top:2px;color:#94a3b8}
#ms-hud .ok small{color:#86efac}#ms-hud .perigo small{color:#fca5a5}#ms-hud .falhou{opacity:.6}
#ms-res{position:fixed;inset:0;z-index:165;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.6);font-family:Rajdhani,sans-serif}
#ms-res .c{width:min(560px,92vw);padding:24px;border-radius:18px;text-align:center;animation:msPop .35s cubic-bezier(.2,1.4,.4,1)}
#ms-res .c.ok{background:rgba(6,30,18,.95);border:2px solid #22c55e;box-shadow:0 0 40px rgba(34,197,94,.3)}
#ms-res .c.no{background:rgba(40,6,10,.95);border:2px solid #ef4444;box-shadow:0 0 40px rgba(239,68,68,.3)}
#ms-res h3{font:900 30px Orbitron;letter-spacing:.05em}
#ms-res .c.ok h3{color:#86efac}#ms-res .c.no h3{color:#fca5a5}
#ms-res .os{margin-top:10px;display:flex;flex-direction:column;gap:4px;font:700 17px Rajdhani;color:#e2e8f0}
#ms-res .lib{margin-top:10px;font:800 16px Orbitron;color:#fde047}
#ms-res .bt{display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap}
#ms-res button{padding:10px 18px;border-radius:10px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;font:800 15px Rajdhani;cursor:pointer}
#ms-res button.pri{background:linear-gradient(90deg,#22d3ee,#6366f1);border:0;color:#020617;font:900 14px Orbitron}
#ms-res button:focus-visible{outline:2px solid #fde047}
/* Garnet 8-bit (assets/pxs-garnet.webp: 8 quadros) */
.gn{background:url('assets/pxs-garnet.webp') 0 0/800% 100% no-repeat;aspect-ratio:300/340;pointer-events:none}
#ms-ov .det{position:relative}
#ms-ov .gnp{position:absolute;right:16px;bottom:14px;height:220px;filter:drop-shadow(0 0 14px rgba(56,189,248,.35))}
#ms-ov .gnc{height:150px;align-self:center;filter:drop-shadow(0 0 12px rgba(56,189,248,.3))}
#ms-hud .gn{position:absolute;right:-14px;top:-84px;height:100px;filter:drop-shadow(0 0 8px rgba(0,0,0,.6))}
#ms-res .gn{height:190px;margin:-140px auto 4px;filter:drop-shadow(0 0 16px rgba(56,189,248,.4))}
@keyframes msPop{from{transform:scale(.8);opacity:0}to{transform:none;opacity:1}}`;
    document.head.appendChild(css);

    // quadros: 0 parada · 1 lendo a prancheta · 2 apontando as missões · 3 entregando a carta (feliz) ·
    // 4 mão no peito · 5 anotando (séria) · 6 assustada (cartas voando) · 7 acenando
    const gn = (f, fps, cls) => `<div class="gn ${cls || ''}" data-f="${f}" data-fps="${fps || 1}"></div>`;
    const GN_IDLE = '0,0,0,1,1,0,0,4';
    setInterval(() => {
        const els = document.querySelectorAll('.gn'); if (!els.length) return;
        const t = performance.now() / 1000;
        els.forEach(el => {
            const fr = (el.dataset.f || '0').split(','), fps = +el.dataset.fps || 1;
            const k = +fr[Math.floor(t * fps) % fr.length] || 0;
            if (el._k !== k) { el._k = k; el.style.backgroundPositionX = (k / 7 * 100) + '%'; }
        });
    }, 100);
    const CORES = [['#0e7490', '#6d28d9'], ['#9d174d', '#f59e0b'], ['#166534', '#0f172a'], ['#7c2d12', '#be185d'], ['#1e3a8a', '#0891b2'], ['#4c1d95', '#db2777']];
    const corDe = (p) => CORES[parseInt(hashStr(p.id), 36) % CORES.length];

    const UI = { view: 'lista', aba: 'meus', packId: null, sel: 0, mirror: false, draft: null, busca: '', filtro: 'todas', sel2: 0, armado: null, msg: '' };

    function ov() { return $('ms-ov'); }
    function abrir(packId) {
        if (typeof isPlaying !== 'undefined' && isPlaying) return;
        UI.msg = ''; UI.armado = null;
        if (packId && packPorId(packId)) { UI.view = 'pack'; UI.packId = packId; UI.sel = primeiraLivre(packPorId(packId)); }
        else if ((UI.view === 'pack' && !packPorId(UI.packId)) || ((UI.view === 'criar1' || UI.view === 'criar2') && !UI.draft)) UI.view = 'lista';
        render();
        document.addEventListener('keydown', tecla, true);
    }
    function fechar() {
        ov()?.remove();
        document.removeEventListener('keydown', tecla, true);
        try { window.bmMenuMusica && window.bmMenuMusica.sync(); } catch (e) {}
    }
    function tecla(e) {
        if (!ov() || document.getElementById('ms-res')) return;
        const typing = /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
        if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); voltar(); return; }
        if (typing) return;
        if (UI.view === 'pack' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault(); e.stopImmediatePropagation();
            const p = packPorId(UI.packId); if (!p) return;
            UI.sel = Math.max(0, Math.min(p.musicas.length - 1, UI.sel + (e.key === 'ArrowUp' ? -1 : 1))); apontar(); render();
            return;
        }
        if (UI.view === 'pack' && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); e.stopImmediatePropagation(); UI.mirror = !UI.mirror; render(); return; }
        if (UI.view === 'pack' && e.key === 'Enter' && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); e.stopImmediatePropagation(); ov().querySelector('[data-jogar]')?.click(); }
    }
    let tAponta = 0;
    function apontar() {
        UI.apontar = Date.now(); clearTimeout(tAponta);
        tAponta = setTimeout(() => { const g = ov()?.querySelector('.gnp'); if (g && g.dataset.f === '2') g.dataset.f = GN_IDLE; }, 1650);
    }
    function voltar() {
        if (UI.view === 'criar2') { UI.view = 'criar1'; render(); return; }
        if (UI.view === 'criar1' || UI.view === 'pack') { UI.view = 'lista'; UI.draft = null; render(); return; }
        fechar();
    }
    function primeiraLivre(p) {
        const e = estadoMusicas(p, progDe(p.id));
        const i = e.findIndex(x => x.st === 'livre');
        return i >= 0 ? i : 0;
    }

    function render() {
        let el = ov();
        const nova = !el;
        if (!el) { el = document.createElement('div'); el.id = 'ms-ov'; document.body.appendChild(el); }
        el.className = '';
        el.innerHTML = `<div class="bx">${UI.view === 'pack' ? vPack() : UI.view === 'criar1' ? vCriar1() : UI.view === 'criar2' ? vCriar2() : vLista()}</div>`;
        if (UI.view === 'lista' && typeof window.beatmaxPersonagem === 'function') {
            window.beatmaxPersonagem(el, 'garnet', window.beatmaxFala ? window.beatmaxFala('missoes', [
                'Sou a <b>Garnet</b>. Eu cuido das missões. Escolha um capítulo e eu te passo as ordens.',
                'Cada capítulo termina num <b>chefão</b>. Vencendo, o <b style="color:#f0abfc">ENCORE</b> é seu.',
                'Monte um pack com as suas músicas. Eu entrego as missões pra turma. ✉️',
                'Missão recebida é missão cumprida. Estou à disposição.'
            ]) : '', '1180px', !nova);
        }
        ligar(el);
        try { window.bmMenuMusica && window.bmMenuMusica.sync(); } catch (e) {}
    }

    // ---------- lista ----------
    function vLista() {
        const l = packs(), me = eu();
        const meus = l.filter(meu), rec = l.filter(p => !meu(p));
        const lista = UI.aba === 'rec' ? rec : meus;
        const cards = lista.slice().sort((a, b) => (b.atualizado || 0) - (a.atualizado || 0)).map(cardPack).join('');
        return `<div class="hd"><h2>🗺️ MISSÕES</h2><span class="sub">packs de músicas com objetivos · capítulos, chefão e Encore</span>
            <div class="r"><button class="btn" data-importar>📥 Importar pack</button><button class="btn pri" data-criar>＋ CRIAR PACK</button><button class="btn" data-fechar>ESC · Fechar</button></div></div>
          <div class="tabs"><button data-aba="meus" class="${UI.aba === 'meus' ? 'on' : ''}">MEUS PACKS · ${meus.length}</button><button data-aba="rec" class="${UI.aba === 'rec' ? 'on' : ''}">RECEBIDOS · ${rec.length}</button>
            <button disabled title="Na próxima fase (nuvem)">EXPLORAR · em breve</button><button disabled title="Em breve">CARREIRA OFICIAL · em breve</button></div>
          <div class="corpo"><div class="packs">${cards}${UI.aba === 'meus' ? `<button class="pk novo" data-criar><b>＋</b><span style="font:800 15px Orbitron;letter-spacing:.06em">CRIAR PACK</span><span style="font:600 14px Rajdhani">escolha de ${MIN_MUS} a ${MAX_MUS} músicas da sua biblioteca</span></button>` : (rec.length ? '' : '<div class="vazio" style="grid-column:1/-1">Nada por aqui ainda. Packs de outros perfis deste PC e packs importados aparecem aqui.</div>')}</div></div>
          <div class="ft"><span><kbd>ESC</kbd>FECHAR</span><span>Perfil: <b style="color:#67e8f9">${esc(me.nome)}</b></span><span style="margin-left:auto">EXP só na 1ª vez de cada missão · seus próprios packs não dão recompensa · música: "Military" — kulakovka (Pixabay)</span></div>`;
    }
    function cardPack(p) {
        const pr = progDe(p.id), ms = p.musicas || [], feitas = ms.filter(m => pr.feitas[m.chartId]).length;
        const [c1, c2] = corDe(p), mine = meu(p), conf = packConfirmado(p), lib = packLiberado(p);
        const falta = ms.filter(m => !confirmada(m)).length;
        const semMus = ms.filter(m => !acharChart(m.chartId)).length;
        const temEnc = ms.some(m => m.encore), encFeito = ms.some(m => m.encore && pr.feitas[m.chartId]);
        const selo = semMus ? `<span class="chip boss" style="background:rgba(2,6,23,.6)">⚠ FALTA${semMus > 1 ? 'M' : ''} ${semMus} MÚSICA${semMus > 1 ? 'S' : ''}</span>`
            : !lib ? `<span class="chip" style="background:rgba(2,6,23,.6)">🔒 CONCLUA O CAP. ANTERIOR</span>`
            : packConcluido(p, pr) ? `<span class="chip ok" style="background:rgba(2,6,23,.6)">✓ CONCLUÍDO${encFeito ? ' · ENCORE ✦' : ''}</span>`
            : mine && !conf ? `<span class="chip warn" style="background:rgba(2,6,23,.6)">⚠ FALTA CONFIRMAR ${falta}</span>`
            : conf ? `<span class="chip ok" style="background:rgba(2,6,23,.6)">✓ CONFIRMADO</span>` : `<span class="chip warn" style="background:rgba(2,6,23,.6)">NÃO CONFIRMADO</span>`;
        const modos = [...new Set(ms.map(m => modoTxt(m.modo)))].join('/');
        const cont = p.cont ? packPorId(p.cont) : null, prox = packs().find(x => x.cont === p.id);
        return `<button class="pk" data-pack="${esc(p.id)}">
            <div class="cap" style="background:linear-gradient(135deg,${c1},${c2})">${selo}<div class="nm">${esc(p.nome || 'Sem nome')}</div><div class="n">CAP. ${esc(p.cap || 1)}</div></div>
            <div class="inf"><div style="font:700 15px Rajdhani;color:#cbd5e1">por <b style="color:${mine ? '#67e8f9' : '#86efac'}">${esc(p.autor ? p.autor.nome : '?')}</b> · ${ms.length} músicas · ${esc(modos)}${temEnc ? ' · ✦' : ''}</div>
              <div class="l"><span>PROGRESSO</span><span style="color:#fff">${feitas} / ${ms.length}</span></div>
              <div class="bar"><i style="width:${ms.length ? Math.round(100 * feitas / ms.length) : 0}%"></i></div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">${cont ? `<span class="chip">← continua: Cap. ${esc(cont.cap)}</span>` : ''}${prox ? `<span class="chip">➜ Cap. ${esc(prox.cap)}: ${esc(prox.nome)}</span>` : ''}${p.importado ? '<span class="chip">📥 importado</span>' : ''}</div></div></button>`;
    }

    // ---------- capítulo ----------
    function vPack() {
        const p = packPorId(UI.packId); if (!p) { UI.view = 'lista'; return vLista(); }
        const pr = progDe(p.id), est = estadoMusicas(p, pr), mine = meu(p), lib = packLiberado(p);
        UI.sel = Math.max(0, Math.min(p.musicas.length - 1, UI.sel));
        const rows = p.musicas.map((m, i) => {
            const e = est[i], c = acharChart(m.chartId), inf = infoChart(c);
            const nome = e.st === 'bloq' && !mine && !m.chefao && !m.encore ? '???' : esc(inf ? inf.titulo : m.titulo);
            const ic = !c ? '⚠' : e.st === 'feita' ? '✓' : e.st === 'livre' ? '▶' : m.chefao ? '💀' : m.encore ? '✦' : '🔒';
            const sub = !c ? 'música não está na sua biblioteca' : e.st === 'bloq' ? esc(e.por) : `${modoTxt(m.modo)}${inf && inf.dif ? ' · ' + esc(inf.dif) : ''} · ${(m.objs || []).length ? (m.objs || []).map(o => OBJ[o.t] ? OBJ[o.t].ic : '').join(' ') : 'sem objetivo'}`;
            const best = pr.feitas[m.chartId] && pr.feitas[m.chartId].prec != null ? `<span class="chip ok">${pr.feitas[m.chartId].prec.toFixed(1).replace('.', ',')}%</span>` : '';
            const tag = m.chefao ? '<span class="chip boss">CHEFÃO</span>' : m.encore ? '<span class="chip enc">ENCORE</span>' : '';
            const cls = ['mi', e.st, m.chefao ? 'chefao' : '', m.encore ? 'encore' : '', i === UI.sel ? 'sel' : ''].join(' ');
            return `<button class="${cls}" data-mi="${i}"><div class="ic">${ic}</div><div style="flex:1;min-width:0"><b>${m.encore ? 'ENCORE' : (i + 1) + '.'} ${nome}</b><small class="m" style="display:block">${sub}</small></div>${best || tag}</button>`;
        }).join('');
        const m = p.musicas[UI.sel], e = est[UI.sel], c = acharChart(m.chartId), inf = infoChart(c);
        const oculto = e.st === 'bloq' && !mine;
        const objs = (m.objs || []).map(o => `<div class="ob"><div class="i">${OBJ[o.t].ic}</div><div style="flex:1"><b>${esc(objTxt(o))}</b><small class="m">${esc(OBJ[o.t].dica(o))}</small></div></div>`).join('')
            + (m.encore ? `<div class="ob" style="border-color:#86198f"><div class="i">✦</div><div style="flex:1"><b>Desafio extra do Encore</b><small class="m">${mine ? esc(m.extra ? objTxt(m.extra) : 'nenhum') + ' (só você vê antes)' : 'revelado quando a música começar'}</small></div></div>` : '');
        const pm = pr.feitas[m.chartId];
        const recompensa = mine ? '<span style="color:#64748b">— (pack seu)</span>' : pr.premio[m.chartId] ? '<span style="color:#86efac">✓ já ganhou</span>' : `+${expDe(m)} EXP <small class="m">(1ª vez)</small>`;
        const pode = lib && c && (e.st !== 'bloq' || mine);
        const conf = confirmada(m);
        return `<div class="hd"><h2>${esc(p.nome || 'Sem nome')}</h2><span class="chip">CAP. ${esc(p.cap || 1)}</span><span class="sub">por ${esc(p.autor ? p.autor.nome : '?')} · desbloqueio: ${p.desbloqueio && p.desbloqueio.tipo === 'n' ? `começa com ${p.desbloqueio.n} liberadas` : 'em sequência'}</span>
            <div class="r">${mine ? '<button class="btn" data-editar>✏ Editar</button>' : ''}<button class="btn" data-exportar>📤 Exportar</button>${UI.armado === 'apagar' ? '<button class="btn red" data-apagar>Clique de novo pra excluir</button>' : '<button class="btn" data-apagar>🗑 Excluir</button>'}<button class="btn" data-voltar>← Voltar</button></div></div>
          <div class="corpo"><div class="capg">
            <div class="set"><div class="lbl">SETLIST${!lib ? ' · 🔒 conclua o capítulo anterior' : ''}</div>${rows}</div>
            <div class="det">
              <div style="display:flex;gap:18px;align-items:center">
                <div style="width:130px;height:130px;flex-shrink:0;border-radius:14px;background:linear-gradient(135deg,${corDe(p)[0]},${corDe(p)[1]});display:flex;align-items:center;justify-content:center;font:900 42px Orbitron;color:#fff">${m.chefao ? '💀' : m.encore ? '✦' : UI.sel + 1}</div>
                <div style="min-width:0"><div class="lbl">${m.encore ? 'ENCORE' : m.chefao ? 'CHEFÃO · MISSÃO ' + (UI.sel + 1) : 'MISSÃO ' + (UI.sel + 1)} DE ${p.musicas.length}</div>
                  <div class="tt">${oculto && !m.chefao && !m.encore ? '???' : esc(inf ? inf.titulo : m.titulo)}</div>
                  <div style="font:700 17px Rajdhani;color:#94a3b8">${inf ? `${inf.artista ? esc(inf.artista) + ' · ' : ''}${modoTxt(inf.modo)}${inf.dif ? ' · ' + esc(inf.dif) : ''}${inf.bpm ? ` · ${inf.bpm} BPM` : ''} · ${tempo(inf.dur)} · ${inf.notas} notas` : '<span style="color:#fca5a5">⚠ esta música não está na sua biblioteca</span>'}</div></div></div>
              <div class="lbl" style="margin-top:4px">OBJETIVOS</div>
              ${objs || '<div class="ob"><div class="i">🎵</div><div><b>Só terminar a música</b><small class="m">sem objetivo extra</small></div></div>'}
              <div class="box3">
                <div><div class="lbl">SEU MELHOR</div><div class="v" style="color:${pm ? '#86efac' : '#94a3b8'}">${pm && pm.prec != null ? pm.prec.toFixed(2).replace('.', ',') + '%' : '—'}</div></div>
                <div><div class="lbl">RECOMPENSA</div><div class="v" style="color:#c4b5fd">${recompensa}</div></div>
                <div><div class="lbl">RANDOM</div><div style="margin-top:6px;display:flex;gap:6px"><button class="btn mini ${!UI.mirror ? 'on' : ''}" data-mirror="0">Normal</button><button class="btn mini ${UI.mirror ? 'on' : ''}" data-mirror="1">⇄ Mirror</button></div></div>
              </div>
              ${mine ? `<div style="font:700 15px Rajdhani;color:${conf ? '#86efac' : '#fcd34d'}">${conf ? '✓ Missão confirmada' : '⚠ Ainda não confirmada: passe nela pra confirmar'}</div>` : ''}
              <div style="margin-top:auto;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button class="btn pri" style="padding:15px 30px;font-size:17px" data-jogar ${pode ? '' : 'disabled'}>▶ ${mine && !conf ? 'TESTAR E CONFIRMAR' : 'JOGAR MISSÃO'}</button>
                <small class="m" style="font-size:14px;max-width:400px">Sem modo sem falha e sem mudar a velocidade da música. A velocidade das notas (SPEED) é livre.</small></div>
              <div class="msg">${esc(UI.msg)}</div>
              ${gn(Date.now() - (UI.apontar || 0) < 1600 ? '2' : e.st === 'bloq' ? '1' : GN_IDLE, 1, 'gnp')}
            </div></div></div>
          <div class="ft"><span><kbd>↑↓</kbd>MISSÃO</span><span><kbd>M</kbd>MIRROR</span><span><kbd>ENTER</kbd>JOGAR</span><span><kbd>ESC</kbd>VOLTAR</span></div>`;
    }
    const expDe = (m) => m.encore ? EXP.encore : m.chefao ? EXP.chefao : EXP.normal;

    // ---------- criador 1: músicas ----------
    function novoDraft(p) {
        if (p) return JSON.parse(JSON.stringify(p));
        const me = eu();
        return { id: uid(), nome: '', cap: 1, cont: '', autor: { id: me.id, nome: me.nome }, criado: Date.now(), desbloqueio: { tipo: 'seq', n: 2 }, musicas: [] };
    }
    function vCriar1() {
        const d = UI.draft;
        const q = UI.busca.trim().toLowerCase();
        const ja = new Set(d.musicas.map(m => m.chartId));
        const bib = charts().map(infoChart).filter(Boolean)
            .filter(i => (UI.filtro === 'todas' || i.modo === UI.filtro) && (!q || (i.titulo + ' ' + i.artista).toLowerCase().includes(q)))
            .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
        const cheio = d.musicas.length >= MAX_MUS;
        const libHtml = bib.length ? bib.slice(0, 200).map(i => `<div class="li"><div class="t"><b>${esc(i.titulo)}</b><small class="m">${i.artista ? esc(i.artista) + ' · ' : ''}${modoTxt(i.modo)}${i.dif ? ' · ' + esc(i.dif) : ''} · ${tempo(i.dur)} · ${i.notas} notas</small></div>${ja.has(i.id) ? '<span class="chip ok">✓ no pack</span>' : `<button class="btn mini" data-add="${esc(i.id)}" ${cheio ? 'disabled' : ''}>＋ Adicionar</button>`}</div>`).join('')
            : `<div class="vazio">${charts().length ? 'Nenhuma música com esse filtro.' : 'Sua biblioteca está vazia. Importe músicas do osu! ou crie charts no Editor.'}</div>`;
        const outros = packs().filter(p => meu(p) && p.id !== d.id);
        const setHtml = d.musicas.map((m, i) => `<div class="li ${m.chefao ? 'chefao' : ''} ${m.encore ? 'encore' : ''}"><span class="n">${m.encore ? '✦' : i + 1}</span><div class="t"><b>${esc(m.titulo)}</b><small class="m">${modoTxt(m.modo)}${m.dif ? ' · ' + esc(m.dif) : ''}</small></div>
            <button class="btn mini ${m.chefao ? 'on' : ''}" data-chefao="${i}" title="Marcar como chefão (só um)">💀</button>
            <button class="btn mini ${m.encore ? 'on' : ''}" data-encore="${i}" title="Encore (vai pro fim)">✦</button>
            <button class="btn mini" data-up="${i}" ${i === 0 || m.encore ? 'disabled' : ''}>↑</button><button class="btn mini" data-down="${i}" ${i >= d.musicas.length - 1 || d.musicas[i + 1].encore || m.encore ? 'disabled' : ''}>↓</button>
            <button class="btn mini" data-rem="${i}">✕</button></div>`).join('')
            + (d.musicas.length < MAX_MUS ? `<div style="padding:9px 12px;border-radius:10px;border:2px dashed #334155;color:#64748b;font:700 14px Rajdhani;text-align:center">vaga livre · de ${MIN_MUS} a ${MAX_MUS} músicas · 💀 chefão e ✦ Encore são opcionais</div>` : '');
        const pronto = d.musicas.length >= MIN_MUS && (d.nome || '').trim();
        return `<div class="hd"><h2>${packPorId(d.id) ? 'EDITAR PACK' : 'CRIAR PACK'}</h2><span class="chip" style="border-color:#22d3ee;color:#67e8f9">1 · MÚSICAS</span><span class="chip">2 · MISSÕES</span>
            <div class="r"><button class="btn" data-salvar>💾 Salvar rascunho</button><button class="btn" data-voltar>← Voltar</button></div></div>
          <div class="campos">
            <label>Nome <input data-f="nome" maxlength="40" value="${esc(d.nome)}" placeholder="ex.: Aquecimento" style="width:240px"></label>
            <label>Capítulo <input data-f="cap" type="number" min="1" max="99" value="${esc(d.cap)}" style="width:66px"></label>
            <label>Continuação de <select data-f="cont"><option value="">— nenhum (começa aqui) —</option>${outros.map(o => `<option value="${esc(o.id)}" ${d.cont === o.id ? 'selected' : ''}>Cap. ${esc(o.cap)} · ${esc(o.nome)}</option>`).join('')}</select></label>
          </div>
          <div class="corpo" style="overflow:hidden"><div class="cr">
            <div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div class="lbl">SUA BIBLIOTECA</div><input data-busca placeholder="🔎 buscar…" value="${esc(UI.busca)}" style="width:230px"></div>
              <div class="chips">${['todas', '4K', '5K', '6K', '8K'].map(f => `<button data-filtro="${f}" class="${UI.filtro === f ? 'on' : ''}">${f === 'todas' ? 'Todas' : modoTxt(f)}</button>`).join('')}</div>
              <div class="lista">${libHtml}</div></div>
            <div><div style="display:flex;justify-content:space-between;align-items:center"><div class="lbl">SETLIST · ${d.musicas.length} DE ${MAX_MUS}</div><small class="m">↑↓ mudam a ordem</small></div>
              <div class="lista" style="flex:0 1 auto">${setHtml}</div>
              <div class="lbl" style="margin-top:6px">DESBLOQUEIO</div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="btn ${d.desbloqueio.tipo !== 'n' ? 'on' : ''}" data-desb="seq">Em sequência (uma libera a próxima)</button>
                <button class="btn ${d.desbloqueio.tipo === 'n' ? 'on' : ''}" data-desb="n">Começa com N liberadas</button>${d.desbloqueio.tipo === 'n' ? `<label style="font:700 15px Rajdhani;color:#94a3b8">N = <input data-f="n" type="number" min="1" max="5" value="${esc(d.desbloqueio.n)}" style="width:60px"></label>` : ''}</div>
              <div style="font:600 14px Rajdhani;color:#64748b">O 💀 chefão abre quando as outras forem concluídas; o ✦ Encore, depois do chefão.</div>
              <div style="margin-top:auto;display:flex;align-items:center;gap:12px"><div class="msg" style="flex:1">${esc(UI.msg)}</div><button class="btn pri" data-prox ${pronto ? '' : 'disabled'}>PRÓXIMO: MISSÕES →</button></div>
            </div></div></div>
          <div class="ft"><span><kbd>ESC</kbd>VOLTAR</span><span style="margin-left:auto">${pronto ? 'Pronto pra configurar as missões!' : `Dê um nome e escolha pelo menos ${MIN_MUS} músicas`}</span></div>`;
    }

    // ---------- criador 2: missões ----------
    function vCriar2() {
        const d = UI.draft;
        UI.sel2 = Math.max(0, Math.min(d.musicas.length - 1, UI.sel2));
        const m = d.musicas[UI.sel2];
        const lst = d.musicas.map((x, i) => `<button class="ms2 ${i === UI.sel2 ? 'sel' : ''}" data-sel2="${i}"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.chefao ? '💀 ' : x.encore ? '✦ ' : ''}${x.encore ? '' : (i + 1) + '. '}${esc(x.titulo)}</span>${!acharChart(x.chartId) ? '<span class="chip boss">sem música</span>' : confirmada(x) ? '<span class="chip ok">✓</span>' : '<span class="chip warn">não testada</span>'}</button>`).join('');
        const inf = infoChart(acharChart(m.chartId));
        const objs = (m.objs || []).map((o, k) => {
            const D = OBJ[o.t];
            let campos = '';
            if (o.t === 'erros') campos = `Errar no máximo <input type="number" min="0" data-ox="${k}" value="${o.x}"> notas (BREAK)`;
            else if (o.t === 'baixos') campos = `No máximo <input type="number" min="0" data-ox="${k}" value="${o.x}"> acertos abaixo de <select data-oy="${k}">${[90, 80, 70, 60, 50].map(v => `<option value="${v}" ${+o.y === v ? 'selected' : ''}>${v}%</option>`).join('')}</select>`;
            else if (o.t === 'combo') campos = `Fazer um combo de <input type="number" min="1" data-ox="${k}" value="${o.x}">${inf ? ` <small class="m">(o chart tem ${inf.notas} notas)</small>` : ''}`;
            else if (o.t === 'prec') campos = `Terminar com <input type="number" min="1" max="100" step="0.5" data-ox="${k}" value="${o.x}">% ou mais de precisão`;
            else if (o.t === 'longas') campos = `Acertar <input type="number" min="1" data-ox="${k}" value="${o.x}"> notas longas${inf ? ` <small class="m">(o chart tem ${inf.holds})</small>` : ''}`;
            else campos = esc(D.menu);
            return `<div class="obed"><span style="font-size:24px">${D.ic}</span>${campos}<button class="btn mini" data-orem="${k}" style="margin-left:auto">✕</button></div>`;
        }).join('');
        const usados = new Set((m.objs || []).map(o => o.t));
        const cheio = (m.objs || []).length >= MAX_OBJ;
        const menu = OBJ_ORDEM.map(t => `<button data-oadd="${t}" ${cheio || usados.has(t) || ((t === 'longas' || t === 'longas0') && inf && !inf.holds) ? 'disabled' : ''}>${OBJ[t].ic} ${esc(OBJ[t].menu)}</button>`).join('');
        const nConf = d.musicas.filter(confirmada).length;
        const extra = m.encore ? `<div class="lbl" style="margin-top:6px">ENCORE · DESAFIO EXTRA</div>
            <div style="font:600 14px Rajdhani;color:#c4b5fd">Escondido até a música começar.</div>
            <select data-extra>${['<option value="">— nenhum —</option>'].concat(EXTRA_OPC.map((o, k) => `<option value="${k}" ${m.extra && m.extra.t === o.t && (m.extra.x == null || m.extra.x === o.x) ? 'selected' : ''}>${OBJ[o.t].ic} ${esc(objTxt(o))}</option>`)).join('')}</select>` : '';
        return `<div class="hd"><h2>${packPorId(d.id) ? 'EDITAR PACK' : 'CRIAR PACK'}</h2><span class="chip">1 · MÚSICAS</span><span class="chip" style="border-color:#22d3ee;color:#67e8f9">2 · MISSÕES</span><span class="sub">${esc(d.nome)} · Cap. ${esc(d.cap)}</span>
            <div class="r"><button class="btn" data-salvar>💾 Salvar</button><button class="btn" data-voltar>← Músicas</button></div></div>
          <div class="corpo" style="overflow:hidden"><div class="cr2">
            <div><div class="lbl">MÚSICAS</div>${lst}<small class="m" style="margin-top:8px;font-size:14px">Mudou um objetivo ou o chart depois de confirmar? A missão volta a "não testada".</small></div>
            <div><div class="lbl">OBJETIVOS · ${esc(m.titulo)} (até ${MAX_OBJ})</div>
              ${objs || '<div class="obed" style="color:#64748b">Sem objetivo: basta terminar a música. Escolha até 2 abaixo.</div>'}
              <div class="menuobj">${menu}</div>
              <div style="font:700 15px Rajdhani;color:#94a3b8">Dificuldade: <b style="color:#e2e8f0">${inf ? esc(inf.dif || '—') + ' · ' + modoTxt(inf.modo) : '—'}</b> <small class="m">(a do próprio chart)</small></div>
              ${extra}
            </div>
            <div><div class="lbl">CONFIRMAÇÃO</div>
              ${gn('5,5,1', 0.7, 'gnc')}
              <div class="aviso">Pra valer, <b>você</b> precisa passar nesta missão com estes objetivos. Assim ninguém recebe missão impossível.</div>
              <button class="btn pri" style="padding:15px" data-testar ${acharChart(m.chartId) ? '' : 'disabled'}>▶ ${confirmada(m) ? 'JOGAR DE NOVO' : 'TESTAR E CONFIRMAR'}</button>
              <div style="font:700 15px Rajdhani;color:${confirmada(m) ? '#86efac' : '#fcd34d'}">${confirmada(m) ? '✓ Confirmada' : '⚠ Ainda não testada'}</div>
              <div class="msg">${esc(UI.msg)}</div>
              <div style="margin-top:auto;padding:12px 14px;border-radius:12px;background:#0b1222;border:1px solid #334155"><div style="display:flex;justify-content:space-between;font:800 12px Orbitron;color:#94a3b8"><span>CONFIRMADAS</span><span style="color:#fff">${nConf} / ${d.musicas.length}</span></div><div class="bar" style="margin-top:6px"><i style="width:${Math.round(100 * nConf / Math.max(1, d.musicas.length))}%;background:linear-gradient(90deg,#22c55e,#a3e635)"></i></div>
                <small class="m">${nConf === d.musicas.length ? 'Pack confirmado! (publicar na nuvem chega na próxima fase)' : 'Exportar e jogar já dá; confirmadas valem pra publicar depois.'}</small></div>
            </div></div></div>
          <div class="ft"><span><kbd>ESC</kbd>VOLTAR</span><span style="margin-left:auto">Salvar guarda o pack · o teste salva sozinho antes de começar</span></div>`;
    }

    // ---------- eventos ----------
    function ligar(el) {
        const q = (s) => el.querySelectorAll(s);
        q('[data-fechar]').forEach(b => b.onclick = fechar);
        q('[data-voltar]').forEach(b => b.onclick = voltar);
        q('[data-aba]').forEach(b => b.onclick = () => { UI.aba = b.dataset.aba; render(); });
        q('[data-criar]').forEach(b => b.onclick = () => { UI.draft = novoDraft(); UI.view = 'criar1'; UI.msg = ''; UI.busca = ''; render(); setTimeout(() => ov()?.querySelector('[data-f="nome"]')?.focus(), 30); });
        q('[data-pack]').forEach(b => b.onclick = () => { const p = packPorId(b.dataset.pack); if (!p) return; UI.view = 'pack'; UI.packId = p.id; UI.sel = primeiraLivre(p); UI.msg = ''; UI.armado = null; render(); });
        q('[data-importar]').forEach(b => b.onclick = importar);
        // capítulo
        q('[data-mi]').forEach(b => b.onclick = () => { UI.sel = +b.dataset.mi; UI.msg = ''; apontar(); render(); });
        q('[data-mirror]').forEach(b => b.onclick = () => { UI.mirror = b.dataset.mirror === '1'; render(); });
        q('[data-jogar]').forEach(b => b.onclick = () => { const p = packPorId(UI.packId); if (p) jogar(p, UI.sel, UI.mirror); });
        q('[data-editar]').forEach(b => b.onclick = () => { const p = packPorId(UI.packId); if (!p) return; UI.draft = novoDraft(p); UI.view = 'criar1'; UI.msg = ''; render(); });
        q('[data-exportar]').forEach(b => b.onclick = () => { const p = packPorId(UI.packId); if (p) exportar(p); });
        q('[data-apagar]').forEach(b => b.onclick = () => {
            if (UI.armado !== 'apagar') { UI.armado = 'apagar'; render(); return; }
            const l = packs().filter(p => p.id !== UI.packId).map(p => (p.cont === UI.packId ? Object.assign(p, { cont: '' }) : p));
            salvarPacks(l); const g = prog(); delete g[UI.packId]; lsSet(PROG_KEY, g);
            UI.armado = null; UI.view = 'lista'; render();
        });
        // criador 1
        const d = UI.draft;
        q('[data-f]').forEach(inp => inp.oninput = () => {
            const f = inp.dataset.f;
            if (f === 'nome') d.nome = inp.value;
            else if (f === 'cap') d.cap = Math.max(1, Math.min(99, parseInt(inp.value, 10) || 1));
            else if (f === 'cont') d.cont = inp.value;
            else if (f === 'n') d.desbloqueio.n = Math.max(1, Math.min(5, parseInt(inp.value, 10) || 1));
            const pr = ov()?.querySelector('[data-prox]'); if (pr) pr.disabled = !(d.musicas.length >= MIN_MUS && (d.nome || '').trim());
        });
        q('select[data-f="cont"]').forEach(s => s.onchange = () => { d.cont = s.value; const ant = packPorId(s.value); if (ant && (+d.cap || 1) <= (+ant.cap || 1)) d.cap = (+ant.cap || 1) + 1; render(); });
        q('[data-busca]').forEach(inp => inp.oninput = () => { UI.busca = inp.value; const pos = inp.selectionStart; render(); const n = ov()?.querySelector('[data-busca]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
        q('[data-filtro]').forEach(b => b.onclick = () => { UI.filtro = b.dataset.filtro; render(); });
        q('[data-add]').forEach(b => b.onclick = () => {
            if (d.musicas.length >= MAX_MUS) return;
            const inf = infoChart(acharChart(b.dataset.add)); if (!inf) return;
            const m = { chartId: inf.id, titulo: inf.titulo, modo: inf.modo, dif: inf.dif, objs: [], chefao: false, encore: false, extra: null, conf: null };
            const ie = d.musicas.findIndex(x => x.encore);
            if (ie >= 0) d.musicas.splice(ie, 0, m); else d.musicas.push(m);
            render();
        });
        q('[data-rem]').forEach(b => b.onclick = () => { d.musicas.splice(+b.dataset.rem, 1); render(); });
        q('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; [d.musicas[i - 1], d.musicas[i]] = [d.musicas[i], d.musicas[i - 1]]; render(); });
        q('[data-down]').forEach(b => b.onclick = () => { const i = +b.dataset.down; [d.musicas[i + 1], d.musicas[i]] = [d.musicas[i], d.musicas[i + 1]]; render(); });
        q('[data-chefao]').forEach(b => b.onclick = () => { const i = +b.dataset.chefao, v = !d.musicas[i].chefao; d.musicas.forEach(m => { m.chefao = false; }); d.musicas[i].chefao = v; if (v) d.musicas[i].encore = false; render(); });
        q('[data-encore]').forEach(b => b.onclick = () => {
            const i = +b.dataset.encore, v = !d.musicas[i].encore;
            d.musicas.forEach(m => { m.encore = false; });
            if (v) { const m = d.musicas.splice(i, 1)[0]; m.encore = true; m.chefao = false; if (!m.extra) m.extra = { t: 'maxcombo' }; d.musicas.push(m); }
            render();
        });
        q('[data-desb]').forEach(b => b.onclick = () => { d.desbloqueio.tipo = b.dataset.desb; render(); });
        q('[data-salvar]').forEach(b => b.onclick = () => { if (salvarDraft()) { UI.msg = '✓ Salvo!'; render(); } });
        q('[data-prox]').forEach(b => b.onclick = () => { if (!salvarDraft()) return; UI.view = 'criar2'; UI.sel2 = 0; UI.msg = ''; render(); });
        // criador 2
        q('[data-sel2]').forEach(b => b.onclick = () => { UI.sel2 = +b.dataset.sel2; UI.msg = ''; render(); });
        const cur = d && d.musicas ? d.musicas[UI.sel2] : null;
        q('[data-oadd]').forEach(b => b.onclick = () => {
            if (!cur) return; const t = b.dataset.oadd, D = OBJ[t], o = { t };
            if (D.x != null) o.x = D.x; if (D.y != null) o.y = D.y;
            const inf = infoChart(acharChart(cur.chartId));
            if (inf && t === 'combo') o.x = Math.max(1, Math.min(inf.notas, Math.round(inf.notas * 0.4)));
            if (inf && t === 'longas') o.x = Math.max(1, Math.round(inf.holds * 0.7));
            cur.objs = (cur.objs || []).concat([o]).slice(0, MAX_OBJ); render();
        });
        q('[data-orem]').forEach(b => b.onclick = () => { cur.objs.splice(+b.dataset.orem, 1); render(); });
        q('[data-ox]').forEach(inp => inp.onchange = () => { const o = cur.objs[+inp.dataset.ox]; const v = parseFloat(inp.value); o.x = isFinite(v) ? Math.max(o.t === 'erros' || o.t === 'baixos' ? 0 : 1, o.t === 'prec' ? Math.min(100, v) : Math.round(v)) : o.x; render(); });
        q('[data-oy]').forEach(s => s.onchange = () => { cur.objs[+s.dataset.oy].y = +s.value; render(); });
        q('[data-extra]').forEach(s => s.onchange = () => { cur.extra = s.value === '' ? null : Object.assign({}, EXTRA_OPC[+s.value]); render(); });
        q('[data-testar]').forEach(b => b.onclick = () => { if (!salvarDraft()) return; const p = packPorId(d.id); if (p) jogar(p, UI.sel2, false, true); });
    }
    function salvarDraft() {
        const d = UI.draft; if (!d) return false;
        d.nome = (d.nome || '').trim();
        if (!d.nome) { UI.msg = 'Dê um nome pro pack.'; render(); return false; }
        if (d.musicas.length < MIN_MUS) { UI.msg = `Escolha pelo menos ${MIN_MUS} músicas.`; render(); return false; }
        // não deixa a continuação apontar pra ele mesmo (nem em ciclo)
        let c = d.cont, guard = 0; while (c && guard++ < 50) { if (c === d.id) { d.cont = ''; break; } const a = packPorId(c); c = a ? a.cont : ''; }
        gravarPack(JSON.parse(JSON.stringify(d)));
        return true;
    }

    // ---------- exportar / importar ----------
    function exportar(p) {
        const dados = { formato: 'beatmax-pack', versao: 1, pack: Object.assign({}, p, { musicas: p.musicas.map(m => Object.assign({}, m, { conf: null, sig: chartSig(acharChart(m.chartId)) })) }) };
        const blob = new Blob([JSON.stringify(dados, null, 1)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = `pack-${String(p.nome || 'missoes').normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()}-cap${p.cap || 1}.beatmaxpack`;
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        UI.msg = '✓ Pack exportado. As músicas vão à parte (pela Nuvem ou pela biblioteca).'; render();
    }
    function importar() {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.beatmaxpack,.json,application/json';
        inp.onchange = () => {
            const f = inp.files && inp.files[0]; if (!f) return;
            f.text().then(t => {
                const j = JSON.parse(t);
                if (!j || j.formato !== 'beatmax-pack' || !j.pack || !Array.isArray(j.pack.musicas)) throw new Error('formato');
                const p = j.pack;
                p.importado = true; p.atualizado = Date.now();
                p.musicas = p.musicas.slice(0, MAX_MUS).map(m => ({ chartId: String(m.chartId || ''), titulo: String(m.titulo || ''), modo: m.modo, dif: m.dif || '', objs: Array.isArray(m.objs) ? m.objs.filter(o => o && OBJ[o.t]).slice(0, MAX_OBJ) : [], chefao: !!m.chefao, encore: !!m.encore, extra: m.extra && OBJ[m.extra.t] ? m.extra : null, conf: null }));
                if (!p.id) p.id = uid();
                gravarPack(p);
                UI.aba = 'rec'; UI.view = 'lista'; render();
            }).catch(() => { UI.msg = 'Esse arquivo não é um pack do BEATMAX.'; render(); });
        };
        inp.click();
    }

    // ================================================================================
    // NA PARTIDA
    // ================================================================================
    let RUN = null;       // missão em andamento
    let salvo = null;     // configurações trocadas pra missão (voltam no fim)
    function jogar(p, idx, mirror, confirmar) {
        const m = p.musicas[idx], c = acharChart(m.chartId);
        if (!c) { UI.msg = 'Esta música não está na sua biblioteca.'; render(); return; }
        if (typeof isPlaying !== 'undefined' && isPlaying) return;
        salvo = { noFail: typeof noFailMode !== 'undefined' ? noFailMode : false, rate: typeof gameRate !== 'undefined' ? gameRate : 1, random: typeof randomMod !== 'undefined' ? randomMod : 'none', voltar: { view: UI.view, packId: UI.packId, sel: UI.sel, sel2: UI.sel2, draftId: UI.draft ? UI.draft.id : null } };
        try { noFailMode = false; } catch (e) {}
        try { gameRate = 1; } catch (e) {}
        try { randomMod = mirror ? 'mirror' : 'none'; } catch (e) {}
        RUN = { packId: p.id, idx, chartId: m.chartId, objs: objsDa(m), m: JSON.parse(JSON.stringify(m)), mirror: !!mirror, confirmar: !!confirmar, falha: null, statsRef: null, iniciou: false, fim: false };
        fechar();
        try {
            currentPatternType = 'custom:' + m.chartId;
            if (window.bmAbrirSelecao) window.bmAbrirSelecao();
            setTimeout(() => { const b = $('btn-start'); if (b) b.click(); else if (typeof startPractice === 'function') startPractice(); }, 60);
        } catch (e) { console.warn('[missoes]', e); restaurar(); RUN = null; }
    }
    function restaurar() {
        if (!salvo) return;
        try { noFailMode = salvo.noFail; } catch (e) {}
        try { gameRate = salvo.rate; if (typeof syncRateUI === 'function') syncRateUI(); } catch (e) {}
        try { randomMod = salvo.random; } catch (e) {}
        try { if (typeof saveSettings === 'function') saveSettings(); } catch (e) {}
    }
    window.bmMissaoAtiva = () => !!(RUN && !RUN.fim);
    window.bmMissaoFalhou = () => !!(RUN && !RUN.fim && RUN.falha);

    // números da partida
    function numeros() {
        const S = typeof stats !== 'undefined' ? stats : null, N = typeof notes !== 'undefined' && Array.isArray(notes) ? notes : [];
        if (!S) return null;
        const j = S.judgments || {}, julgadas = (j.max100 || 0) + (j.max90 || 0) + (j.lower || 0) + (j.break || 0);
        const total = N.length, rest = Math.max(0, total - julgadas);
        const tp = typeof totalPossibleScore !== 'undefined' && totalPossibleScore > 0 ? totalPossibleScore : total * 100;
        const ganho = typeof currentEarnedScore !== 'undefined' ? currentEarnedScore : 0;
        let H = 0, hOk = 0, hRuim = 0;
        for (const n of N) { if (!n.holdEnd) continue; H++; if (n.missed || (n.holdResolved && !(n.pointsEarned > 0))) hRuim++; else if (n.holdResolved) hOk++; }
        const pc = S.pctCounts || {};
        const abaixo = (y) => Object.keys(pc).reduce((a, k) => a + (+k < y ? pc[k] : 0), 0);
        return { S, brk: j.break || 0, combo: S.combo || 0, maxCombo: S.maxCombo || 0, total, rest, prec: tp ? 100 * ganho / tp : 0, maxPrec: tp ? 100 * (ganho + rest * 100) / tp : 0, H, hOk, hRuim, abaixo, hp: typeof hp !== 'undefined' ? hp : 100 };
    }
    // situação de cada objetivo: { v (texto), pct (0..1 barra), st: 'ok'|'vai'|'perigo'|'falhou', msg, motivo }
    function avaliar(o, n, final) {
        switch (o.t) {
            case 'erros': { const st = n.brk > o.x ? 'falhou' : n.brk >= o.x - Math.max(1, Math.round(o.x * 0.3)) ? 'perigo' : 'vai'; return { v: `${n.brk} / ${o.x}`, pct: o.x ? Math.min(1, n.brk / o.x) : (n.brk ? 1 : 0), st: st !== 'falhou' && final ? 'ok' : st, msg: st === 'falhou' ? `passou de ${o.x} erros` : `mais ${o.x - n.brk + 1} e falha`, motivo: `Passou de ${o.x} erros (BREAK)`, ruim: true }; }
            case 'baixos': { const a = n.abaixo(o.y); const st = a > o.x ? 'falhou' : a >= o.x - Math.max(1, Math.round(o.x * 0.3)) ? 'perigo' : 'vai'; return { v: `${a} / ${o.x}`, pct: o.x ? Math.min(1, a / o.x) : (a ? 1 : 0), st: st !== 'falhou' && final ? 'ok' : st, msg: `acertos abaixo de ${o.y}%`, motivo: `Passou de ${o.x} acertos abaixo de ${o.y}%`, ruim: true }; }
            case 'combo': { const ok = n.maxCombo >= o.x, da = Math.max(n.maxCombo, n.combo + n.rest) >= o.x; return { v: `${Math.max(n.combo, ok ? o.x : 0) >= o.x ? o.x : n.combo} → ${o.x}`, pct: Math.min(1, Math.max(n.maxCombo, n.combo) / o.x), st: ok ? 'ok' : !da || final ? 'falhou' : 'vai', msg: ok ? 'conseguiu!' : da ? `ainda dá · restam ${n.rest} notas` : 'não dá mais', motivo: `Não dava mais pra chegar no combo ${o.x}` }; }
            case 'prec': { const ok = n.prec >= o.x, da = n.maxPrec >= o.x; return { v: `${(final ? n.prec : n.maxPrec).toFixed(1).replace('.', ',')}%`, pct: Math.min(1, (final ? n.prec : n.maxPrec) / 100), st: final ? (ok ? 'ok' : 'falhou') : da ? (n.maxPrec - o.x < 1.5 ? 'perigo' : 'vai') : 'falhou', msg: final ? (ok ? 'conseguiu!' : `faltou pra ${o.x}%`) : `máximo possível agora (meta ${o.x}%)`, motivo: `Não dava mais pra terminar com ${o.x}%` }; }
            case 'sobreviver': return { v: `HP ${Math.round(n.hp)}`, pct: Math.max(0, Math.min(1, n.hp / 100)), st: n.hp <= 0 ? 'falhou' : final ? 'ok' : n.hp < 30 ? 'perigo' : 'vai', msg: n.hp < 30 ? 'cuidado com o HP!' : 'segura firme', motivo: 'O HP zerou' };
            case 'maxcombo': return { v: n.brk ? '✕' : '✓', pct: n.total ? 1 - n.rest / n.total : 0, st: n.brk ? 'falhou' : final ? 'ok' : 'vai', msg: n.brk ? 'errou uma nota' : 'nenhum erro até agora', motivo: 'Errou uma nota (MAX COMBO)' };
            case 'longas': { const ok = n.hOk >= o.x, da = n.H - n.hRuim >= o.x; return { v: `${n.hOk} / ${o.x}`, pct: Math.min(1, n.hOk / o.x), st: ok ? 'ok' : !da || final ? 'falhou' : 'vai', msg: ok ? 'conseguiu!' : `${n.H - n.hRuim - n.hOk} longas pela frente`, motivo: `Não sobravam notas longas pra chegar em ${o.x}` }; }
            case 'longas0': return { v: `${n.hRuim ? '✕' : '✓'} ${n.hOk}/${n.H}`, pct: n.H ? n.hOk / n.H : 1, st: n.hRuim ? 'falhou' : final ? 'ok' : 'vai', msg: n.hRuim ? 'errou uma longa' : 'nenhuma longa errada', motivo: 'Errou uma nota longa' };
        }
        return { v: '', pct: 0, st: 'vai', msg: '', motivo: '' };
    }
    function hudPos(h) {
        const cv = (typeof palcoGearCanvas === 'function' && palcoGearCanvas()) || $('gameCanvas');
        const rc = typeof gearRectsCached === 'function' ? gearRectsCached(performance.now()) : null;
        const r = rc && rc.gear ? rc.gear : cv && cv.getBoundingClientRect();
        let left = 20, top = 120;
        if (r && r.width) {
            if (innerWidth - r.right >= 330) { left = r.right + 24; top = Math.max(20, r.top + r.height * 0.12); }
            else if (r.left >= 330) { left = r.left - 324; top = Math.max(20, r.top + r.height * 0.12); }
            else { left = Math.max(8, r.left + 8); top = Math.max(8, r.top + 8); }
        }
        h.style.left = Math.round(left) + 'px'; h.style.top = Math.round(top) + 'px';
    }
    let hudUlt = '';
    function tick() {
        if (!RUN || RUN.fim) { const h = $('ms-hud'); if (h) h.remove(); return; }
        const playing = typeof isPlaying !== 'undefined' && isPlaying;
        if (playing) RUN.iniciou = true;
        if (RUN.iniciou && !playing) { // saiu no meio (menu de pausa) sem terminar
            RUN.fim = true; restaurar(); $('ms-hud')?.remove(); RUN = null; return;
        }
        if (!playing) return;
        if (typeof stats !== 'undefined' && stats !== RUN.statsRef) { RUN.statsRef = stats; RUN.falha = null; hudUlt = ''; } // recomeçou (Retry)
        const n = numeros(); if (!n) return;
        const contando = typeof isCountingDown !== 'undefined' && isCountingDown;
        const av = RUN.objs.map(o => avaliar(o, n, false));
        if (!RUN.falha && !contando) { const k = av.findIndex(a => a.st === 'falhou'); if (k >= 0) RUN.falha = av[k].motivo; }
        let h = $('ms-hud');
        if (!h) { h = document.createElement('div'); h.id = 'ms-hud'; document.body.appendChild(h); }
        hudPos(h);
        const p = packPorId(RUN.packId), tot = p ? p.musicas.length : 0;
        const titulo = `${RUN.m.encore ? 'ENCORE' : RUN.m.chefao ? 'CHEFÃO' : 'MISSÃO ' + (RUN.idx + 1) + '/' + tot} · ${RUN.m.titulo}`;
        const pior = av.some(a => a.st === 'falhou') ? '6' : av.some(a => a.st === 'perigo') ? '2' : '1,1,5';
        const html = gn(pior, 0.8) + `<div class="h">${esc(titulo)}</div>` + (RUN.objs.length ? RUN.objs.map((o, k) => {
            const a = av[k], cor = a.st === 'falhou' ? '#ef4444' : a.st === 'perigo' ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : a.st === 'ok' ? '#22c55e' : a.ruim ? 'linear-gradient(90deg,#22c55e,#f59e0b)' : 'linear-gradient(90deg,#22d3ee,#4ade80)';
            const nome = o.extra ? '✦ ' + objTxt(o) : `${OBJ[o.t].ic} ${objTxt(o)}`;
            return `<div class="o ${a.st === 'falhou' ? 'falhou perigo' : a.st}"><div class="l"><span>${esc(nome)}</span><span>${esc(a.v)}</span></div><div class="bar"><i style="width:${Math.round(a.pct * 100)}%;background:${cor}"></i></div><small>${esc(a.msg)}</small></div>`;
        }).join('') : '<div class="o"><small>Só terminar a música!</small></div>');
        if (html !== hudUlt) { h.innerHTML = html; hudUlt = html; }
    }
    setInterval(tick, 150);

    // fim da partida: confere, grava e mostra o resultado
    function terminou(failed) {
        if (!RUN || RUN.fim || !RUN.iniciou) return;
        RUN.fim = true;
        const r = RUN; RUN = null;
        $('ms-hud')?.remove();
        const n = numeros();
        const av = n ? r.objs.map(o => avaliar(o, n, true)) : [];
        let motivo = r.falha || (failed ? 'O HP zerou' : '');
        if (!motivo) { const k = av.findIndex(a => a.st !== 'ok'); if (k >= 0) motivo = av[k].motivo; }
        const passou = !motivo;
        restaurar();
        const p = packPorId(r.packId);
        let liberou = [], ganhou = 0, confirmou = false;
        if (p && passou) {
            const pr = progDe(p.id), antes = estadoMusicas(p, pr);
            const ant = pr.feitas[r.chartId];
            pr.feitas[r.chartId] = { prec: Math.max(n ? n.prec : 0, ant && ant.prec || 0), at: Date.now() };
            if (!meu(p) && !pr.premio[r.chartId]) { pr.premio[r.chartId] = 1; ganhou = expDe(r.m); }
            gravarProg(p.id, pr);
            const depois = estadoMusicas(p, pr);
            liberou = p.musicas.filter((m, i) => antes[i].st === 'bloq' && depois[i].st === 'livre').map(m => m.encore ? '✦ ENCORE' : m.chefao ? '💀 CHEFÃO' : m.titulo);
            if (packConcluido(p, pr)) { const prox = packs().find(x => x.cont === p.id); if (prox && liberou.indexOf('cap') < 0) liberou.push(`Capítulo ${prox.cap}: ${prox.nome}`); }
            // o criador passando = missão confirmada (com estes objetivos e este chart)
            if (meu(p)) {
                const m = p.musicas.find(x => x.chartId === r.chartId);
                const c = acharChart(r.chartId);
                if (m && c && JSON.stringify(m.objs || []) === JSON.stringify(r.m.objs || []) && JSON.stringify(m.extra || null) === JSON.stringify(r.m.extra || null)) { m.conf = cfgSig(m, c); gravarPack(p); confirmou = true; if (UI.draft && UI.draft.id === p.id) UI.draft = novoDraft(p); }
            }
            if (ganhou && typeof window.nivelBonus === 'function') window.nivelBonus(ganhou, `Missão: ${r.m.titulo}`);
        }
        setTimeout(() => mostrarResultado(r, passou, motivo, av, liberou, ganhou, confirmou), 350);
    }
    function mostrarResultado(r, passou, motivo, av, liberou, ganhou, confirmou) {
        $('ms-res')?.remove();
        const el = document.createElement('div'); el.id = 'ms-res';
        const objs = r.objs.map((o, k) => `<div>${av[k] && av[k].st === 'ok' ? '✓' : '✕'} ${esc(o.extra ? '✦ ' + objTxt(o) : objTxt(o))}</div>`).join('');
        const p = packPorId(r.packId), prox = p ? estadoMusicas(p, progDe(p.id)).findIndex(x => x.st === 'livre') : -1;
        el.innerHTML = `<div class="c ${passou ? 'ok' : 'no'}">${gn(passou ? (confirmou && !ganhou ? '7' : '3,3,3,7,7,7') : '6', 1.5)}<h3>${passou ? (r.m.encore ? 'ENCORE CONCLUÍDO!' : r.m.chefao ? 'CHEFÃO DERROTADO!' : 'MISSÃO CONCLUÍDA!') : 'MISSÃO FALHOU'}</h3>
            ${passou ? '' : `<div class="os" style="color:#fecaca">❌ ${esc(motivo)}</div>`}
            <div class="os">${objs}</div>
            ${ganhou ? `<div class="lib" style="color:#c4b5fd">+${ganhou} EXP</div>` : ''}${confirmou ? '<div class="lib" style="color:#86efac">✓ Missão confirmada</div>' : ''}
            ${liberou.map(t => `<div class="lib">🔓 Liberou: ${esc(t)}</div>`).join('')}
            <div class="bt"><button class="pri" data-r="de-novo">↻ ${passou ? 'Jogar de novo' : 'Tentar de novo'}</button>${passou && prox >= 0 && !r.confirmar ? '<button class="pri" data-r="prox">▶ Próxima missão</button>' : ''}<button data-r="voltar">${r.confirmar ? 'Voltar ao pack' : 'Voltar ao capítulo'}</button><button data-r="ver">Ver resultado</button></div></div>`;
        document.body.appendChild(el);
        const sair = () => { el.remove(); document.removeEventListener('keydown', k, true); };
        const voltarMissoes = () => {
            sair();
            try { $('stats-overlay')?.classList.add('hidden'); if (typeof leaveGameFullscreen === 'function') leaveGameFullscreen(); if (typeof stopAllGameLoops === 'function') stopAllGameLoops(); $('menu-overlay')?.classList.add('hidden'); if (window.bmAbrirMenu) window.bmAbrirMenu(); } catch (e) {}
        };
        el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
            const a = b.dataset.r, pk = packPorId(r.packId);
            if (a === 'ver') { sair(); return; }
            if (a === 'de-novo' && pk) { const i = pk.musicas.findIndex(m => m.chartId === r.chartId); voltarMissoes(); jogar(pk, i >= 0 ? i : r.idx, r.mirror, r.confirmar); return; }
            if (a === 'prox' && pk) { voltarMissoes(); jogar(pk, prox, r.mirror, false); return; }
            voltarMissoes();
            if (pk) {
                if (r.confirmar && meu(pk)) { UI.draft = novoDraft(pk); UI.view = 'criar2'; UI.sel2 = Math.max(0, pk.musicas.findIndex(m => m.chartId === r.chartId)); UI.msg = ''; abrir(); }
                else { UI.view = 'pack'; UI.packId = pk.id; abrir(pk.id); }
            } else abrir();
        });
        const k = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); sair(); } };
        document.addEventListener('keydown', k, true);
        setTimeout(() => el.querySelector('button.pri')?.focus(), 50);
    }
    if (typeof window.afterRunFinished === 'function') {
        const orig = window.afterRunFinished;
        window.afterRunFinished = function (failed) {
            try { terminou(failed); } catch (e) { console.warn('[missoes]', e); }
            return orig.apply(this, arguments);
        };
    }

    window.openMissoes = abrir;
    window.bmMissoes = { packs, prog, estadoMusicas, confirmada, infoChart, OBJ };
})();

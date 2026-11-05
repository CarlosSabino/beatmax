// =====================================================================================
// presente.js — PRESENTÃO DE ANIVERSÁRIO: 1.000 Beatcoins pra galera.
//
//  Do dia 16 ao dia 30 de novembro de 2026, ao abrir o jogo aparece um aviso de festa (com
//  confete e a Arya) e o botão "ABRIR O PRESENTE" dá +1.000 Beatcoins, uma vez só por perfil
//  (fica marcado nas moedas, que vão pra nuvem junto). Teste: ?aniv=1 na URL.
// =====================================================================================
(function () {
    const ID = 'aniv2026', VALOR = 1000;
    const INI = new Date(2026, 10, 16), FIM = new Date(2026, 10, 30, 23, 59, 59);
    const forca = /[?&]aniv=1\b/.test(location.search);
    const agora = () => new Date();
    const noPrazo = () => forca || (agora() >= INI && agora() <= FIM);
    const ehODia = () => { const d = agora(); return d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 16; };

    const css = document.createElement('style');
    css.textContent = `
#aniv-ov{position:fixed;inset:0;z-index:158;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,rgba(88,28,135,.55),rgba(2,6,23,.93) 70%);font-family:Rajdhani,sans-serif;color:#fdf4ff;overflow:hidden}
#aniv-ov .bx{position:relative;width:min(720px,94vw);padding:26px 30px 24px;border-radius:22px;text-align:center;background:linear-gradient(180deg,#1e1038,#120a24);border:2px solid #f0abfc;box-shadow:0 0 0 6px rgba(240,171,252,.08),0 0 60px rgba(236,72,153,.35),0 30px 80px rgba(0,0,0,.6);animation:anPop .55s cubic-bezier(.2,1.5,.4,1)}
#aniv-ov .bolo{font-size:64px;line-height:1;animation:anBolo 1.2s ease-in-out infinite;filter:drop-shadow(0 0 18px rgba(253,224,71,.5))}
#aniv-ov h2{font:900 clamp(22px,3.2vw,34px) Orbitron,monospace;letter-spacing:.06em;margin:8px 0 6px;background:linear-gradient(90deg,#fde047,#f472b6,#22d3ee,#a3e635,#fde047);background-size:300% 100%;-webkit-background-clip:text;color:transparent;animation:anArco 4s linear infinite}
#aniv-ov p{font:700 19px Rajdhani;color:#e9d5ff;line-height:1.35;margin:4px 0}
#aniv-ov p small{font-size:15px;color:#c4b5fd}
#aniv-ov .valor{display:inline-flex;align-items:center;gap:12px;margin:14px 0 6px;padding:10px 22px;border-radius:16px;background:rgba(250,204,21,.12);border:2px solid #facc15;font:900 clamp(26px,4vw,40px) Orbitron;color:#fde047;text-shadow:0 0 18px rgba(250,204,21,.6)}
#aniv-ov .valor i{width:1.15em;height:1.15em;background:url('assets/beatcoin-hd.png') center/contain no-repeat;animation:anGira 2.2s ease-in-out infinite}
#aniv-ov .bt{margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
#aniv-ov button{padding:13px 26px;border-radius:14px;border:0;cursor:pointer;font:900 17px Orbitron;letter-spacing:.04em}
#aniv-ov button.abrir{background:linear-gradient(90deg,#f472b6,#a855f7,#22d3ee);color:#fff;box-shadow:0 0 24px rgba(236,72,153,.5);animation:anPulso 1.1s ease-in-out infinite}
#aniv-ov button.dps{background:#1e293b;color:#cbd5e1;border:1px solid #475569;font:800 15px Rajdhani}
#aniv-ov .cf{position:absolute;top:-20px;width:10px;height:16px;opacity:.9;animation:anCai linear infinite}
#aniv-ov .bal{position:absolute;bottom:-120px;width:56px;height:70px;border-radius:50% 50% 48% 48%;opacity:.85;animation:anSobe linear infinite}
#aniv-ov .bal:after{content:'';position:absolute;left:50%;top:100%;width:1px;height:60px;background:rgba(255,255,255,.5)}
@keyframes anPop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
@keyframes anBolo{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}
@keyframes anArco{to{background-position:300% 0}}
@keyframes anGira{0%,100%{transform:rotateY(0)}50%{transform:rotateY(180deg)}}
@keyframes anPulso{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes anCai{to{transform:translateY(110vh) rotate(720deg)}}
@keyframes anSobe{to{transform:translateY(-130vh) translateX(30px)}}
@media (prefers-reduced-motion:reduce){#aniv-ov *{animation:none!important}}`;
    document.head.appendChild(css);

    const FALAS = [
        'Shhh! Festa surpresa! Não conta pra ninguém… 🎈',
        'Eu ia fazer um bolo, mas a Jade grafitou ele. 🎂',
        'Tem bolo, confete e 1.000 moedas. Pode chegar! 🎉'
    ];
    function abrir() {
        if (document.getElementById('aniv-ov')) return;
        const ov = document.createElement('div'); ov.id = 'aniv-ov';
        const cores = ['#f472b6', '#22d3ee', '#fde047', '#a3e635', '#c084fc', '#fb923c'];
        let deco = '';
        for (let i = 0; i < 34; i++) deco += `<i class="cf" style="left:${(Math.random() * 100).toFixed(1)}%;background:${cores[i % cores.length]};animation-duration:${(4 + Math.random() * 4).toFixed(1)}s;animation-delay:-${(Math.random() * 6).toFixed(1)}s;border-radius:${i % 3 ? 2 : 8}px"></i>`;
        for (let i = 0; i < 6; i++) deco += `<i class="bal" style="left:${(5 + i * 16 + Math.random() * 6).toFixed(1)}%;background:${cores[(i + 2) % cores.length]};animation-duration:${(9 + Math.random() * 5).toFixed(1)}s;animation-delay:-${(Math.random() * 8).toFixed(1)}s"></i>`;
        ov.innerHTML = deco + `<div class="bx">
            <div class="bolo">🎂</div>
            <h2>${ehODia() ? 'HOJE TEM FESTA NO BEATMAX!' : 'A FESTA AINDA TÁ ROLANDO!'}</h2>
            <p>Psiu… quem fez este jogo ${ehODia() ? 'está' : 'esteve'} de aniversário! 🥳<br><small>Idade? Segredo de estado. 🤫</small></p>
            <p>Mas, aqui no BEATMAX, quem ganha o presente é <b style="color:#fde047">você</b>:</p>
            <div class="valor"><i></i>+1.000 BEATCOINS</div>
            <p><small>Valeu por jogar com a gente! Aproveita: os itens ⭐ PREMIUM estão em promoção. 😉</small></p>
            <div class="bt"><button class="abrir" data-abrir>🎁 ABRIR O PRESENTE</button><button class="dps" data-dps>Depois</button></div>
          </div>`;
        document.body.appendChild(ov);
        if (typeof window.beatmaxPersonagem === 'function') window.beatmaxPersonagem(ov, 'arya', FALAS[Math.floor(Math.random() * FALAS.length)], '760px');
        const fechar = () => { ov.remove(); document.removeEventListener('keydown', tecla, true); try { window.bmMenuMusica && window.bmMenuMusica.sync(); } catch (e) {} };
        const pegar = () => {
            fechar();
            if (typeof window.beatcoinsPresente === 'function') window.beatcoinsPresente(ID, VALOR, '🎂 PRESENTE DE ANIVERSÁRIO', 'Bolo, confete e <b>+1.000</b> pra você. Bom jogo!', true);
        };
        ov.querySelector('[data-abrir]').onclick = pegar;
        ov.querySelector('[data-dps]').onclick = () => { adiado = true; fechar(); };
        const tecla = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); adiado = true; fechar(); }
            else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); pegar(); }
        };
        document.addEventListener('keydown', tecla, true);
        setTimeout(() => ov.querySelector('[data-abrir]')?.focus(), 80);
    }
    // aparece sozinho quando o jogo está "calmo" (sem abertura, partida ou outra janela)
    let adiado = false, tentativas = 0;
    function tick() {
        if (adiado || !noPrazo()) return;
        if (typeof window.beatcoinsPresenteJa !== 'function' || window.beatcoinsPresenteJa(ID)) return;
        const abertura = (typeof introEl !== 'undefined' && introEl) || document.getElementById('tela-abertura');
        const jogando = typeof isPlaying !== 'undefined' && isPlaying;
        const perfil = !!sessionStorage.getItem('djmaxPerfilEscolhido') || !(window.perfis && window.perfis.list && window.perfis.list.length > 1);
        const outros = document.querySelector('#nov-ov, #perfil-ov, #sair-ov, #calt-ov, #col-ov, #ms-ov, #ms-res, #rk-ov, #lv-ov, #lv-up, #bc-ov, #bc-cele, #nuvem-modal.open, #settings-modal:not(.hidden), #hw-ov, #nt-ov, #nt-jogo, #stats-overlay:not(.hidden)');
        if (abertura || jogando || !perfil || outros) { if (++tentativas < 3000) setTimeout(tick, 1500); return; }
        abrir();
    }
    setTimeout(tick, 3500);
    window.bmPresenteAniversario = abrir;
})();

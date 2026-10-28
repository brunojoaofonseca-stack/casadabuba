// Casa da Buba v2: menu, alternador, formulário da lista de espera e modo de revisão
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Menu em ecrãs pequenos
  const menu = $('#menu');
  const botaoMenu = $('.topo__menu');
  botaoMenu?.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    botaoMenu.setAttribute('aria-expanded', aberto);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('aberto');
    botaoMenu?.setAttribute('aria-expanded', 'false');
  }));

  // Duas velocidades: sem script os dois painéis aparecem seguidos
  const separadores = $$('.seg [role="tab"]');
  const escolher = tab => separadores.forEach(t => {
    const sel = t === tab;
    t.setAttribute('aria-selected', sel);
    t.tabIndex = sel ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
  });
  separadores.forEach((t, i) => {
    t.addEventListener('click', () => escolher(t));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const outro = separadores[(i + (e.key === 'ArrowRight' ? 1 : separadores.length - 1)) % separadores.length];
      escolher(outro);
      outro.focus();
    });
  });
  if (separadores.length) escolher(separadores[0]);

  // Fila dos cães: um retrato por toque
  const fila = $('#cedulas');
  $$('[data-rolar]').forEach(b => b.addEventListener('click', () => {
    const passo = fila.querySelector('.cao').offsetWidth + parseFloat(getComputedStyle(fila).columnGap || 0);
    const suave = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    fila.scrollBy({ left: passo * Number(b.dataset.rolar), behavior: suave });
  }));

  // Lista de espera: quatro perguntas; ainda não está ligada a lado nenhum
  const form = $('#conversa');
  if (form) {
    const etapas = $$('.etapa', form);
    const total = etapas.length;
    const barra = $('.conversa__progresso span', form);
    const contador = $('.conversa__passo b', form);
    const aviso = $('#conversa-aviso');
    const voltar = $('[data-voltar]', form);
    const seguir = $('[data-seguir]', form);
    let atual = 1;
    const mostrar = n => {
      atual = n;
      etapas.forEach(e => e.classList.toggle('ativa', e.dataset.etapa === String(n)));
      barra.style.transform = `scaleX(${n / total})`;
      contador.textContent = n;
      voltar.hidden = n === 1;
      seguir.textContent = n === total ? 'Enviar' : 'Seguinte';
      aviso.textContent = '';
    };
    const valido = () => {
      let primeiro = null;
      $$('[required]', etapas[atual - 1]).forEach(c => {
        const ok = c.checkValidity() && c.value.trim() !== '';
        c.toggleAttribute('aria-invalid', !ok);
        if (!ok && !primeiro) primeiro = c;
      });
      if (primeiro) {
        aviso.textContent = primeiro.type === 'email' ? 'Esse email parece incompleto. Escreva-o como nome@exemplo.pt.' : 'Falta preencher este campo.';
        primeiro.focus();
        return false;
      }
      return true;
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!valido()) return;
      if (atual < total) return mostrar(atual + 1);
      if (!form.dataset.endpoint) { aviso.textContent = 'Nada foi enviado: este formulário ainda não está ligado.'; return; }
      seguir.setAttribute('aria-busy', 'true');
      fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form) })
        .then(r => { aviso.textContent = r.ok ? 'Recebemos o seu pedido. Respondemos por email.' : 'Não foi possível enviar. Tente outra vez daqui a um minuto.'; })
        .catch(() => { aviso.textContent = 'Não foi possível enviar. Tente outra vez daqui a um minuto.'; })
        .finally(() => seguir.removeAttribute('aria-busy'));
    });
    voltar.addEventListener('click', () => mostrar(atual - 1));
    mostrar(1);
  }

  // Modo de revisão: aparece depois do topo e destaca o que falta confirmar
  const proto = $('.proto');
  const rever = $('#rever');
  const tbc = $$('[data-tbc]');
  if (proto && rever) {
    $('#rever-n').textContent = tbc.length;
    const hero = $('.hero');
    let noFormulario = false;
    const aoRolar = () => { proto.hidden = noFormulario || scrollY < (hero ? hero.offsetHeight * 0.8 : 400); };
    addEventListener('scroll', aoRolar, { passive: true });
    const contacto = $('#contacto');
    if (contacto) new IntersectionObserver(([e]) => { noFormulario = e.isIntersecting; aoRolar(); }).observe(contacto);
    aoRolar();
    rever.addEventListener('click', () => {
      const ligado = document.body.classList.toggle('revisao');
      rever.setAttribute('aria-pressed', ligado);
      tbc.forEach(el => ligado ? el.title = `A confirmar: ${el.dataset.tbc}` : el.removeAttribute('title'));
    });
  }
})();

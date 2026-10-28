// Casa da Buba v2 "O mergulho": menu, progresso por capítulos, entradas, contagem, formulário e revisão
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Menu em ecrãs pequenos
  const menu = $('#menu');
  const botaoMenu = $('.menu-botao');
  botaoMenu?.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    botaoMenu.setAttribute('aria-expanded', aberto);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('aberto');
    botaoMenu?.setAttribute('aria-expanded', 'false');
  }));

  // Progresso: a barra no topo e a linha do medidor acompanham a descida
  document.body.insertAdjacentHTML('afterbegin', '<div class="progresso" aria-hidden="true"><span></span></div>');
  const barras = [$('.progresso span'), $('.medidor__linha span')].filter(Boolean);
  let pedido = 0;
  const atualizar = () => {
    pedido = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    barras.forEach(b => b.style.setProperty('--p', p.toFixed(4)));
  };
  addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(atualizar); }, { passive: true });
  atualizar();

  // O capítulo visível fica marcado no medidor e no menu
  const marcas = $$('.medidor a, .menu a');
  const obsCapitulos = new IntersectionObserver(entradas => entradas.forEach(e => {
    if (!e.isIntersecting) return;
    marcas.forEach(a => { if (a.hash === `#${e.target.id}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('.capitulo').forEach(c => obsCapitulos.observe(c));

  // Entradas suaves, uma vez; nada fica escondido se o observador falhar
  const revelar = el => el.classList.add('visto');
  const obsRevela = new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting) { revelar(e.target); obsRevela.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.revela').forEach(el => obsRevela.observe(el));
  setTimeout(() => $$('.revela').forEach(revelar), 2500);

  // Contagem para o nascimento previsto (data estimada, a confirmar)
  const dias = $('[data-dias]');
  if (dias) {
    const falta = Math.ceil((new Date('2027-03-15T00:00:00') - new Date()) / 86400000);
    if (falta > 0) dias.textContent = `Faltam ${falta} dias.`;
  }

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

    // As ligações com motivo já escolhem a resposta certa na primeira pergunta
    $$('[data-motivo]').forEach(a => a.addEventListener('click', () => {
      const opcao = form.querySelector(`input[name="motivo"][value="${a.dataset.motivo}"]`);
      if (opcao) { opcao.checked = true; mostrar(1); }
    }));
  }

  // Modo de revisão: aparece depois da superfície e esconde-se junto ao formulário
  const caixaRever = $('.rever');
  const rever = $('#rever');
  const tbc = $$('[data-tbc]');
  if (caixaRever && rever) {
    $('#rever-n').textContent = tbc.length;
    const topo = $('.superficie');
    let noFormulario = false;
    const aoRolar = () => { caixaRever.hidden = noFormulario || scrollY < (topo ? topo.offsetHeight * 0.8 : 400); };
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

// Casa da Buba — interações do site
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Topo: sombra ao rolar e menu móvel
  const topo = $('#topo');
  const menu = $('#menu');
  const menuBtn = $('.menu-btn');
  const aoRolar = () => topo.classList.toggle('rolado', scrollY > 8);
  addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();
  menuBtn.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    menuBtn.setAttribute('aria-expanded', aberto);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('aberto');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  // Ligação ativa no menu conforme a secção visível
  const ligacoes = new Map($$('a', menu).map(a => [a.hash.slice(1), a]));
  const obsMenu = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      ligacoes.forEach(a => a.classList.remove('ativo'));
      ligacoes.get(e.target.id)?.classList.add('ativo');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ligacoes.forEach((_, id) => { const s = document.getElementById(id); if (s) obsMenu.observe(s); });

  // Entrada suave dos elementos
  const obsRevela = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visto'); obsRevela.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.revela').forEach(el => obsRevela.observe(el));

  // Duas velocidades: em casa / na água
  const alternar = $('.alternar');
  const fotos = $('.velocidades__fotos');
  const separadores = $$('[role="tab"]', alternar);
  const escolher = tab => {
    separadores.forEach(t => {
      const sel = t === tab;
      t.setAttribute('aria-selected', sel);
      t.tabIndex = sel ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
    });
    const modo = tab.id === 't-agua' ? 'agua' : 'casa';
    alternar.dataset.modo = modo;
    fotos.dataset.modo = modo;
  };
  separadores.forEach((t, i) => {
    t.addEventListener('click', () => escolher(t));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const outro = separadores[(i + 1) % separadores.length];
      escolher(outro);
      outro.focus();
    });
  });

  // Cédulas: setas
  const cedulas = $('#cedulas');
  $$('[data-rolar]').forEach(b => b.addEventListener('click', () => {
    const passo = cedulas.querySelector('.cedula').offsetWidth + 20;
    cedulas.scrollBy({ left: passo * Number(b.dataset.rolar), behavior: 'smooth' });
  }));

  // Formulário em conversa
  const form = $('#conversa');
  const etapas = $$('.etapa', form);
  const total = 4;
  const barra = $('.conversa__progresso span', form);
  const contador = $('.conversa__passo b', form);
  const voltar = $('[data-voltar]', form);
  const seguir = $('[data-seguir]', form);
  let atual = 1;

  const mostrar = n => {
    atual = n;
    etapas.forEach(e => e.classList.toggle('ativa', e.dataset.etapa === String(n)));
    const fim = n === 'fim';
    barra.style.width = fim ? '100%' : `${(n / total) * 100}%`;
    contador.textContent = fim ? total : n;
    $('.conversa__passo', form).hidden = fim;
    voltar.hidden = fim || n === 1;
    seguir.hidden = fim;
    seguir.firstChild.textContent = n === total ? 'Enviar ' : 'Seguinte ';
  };
  const valido = () => {
    const campos = $$('[required]', etapas[atual - 1]);
    let ok = true;
    campos.forEach(c => {
      const bom = c.type === 'email' ? /\S+@\S+\.\S+/.test(c.value) : c.value.trim() !== '';
      c.classList.toggle('erro', !bom);
      if (!bom && ok) { c.focus(); ok = false; }
    });
    return ok;
  };
  seguir.addEventListener('click', () => {
    if (!valido()) return;
    if (atual < total) return mostrar(atual + 1);
    // Protótipo: nada é enviado
    $('[data-nome]', form).textContent = form.nome.value.trim().split(' ')[0] || 'amigo';
    mostrar('fim');
  });
  voltar.addEventListener('click', () => mostrar(atual - 1));
  form.addEventListener('submit', e => { e.preventDefault(); seguir.click(); });

  // Modo de revisão
  const tbc = $$('[data-tbc]');
  const rever = $('#rever');
  $('#rever-n').textContent = tbc.length;
  rever.addEventListener('click', () => {
    const ligado = document.body.classList.toggle('revisao');
    rever.setAttribute('aria-pressed', ligado);
    tbc.forEach(el => ligado ? el.title = `A confirmar: ${el.dataset.tbc}` : el.removeAttribute('title'));
  });
})();

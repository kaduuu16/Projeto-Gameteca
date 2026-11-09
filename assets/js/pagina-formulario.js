/*
  Minha Gameteca — pagina-formulario.js
  Formulário do jogo: lê os campos, valida, mostra os erros e salva.
  O mesmo arquivo atende a página de cadastro e a de edição.
*/

'use strict';

/* ---- Elementos e estado da página ---------------------------------------- */

const formJogo = document.querySelector('.formulario');
const resumoDeErros = document.getElementById('resumo-erros');

// O HTML informa o modo: <form data-modo="cadastro"> ou <form data-modo="edicao">
const modoEdicao = formJogo.dataset.modo === 'edicao';
let jogoEmEdicao = null;      // preenchido ao abrir a página de edição

// Campos validados, na ordem em que aparecem na tela
const CAMPOS_DO_JOGO = ['titulo', 'plataforma', 'genero', 'ano', 'status', 'nota', 'horas', 'capa', 'observacoes'];

// Os erros só passam a ser atualizados a cada tecla depois da primeira
// tentativa de salvar, para não acusar erro em quem ainda está preenchendo
let jaTentouSalvar = false;


/* ---- Leitura dos campos -------------------------------------------------- */

// Campos numéricos que podem ficar em branco: vazio vira null
function lerNumeroOpcional(campo) {
  if (campo.validity.badInput) {
    return NaN;               // a pessoa digitou algo que não é número
  }
  return campo.value === '' ? null : Number(campo.value);
}

// Monta o objeto do jogo com o que está digitado no formulário
function lerFormulario() {
  const campos = formJogo.elements;

  return {
    titulo: campos.titulo.value.trim(),
    plataforma: campos.plataforma.value,
    genero: campos.genero.value,
    ano: campos.ano.value === '' ? NaN : Number(campos.ano.value),
    status: campos.status.value,
    nota: lerNumeroOpcional(campos.nota),
    horas: lerNumeroOpcional(campos.horas),
    capa: campos.capa.value.trim(),
    observacoes: campos.observacoes.value.trim(),
  };
}


// Na edição, o próprio jogo não conta como "repetido"
function validarDados(dados) {
  const idIgnorado = jogoEmEdicao === null ? undefined : jogoEmEdicao.id;
  return validarJogo(dados, idIgnorado);
}


/* ---- Mensagens de erro --------------------------------------------------- */

// Devolve o elemento que envolve o campo (a <div class="campo"> ou, no caso
// do status, o grupo de botões de rádio)
function caixaDoCampo(nome) {
  const controle = formJogo.elements[nome];
  const elemento = controle instanceof RadioNodeList ? controle[0] : controle;
  return elemento.closest('.opcoes, .campo');
}

// Liga ou desliga o erro no aria-describedby, sem apagar outras descrições
function ligarDescricao(controle, idDoErro, ligar) {
  const atuais = (controle.getAttribute('aria-describedby') || '').split(' ');
  const ids = atuais.filter((id) => id !== '' && id !== idDoErro);

  if (ligar) {
    ids.push(idDoErro);
  }
  if (ids.length > 0) {
    controle.setAttribute('aria-describedby', ids.join(' '));
  } else {
    controle.removeAttribute('aria-describedby');
  }
}

// Mostra a mensagem de erro embaixo do campo, ou remove se "mensagem" vier vazia
function mostrarErroDoCampo(nome, mensagem) {
  const caixa = caixaDoCampo(nome);
  const controles = caixa.querySelectorAll('input, select, textarea');
  const idDoErro = `erro-${nome}`;
  let erro = document.getElementById(idDoErro);

  if (!mensagem) {
    if (erro) {
      erro.remove();
    }
    caixa.classList.remove('campo--invalido');
    for (const controle of controles) {
      controle.removeAttribute('aria-invalid');
      ligarDescricao(controle, idDoErro, false);
    }
    return;
  }

  if (!erro) {
    erro = document.createElement('small');
    erro.className = 'erro-campo';
    erro.id = idDoErro;
    caixa.append(erro);
  }
  erro.textContent = mensagem;

  caixa.classList.add('campo--invalido');
  for (const controle of controles) {
    controle.setAttribute('aria-invalid', 'true');
    ligarDescricao(controle, idDoErro, true);
  }
}

function limparErros() {
  for (const nome of CAMPOS_DO_JOGO) {
    mostrarErroDoCampo(nome, '');
  }
  resumoDeErros.hidden = true;
}

function focarCampo(nome) {
  const controle = formJogo.elements[nome];
  if (controle instanceof RadioNodeList) {
    const marcado = [...controle].find((opcao) => opcao.checked);
    (marcado || controle[0]).focus();
  } else {
    controle.focus();
  }
}


/* ---- Salvar -------------------------------------------------------------- */

function aoSalvar(evento) {
  evento.preventDefault();
  jaTentouSalvar = true;

  const dados = lerFormulario();
  const erros = validarDados(dados);
  const camposComErro = CAMPOS_DO_JOGO.filter((nome) => erros[nome]);

  for (const nome of CAMPOS_DO_JOGO) {
    mostrarErroDoCampo(nome, erros[nome]);
  }

  if (camposComErro.length > 0) {
    resumoDeErros.textContent = camposComErro.length === 1
      ? 'Há 1 campo com problema. Corrija o campo destacado e salve de novo.'
      : `Há ${camposComErro.length} campos com problema. Corrija os campos destacados e salve de novo.`;
    resumoDeErros.hidden = false;
    focarCampo(camposComErro[0]);
    return;
  }
  resumoDeErros.hidden = true;

  const jogo = modoEdicao ? atualizarJogo(jogoEmEdicao.id, dados) : adicionarJogo(dados);
  if (jogo === null) {
    mostrarAviso('erro', modoEdicao
      ? 'Não foi possível salvar. O jogo pode ter sido excluído em outra aba, ou o navegador bloqueou o armazenamento de dados.'
      : 'Não foi possível guardar o jogo neste navegador. Verifique se o armazenamento de dados do site está liberado.');
    return;
  }

  // O aviso de sucesso aparece na próxima página, depois do redirecionamento
  if (modoEdicao) {
    guardarAvisoParaProximaPagina('sucesso', `As alterações em “${jogo.titulo}” foram salvas.`);
    location.href = urlDaPagina('detalhes', jogo.id);
  } else {
    guardarAvisoParaProximaPagina('sucesso', `“${jogo.titulo}” foi adicionado à coleção.`);
    location.href = `${RAIZ}index.html`;
  }
}

// Depois da primeira tentativa, confere de novo o campo que acabou de mudar
function aoAlterarCampo(evento) {
  const nome = evento.target.name;
  if (!jaTentouSalvar || !CAMPOS_DO_JOGO.includes(nome)) {
    return;
  }

  const erros = validarDados(lerFormulario());
  mostrarErroDoCampo(nome, erros[nome]);

  // Título e plataforma são conferidos juntos (jogo repetido na mesma plataforma)
  if (nome === 'plataforma') {
    mostrarErroDoCampo('titulo', erros.titulo);
  }
  if (Object.keys(erros).length === 0) {
    resumoDeErros.hidden = true;
  }
}


/* ---- Edição -------------------------------------------------------------- */

// Copia os dados do jogo para os campos do formulário
function preencherFormulario(jogo) {
  for (const nome of CAMPOS_DO_JOGO) {
    const valor = jogo[nome];
    // No caso do status, atribuir o valor marca o botão de rádio correspondente
    formJogo.elements[nome].value = valor === null || valor === undefined ? '' : valor;
  }
}

// Abre a página de edição com o jogo indicado no endereço (…/editar.html?id=3)
function iniciarEdicao() {
  jogoEmEdicao = buscarJogoPorId(idDaUrl());

  if (jogoEmEdicao === null) {
    document.getElementById('painel-formulario').hidden = true;
    document.getElementById('nao-encontrado').hidden = false;
    document.title = 'Jogo não encontrado — Minha Gameteca';
    return;
  }

  preencherFormulario(jogoEmEdicao);

  const enderecoDosDetalhes = urlDaPagina('detalhes', jogoEmEdicao.id);
  document.getElementById('titulo-atual').textContent = jogoEmEdicao.titulo;
  document.getElementById('trilha-detalhes').href = enderecoDosDetalhes;
  document.getElementById('link-cancelar').href = enderecoDosDetalhes;
  document.title = `Editar ${jogoEmEdicao.titulo} — Minha Gameteca`;
}


/* ---- Eventos e início ---------------------------------------------------- */

// O limite do ano acompanha a mesma regra usada na validação
formJogo.elements.ano.max = ANO_MAXIMO;

formJogo.addEventListener('submit', aoSalvar);
formJogo.addEventListener('input', aoAlterarCampo);

formJogo.addEventListener('reset', () => {
  jaTentouSalvar = false;
  limparErros();
});

if (modoEdicao) {
  iniciarEdicao();
}

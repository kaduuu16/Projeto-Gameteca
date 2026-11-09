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

// Evita salvar duas vezes enquanto a capa está sendo buscada
let salvando = false;

// Tempo máximo que o cadastro espera pela capa antes de salvar sem ela
const TEMPO_MAXIMO_DA_CAPA_AO_SALVAR = 8000;      // milissegundos


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

  const dados = {
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

  // Só o formulário de cadastro tem este campo oculto (preenchido pela busca na API)
  if (campos.idCheapShark) {
    dados.idCheapShark = campos.idCheapShark.value || null;
  }

  return dados;
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

// Devolve o resultado da promessa, ou null se ela demorar mais que "ms"
function comLimiteDeTempo(promessa, ms) {
  const tempoEsgotado = new Promise((resolver) => setTimeout(() => resolver(null), ms));
  return Promise.race([promessa, tempoEsgotado]);
}

// Cadastro sem capa: procura a capa pelo título antes de salvar.
// Completa "dados" quando encontra e devolve true; devolve false se não achar.
// Se a API falhar ou demorar, o jogo é salvo do mesmo jeito, sem capa.
async function completarCapaAutomaticamente(dados) {
  const botaoSalvar = formJogo.querySelector('button[type="submit"]');
  const textoDoBotao = botaoSalvar.textContent;
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = 'Buscando a capa…';
  mostrarEstadoDaCapa('carregando', `Buscando a capa de “${dados.titulo}” antes de salvar…`);

  try {
    const achado = await comLimiteDeTempo(buscarCapaPorTitulo(dados.titulo), TEMPO_MAXIMO_DA_CAPA_AO_SALVAR);
    if (achado === null) {
      return false;
    }
    if (!dados.idCheapShark) {
      dados.idCheapShark = achado.idCheapShark;
    }
    if (achado.capa === '') {
      return false;
    }
    dados.capa = achado.capa;
    return true;
  } catch (erro) {
    console.warn('Não foi possível buscar a capa automaticamente.', erro);
    return false;
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = textoDoBotao;
  }
}

function textoDoCadastro(titulo, capaEncontrada) {
  if (capaEncontrada === true) {
    return `“${titulo}” foi adicionado à coleção, com a capa encontrada na internet.`;
  }
  if (capaEncontrada === false) {
    return `“${titulo}” foi adicionado à coleção. Não encontramos a capa; você pode informar uma na edição do jogo.`;
  }
  return `“${titulo}” foi adicionado à coleção.`;
}

async function aoSalvar(evento) {
  evento.preventDefault();
  if (salvando) {
    return;
  }
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
  salvando = true;

  // null: não precisou buscar; true/false: buscou e achou ou não a capa
  let capaEncontrada = null;
  if (!modoEdicao && dados.capa === '') {
    capaEncontrada = await completarCapaAutomaticamente(dados);
  }

  const jogo = modoEdicao ? atualizarJogo(jogoEmEdicao.id, dados) : adicionarJogo(dados);
  if (jogo === null) {
    salvando = false;
    estadoDaCapa.hidden = true;
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
    guardarAvisoParaProximaPagina('sucesso', textoDoCadastro(jogo.titulo, capaEncontrada));
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
  formJogo.elements.idCheapShark.value = jogoEmEdicao.idCheapShark || '';
  atualizarPreviaDaCapa();

  const enderecoDosDetalhes = urlDaPagina('detalhes', jogoEmEdicao.id);
  document.getElementById('titulo-atual').textContent = jogoEmEdicao.titulo;
  document.getElementById('trilha-detalhes').href = enderecoDosDetalhes;
  document.getElementById('link-cancelar').href = enderecoDosDetalhes;
  document.title = `Editar ${jogoEmEdicao.titulo} — Minha Gameteca`;
}


/* ---- Capa: prévia e busca pelo título ------------------------------------ */

const previaDaCapa = document.getElementById('previa-capa');
const estadoDaCapa = document.getElementById('estado-capa');
const botaoBuscarCapa = document.getElementById('botao-buscar-capa');
let temporizadorDaPrevia = null;

// estado: 'carregando', 'ok', 'vazio' ou 'erro' (o CSS muda a aparência)
function mostrarEstadoDaCapa(estado, texto) {
  estadoDaCapa.dataset.estado = estado;
  estadoDaCapa.textContent = texto;
  estadoDaCapa.hidden = false;
}

// Mostra na prévia a imagem do endereço digitado. Sem endereço válido,
// mostra a capa provisória que o jogo vai receber.
function atualizarPreviaDaCapa() {
  const endereco = formJogo.elements.capa.value.trim();

  if (ehEnderecoWeb(endereco)) {
    previaDaCapa.src = endereco;
  } else if (jogoEmEdicao !== null) {
    previaDaCapa.src = urlDaCapa({ ...jogoEmEdicao, capa: '' });
  } else {
    previaDaCapa.src = CAPA_PADRAO;
  }
}

// O endereço digitado não abriu uma imagem: avisa e volta para a capa padrão
function aoFalharPrevia() {
  const endereco = formJogo.elements.capa.value.trim();
  if (previaDaCapa.src === CAPA_PADRAO) {
    return;
  }
  previaDaCapa.src = CAPA_PADRAO;
  if (endereco !== '') {
    mostrarEstadoDaCapa('erro', 'A imagem deste endereço não abriu. Confira o endereço ou use a busca pelo título.');
  }
}

// Enquanto a pessoa digita o endereço, espera uma pausa antes de atualizar a prévia
function aoDigitarEnderecoDaCapa() {
  estadoDaCapa.hidden = true;
  clearTimeout(temporizadorDaPrevia);
  temporizadorDaPrevia = setTimeout(atualizarPreviaDaCapa, 400);
}

// Botão "Buscar capa pelo título"
async function aoBuscarCapa() {
  const campos = formJogo.elements;
  const titulo = campos.titulo.value.trim();

  if (titulo.length < 2) {
    mostrarEstadoDaCapa('erro', 'Preencha o título do jogo antes de buscar a capa.');
    campos.titulo.focus();
    return;
  }

  botaoBuscarCapa.disabled = true;
  mostrarEstadoDaCapa('carregando', `Buscando a capa de “${titulo}”…`);

  try {
    const achado = await buscarCapaPorTitulo(titulo);

    if (achado === null || achado.capa === '') {
      mostrarEstadoDaCapa('vazio', `Não encontramos a capa de “${titulo}”. Confira se o título está completo ou cole o endereço de uma imagem.`);
      return;
    }

    campos.capa.value = achado.capa;
    if (campos.idCheapShark.value === '') {
      campos.idCheapShark.value = achado.idCheapShark;
    }
    atualizarPreviaDaCapa();
    mostrarErroDoCampo('capa', '');
    mostrarEstadoDaCapa('ok', 'Capa encontrada. Ela será salva junto com o jogo.');
  } catch (erro) {
    console.warn('Falha ao buscar a capa na API CheapShark.', erro);
    mostrarEstadoDaCapa('erro', 'Não foi possível buscar a capa agora. Verifique sua conexão e tente de novo.');
  } finally {
    botaoBuscarCapa.disabled = false;
  }
}


/* ---- Busca na API (só na página de cadastro) ----------------------------- */

const formBuscaApi = document.getElementById('form-busca-api');
const estadoDaBusca = document.getElementById('estado-busca-api');
const listaDeResultados = document.getElementById('resultados-api');

// estado: 'carregando', 'ok', 'vazio' ou 'erro' (o CSS muda a aparência)
function mostrarEstadoDaBusca(estado, texto) {
  estadoDaBusca.dataset.estado = estado;
  estadoDaBusca.textContent = texto;
  estadoDaBusca.hidden = false;
}

// Copia os dados do resultado escolhido para o formulário do jogo
function usarResultado(resultado) {
  const campos = formJogo.elements;

  campos.titulo.value = resultado.titulo;
  campos.idCheapShark.value = resultado.idCheapShark;
  campos.capa.value = resultado.miniatura;
  if (campos.plataforma.value === '') {
    campos.plataforma.value = 'pc';       // a CheapShark só acompanha lojas de PC
  }
  estadoDaCapa.hidden = true;
  atualizarPreviaDaCapa();

  // Troca a miniatura pela melhor capa disponível (a vertical da Steam, quando
  // existe), desde que a pessoa não tenha mexido no campo enquanto isso
  escolherCapa(resultado).then((melhor) => {
    if (melhor !== '' && campos.capa.value === resultado.miniatura) {
      campos.capa.value = melhor;
      atualizarPreviaDaCapa();
    }
  });

  // Se já havia erros na tela, confere de novo os campos que acabaram de mudar
  if (jaTentouSalvar) {
    const erros = validarDados(lerFormulario());
    for (const nome of ['titulo', 'plataforma', 'capa']) {
      mostrarErroDoCampo(nome, erros[nome]);
    }
  }

  mostrarEstadoDaBusca('ok', `Dados de “${resultado.titulo}” copiados para o formulário. Complete o gênero, o ano e o status e salve.`);
  campos.genero.focus();
}

// Monta um item da lista de resultados
function criarResultado(resultado) {
  const item = document.createElement('li');

  if (resultado.miniatura !== '') {
    const imagem = document.createElement('img');
    imagem.alt = '';
    imagem.loading = 'lazy';
    imagem.addEventListener('error', () => imagem.remove(), { once: true });
    imagem.src = resultado.miniatura;
    item.append(imagem);
  }

  const texto = document.createElement('span');
  texto.className = 'resultado-texto';

  const titulo = document.createElement('strong');
  titulo.textContent = resultado.titulo;
  texto.append(titulo);

  if (!Number.isNaN(resultado.menorPreco)) {
    const preco = document.createElement('span');
    preco.textContent = `a partir de ${formatarPreco(resultado.menorPreco)}`;
    texto.append(preco);
  }

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao botao--secundario botao--pequeno';
  botao.textContent = 'Usar este jogo';
  botao.setAttribute('aria-label', `Usar ${resultado.titulo}`);
  botao.addEventListener('click', () => usarResultado(resultado));

  item.append(texto, botao);
  return item;
}

async function aoBuscarNaApi(evento) {
  evento.preventDefault();

  const termo = formBuscaApi.elements['busca-api'].value.trim();
  const botaoBuscar = formBuscaApi.querySelector('button[type="submit"]');

  if (termo.length < 2) {
    listaDeResultados.replaceChildren();
    mostrarEstadoDaBusca('erro', 'Digite pelo menos 2 letras do nome do jogo.');
    return;
  }

  listaDeResultados.replaceChildren();
  mostrarEstadoDaBusca('carregando', `Buscando “${termo}”…`);
  botaoBuscar.disabled = true;            // evita duas buscas ao mesmo tempo

  try {
    const resultados = await buscarJogosNaApi(termo);

    if (resultados.length === 0) {
      mostrarEstadoDaBusca('vazio', `Nenhum jogo encontrado para “${termo}”. Confira o nome ou preencha os dados à mão.`);
      return;
    }

    for (const resultado of resultados) {
      listaDeResultados.append(criarResultado(resultado));
    }
    mostrarEstadoDaBusca('ok', resultados.length === 1
      ? `1 resultado para “${termo}”.`
      : `${resultados.length} resultados para “${termo}”. Escolha um para preencher o formulário.`);
  } catch (erro) {
    console.warn('Falha ao consultar a API CheapShark.', erro);
    mostrarEstadoDaBusca('erro', 'Não foi possível consultar a CheapShark agora. Verifique sua conexão e tente de novo, ou preencha os dados à mão.');
  } finally {
    botaoBuscar.disabled = false;
  }
}


/* ---- Eventos e início ---------------------------------------------------- */

// O limite do ano acompanha a mesma regra usada na validação
formJogo.elements.ano.max = ANO_MAXIMO;

formJogo.addEventListener('submit', aoSalvar);
formJogo.addEventListener('input', aoAlterarCampo);

formJogo.addEventListener('reset', () => {
  jaTentouSalvar = false;
  limparErros();
  formJogo.elements.idCheapShark.value = '';    // campos ocultos não são limpos pelo reset
  estadoDaCapa.hidden = true;
  setTimeout(atualizarPreviaDaCapa);            // depois que os campos forem limpos
});

// Se a pessoa reescrever o título, o jogo deixa de ser o que veio da API
formJogo.elements.titulo.addEventListener('input', () => {
  formJogo.elements.idCheapShark.value = '';
});

// Capa: prévia ao digitar o endereço e botão de busca pelo título
marcarFormatoDaCapa(previaDaCapa);
previaDaCapa.addEventListener('error', aoFalharPrevia);
formJogo.elements.capa.addEventListener('input', aoDigitarEnderecoDaCapa);
botaoBuscarCapa.addEventListener('click', aoBuscarCapa);

if (formBuscaApi !== null) {
  formBuscaApi.addEventListener('submit', aoBuscarNaApi);
}

// No cadastro, o navegador pode ter restaurado um endereço de capa digitado antes
if (!modoEdicao) {
  atualizarPreviaDaCapa();
}

if (modoEdicao) {
  iniciarEdicao();

  // Se o navegador reabrir uma cópia guardada desta página (botão "voltar"),
  // recarrega para mostrar os dados atuais do jogo
  window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) {
      location.reload();
    }
  });
}

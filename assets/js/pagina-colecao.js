/*
  Minha Gameteca — pagina-colecao.js
  Página inicial: desenha a coleção a partir dos dados guardados.
*/

'use strict';

/* ---- Elementos da página ------------------------------------------------- */

const formBusca = document.getElementById('form-busca');
const listaJogos = document.getElementById('lista-jogos');
const modeloJogo = document.getElementById('modelo-jogo');
const contador = document.getElementById('contador');
const mensagemSemJogos = document.getElementById('mensagem-sem-jogos');
const mensagemSemResultados = document.getElementById('mensagem-sem-resultados');
const areaResumo = document.getElementById('resumo');


/* ---- Pesquisa e filtros -------------------------------------------------- */

// Campos do jogo que podem ser filtrados (mesmo nome no formulário e no objeto)
const CAMPOS_DE_FILTRO = ['plataforma', 'genero', 'status'];

// Lê o que a pessoa escolheu no formulário de busca
function lerCriterios() {
  const campos = formBusca.elements;
  return {
    termo: normalizarTexto(campos.busca.value),
    plataforma: campos.plataforma.value,
    genero: campos.genero.value,
    status: campos.status.value,
    ordenarPor: campos['ordenar-por'].value,
    ordem: campos.ordem.value,
  };
}

// Mantém só os jogos cujo título contém o termo pesquisado
function pesquisarJogos(jogos, termo) {
  if (termo === '') {
    return jogos;
  }
  return jogos.filter((jogo) => normalizarTexto(jogo.titulo).includes(termo));
}

// Mantém só os jogos que combinam com todos os filtros escolhidos.
// Filtro vazio ("Todas", "Todos") não restringe nada.
function filtrarJogos(jogos, criterios) {
  return jogos.filter((jogo) => {
    for (const campo of CAMPOS_DE_FILTRO) {
      if (criterios[campo] !== '' && jogo[campo] !== criterios[campo]) {
        return false;
      }
    }
    return true;
  });
}


/* ---- Ordenação ----------------------------------------------------------- */

function compararTitulos(a, b) {
  return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
}

// Devolve uma cópia ordenada da lista (não altera o array recebido).
// ordenarPor: 'titulo', 'nota', 'ano' ou 'horas'; ordem: 'crescente' ou 'decrescente'.
function ordenarJogos(jogos, ordenarPor, ordem) {
  const sentido = ordem === 'decrescente' ? -1 : 1;

  return [...jogos].sort((a, b) => {
    if (ordenarPor === 'titulo') {
      return sentido * compararTitulos(a, b);
    }

    const valorA = a[ordenarPor];
    const valorB = b[ordenarPor];

    // Jogos sem valor (por exemplo, ainda sem nota) ficam sempre no fim
    if (valorA === null && valorB === null) {
      return compararTitulos(a, b);
    }
    if (valorA === null) {
      return 1;
    }
    if (valorB === null) {
      return -1;
    }

    // Em caso de empate, desempata pelo título
    if (valorA === valorB) {
      return compararTitulos(a, b);
    }
    return sentido * (valorA - valorB);
  });
}


/* ---- Listagem ------------------------------------------------------------ */

// Monta o cartão de um jogo copiando o <template id="modelo-jogo"> do HTML
function criarCartao(jogo) {
  const fragmento = modeloJogo.content.cloneNode(true);
  const cartao = fragmento.querySelector('.jogo');
  const idDoTitulo = `jogo-${jogo.id}-titulo`;

  cartao.dataset.id = jogo.id;
  cartao.dataset.status = jogo.status;            // o CSS usa para a cor do status
  cartao.setAttribute('aria-labelledby', idDoTitulo);

  const titulo = cartao.querySelector('h3');
  titulo.id = idDoTitulo;
  titulo.textContent = jogo.titulo;

  aplicarCapa(cartao.querySelector('img'), jogo);

  const textos = {
    plataforma: PLATAFORMAS[jogo.plataforma] || jogo.plataforma,
    genero: GENEROS[jogo.genero] || jogo.genero,
    ano: jogo.ano,
    status: STATUS[jogo.status] || jogo.status,
    nota: formatarNota(jogo.nota),
  };
  for (const [campo, texto] of Object.entries(textos)) {
    cartao.querySelector(`[data-campo="${campo}"]`).textContent = texto;
  }

  const linkDetalhes = cartao.querySelector('[data-acao="detalhes"]');
  linkDetalhes.href = urlDaPagina('detalhes', jogo.id);
  linkDetalhes.setAttribute('aria-label', `Ver detalhes de ${jogo.titulo}`);

  const linkEditar = cartao.querySelector('[data-acao="editar"]');
  linkEditar.href = urlDaPagina('editar', jogo.id);
  linkEditar.setAttribute('aria-label', `Editar ${jogo.titulo}`);

  const botaoExcluir = cartao.querySelector('[data-acao="excluir"]');
  botaoExcluir.dataset.id = jogo.id;
  botaoExcluir.setAttribute('aria-label', `Excluir ${jogo.titulo}`);

  return fragmento;
}

function textoDoContador(visiveis, total) {
  const palavra = total === 1 ? 'jogo' : 'jogos';
  return `Exibindo ${visiveis} de ${total} ${palavra}.`;
}

// Redesenha a lista inteira com os dados guardados no momento
function atualizarLista() {
  const todos = listarJogos();
  const criterios = lerCriterios();
  let visiveis = pesquisarJogos(todos, criterios.termo);
  visiveis = filtrarJogos(visiveis, criterios);
  visiveis = ordenarJogos(visiveis, criterios.ordenarPor, criterios.ordem);

  const cartoes = document.createDocumentFragment();
  for (const jogo of visiveis) {
    cartoes.append(criarCartao(jogo));
  }
  listaJogos.replaceChildren(cartoes);

  const colecaoVazia = todos.length === 0;
  contador.hidden = colecaoVazia;
  contador.textContent = textoDoContador(visiveis.length, todos.length);
  mensagemSemJogos.hidden = !colecaoVazia;
  mensagemSemResultados.hidden = colecaoVazia || visiveis.length > 0;

  atualizarResumo(todos);
}


/* ---- Resumo -------------------------------------------------------------- */

function escreverNoResumo(nome, texto) {
  areaResumo.querySelector(`[data-resumo="${nome}"]`).textContent = texto;
}

// O resumo considera a coleção inteira, não só o que está filtrado na tela
function atualizarResumo(jogos) {
  const resumo = calcularResumo(jogos);

  for (const status of Object.keys(STATUS)) {
    escreverNoResumo(status, resumo.porStatus[status]);
  }
  escreverNoResumo('total', resumo.total);
  escreverNoResumo('horas', `${formatarNumero(resumo.horas)} h`);
  escreverNoResumo('nota-media', resumo.notaMedia === null ? 'sem notas' : formatarNumero(resumo.notaMedia));
}


/* ---- Exclusão ------------------------------------------------------------ */

// Um único ouvinte na lista atende os botões "Excluir" de todos os cartões,
// inclusive dos que forem criados depois (delegação de eventos)
function aoClicarNaLista(evento) {
  const botao = evento.target.closest('[data-acao="excluir"]');
  if (botao === null) {
    return;
  }

  const jogo = buscarJogoPorId(Number(botao.dataset.id));
  if (jogo === null) {
    atualizarLista();         // o jogo já tinha sido excluído em outra aba
    return;
  }

  pedirConfirmacaoDeExclusao(jogo, () => {
    if (excluirJogo(jogo.id) === null) {
      mostrarAviso('erro', 'Não foi possível excluir o jogo. Recarregue a página e tente de novo.');
      return;
    }
    atualizarLista();
    mostrarAviso('sucesso', `“${jogo.titulo}” foi excluído da coleção.`);
    // O botão clicado deixou de existir: leva o foco para o título da lista
    document.getElementById('titulo-colecao').focus();
  });
}


/* ---- Eventos ------------------------------------------------------------- */

// A lista acompanha o que é digitado ou escolhido, sem precisar de botão
formBusca.addEventListener('input', atualizarLista);

// Enter no campo de pesquisa não deve recarregar a página
formBusca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  atualizarLista();
});

// O evento "reset" acontece antes de os campos serem limpos; por isso
// a lista é redesenhada logo depois, com setTimeout
formBusca.addEventListener('reset', () => {
  setTimeout(atualizarLista);
});

listaJogos.addEventListener('click', aoClicarNaLista);

// Se a coleção mudar em outra aba do navegador, esta lista acompanha
window.addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_JOGOS || evento.key === null) {
    atualizarLista();
  }
});


/* ---- Início -------------------------------------------------------------- */

atualizarLista();

// Ao voltar para esta página pelo botão "voltar", o navegador pode restaurar
// os campos da busca e uma cópia antiga da lista: redesenha com os dados atuais
window.addEventListener('pageshow', atualizarLista);

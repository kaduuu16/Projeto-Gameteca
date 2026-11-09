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


/* ---- Pesquisa ------------------------------------------------------------ */

// Lê o que a pessoa escolheu no formulário de busca
function lerCriterios() {
  const campos = formBusca.elements;
  return {
    termo: normalizarTexto(campos.busca.value),
  };
}

// Mantém só os jogos cujo título contém o termo pesquisado
function pesquisarJogos(jogos, termo) {
  if (termo === '') {
    return jogos;
  }
  return jogos.filter((jogo) => normalizarTexto(jogo.titulo).includes(termo));
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
  const visiveis = pesquisarJogos(todos, criterios.termo);

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


/* ---- Início -------------------------------------------------------------- */

atualizarLista();

// Ao voltar para esta página pelo botão "voltar", o navegador pode restaurar
// os campos da busca e uma cópia antiga da lista: redesenha com os dados atuais
window.addEventListener('pageshow', atualizarLista);

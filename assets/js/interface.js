/*
  Minha Gameteca — interface.js
  Funções de tela usadas por mais de uma página: endereços, capas e formatação.
*/

'use strict';

/* ---- Endereços ----------------------------------------------------------- */

// Endereço da raiz do site, calculado a partir do endereço deste arquivo
// (…/assets/js/interface.js). Assim os caminhos funcionam na página inicial,
// nas páginas dentro de "pages/" e também ao abrir os arquivos direto do disco.
const RAIZ = new URL('../../', document.currentScript.src).href;

const CAPA_PADRAO = RAIZ + 'assets/img/capa-padrao.svg';
const TOTAL_DE_CAPAS_PROVISORIAS = 5;

// Monta o endereço de uma página interna. Ex.: urlDaPagina('detalhes', 3)
function urlDaPagina(pagina, id) {
  const endereco = `${RAIZ}pages/${pagina}.html`;
  return id === undefined ? endereco : `${endereco}?id=${id}`;
}

// Lê o id do jogo no endereço da página atual (…/detalhes.html?id=3).
// Devolve o número, ou null se o endereço não tiver um id válido.
function idDaUrl() {
  const texto = new URLSearchParams(location.search).get('id');
  if (texto === null || texto.trim() === '') {
    return null;
  }
  const id = Number(texto);
  return Number.isInteger(id) ? id : null;
}


/* ---- Capas --------------------------------------------------------------- */

function temCapaPropria(jogo) {
  return /^https?:\/\//i.test(String(jogo.capa || ''));
}

// Jogos sem capa recebem uma das capas provisórias (capa-1.svg a capa-5.svg),
// escolhida pelo id para ser sempre a mesma para o mesmo jogo.
function urlDaCapa(jogo) {
  if (temCapaPropria(jogo)) {
    return jogo.capa;
  }
  const numero = (Math.abs(jogo.id - 1) % TOTAL_DE_CAPAS_PROVISORIAS) + 1;
  return `${RAIZ}assets/img/capa-${numero}.svg`;
}

// Algumas lojas só têm imagem horizontal. Quando a imagem carrega, marca o
// formato para o CSS mostrar a imagem inteira em vez de cortar as laterais.
function marcarFormatoDaCapa(imagem) {
  imagem.addEventListener('load', () => {
    imagem.classList.toggle('capa--paisagem', imagem.naturalWidth > imagem.naturalHeight);
  });
}

// Coloca a capa do jogo em um <img>. Se o endereço da imagem falhar,
// troca pela capa padrão em vez de deixar a imagem quebrada.
function aplicarCapa(imagem, jogo) {
  imagem.alt = temCapaPropria(jogo)
    ? `Capa do jogo ${jogo.titulo}`
    : `Capa provisória do jogo ${jogo.titulo}`;

  imagem.addEventListener('error', () => {
    imagem.src = CAPA_PADRAO;
  }, { once: true });
  marcarFormatoDaCapa(imagem);

  imagem.src = urlDaCapa(jogo);
}


/* ---- Formatação ---------------------------------------------------------- */

function formatarNumero(valor) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function formatarNota(nota) {
  return nota === null ? 'Ainda sem nota' : `${formatarNumero(nota)} / 10`;
}

function formatarHoras(horas) {
  return horas === null ? 'Não informado' : `${formatarNumero(horas)} h`;
}

// A API informa os preços em dólar. Ex.: formatarPreco(14.99) → "US$ 14,99"
function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
}


/* ---- Texto --------------------------------------------------------------- */

// Deixa o texto em minúsculas e sem acentos, para comparar "Açao" com "ação"
function normalizarTexto(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}


/* ---- Avisos (mensagens de feedback) -------------------------------------- */

const CHAVE_AVISO = 'gameteca:aviso';
const TEMPO_DO_AVISO = 8000;        // milissegundos

// Mostra uma mensagem flutuante no pé da tela. tipo: 'sucesso' ou 'erro'.
function mostrarAviso(tipo, texto) {
  const area = document.getElementById('avisos');

  const aviso = document.createElement('div');
  aviso.className = `mensagem mensagem--${tipo}`;
  aviso.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');

  const conteudo = document.createElement('span');
  conteudo.textContent = texto;

  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.className = 'aviso-fechar';
  fechar.setAttribute('aria-label', 'Fechar aviso');
  fechar.textContent = '\u00d7';
  fechar.addEventListener('click', () => aviso.remove());

  aviso.append(conteudo, fechar);
  area.replaceChildren(aviso);      // um aviso por vez

  // Avisos de sucesso somem sozinhos; os de erro ficam até serem fechados
  if (tipo === 'sucesso') {
    setTimeout(() => aviso.remove(), TEMPO_DO_AVISO);
  }
}

// Guarda um aviso para aparecer na próxima página (usado antes de redirecionar,
// por exemplo depois de salvar um jogo). Fica no sessionStorage só até ser mostrado.
function guardarAvisoParaProximaPagina(tipo, texto) {
  try {
    sessionStorage.setItem(CHAVE_AVISO, JSON.stringify({ tipo: tipo, texto: texto }));
  } catch (erro) {
    // Sem sessionStorage, o aviso simplesmente não aparece
  }
}

function mostrarAvisoPendente() {
  try {
    const guardado = sessionStorage.getItem(CHAVE_AVISO);
    if (guardado === null) {
      return;
    }
    sessionStorage.removeItem(CHAVE_AVISO);
    const aviso = JSON.parse(guardado);
    mostrarAviso(aviso.tipo, aviso.texto);
  } catch (erro) {
    // Aviso ilegível: ignora
  }
}

// Toda página confere, ao abrir, se há um aviso esperando para ser mostrado
document.addEventListener('DOMContentLoaded', mostrarAvisoPendente);


/* ---- Confirmação de exclusão --------------------------------------------- */

// Função a chamar se a pessoa confirmar a exclusão que está sendo perguntada
let acaoAoConfirmarExclusao = null;

// Abre o diálogo "Excluir jogo?" e só chama aoConfirmar() se a pessoa
// escolher "Sim, excluir". Cancelar ou apertar Esc não faz nada.
function pedirConfirmacaoDeExclusao(jogo, aoConfirmar) {
  const dialogo = document.getElementById('dialogo-exclusao');

  dialogo.querySelector('[data-campo="titulo-do-jogo"]').textContent = jogo.titulo;
  acaoAoConfirmarExclusao = aoConfirmar;
  dialogo.showModal();
}

// Os botões do diálogo ficam em um <form method="dialog">. O evento "submit"
// acontece na hora do clique e informa qual botão foi usado (evento.submitter).
function aoResponderDialogoDeExclusao(evento) {
  evento.preventDefault();

  const dialogo = evento.target.closest('dialog');
  const confirmou = evento.submitter !== null && evento.submitter.value === 'confirmar';
  const acao = acaoAoConfirmarExclusao;
  acaoAoConfirmarExclusao = null;

  // Fecha o diálogo antes de agir, para o foco poder voltar para a página
  dialogo.close();

  if (confirmou && acao !== null) {
    acao();
  }
}

// Só as páginas que têm o diálogo (coleção e detalhes) registram o ouvinte
document.addEventListener('DOMContentLoaded', () => {
  const dialogo = document.getElementById('dialogo-exclusao');
  if (dialogo !== null) {
    dialogo.querySelector('form').addEventListener('submit', aoResponderDialogoDeExclusao);
  }
});

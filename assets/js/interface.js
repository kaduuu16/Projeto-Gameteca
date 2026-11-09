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

// Coloca a capa do jogo em um <img>. Se o endereço da imagem falhar,
// troca pela capa padrão em vez de deixar a imagem quebrada.
function aplicarCapa(imagem, jogo) {
  imagem.alt = temCapaPropria(jogo)
    ? `Capa do jogo ${jogo.titulo}`
    : `Capa provisória do jogo ${jogo.titulo}`;

  imagem.addEventListener('error', () => {
    imagem.src = CAPA_PADRAO;
  }, { once: true });

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


/* ---- Texto --------------------------------------------------------------- */

// Deixa o texto em minúsculas e sem acentos, para comparar "Açao" com "ação"
function normalizarTexto(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

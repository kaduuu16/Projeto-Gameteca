/*
  Minha Gameteca — api.js
  Comunicação com a API pública CheapShark (https://apidocs.cheapshark.com/).

  A CheapShark acompanha os preços de jogos de PC em várias lojas digitais.
  Ela não exige cadastro nem chave. A aplicação usa dois endereços:

    GET /games?title=…   procura jogos pelo nome
    GET /games?id=…      ofertas atuais e menor preço já registrado de um jogo

  Os dados externos vêm da API; o que a pessoa decide guardar na coleção
  fica no localStorage (dados.js).
*/

'use strict';

const API_CHEAPSHARK = 'https://www.cheapshark.com/api/1.0';
const TEMPO_LIMITE_DA_API = 10000;      // milissegundos
const MAXIMO_DE_RESULTADOS = 8;


/* ---- Requisição ---------------------------------------------------------- */

// Faz uma requisição GET e devolve a resposta JSON já convertida em objeto.
// Lança um erro se a rede falhar, se a API demorar demais ou responder com erro.
async function consultarApi(caminho) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TEMPO_LIMITE_DA_API);

  try {
    const resposta = await fetch(API_CHEAPSHARK + caminho, { signal: controlador.signal });
    if (!resposta.ok) {
      throw new Error(`A API respondeu com o código ${resposta.status}.`);
    }
    return await resposta.json();
  } finally {
    clearTimeout(temporizador);
  }
}


/* ---- Busca de jogos pelo nome -------------------------------------------- */

// Converte um item da resposta da API para o formato usado na aplicação
function converterResultado(item) {
  return {
    idCheapShark: String(item.gameID),
    titulo: String(item.external || ''),
    miniatura: String(item.thumb || ''),
    // Jogos vendidos na Steam têm uma capa em formato retrato neste endereço
    capaRetrato: item.steamAppID
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${encodeURIComponent(item.steamAppID)}/library_600x900.jpg`
      : '',
    menorPreco: Number(item.cheapest),
  };
}

// Procura jogos pelo nome. Devolve um array (vazio se nada for encontrado).
async function buscarJogosNaApi(termo) {
  const dados = await consultarApi(`/games?title=${encodeURIComponent(termo)}&limit=${MAXIMO_DE_RESULTADOS}`);

  if (!Array.isArray(dados)) {
    throw new Error('A API devolveu uma resposta em formato inesperado.');
  }
  return dados.map(converterResultado);
}

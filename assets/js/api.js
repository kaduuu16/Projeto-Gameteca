/*
  Minha Gameteca — api.js
  Comunicação com a API pública CheapShark (https://apidocs.cheapshark.com/).

  A CheapShark acompanha os preços de jogos de PC em várias lojas digitais.
  Ela não exige cadastro nem chave. A aplicação usa dois endereços:

    GET /games?title=…   procura jogos pelo nome
    GET /games?id=…      ofertas atuais e menor preço já registrado de um jogo

  As capas vêm da Steam: a API informa o código do jogo na Steam (steamAppID),
  e a partir dele monta-se o endereço das imagens oficiais da loja.

  Os dados externos vêm da API; o que a pessoa decide guardar na coleção
  fica no localStorage (dados.js).

  Depende de interface.js (normalizarTexto), que deve ser carregado antes.
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
    steamAppID: item.steamAppID ? String(item.steamAppID) : '',
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


/* ---- Capas --------------------------------------------------------------- */

const TEMPO_LIMITE_DA_IMAGEM = 4000;      // milissegundos

// Edições que contam como "o mesmo jogo" ao procurar a capa
// (ex.: "The Witcher 3: Wild Hunt Remastered" para "The Witcher 3: Wild Hunt")
const EDICOES_DO_MESMO_JOGO = [
  'remastered', 'complete edition', 'definitive edition', 'deluxe edition',
  'enhanced edition', 'standard edition', 'gold edition', 'ultimate edition',
  'game of the year edition', 'goty edition',
];

// Título reduzido ao essencial para comparar: sem acentos, maiúsculas e pontuação.
// Ex.: "The Witcher 3: Wild Hunt" → "the witcher 3 wild hunt"
function chaveDoTitulo(titulo) {
  return normalizarTexto(titulo).replace(/[^a-z0-9]+/g, ' ').trim();
}

function ehEdicaoDoMesmoJogo(tituloDoResultado, chaveProcurada) {
  const chave = chaveDoTitulo(tituloDoResultado);
  if (!chave.startsWith(`${chaveProcurada} `)) {
    return false;
  }
  return EDICOES_DO_MESMO_JOGO.includes(chave.slice(chaveProcurada.length + 1));
}

// Endereços de capa possíveis para um resultado, do melhor para o pior:
// capa vertical da Steam em alta resolução, capa vertical normal, imagem
// horizontal da página da loja e, por último, a miniatura enviada pela API.
function enderecosDeCapa(resultado) {
  const enderecos = [];

  if (resultado.steamAppID !== '') {
    const id = encodeURIComponent(resultado.steamAppID);
    enderecos.push(`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900_2x.jpg`);
    enderecos.push(`https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`);
    enderecos.push(`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`);
  }
  if (resultado.miniatura !== '') {
    enderecos.push(resultado.miniatura);
  }
  return enderecos;
}

// Testa, sem mostrar na tela, se uma imagem existe e carrega
function imagemCarrega(endereco) {
  return new Promise((resolver) => {
    const imagem = new Image();
    const temporizador = setTimeout(() => resolver(false), TEMPO_LIMITE_DA_IMAGEM);

    imagem.addEventListener('load', () => {
      clearTimeout(temporizador);
      resolver(imagem.naturalWidth > 0);
    });
    imagem.addEventListener('error', () => {
      clearTimeout(temporizador);
      resolver(false);
    });
    imagem.src = endereco;
  });
}

// Devolve o primeiro endereço de capa que carrega, ou '' se nenhum carregar
async function escolherCapa(resultado) {
  for (const endereco of enderecosDeCapa(resultado)) {
    if (await imagemCarrega(endereco)) {
      return endereco;
    }
  }
  return '';
}

// Procura a capa de um jogo pelo título. Só aceita o mesmo jogo (título igual,
// ou uma edição dele), para nunca trazer a capa de outro jogo, de uma trilha
// sonora ou de uma expansão. Devolve { capa, idCheapShark } ou null.
async function buscarCapaPorTitulo(titulo) {
  const procurado = chaveDoTitulo(titulo);
  if (procurado === '') {
    return null;
  }

  const resultados = await buscarJogosNaApi(titulo);
  const iguais = resultados.filter((resultado) => chaveDoTitulo(resultado.titulo) === procurado);
  const igualNaSteam = iguais.find((resultado) => resultado.steamAppID !== '');
  const edicaoNaSteam = resultados.find((resultado) => (
    resultado.steamAppID !== '' && ehEdicaoDoMesmoJogo(resultado.titulo, procurado)
  ));

  // Para a capa, prefere o resultado que está na Steam (imagens melhores);
  // para o código do jogo (usado nos preços), prefere o título idêntico
  const fonteDaCapa = igualNaSteam || edicaoNaSteam || iguais[0];
  if (fonteDaCapa === undefined) {
    return null;
  }

  return {
    capa: await escolherCapa(fonteDaCapa),
    idCheapShark: (iguais[0] || fonteDaCapa).idCheapShark,
  };
}


/* ---- Ofertas de um jogo -------------------------------------------------- */

// O link de uma oferta precisa passar pelo redirecionamento da CheapShark.
// O código da oferta pode vir já codificado para URL; por isso é decodificado
// antes de ser codificado de novo (assim nunca fica codificado duas vezes).
function enderecoDaOferta(idDaOferta) {
  let id = String(idDaOferta);
  try {
    id = decodeURIComponent(id);
  } catch (erro) {
    // Já estava sem codificação
  }
  return `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(id)}`;
}

// Busca as ofertas de um jogo pelo código dele na CheapShark.
// Devolve null se a API não conhecer o jogo. Formato do resultado:
//   {
//     titulo: 'Hollow Knight',
//     quantidadeDeOfertas: 5,
//     melhorOferta: { preco, precoNormal, desconto, link } ou null,
//     menorPrecoHistorico: { preco, data } ou null
//   }
async function buscarOfertasNaApi(idCheapShark) {
  const dados = await consultarApi(`/games?id=${encodeURIComponent(idCheapShark)}`);

  if (dados === null || typeof dados !== 'object' || !dados.info) {
    return null;
  }

  const ofertas = Array.isArray(dados.deals) ? dados.deals : [];

  // Percorre as ofertas guardando a de menor preço
  let melhorOferta = null;
  for (const oferta of ofertas) {
    const preco = Number(oferta.price);
    if (Number.isNaN(preco)) {
      continue;
    }
    if (melhorOferta === null || preco < melhorOferta.preco) {
      melhorOferta = {
        preco: preco,
        precoNormal: Number(oferta.retailPrice),
        desconto: Math.round(Number(oferta.savings)) || 0,     // em %
        link: enderecoDaOferta(oferta.dealID),
      };
    }
  }

  let menorPrecoHistorico = null;
  const historico = dados.cheapestPriceEver;
  const temHistorico = historico
    && historico.price !== null && historico.price !== undefined
    && !Number.isNaN(Number(historico.price));
  if (temHistorico) {
    menorPrecoHistorico = {
      preco: Number(historico.price),
      data: new Date(Number(historico.date) * 1000),           // a API informa em segundos
    };
  }

  return {
    titulo: String(dados.info.title || ''),
    quantidadeDeOfertas: ofertas.length,
    melhorOferta: melhorOferta,
    menorPrecoHistorico: menorPrecoHistorico,
  };
}

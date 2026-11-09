/*
  Minha Gameteca — dados.js
  Camada de dados da aplicação.

  Guarda a coleção de jogos no localStorage do navegador e reúne as funções
  que leem e alteram esses dados. Nada aqui mexe na tela: quem desenha a
  interface são os arquivos pagina-*.js.

  Formato de um jogo (objeto):
    {
      id: 1794240000000,       // número único (momento da criação, em milissegundos)
      titulo: 'Hollow Knight',
      plataforma: 'pc',        // uma das chaves de PLATAFORMAS
      genero: 'plataforma',    // uma das chaves de GENEROS
      ano: 2017,
      status: 'jogando',       // uma das chaves de STATUS
      nota: 9,                 // de 0 a 10, ou null se ainda não tem nota
      horas: 25,               // ou null
      capa: 'https://…',       // endereço da imagem, ou '' para usar a capa provisória
      observacoes: '',
      idCheapShark: '120',     // código do jogo na API CheapShark, se veio da busca; senão null
      criadoEm: '2026-11-09T12:00:00.000Z',
      atualizadoEm: '2026-11-09T12:00:00.000Z'
    }
*/

'use strict';

/* ---- Constantes ---------------------------------------------------------- */

// Nome da chave usada no localStorage
const CHAVE_JOGOS = 'gameteca:jogos';

// Valor guardado → texto mostrado na tela
const PLATAFORMAS = {
  'pc': 'PC',
  'playstation-5': 'PlayStation 5',
  'playstation-4': 'PlayStation 4',
  'xbox-series': 'Xbox Series X|S',
  'nintendo-switch': 'Nintendo Switch',
  'mobile': 'Mobile',
};

const GENEROS = {
  'acao': 'Ação',
  'aventura': 'Aventura',
  'rpg': 'RPG',
  'plataforma': 'Plataforma',
  'estrategia': 'Estratégia',
  'esporte': 'Esporte',
  'corrida': 'Corrida',
  'simulacao': 'Simulação',
  'outro': 'Outro',
};

const STATUS = {
  'quero-jogar': 'Quero jogar',
  'jogando': 'Jogando',
  'zerado': 'Zerado',
  'abandonado': 'Abandonado',
};

// Coleção inicial, gravada só na primeira visita, para a aplicação não começar vazia.
// As capas são as imagens oficiais da Steam (o mesmo endereço que a busca na API
// encontra). O GTA VI ainda não está à venda para PC, então fica com a capa provisória.
const JOGOS_DE_EXEMPLO = [
  {
    id: 1,
    titulo: 'The Witcher 3: Wild Hunt',
    plataforma: 'pc',
    genero: 'rpg',
    ano: 2015,
    status: 'zerado',
    nota: 10,
    horas: 120,
    capa: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900_2x.jpg',
    observacoes: 'Joguei todas as missões principais e as duas expansões. Quero rejogar com outro final.',
    idCheapShark: '112330',
    criadoEm: '2026-09-20T12:00:00.000Z',
    atualizadoEm: '2026-09-20T12:00:00.000Z',
  },
  {
    id: 2,
    titulo: 'Hollow Knight',
    plataforma: 'nintendo-switch',
    genero: 'plataforma',
    ano: 2017,
    status: 'jogando',
    nota: 9,
    horas: 25,
    capa: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900_2x.jpg',
    observacoes: 'Parei na Cidade das Lágrimas. Falta encontrar o resto dos amuletos.',
    idCheapShark: '165363',
    criadoEm: '2026-09-21T12:00:00.000Z',
    atualizadoEm: '2026-09-21T12:00:00.000Z',
  },
  {
    id: 3,
    titulo: 'Celeste',
    plataforma: 'nintendo-switch',
    genero: 'plataforma',
    ano: 2018,
    status: 'zerado',
    nota: 9,
    horas: 18,
    capa: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/504230/library_600x900_2x.jpg',
    observacoes: 'Terminei a história. Os lados B ficam para depois.',
    idCheapShark: '177485',
    criadoEm: '2026-09-22T12:00:00.000Z',
    atualizadoEm: '2026-09-22T12:00:00.000Z',
  },
  {
    id: 4,
    titulo: 'Forza Horizon 5',
    plataforma: 'xbox-series',
    genero: 'corrida',
    ano: 2021,
    status: 'abandonado',
    nota: 7,
    horas: 12,
    capa: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1551360/library_600x900_2x.jpg',
    observacoes: '',
    idCheapShark: '233750',
    criadoEm: '2026-09-23T12:00:00.000Z',
    atualizadoEm: '2026-09-23T12:00:00.000Z',
  },
  {
    id: 5,
    titulo: 'Grand Theft Auto VI',
    plataforma: 'playstation-5',
    genero: 'acao',
    ano: 2026,
    status: 'quero-jogar',
    nota: null,
    horas: null,
    capa: '',
    observacoes: 'Esperando o lançamento.',
    idCheapShark: null,
    criadoEm: '2026-09-24T12:00:00.000Z',
    atualizadoEm: '2026-09-24T12:00:00.000Z',
  },
];


/* ---- Leitura e gravação no localStorage ---------------------------------- */

// Grava a coleção inteira. Devolve true se deu certo e false se o navegador
// recusou (armazenamento bloqueado ou cheio).
function salvarJogos(jogos) {
  try {
    localStorage.setItem(CHAVE_JOGOS, JSON.stringify(jogos));
    return true;
  } catch (erro) {
    console.warn('Não foi possível gravar no localStorage.', erro);
    return false;
  }
}

// Devolve a coleção guardada, como um array de objetos.
function listarJogos() {
  let texto;

  try {
    texto = localStorage.getItem(CHAVE_JOGOS);
  } catch (erro) {
    console.warn('Não foi possível ler o localStorage.', erro);
    return [];
  }

  // Primeira visita: ainda não existe nada guardado, então grava os exemplos.
  // (Uma coleção esvaziada pela pessoa fica guardada como "[]" e não cai aqui.)
  if (texto === null) {
    salvarJogos(JOGOS_DE_EXEMPLO);
    return JOGOS_DE_EXEMPLO.map((jogo) => ({ ...jogo }));
  }

  try {
    const jogos = JSON.parse(texto);
    return Array.isArray(jogos) ? jogos : [];
  } catch (erro) {
    console.warn('Os dados guardados estão corrompidos e foram ignorados.', erro);
    return [];
  }
}

// Procura um jogo pelo id. Devolve o objeto ou null.
function buscarJogoPorId(id) {
  const jogo = listarJogos().find((item) => item.id === id);
  return jogo || null;
}


/* ---- Validação ----------------------------------------------------------- */

const ANO_MINIMO = 1970;
const ANO_MAXIMO = new Date().getFullYear() + 5;     // permite jogos já anunciados
const TAMANHO_MAXIMO_DO_TITULO = 120;
const TAMANHO_MAXIMO_DAS_OBSERVACOES = 500;

function ehEnderecoWeb(texto) {
  try {
    const endereco = new URL(texto);
    return endereco.protocol === 'http:' || endereco.protocol === 'https:';
  } catch (erro) {
    return false;
  }
}

// Já existe outro jogo com o mesmo título na mesma plataforma?
// "idIgnorado" é o id do próprio jogo quando ele está sendo editado.
function existeJogoIgual(titulo, plataforma, idIgnorado) {
  const procurado = titulo.trim().toLowerCase();

  return listarJogos().some((jogo) => (
    jogo.id !== idIgnorado
    && jogo.plataforma === plataforma
    && jogo.titulo.trim().toLowerCase() === procurado
  ));
}

// Confere os dados de um jogo antes de salvar. Devolve um objeto com uma
// mensagem para cada campo com problema; objeto vazio significa "tudo certo".
function validarJogo(dados, idIgnorado) {
  const erros = {};

  if (dados.titulo.length < 2) {
    erros.titulo = 'Informe o título do jogo (pelo menos 2 letras).';
  } else if (dados.titulo.length > TAMANHO_MAXIMO_DO_TITULO) {
    erros.titulo = `O título pode ter no máximo ${TAMANHO_MAXIMO_DO_TITULO} caracteres.`;
  } else if (existeJogoIgual(dados.titulo, dados.plataforma, idIgnorado)) {
    erros.titulo = 'Este jogo já está na sua coleção nesta plataforma.';
  }

  if (!Object.keys(PLATAFORMAS).includes(dados.plataforma)) {
    erros.plataforma = 'Escolha a plataforma.';
  }

  if (!Object.keys(GENEROS).includes(dados.genero)) {
    erros.genero = 'Escolha o gênero.';
  }

  if (!Number.isInteger(dados.ano) || dados.ano < ANO_MINIMO || dados.ano > ANO_MAXIMO) {
    erros.ano = `Informe o ano com 4 dígitos, entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`;
  }

  if (!Object.keys(STATUS).includes(dados.status)) {
    erros.status = 'Escolha o status do jogo.';
  }

  if (dados.nota !== null && (Number.isNaN(dados.nota) || dados.nota < 0 || dados.nota > 10)) {
    erros.nota = 'A nota vai de 0 a 10. Deixe em branco se ainda não jogou.';
  }

  if (dados.horas !== null && (Number.isNaN(dados.horas) || dados.horas < 0)) {
    erros.horas = 'Informe as horas como um número igual ou maior que zero.';
  }

  if (dados.capa !== '' && !ehEnderecoWeb(dados.capa)) {
    erros.capa = 'Informe o endereço completo da imagem, começando com http:// ou https://.';
  }

  if (dados.observacoes.length > TAMANHO_MAXIMO_DAS_OBSERVACOES) {
    erros.observacoes = `As observações podem ter no máximo ${TAMANHO_MAXIMO_DAS_OBSERVACOES} caracteres.`;
  }

  return erros;
}


/* ---- Cadastro ------------------------------------------------------------ */

// Acrescenta um jogo à coleção e grava. Devolve o jogo criado (já com id),
// ou null se não foi possível gravar.
function adicionarJogo(dados) {
  const jogos = listarJogos();
  const agora = new Date();

  // O id é o momento da criação; o laço garante que nunca se repita
  let id = agora.getTime();
  while (jogos.some((jogo) => jogo.id === id)) {
    id += 1;
  }

  const jogo = {
    ...dados,
    id: id,
    criadoEm: agora.toISOString(),
    atualizadoEm: agora.toISOString(),
  };

  jogos.push(jogo);
  return salvarJogos(jogos) ? jogo : null;
}

/* ---- Edição -------------------------------------------------------------- */

// Troca os dados de um jogo existente e grava. Devolve o jogo atualizado,
// ou null se o jogo não existe mais ou se não foi possível gravar.
function atualizarJogo(id, dados) {
  const jogos = listarJogos();
  const posicao = jogos.findIndex((jogo) => jogo.id === id);

  if (posicao === -1) {
    return null;
  }

  // Mantém o que não muda (id e data de criação) e registra a data da alteração
  const atualizado = {
    ...jogos[posicao],
    ...dados,
    id: id,
    atualizadoEm: new Date().toISOString(),
  };

  jogos[posicao] = atualizado;
  return salvarJogos(jogos) ? atualizado : null;
}

/* ---- Exclusão ------------------------------------------------------------ */

// Remove um jogo da coleção e grava. Devolve o jogo removido,
// ou null se ele não existia ou se não foi possível gravar.
function excluirJogo(id) {
  const jogos = listarJogos();
  const removido = jogos.find((jogo) => jogo.id === id);

  if (removido === undefined) {
    return null;
  }

  const restantes = jogos.filter((jogo) => jogo.id !== id);
  return salvarJogos(restantes) ? removido : null;
}

/* ---- Resumo -------------------------------------------------------------- */

// Calcula os números do "Resumo da coleção" a partir de uma lista de jogos
function calcularResumo(jogos) {
  const resumo = {
    total: jogos.length,
    porStatus: {},
    horas: 0,
    notaMedia: null,       // null quando nenhum jogo tem nota
  };

  for (const status of Object.keys(STATUS)) {
    resumo.porStatus[status] = 0;
  }

  let somaDasNotas = 0;
  let jogosComNota = 0;

  for (const jogo of jogos) {
    if (resumo.porStatus[jogo.status] !== undefined) {
      resumo.porStatus[jogo.status] += 1;
    }
    if (jogo.horas !== null) {
      resumo.horas += jogo.horas;
    }
    if (jogo.nota !== null) {
      somaDasNotas += jogo.nota;
      jogosComNota += 1;
    }
  }

  if (jogosComNota > 0) {
    resumo.notaMedia = somaDasNotas / jogosComNota;
  }

  return resumo;
}

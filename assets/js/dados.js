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

// Coleção inicial, gravada só na primeira visita, para a aplicação não começar vazia
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
    capa: '',
    observacoes: 'Joguei todas as missões principais e as duas expansões. Quero rejogar com outro final.',
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
    capa: '',
    observacoes: 'Parei na Cidade das Lágrimas. Falta encontrar o resto dos amuletos.',
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
    capa: '',
    observacoes: 'Terminei a história. Os lados B ficam para depois.',
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
    capa: '',
    observacoes: '',
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

/*
  Minha Gameteca — pagina-detalhes.js
  Página de detalhes: mostra a ficha completa do jogo indicado no endereço
  (…/detalhes.html?id=3).
*/

'use strict';

/* ---- Elementos da página ------------------------------------------------- */

const fichaDoJogo = document.getElementById('detalhe');
const painelNaoEncontrado = document.getElementById('nao-encontrado');


/* ---- Ficha do jogo ------------------------------------------------------- */

// Converte a data guardada (texto no formato ISO) para o formato brasileiro
function formatarData(textoIso) {
  const data = new Date(textoIso);
  if (Number.isNaN(data.getTime())) {
    return 'Não informado';
  }
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function escreverNaFicha(campo, texto) {
  fichaDoJogo.querySelector(`[data-campo="${campo}"]`).textContent = texto;
}

function mostrarJogo(jogo) {
  const plataforma = PLATAFORMAS[jogo.plataforma] || jogo.plataforma;
  const genero = GENEROS[jogo.genero] || jogo.genero;

  const textos = {
    'titulo': jogo.titulo,
    'linha-resumo': `${genero} · ${plataforma} · ${jogo.ano}`,
    'plataforma': plataforma,
    'genero': genero,
    'ano': jogo.ano,
    'status': STATUS[jogo.status] || jogo.status,
    'nota': formatarNota(jogo.nota),
    'horas': formatarHoras(jogo.horas),
    'criado-em': formatarData(jogo.criadoEm),
    'atualizado-em': formatarData(jogo.atualizadoEm),
    'observacoes': jogo.observacoes || 'Nenhuma observação anotada.',
    'legenda-capa': temCapaPropria(jogo)
      ? ''
      : 'Capa provisória. Edite o jogo para informar o endereço de uma imagem.',
  };
  for (const [campo, texto] of Object.entries(textos)) {
    escreverNaFicha(campo, texto);
  }

  aplicarCapa(document.getElementById('detalhe-capa'), jogo);
  fichaDoJogo.dataset.status = jogo.status;       // o CSS usa para a cor do status
  document.getElementById('link-editar').href = urlDaPagina('editar', jogo.id);

  document.title = `${jogo.titulo} — Minha Gameteca`;
  fichaDoJogo.hidden = false;
}

/* ---- Preços (API CheapShark) --------------------------------------------- */

const estadoDasOfertas = document.getElementById('estado-ofertas');

// estado: 'carregando', 'ok', 'vazio' ou 'erro' (o CSS muda a aparência)
function mostrarEstadoDasOfertas(estado, texto) {
  estadoDasOfertas.dataset.estado = estado;
  estadoDasOfertas.textContent = texto;
}

function mostrarOfertas(ofertas) {
  const melhor = ofertas.melhorOferta;
  const historico = ofertas.menorPrecoHistorico;

  let textoAtual = formatarPreco(melhor.preco);
  if (melhor.desconto > 0 && !Number.isNaN(melhor.precoNormal)) {
    textoAtual += ` (${melhor.desconto}% de desconto sobre ${formatarPreco(melhor.precoNormal)})`;
  }

  const textoHistorico = historico === null
    ? 'Não informado'
    : `${formatarPreco(historico.preco)} em ${historico.data.toLocaleDateString('pt-BR')}`;

  const lista = document.getElementById('lista-ofertas');
  lista.querySelector('[data-oferta="atual"]').textContent = textoAtual;
  lista.querySelector('[data-oferta="historico"]').textContent = textoHistorico;
  lista.hidden = false;

  document.getElementById('link-oferta').href = melhor.link;
  document.getElementById('acoes-oferta').hidden = false;

  mostrarEstadoDasOfertas('ok', ofertas.quantidadeDeOfertas === 1
    ? `1 oferta encontrada para “${ofertas.titulo}”.`
    : `${ofertas.quantidadeDeOfertas} ofertas encontradas para “${ofertas.titulo}”.`);
}

// Descobre o código do jogo na CheapShark. Jogos cadastrados pela busca já
// têm o código guardado; para os digitados à mão, procura um título igual.
async function descobrirIdNaApi(jogo) {
  if (jogo.idCheapShark) {
    return jogo.idCheapShark;
  }

  const resultados = await buscarJogosNaApi(jogo.titulo);
  const procurado = normalizarTexto(jogo.titulo);
  const igual = resultados.find((resultado) => normalizarTexto(resultado.titulo) === procurado);

  return igual === undefined ? null : igual.idCheapShark;
}

async function carregarOfertas(jogo) {
  try {
    const id = await descobrirIdNaApi(jogo);
    const ofertas = id === null ? null : await buscarOfertasNaApi(id);

    if (ofertas === null || ofertas.melhorOferta === null) {
      mostrarEstadoDasOfertas('vazio', 'Não encontramos este título nas lojas de PC acompanhadas pela CheapShark.');
      return;
    }
    mostrarOfertas(ofertas);
  } catch (erro) {
    console.warn('Falha ao consultar a API CheapShark.', erro);
    mostrarEstadoDasOfertas('erro', 'Não foi possível consultar os preços agora. Verifique sua conexão e recarregue a página.');
  }
}


/* ---- Exclusão ------------------------------------------------------------ */

// Excluir pede confirmação; depois de excluir, volta para a coleção
function aoClicarEmExcluir() {
  pedirConfirmacaoDeExclusao(jogoAtual, () => {
    if (excluirJogo(jogoAtual.id) === null) {
      mostrarAviso('erro', 'Não foi possível excluir o jogo. Recarregue a página e tente de novo.');
      return;
    }
    guardarAvisoParaProximaPagina('sucesso', `“${jogoAtual.titulo}” foi excluído da coleção.`);
    location.href = `${RAIZ}index.html`;
  });
}

function mostrarNaoEncontrado() {
  document.title = 'Jogo não encontrado — Minha Gameteca';
  painelNaoEncontrado.hidden = false;
}


/* ---- Início -------------------------------------------------------------- */

const jogoAtual = buscarJogoPorId(idDaUrl());

if (jogoAtual === null) {
  mostrarNaoEncontrado();
} else {
  mostrarJogo(jogoAtual);
  document.getElementById('botao-excluir').addEventListener('click', aoClicarEmExcluir);
  carregarOfertas(jogoAtual);
}

// Se o navegador reabrir uma cópia guardada desta página (botão "voltar"),
// recarrega para mostrar os dados atuais
window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) {
    location.reload();
  }
});

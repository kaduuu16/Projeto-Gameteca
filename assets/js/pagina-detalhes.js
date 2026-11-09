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
}

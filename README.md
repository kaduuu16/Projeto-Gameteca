# Minha Gameteca

Sistema web para organizar a coleção de jogos de uma pessoa: jogos que ela possui, está jogando, já zerou, abandonou ou pretende jogar (lista de desejos).

Projeto do Trabalho Prático Individual da disciplina de Desenvolvimento de Interfaces Web, desenvolvido de forma evolutiva em etapas.

- **Aplicação publicada:** https://kaduuu16.github.io/Projeto-Gameteca/
- **Repositório:** https://github.com/kaduuu16/Projeto-Gameteca

## Entidade principal

**Jogo**, com título, plataforma, gênero, ano de lançamento, status (quero jogar, jogando, zerado ou abandonado), nota pessoal (0 a 10), horas jogadas, URL da capa e observações.

## API pública

[CheapShark API](https://apidocs.cheapshark.com/), que acompanha jogos e preços em lojas digitais de PC. Não exige cadastro nem chave. Ela é usada em duas funcionalidades:

1. **No cadastro:** buscar um jogo pelo nome e preencher o formulário (título, capa e plataforma) com o resultado escolhido. O jogo salvo vai para o `localStorage`.
2. **Nos detalhes:** mostrar o menor preço atual do jogo, o desconto, o menor preço já registrado e o link da oferta.

> Na Entrega 0 a API indicada era a RAWG. Ela foi trocada pela CheapShark porque a RAWG exige uma chave pessoal, que ficaria exposta em um repositório público. O tema e a entidade não mudaram.

## Etapas

| Etapa | Conteúdo | Situação |
| --- | --- | --- |
| 1 | HTML e estrutura da interface | Concluída (v1.0.0) |
| 2 | CSS, layout e responsividade | Concluída (v2.0.0) |
| 3 | JavaScript, dados e interatividade (localStorage e API) | Concluída (v3.0.0) |

## Etapa 3: o que foi desenvolvido

| Funcionalidade | Como funciona |
| --- | --- |
| Cadastrar | Formulário em `pages/cadastro.html`. Os dados são lidos e validados em JavaScript; cada erro aparece embaixo do campo. Depois de salvar, a pessoa volta para a coleção com um aviso de sucesso. |
| Listar | Os cartões são criados pelo JavaScript a partir do `localStorage`, copiando um `<template>` do HTML. Contador, resumo e mensagens de lista vazia acompanham os dados. |
| Ver detalhes | `pages/detalhes.html?id=…` mostra a ficha completa do jogo, com datas de cadastro e de alteração. |
| Editar | `pages/editar.html?id=…` abre o formulário preenchido e grava as alterações. |
| Excluir | Botão "Excluir" na lista e nos detalhes, com diálogo de confirmação. |
| Pesquisar | Por título, enquanto a pessoa digita, ignorando acentos e maiúsculas. |
| Filtrar | Por plataforma, gênero e status, combináveis entre si e com a pesquisa. |
| Ordenar | Por título, nota, ano ou horas jogadas, em ordem crescente ou decrescente. |
| Persistência | Toda a coleção fica no `localStorage`, na chave `gameteca:jogos`, e é gravada de novo a cada cadastro, edição ou exclusão. |
| API | Busca de jogos no cadastro e preços nos detalhes (CheapShark), com estados de carregando, sem resultados e erro. |

**Regras de validação do jogo**

- Título obrigatório, com 2 a 120 caracteres, e sem repetir um jogo que já existe na mesma plataforma.
- Plataforma, gênero e status obrigatórios.
- Ano inteiro, de 1970 até o ano atual mais 5 (para jogos já anunciados).
- Nota opcional, de 0 a 10. Horas opcionais, a partir de 0.
- Capa opcional; quando informada, precisa ser um endereço `http://` ou `https://`.
- Observações com no máximo 500 caracteres.

**Organização do JavaScript** (`assets/js/`)

| Arquivo | Responsabilidade |
| --- | --- |
| `dados.js` | Camada de dados: `localStorage`, jogos de exemplo, validação e as funções de cadastrar, buscar, editar, excluir e resumir. Não mexe na tela. |
| `interface.js` | Funções de tela usadas por mais de uma página: endereços, capas, formatação, avisos e confirmação de exclusão. |
| `api.js` | Requisições à CheapShark com `fetch`, tempo limite e conversão das respostas. |
| `pagina-colecao.js` | Página inicial: listagem, pesquisa, filtros, ordenação, resumo e exclusão. |
| `pagina-formulario.js` | Cadastro e edição (o mesmo código atende os dois) e a busca na API. |
| `pagina-detalhes.js` | Ficha do jogo, preços da API e exclusão. |

Os arquivos são scripts comuns (sem módulos nem ferramentas de build), carregados com `defer` na ordem em que dependem uns dos outros.

**Detalhes de comportamento**

- Na primeira visita, a coleção começa com 5 jogos de exemplo. Uma coleção esvaziada pela pessoa continua vazia.
- Jogos sem capa recebem uma capa provisória; se o endereço da capa falhar, entra uma imagem padrão.
- Todo texto digitado ou vindo da API é inserido com `textContent`, nunca como HTML.
- Se a API estiver fora do ar, o cadastro manual e o restante da aplicação continuam funcionando.
- A lista se atualiza quando a coleção é alterada em outra aba do navegador.

## Etapa 2: o que foi desenvolvido

Toda a estilização está em um único arquivo externo, `assets/css/style.css`, organizado em oito seções comentadas.

**Identidade visual**
- Direção "cartuchos de jogo": bordas firmes, sombras sólidas deslocadas e botões que afundam ao clicar.
- Cores definidas como variáveis CSS (`:root`): índigo para texto e bordas, violeta (cor do logotipo) para ações e links.
- Cada status tem uma cor própria (quero jogar, jogando, zerado, abandonado) usada na lombada dos cards, nos selos, nas opções do formulário e no resumo. A cor nunca é a única informação: sempre há texto ou o sinal ✓.
- Tipografia: Bricolage Grotesque nos títulos e Atkinson Hyperlegible no texto (fonte desenhada para legibilidade), carregadas do Google Fonts, com fontes de reserva no CSS. Ambas sob licença OFL.

**Layout**
- **Flexbox:** topo e navegação, rodapé, estrutura vertical da página, grupos de botões, resultados da busca na API.
- **CSS Grid:** áreas da página principal (`grid-template-areas`), cards da listagem, campos do formulário, painel de busca e ficha de detalhes.
- Box Model com `box-sizing: border-box`, escala de espaçamento em `rem` e unidades como `ch`, `fr`, `clamp()` e `min()`.

**Responsividade (mobile-first, Media Queries em `em`)**

| Largura | O que muda |
| --- | --- |
| base | Uma coluna; cards horizontais com capa ao lado; botões do formulário em largura total |
| 30em (480px) | Campo de busca da API com o botão ao lado |
| 40em (640px) | Cards verticais em grade; busca organizada em áreas |
| 48em (768px) | Navegação ao lado do título; ficha de detalhes em duas colunas |
| 64em (1024px) | Resumo da coleção fixo (sticky) ao lado da lista |
| 90em (1440px) | Conteúdo mais largo e texto maior |

Testado de 320px a 1920px, sem rolagem horizontal em nenhuma página, inclusive com títulos muito longos.

**Estados de interação e acessibilidade visual**
- `:hover`, `:active`, `:disabled` e `:focus-visible` nos botões, links, campos e cards.
- Foco por teclado com contorno de 3px (âmbar sobre o topo escuro, violeta no restante) e link "pular para o conteúdo".
- Todos os pares de cor de texto têm contraste de pelo menos 4,5:1; bordas e indicadores de foco, pelo menos 3:1.
- Campo com erro fica em vermelho, com a mensagem embaixo e o rótulo destacado (na Etapa 3 a marcação passou a ser feita pelo JavaScript, com `aria-invalid`).
- Mensagens: avisos de sucesso e de erro, erros do formulário, lista vazia, pesquisa sem resultados e estados da API.
- Diálogo de confirmação de exclusão (`<dialog>`), aberto pelo JavaScript.
- Respeita `prefers-reduced-motion`.

## Etapa 1: o que foi desenvolvido

- Estrutura HTML semântica (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`).
- Página principal com a estrutura da listagem em cards.
- Estrutura de pesquisa, filtros (plataforma, gênero e status) e ordenação.
- Formulário de cadastro com campos adequados a cada dado (`input`, `select`, `radio`, `textarea`, `button`).
- Página de detalhes do jogo, com estrutura de confirmação de exclusão.
- Página de edição.
- Tabela de resumo da coleção em `aside`.

## Estrutura do projeto

```
Projeto-Gameteca/
├── index.html                  (minha coleção)
├── README.md
├── pages/
│   ├── cadastro.html
│   ├── detalhes.html
│   └── editar.html
└── assets/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── dados.js
    │   ├── interface.js
    │   ├── api.js
    │   ├── pagina-colecao.js
    │   ├── pagina-formulario.js
    │   └── pagina-detalhes.js
    └── img/
        ├── capa-1.svg ... capa-5.svg   (capas provisórias, arte original)
        ├── capa-padrao.svg
        └── logo.svg
```

## Como executar

Acesse a [aplicação publicada](https://kaduuu16.github.io/Projeto-Gameteca/) ou abra o arquivo `index.html` em um navegador. Não é necessário instalar nada.

A internet é usada para as fontes e para a API. Sem ela, o site usa fontes de reserva e a coleção continua funcionando; só a busca de jogos e os preços ficam indisponíveis.

Para recomeçar com os jogos de exemplo, apague a chave `gameteca:jogos` do `localStorage` (nas ferramentas do navegador, em Aplicativo → Armazenamento local) e recarregue a página.

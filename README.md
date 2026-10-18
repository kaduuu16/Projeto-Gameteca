# Minha Gameteca

Sistema web para organizar a coleção de jogos de uma pessoa: jogos que ela possui, está jogando, já zerou, abandonou ou pretende jogar (lista de desejos).

Projeto do Trabalho Prático Individual da disciplina de Desenvolvimento Web, desenvolvido de forma evolutiva em etapas.

## Entidade principal

**Jogo**, com título, plataforma, gênero, ano de lançamento, status (quero jogar, jogando, zerado ou abandonado), nota pessoal (0 a 10), horas jogadas, URL da capa e observações.

## API pública prevista

[RAWG Video Games Database API](https://rawg.io/apidocs), para pesquisar jogos pelo nome e preencher automaticamente dados do cadastro (será implementada na Etapa 3).

## Etapas

| Etapa | Conteúdo | Situação |
| --- | --- | --- |
| 1 | HTML e estrutura da interface | Concluída (v1.0.0) |
| 2 | CSS, layout e responsividade | Concluída (v2.0.0) |
| 3 | JavaScript, dados e interatividade (localStorage e API) | Pendente |

## Etapa 1: o que foi desenvolvido

- Estrutura HTML semântica (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`).
- Página principal com listagem de jogos de exemplo em cards.
- Estrutura de pesquisa, filtros (plataforma, gênero e status) e ordenação.
- Formulário de cadastro com campos adequados a cada dado (`input`, `select`, `radio`, `textarea`, `button`).
- Página de detalhes do jogo, com estrutura de confirmação de exclusão.
- Página de edição com o formulário preenchido.
- Tabela de resumo da coleção em `aside`.
- Botões de editar e excluir presentes, ainda sem funcionamento.

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

Testado de 360px a 1920px, sem rolagem horizontal em nenhuma página.

**Estados de interação e acessibilidade visual**
- `:hover`, `:active`, `:disabled` e `:focus-visible` nos botões, links, campos e cards.
- Foco por teclado com contorno de 3px (âmbar sobre o topo escuro, violeta no restante) e link "pular para o conteúdo".
- Todos os pares de cor de texto têm contraste de pelo menos 4,5:1; bordas e indicadores de foco, pelo menos 3:1.
- Campo inválido fica em vermelho depois que a pessoa interage (`:user-invalid`).
- Mensagens previstas: aviso de dados de exemplo, erro e sucesso do formulário (aparecem só com CSS, via `:has()` e `:valid`) e lista vazia.
- Diálogo de confirmação de exclusão abre pelo botão "Excluir jogo" (atributo `command`), sem JavaScript. A exclusão em si vem na Etapa 3.
- Respeita `prefers-reduced-motion`.

**Compatibilidade:** os recursos mais novos (`:has()`, `:user-invalid`, `command`) funcionam nas versões atuais de Chrome, Edge, Firefox e Safari. Em navegadores antigos, o layout e as cores continuam funcionando; só as mensagens automáticas do formulário e a abertura do diálogo ficam de fora.

## Estrutura do projeto

```
minha-gameteca/
├── index.html
├── README.md
├── pages/
│   ├── cadastro.html
│   ├── detalhes.html
│   └── editar.html
└── assets/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── script.js
    └── img/
        ├── capa-1.svg ... capa-5.svg   (capas de exemplo, arte original)
        ├── capa-padrao.svg
        └── logo.svg
```

## Como executar

Abra o arquivo `index.html` em um navegador. Não é necessário instalar nada. A internet só é usada para carregar as fontes; sem ela, o site usa as fontes de reserva do sistema.

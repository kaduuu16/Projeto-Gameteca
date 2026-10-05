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
| 1 | HTML e estrutura da interface | Concluída |
| 2 | CSS, layout e responsividade | Pendente |
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
        ├── capa-padrao.svg
        └── logo.svg
```

## Como executar

Abra o arquivo `index.html` em um navegador. Não é necessário instalar nada.

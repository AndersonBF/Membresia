# Guia dos screenshots do README

O `README.md` já referencia os arquivos abaixo. Basta salvar cada print com o nome exato nesta pasta e as imagens aparecem automaticamente.

## Antes de começar

- **Use dados fictícios.** Nomes, e-mails, telefones e fotos de membros reais não podem ir para o GitHub — principalmente se o repositório for público. Rode o seed (`docker exec membresia-app npx prisma db seed`) e tire os prints com os dados de exemplo.
- Navegador em **1440x900**, tema claro, janela maximizada.
- No Chrome: `F12` → `Ctrl+Shift+P` → digite "Capture screenshot" → gera um PNG limpo, sem barra de endereço.
- Se sobrar algo identificável na tela, borre antes de salvar.

## Arquivos esperados

| Arquivo | Tela | Rota |
|---|---|---|
| `dashboard-admin.png` | Painel administrativo (print de destaque, topo do README) | `/admin` |
| `membros.png` | Listagem de membros | `/list/members` |
| `presenca-take.png` | Tomada de presença | `/list/attendance/take` |
| `presenca-relatorio.png` | Relatório de frequência | `/list/attendance` |
| `eventos.png` | Calendário / eventos | `/calendario-geral` |
| `diaconia-escala.png` | Escala da diaconia | `/diaconia/escala` |
| `diaconia-inventario.png` | Inventário da diaconia | `/diaconia/inventario` |
| `diaconia-tarefas.png` | Quadro de tarefas | `/diaconia/tarefas` |
| `sociedade.png` | Página de uma sociedade interna | `/internalsociety` |
| `financas.png` | Painel financeiro | `/list/finance` |

A aplicação roda em `http://localhost:5555`.

## Se pular algum

Uma imagem que não existe aparece como ícone quebrado no GitHub. Se não for tirar algum print agora, remova a linha `![...](...)` correspondente do `README.md`.

Este arquivo é só um lembrete — pode apagar quando terminar.

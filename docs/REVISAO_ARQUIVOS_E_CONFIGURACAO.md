# Revisão de arquivos e configuração

Revisão solicitada em 15/11/2026, na branch `teste`. Nenhum arquivo removido, nenhuma dependência desinstalada e nenhuma alteração no banco ou no `.env` real.

## Candidatos à remoção

Ausência de referência não prova ausência de uso externo/manual. A tabela indica os candidatos encontrados no estado atual do projeto.

| Arquivo | Evidência | Recomendação |
|---|---|---|
| `src/App.css` | Arquivo vazio e sem import no aplicativo. | Remover em uma limpeza autorizada. |
| `src/index.css` | Estilos de template, sem import na entrada `main.jsx` ou nos demais módulos. | Remover se a equipe não pretende reaproveitar. |
| `src/utils/prioridade.js` | `PRIORIDADE`/`infoPrioridade` sem consumidores identificados. | Remover se não houver uso planejado. |
| `public/img/caio2.png` | Sem referência estática e sem ocorrência nas URLs/propostas consultadas do banco local. | Candidato à remoção; confirmar se é material de apresentação. |
| `public/img/IRIZAR3.jpg` | Mesma verificação, sem referências encontradas. | Candidato à remoção; confirmar uso externo. |
| `public/img/nome.png` | Mesma verificação, sem referências encontradas. | Candidato à remoção; confirmar uso externo. |
| `backend/scripts/start.py` | Inicializador antigo fora do `package.json`; espera venv em `backend/.venv`. O launcher atual aceita também a venv da raiz. | Remover ou arquivar; o fluxo atual é `npm run start`. |
| `start.sh` | Inicia Flask e depois `npm run start`, que inicia outro Flask. Problema já registrado nas evidências anteriores. | Priorizar remoção/atualização em tarefa autorizada. |

## Referências e artefatos que podem ser organizados

- `backend/cod_qrcode.txt`: tutorial de referência, não executado pelo aplicativo. Mencionado nos documentos de arquitetura; arquivar em documentação se ainda for útil, sem confundir com a implementação real.
- `src/pages/doc.md` e `itens_faltantes.txt`: anotações soltas de tarefas. Revisar quais itens já foram entregues antes de consolidar no acompanhamento. Não foram tratados como código inútil.
- `src/docs/GUIA-BACKEND.md`: descreve serviços em modo demonstração/localStorage e orienta integração antiga. Deve ser revisado ou marcado como histórico.
- `README.md`: ainda contém nome/URL de projeto genéricos e orienta copiar `.env.example` da raiz, mas o arquivo atual fica em `backend/`. Recomenda-se atualizar, não apagar.
- `.tmp/`: contém prévia de PDF, dados agregados, verificações de estrutura e resultado de ESLint. Artefatos locais de revisão; não são dependências do sistema. O PDF foi entregue ao usuário e não foi excluído. A pasta ainda não está no `.gitignore`.
- `dist/`, `__pycache__/` e arquivos `.pyc`: gerados e recriáveis. `node_modules/` e `.venv/` são dependências locais necessárias para executar o projeto, não código inútil. Já existem regras de exclusão no Git para essas pastas.
- `backend/static/uploads/`: pode conter imagens ligadas a registros do sistema. Não remover por falta de imports no código: esses caminhos são obtidos do banco.

## Dependências aparentemente sem uso

`axios`, `qrcode.react` e `concurrently` estão no `package.json`, mas não foram encontradas importações/usos nos fontes e scripts atuais. Candidatas a uma revisão separada de dependências; não foram removidas nem houve alteração do lockfile. A biblioteca Python `qrcode` continua usada pelo backend.

## Pontos técnicos encontrados

- Imports de CSS com caixa diferente do nome real: `Equipe.jsx` → `Equipe.css`/`equipe.css`; `Estoque.jsx` → `Estoque.css`/`estoque.css`; `Inicio.jsx` → `Inicio.css`/`inicio.css`; `Relatorio.jsx` → `Relatorio.css`/`relatorio.css`. Funcionam no Windows, mas podem falhar em ambientes com caminhos sensíveis à caixa.
- `index.html` referencia `/favicon.svg`, ausente em `public/`.
- ESLint executado no `src/`: **5 erros e 2 avisos** em `useSolicitacoesPedido.js`, `Clientes.jsx`, `Estoque.jsx`, `FormCliente.jsx` e `pedidosService.js`. Regras envolvidas: variáveis sem uso, dependências de hooks, atualização de estado em effects e imutabilidade. Resultado detalhado em `.tmp/auditoria_eslint.json`. Sem correções automáticas nesta auditoria.
- `config.py` ainda expõe `SMTP_PASSWORD`/`SMTP_FROM`, enquanto `email_service.py` lê `SMTP_PASS`/`EMAIL_REMETENTE` e `FRONT_URL`. O exemplo foi alinhado ao serviço efetivamente utilizado. A centralização dessas leituras é uma pendência separada; o código de envio não foi alterado.

## Alteração autorizada no exemplo de ambiente

`backend/.env.example` agora explica como copiar para `backend/.env`, localizar as credenciais SMTP da caixa Mailtrap, preencher usuário/senha, definir remetente e endereço do frontend e conferir as mensagens capturadas. Nenhuma credencial real foi inserida.

Mailtrap Email Sandbox captura os e-mails de teste em sua caixa, sem entrega ao destinatário real por padrão. Usar `sandbox.smtp.mailtrap.io`, porta 587 no exemplo, com STARTTLS como implementado no sistema. Referência: [integração SMTP oficial](https://docs.mailtrap.io/email-sandbox/setup/sandbox-smtp-integration).

## Verificação e limites

- Leitura de fontes, imports, rotas, scripts de inicialização, dependências, arquivos públicos e documentação relacionada. Exclusão de dependências instaladas, builds, caches e credenciais da inspeção de conteúdo.
- Busca das três imagens candidatas nas colunas `clientes.logo_url`, `pedido_itens.imagem_url` e no JSON de solicitações: zero ocorrências no banco local. Não é uma verificação de outras instalações ou de uso externo.
- Exemplo analisado com `python-dotenv`: sintaxe válida, credenciais vazias e nomes compatíveis com o envio atual.
- Testes executados: 6 de redefinição e 3 de ativação aprovados. Envio SMTP simulado; não foi enviado e-mail real ao Mailtrap.
- Auditoria de referências e organização; não substitui auditoria completa de segurança nem teste de todas as funcionalidades. Documentação de acompanhamento não alterada.

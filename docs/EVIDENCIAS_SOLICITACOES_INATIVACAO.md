# Solicitações de exclusão de estoque e inativação de clientes

Implementação solicitada em 15/11/2026. Relacionada a T09/T10/T13/T14; o fluxo de aprovação para clientes é o ajuste solicitado nesta entrega. O acompanhamento de requisitos não foi alterado.

## Comportamento

- Estoque: o botão de exclusão abre um formulário com justificativa obrigatória de 5 a 2000 caracteres.
- Clientes: os detalhes de um cliente ativo oferecem “Solicitar inativação”, com o mesmo formulário.
- O React envia a justificativa e o identificador para `POST /solicitacoes`. O Flask valida sessão, alvo ativo e ausência de solicitação pendente antes de gravar.
- A Central Administrativa identifica estoque e cliente, mostra o motivo e permite aprovar ou recusar. O registro permanece ativo até a aprovação.
- A aprovação grava `ativo=0` e a decisão na mesma transação; a recusa preserva o registro. O estoque também usa exclusão lógica para preservar pedidos existentes.
- As rotas antigas de exclusão criam solicitações; o formulário de edição preserva o status. Inativação e reativação exigem solicitação e aprovação, inclusive para administradores.

## Arquivos

- `backend/solicitacoes.py`: envio, listagem e decisão dos dois alvos.
- `backend/estoque.py`, `backend/clientes.py`: proteção das rotas existentes.
- `backend/database/schema.sql`, `backend/database/migracao_solicitacoes_clientes.sql`: vínculo opcional com cliente, FK, índice e regra de exatamente um alvo.
- `src/components/SolicitarInativacao.jsx`: formulário compartilhado para manter a mesma validação e apresentação.
- `src/pages/Estoque.jsx`, `Clientes.jsx`, `FormCliente.jsx`, `PainelAdm.jsx`: ações e apresentação.
- `backend/tests/test_solicitacoes_inativacao.py`: sete testes novos; fixtures de `test_perfil.py` e `test_controle_pecas.py` atualizadas para as colunas atuais.

## Validação executada

- `python -m unittest discover -s backend/tests -p test_solicitacoes_inativacao.py`: 21 testes aprovados (sete novos e 14 do perfil reutilizados pelo módulo). SQLite isolado, com `FOR UPDATE` adaptado.
- Cobertura: aprovação dos dois alvos, justificativa, duplicidade, recusa, perfil sem permissão, visibilidade por solicitante, rollback na falha da decisão, rotas antigas e tentativa de contornar a aprovação pela edição de cliente.
- `npx vite build`: aprovado; aviso de tamanho do bundle já existente.
- MySQL local 8.4.8: migração aplicada preservando registros. Teste HTTP para ambos os alvos confirmou envio, permanência ativa antes da decisão, bloqueio de duplicidade, proibição de decisão por colaborador, listagem administrativa e inativação após aprovação. Esse teste usou uma transação compartilhada, suprimiu commits das rotas e terminou com rollback dos registros temporários; não verifica concorrência nem persistência após commit.

## Pendências fora do escopo

- Suíte completa do backend: quatro erros em testes de pedidos (`no such column: c.logo_url` na fixture SQLite).
- Suíte completa do frontend: 43 aprovados e dois erros em `pedidos_estoque.test.mjs` (`clientes.filter is not a function` nos dados simulados).
- Validação visual no navegador com os dois perfis ainda deve ser feita. Não foram marcados requisitos como concluídos.

## Ajuste solicitado: formulário sem status e reativação

- Removidos os controles Ativo/Inativo do formulário. Novos clientes são cadastrados ativos no backend; a edição comum não escreve a coluna `ativo`, preservando inclusive clientes inativos.
- Nos detalhes de clientes inativos, “Solicitar reativação” reutiliza o formulário de justificativa. A API registra `tipo='edicao'`, `cliente_id` e `reativar=true` nos dados propostos, sem nova alteração de schema. O backend deriva a operação do tipo/alvo, sem confiar em um status fornecido pelo formulário.
- A Central Administrativa identifica a reativação. Aprovar muda `ativo=1` e conclui a solicitação na mesma transação; recusar mantém `ativo=0`. São preservados os bloqueios de duplicidade e decisão por colaboradores.
- Teste direcionado atualizado: 26 testes aprovados (12 do fluxo e 14 do perfil). Casos adicionais: cadastro ativo sem status, edição de inativo preservando status, envio/aprovação/recusa de reativação e tentativa administrativa de reativar diretamente pela edição.
- Build Vite aprovado. Os casos adicionais foram executados com SQLite isolado; a reativação não foi validada visualmente nem com commit no MySQL nesta etapa.

## Ajuste solicitado: notificações temporárias

- Relacionado à integração T13/T14: respostas administrativas deixam de exigir fechamento manual. O prazo é de seis segundos desde a primeira exibição e fica no armazenamento local do navegador; atualizar a página não reinicia esse prazo. Consultar a Central Administrativa não inicia a contagem.
- `src/services/solicitacoesService.js` calcula e persiste os prazos; `src/hooks/useSolicitacoesPedido.js` remove os avisos automaticamente e limpa seus timers ao sair da tela. O histórico de decisões no banco é preservado.
- `src/components/AvisoTopo.jsx` identifica cliente, estoque, pedido ou perfil e descreve a ação correspondente, corrigindo “Pedido #null”.
- `node --test tests/notificacoes.test.mjs`: dois testes aprovados, com relógio e armazenamento simulados, cobrindo prazo após recarregamento, expiração, fechamento manual e identificação dos alvos na renderização. Build Vite aprovado. Validação visual no navegador permanece pendente.

## Ajuste solicitado: aparência dos modais de justificativa

- `SolicitarInativacao.jsx` reutiliza cabeçalho, título, subtítulo, identificação, campo de motivo e ações do padrão existente. `solicitacoes.css` limita os ajustes ao modal, com campo em uma coluna, bordas arredondadas, foco visível, rolagem em telas pequenas e quebra das ações quando necessário.
- `Pedidos.jsx` substitui o prompt nativo de exclusão pelo mesmo modal utilizado no estoque e nos clientes. Mantém o envio pelo hook existente, o bloqueio de solicitação pendente e os erros dentro do formulário.
- Reativação de clientes também recebe o mesmo visual por compartilhar o componente. Nenhuma alteração de backend ou banco nesta etapa.
- Build Vite aprovado. Validação visual no navegador permanece pendente.

Refinamento após a referência indicada pelo usuário: o componente agora utiliza diretamente `cliente-detalhes-modal`, a identidade do cabeçalho, as seções de informações, o visual de observações e os botões do modal de detalhes de clientes. Removidos os estilos alternativos da primeira versão de `solicitacoes.css`; `cliente.css` contém apenas adaptações para formulário, textarea e rolagem. Informações e comportamento preservados. Build Vite aprovado novamente; sem validação visual no navegador.

## Ajuste solicitado: estoque inativo e reativação (T09/T10/T14)

- `Estoque.jsx`: opção Inativos no filtro, identificação na lista e nos detalhes, ação de solicitar reativação em ambos. Itens inativos não exibem edição nem aviso de saldo baixo. A troca de filtro cancela consultas anteriores para evitar resultados de outro status.
- `backend/estoque.py`: `GET /listar-estoque?status=inativos` retorna somente inativos e inclui `ativo` na resposta. Sem parâmetro, continua retornando apenas ativos, preservando os demais consumidores.
- `backend/solicitacoes.py`: reativação de estoque reutiliza `tipo='edicao'` com justificativa e alvo único. Mantém validação de status, bloqueio de duplicidade e aprovação exclusiva de administrador; decisão e ativação são atômicas. Recusa ou falha na decisão preserva a inatividade.
- `SolicitarInativacao.jsx`, `PainelAdm.jsx` e `AvisoTopo.jsx`: identificação e mensagens específicas de reativação de estoque, mantendo o visual do modal de clientes. Sem migração adicional de banco.
- Validação: 29 testes no módulo de solicitações (incluindo 14 de perfil), 15 de variações/listagem de estoque e dois de notificações aprovados; build Vite aprovado. Testes usam SQLite ou conexões simuladas. Validação visual e reativação em MySQL real não executadas nesta etapa.

## Ajuste solicitado: decisões do perfil como notificações temporárias

- `Perfil.jsx` substitui os textos permanentes de aprovação/recusa por `AvisoTopo`, com fechamento manual e expiração em seis segundos. O envio também usa o mesmo componente e duração; removida a duplicação da mensagem de pendência.
- `solicitacoesService.js` compartilha a preparação de prazos com a resposta de `/perfil`, sem chamada adicional de API. Perfil e início/pedidos usam os mesmos identificadores, prazos e registros de avisos vistos; atualizar ou retornar à página não reinicia o prazo. A pendência continua controlando o bloqueio de edição, independentemente do aviso.
- Cinco testes de notificações/perfil aprovados, incluindo prazo compartilhado com o perfil e renderização de aprovação e recusa com motivo. Build Vite aprovado; validação visual pendente.

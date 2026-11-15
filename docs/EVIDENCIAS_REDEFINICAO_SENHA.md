# T05 — Redefinição de senha

Implementação autorizada em 14/11/2026, relacionada ao requisito nº 1 de autenticação.

## Fluxo implementado

O modal de login recebe apenas o RE. O cliente de API obtém CSRF e envia a solicitação ao Flask. Para uma conta ativa e já ativada, o backend grava somente o hash de um token aleatório na tabela existente `tokens`, com validade de 24 horas, e envia o link ao e-mail cadastrado pelo SMTP existente. Não há aprovação administrativa.

A rota pública `/redefinir-senha` reutiliza o componente visual de primeiro acesso. Ao salvar, o backend verifica tipo, validade, uso e situação da conta, grava a senha em hash e inutiliza todos os tokens de redefinição da conta na mesma transação. Novo envio expira links anteriores. O login continua usando RE e senha.

## Verificação executada

- `.venv/Scripts/python.exe -m unittest discover -s backend/tests -p test_redefinicao_senha.py -v`: 6 testes passaram. Flask real, banco e SMTP simulados. Cobrem troca e login com nova senha, rejeição da senha antiga, uso único, links expirados/substituídos/desconhecidos, conta desativada ou não ativada, validação de entradas, CSRF e falha de envio com resposta genérica.
- `node node_modules/vite/bin/vite.js build`: passou; aviso de tamanho de bundle.
- ESLint em `Login.jsx`, `DefinirSenha.jsx` e `App.jsx`: passou.
- Suíte geral Python: 134 testes, 4 erros em `test_controle_pecas.py`, por `sqlite3.OperationalError: no such column: c.logo_url`, fora dos arquivos alterados.
- Suíte geral JavaScript: 45 testes, 43 passaram e 2 falharam em `pedidos_estoque.test.mjs`, por `clientes.filter is not a function`, fora dos arquivos alterados. Também houve aviso de porta HMR ocupada.

## Validação pendente

Não foi executada troca de senha em conta real, nem envio real ao Mailtrap. Confirmar o fluxo no ambiente local: abrir o modal, informar o RE de uma conta ativa e já ativada, conferir o e-mail na caixa de testes, abrir o link, confirmar a nova senha e testar o login. Depois, tentar reutilizar o link e confirmar a rejeição.

A tela de primeiro acesso existente chama rotas de ativação que não estão registradas no backend atual. Essa pendência não foi corrigida nesta tarefa; a redefinição usa rotas próprias. Contas ainda não ativadas não recebem link de redefinição.

Falhas SMTP são registradas sem destinatário ou credenciais; a resposta pública permanece genérica. Sessões já abertas em outros dispositivos seguem a limitação de revogação documentada na arquitetura.

Nenhum requisito foi marcado como concluído. Nenhuma tabela ou coluna foi criada; nenhum commit, push ou merge foi executado.

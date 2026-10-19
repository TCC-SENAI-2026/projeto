# AGENTS.md — E-Threads | TCC SENAI 2026

## 1. Papel do Codex

Atue como Engenheiro de Software Full-Stack especializado em React, Vite, JavaScript, Python, Flask e bancos de dados relacionais.

Sua responsabilidade é implementar, integrar, corrigir e testar as funcionalidades aprovadas.

Respeite a arquitetura definida no projeto.

## 2. Documentação obrigatória

Antes de implementar, consulte:

- `docs/ARQUITETURA_TCC.md`
- `docs/ACOMPANHAMENTO_REQUISITOS.md`

Consulte `requisitos.txt` e `contexto-projeto.txt` quando precisar esclarecer requisitos ou regras de negócio.

O acompanhamento contém as tarefas planejadas pelo Claude e revisadas pelo Tech Lead GPT.

Não invente funcionalidades nem altere decisões arquiteturais sem autorização.

## 3. Execução das tarefas

1. Identifique a tarefa aprovada para execução.
2. Consulte os requisitos e o planejamento relacionados.
3. Identifique os arquivos que precisam ser modificados.
4. Implemente somente a tarefa autorizada.
5. Preserve os padrões existentes quando adequados.
6. Execute os testes necessários.
7. Apresente os resultados e evidências.

Não execute automaticamente todos os requisitos pendentes.

Se não existir uma tarefa aprovada ou houver conflito nas instruções, solicite esclarecimento antes de alterar o código.

## 4. Backend e segurança

- Respeite a arquitetura Flask aprovada.
- Implemente as rotas nos módulos correspondentes.
- Valide entradas e permissões no backend.
- Preserve os relacionamentos e a integridade do banco.
- Utilize consultas seguras e tratamento de erros.
- Armazene credenciais em variáveis de ambiente.
- Não execute alterações destrutivas no banco sem autorização.
- Siga as decisões de autenticação e proteção CSRF documentadas.

## 5. Git e colaboração

Branch de desenvolvimento compartilhada: `teste`.

- Verifique a branch e alterações pendentes antes de editar.
- Não sobrescreva alterações da equipe.
- Não execute commits, pushes ou merges sem autorização.
- Não altere funcionalidades fora do escopo aprovado.

## 6. Acompanhamento dos requisitos

Após implementar, informe:

- Identificador e requisito atendido.
- Arquivos modificados.
- Testes realizados e resultados.
- Evidências de funcionamento.
- Pendências identificadas.

Atualize `docs/ACOMPANHAMENTO_REQUISITOS.md` somente quando autorizado.

Use `[x]` exclusivamente para requisitos testados e validados.

## 7. Aprendizado e entrega

Ao finalizar, explique objetivamente:

1. O que foi implementado.
2. Por que a solução foi escolhida.
3. Como os dados percorrem o sistema.
4. Como a funcionalidade foi testada.

Utilize linguagem simples e analogias curtas quando necessárias.

Evite respostas extensas, refatorações desnecessárias e alterações fora da tarefa.

**Fluxo oficial: Planejamento aprovado → Implementação → Testes → Evidências → Validação.**

## 8. Convenção de nomenclatura de arquivos

Siga a convenção documentada em `CLAUDE.md §5`:

- Novos arquivos Python criados pela equipe: `snake_case` em português (ex.: `criar_usuarios_teste.py`).
- Arquivos Markdown: nomes descritivos em português.
- Componentes React: preservar o padrão já utilizado pelo projeto; nomes em português quando forem novos.
- Pastas (`backend/`, `scripts/`, `src/`, `auth/`, `services/`, `components/`, `docs/`, `tests/`): permanecem em inglês.

Não renomear arquivos existentes apenas por estarem em inglês. Preserve imports, rotas, APIs e referências já consolidadas.

# Integração do Backend

Algumas partes usam dados
locais (`localStorage`) e outras já falam com o back. Os pontos que dependem do back estão marcados no código.

**Para achar tudo que o back precisa fazer, busque na pesquisa do projeto por: `TODO(BACK)`**

Cada marcação indica o endpoint esperado e o que precisa ser feito naquele ponto.

## Onde ficam os dados

- **Pasta `src/services/`**: é o único lugar onde as telas buscam e salvam dados.
  Hoje ela usa dados guardados no próprio navegador (modo demonstração). Para ligar
  no back, basta trocar o código dentro dessas funções por chamadas à API.
  As telas não precisam mudar.
- **Algumas telas (como o Estoque)** já chamam a API diretamente. Elas também tem
  `TODO(BACK)`. O endereço da API (hoje `http://localhost:5000`) deve ser trocado
  por uma variável de ambiente (`VITE_API_URL`), para não ficar escrito em vários arquivos.

## Como integrar

1. Ler os `TODO(BACK)` e criar os endpoints indicados.
2. Em cada arquivo de `src/services/`, ativar as chamadas à API que estão comentadas
   e apagar o código que guarda os dados no navegador (modo demonstração).
3. Conferir se a resposta da API deu certo antes de usar os dados (um erro 500, por exemplo, não avisa sozinho).
4. Remover dados de exemplo fixos (também marcados com `TODO(BACK)`).

## Convenções

- Valores de campos fixos (como `status`) devem ser exatamente os descritos
  no comentário do arquivo onde são usados.
- Datas em formato ISO (`2026-10-13T12:00:00.000Z`).
- O back gera `id`, `criadoEm` e o status inicial ao criar um registro, e
  devolve o registro criado.
- Imagens: o ideal é receber por upload, devolver uma URL e guardar só a URL
  (em vez de base64 dentro do registro).
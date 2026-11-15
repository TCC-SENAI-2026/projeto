# Melhoria do PDF de produção — T11/T14

Escopo autorizado: melhorar a apresentação do PDF com os dados disponíveis, sem seleção de período nem novas consultas de negócio.

- `src/pages/Relatorio.jsx`: mantém as consultas existentes e usa o novo gerador, com indicação de geração em andamento e tratamento de erro no download.
- `src/services/gerar_relatorio_producao.js`: documento A4 de duas páginas com logo existente, referência mensal, emissão em horário de Brasília, cards do mês, gráfico anual vetorial, situação atual separada, tabela dos 12 meses, acumulado anual, critérios de leitura e paginação. Nome do arquivo inclui ano e mês. Meses futuros usam traço; mês atual é parcial.
- Dados: endpoints administrativos → estado React → gerador jsPDF/AutoTable → download. Produção mensal e anual consideram conclusão; pedidos pendentes/em produção e estoque baixo são apresentados como situação na consulta. Nenhuma alteração no backend ou banco.
- `node --test tests/relatorio_pdf.test.mjs`: três testes aprovados, incluindo logo incorporada, número de páginas, total sem meses futuros, janeiro sem produção, dezembro, formatação brasileira e espaço das notas antes do rodapé.
- `npx vite build`: aprovado; aviso de tamanho do bundle existente.
- Prévia local gerada em `.tmp/relatorio-producao-2026-11.pdf` com dados agregados reais dos endpoints conectados ao MySQL local. Sem alterações nos registros. Inspeção visual do PDF não executada nesta etapa.
- Documento de acompanhamento não alterado; nenhum requisito marcado como validado.

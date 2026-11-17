import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const numero = valor => Number(valor || 0).toLocaleString('pt-BR');

export function gerarRelatorioProducao(dados, { logo, emitidoEm = new Date() } = {}) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const periodo = `${MESES[dados.mes - 1]} de ${dados.ano}`;
    const meses = Array.from({ length: 12 }, (_, indice) => ({
        mes: indice + 1,
        total: indice < dados.mes ? Number(dados.producao.find(item => item.mes === indice + 1)?.total || 0) : null,
    }));
    const acumulado = meses.reduce((soma, item) => soma + (item.total ?? 0), 0);
    const texto = (valor, x, y, tamanho = 10, cor = '#475569', negrito = false, opcoes = {}) => {
        doc.setFont('helvetica', negrito ? 'bold' : 'normal');
        doc.setFontSize(tamanho);
        doc.setTextColor(cor);
        doc.text(String(valor), x, y, opcoes);
    };
    function cabecalho(subtitulo) {
        doc.setFillColor('#0f172a');
        doc.rect(0, 0, 210, 3, 'F');
        if (logo) doc.addImage(logo, 'PNG', 16, 12, 12, 16);
        texto('E-THREADS', logo ? 33 : 16, 19, 13, '#0f172a', true);
        texto('GESTÃO DA PRODUÇÃO', logo ? 33 : 16, 25, 8, '#64748b');
        texto('Relatório de produção', 16, 42, 24, '#0f172a', true);
        texto(subtitulo, 16, 51, 10);
        texto(`Emissão: ${emitidoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília)`, 16, 58, 8, '#64748b');
        doc.setDrawColor('#e2e8f0');
        doc.line(16, 64, 194, 64);
    }
    function secao(titulo, y, subtitulo) {
        texto(titulo, 16, y, 13, '#0f172a', true);
        if (subtitulo) texto(subtitulo, 16, y + 7, 9, '#64748b');
    }
    function card(x, y, largura, rotulo, valor, unidade) {
        doc.setFillColor('#f8fafc');
        doc.setDrawColor('#e2e8f0');
        doc.roundedRect(x, y, largura, 31, 3, 3, 'FD');
        texto(rotulo, x + 5, y + 8, 9);
        texto(numero(valor), x + 5, y + 20, 21, '#0f172a', true);
        texto(unidade, x + 5, y + 26, 8, '#64748b');
    }

    cabecalho(`Referência: ${periodo}`);
    secao('Resultados do mês', 76, 'Peças e pedidos contabilizados pela data de conclusão.');
    card(16, 90, 87, 'Produção do mês', dados.producao_total, 'peças produzidas');
    card(107, 90, 87, 'Pedidos concluídos no mês', dados.pedidos_concluidos, 'pedidos');

    secao('Produção do ano', 136, `Janeiro a ${MESES[dados.mes - 1].toLowerCase()} de ${dados.ano} | Acumulado: ${numero(acumulado)} peças`);
    // Gráfico vetorial: legível na impressão e independente da animação da tela.
    const x = 29, y = 154, largura = 161, altura = 50;
    const maximo = Math.max(1, ...meses.map(item => item.total || 0));
    // Assim como na tela, a escala chega pelo menos a 100 e cresce se necessário.
    const teto = Math.max(100, Math.ceil(maximo / 100) * 100);
    for (let i = 0; i <= 5; i++) {
        const linha = y + altura - i * altura / 5;
        doc.setDrawColor('#e2e8f0');
        doc.line(x, linha, x + largura, linha);
        texto(numero(Math.round(teto * i / 5)), 16, linha + 1, 7, '#64748b');
    }
    meses.forEach((item, indice) => {
        const centro = x + (indice + .5) * largura / 12;
        if (item.total !== null && item.total > 0) {
            const barra = item.total / teto * altura;
            doc.setFillColor('#2563eb');
            doc.rect(centro - 4, y + altura - barra, 8, barra, 'F');
        }
        texto(item.total === null ? '-' : numero(item.total), centro, y + altura + 5, 7, '#0f172a', true, { align: 'center' });
        texto(MESES[indice].slice(0, 3), centro, y + altura + 10, 7, '#64748b', false, { align: 'center' });
    });
    texto('Mês atual parcial. Meses futuros sem apuração.', 16, 222, 8, '#64748b');

    secao('Situação atual', 237, 'Retrato na consulta, independente do mês de criação dos pedidos.');
    card(16, 250, 57, 'Pedidos pendentes', dados.pedidos_pendentes, 'pedidos');
    card(77, 250, 57, 'Em produção', dados.pedidos_em_producao, 'pedidos');
    card(138, 250, 56, 'Estoque baixo', dados.estoque_baixo, 'itens ativos');

    doc.addPage();
    cabecalho(`Detalhamento anual | ${dados.ano}`);
    secao(`Produção mensal - ${dados.ano}`, 77, 'Somente peças de pedidos concluídos e não excluídos.');
    autoTable(doc, {
        startY: 92, margin: { left: 16, right: 16, bottom: 25 },
        head: [['Mês', 'Peças produzidas', 'Apuração']],
        body: meses.map(item => [MESES[item.mes - 1], item.total === null ? '—' : numero(item.total),
            item.total === null ? 'Mês futuro' : item.mes === dados.mes ? 'Parcial' : 'Encerrada']),
        foot: [['Total acumulado do ano', numero(acumulado), `Até ${MESES[dados.mes - 1]}`]],
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 2.5, textColor: '#334155', lineColor: '#e2e8f0' },
        headStyles: { fillColor: '#0f172a', textColor: '#ffffff', fontStyle: 'bold' },
        footStyles: { fillColor: '#eff6ff', textColor: '#1e40af', fontStyle: 'bold' },
        alternateRowStyles: { fillColor: '#f8fafc' },
        columnStyles: { 1: { halign: 'right' } },
    });
    const observacoesY = doc.lastAutoTable.finalY + 12;
    texto('Critérios de leitura', 16, observacoesY, 11, '#0f172a', true);
    const observacoes = [
        'Zero indica ausência de produção concluída; traço indica mês futuro.',
        'O mês atual está em andamento. Os valores podem mudar até seu encerramento.',
        'Estoque baixo: itens ativos com saldo menor ou igual ao mínimo cadastrado.',
        'Pedidos pendentes e em produção representam a situação no momento da consulta.',
    ];
    observacoes.forEach((linha, indice) => texto(linha, 16, observacoesY + 8 + indice * 6, 8, '#64748b'));
    const paginas = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina);
        doc.setDrawColor('#e2e8f0');
        doc.line(16, 286, 194, 286);
        texto(`E-Threads | ${periodo}`, 16, 292, 8, '#64748b');
        texto(`Página ${pagina} de ${paginas}`, 171, 292, 8, '#64748b');
    }
    return { doc, nomeArquivo: `relatorio-producao-${dados.ano}-${String(dados.mes).padStart(2, '0')}.pdf` };
}

export async function carregarLogoRelatorio() {
    const resposta = await fetch('/img/logo.png');
    if (!resposta.ok) throw new Error('Não foi possível carregar a logo do relatório.');
    const bytes = await resposta.arrayBuffer();
    return new Uint8Array(bytes);
}

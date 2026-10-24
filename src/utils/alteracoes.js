import { TAMANHOS } from "./opcoesProduto";

// Rótulos amigáveis dos campos da ficha (os mesmos do modal de edição)
const ROTULOS_FICHA = {
    cliente: "Nome do cliente",
    contato: "Telefone",
    email: "E-mail",
    dataPedido: "Data do pedido",
    entrega: "Prazo de entrega",
    observacao: "Observações gerais",
};

const ROTULOS_DETALHE = {
    personalizacao: "Personalização",
    tecido: "Tecido",
    cor: "Cor",
    local: "Local da arte",
    observacao: "Observações do item",
};

function texto(valor) {
    return valor === undefined || valor === null || valor === "" ? "—" : String(valor);
}

// "2026-11-04" -> "04/11/2026" (sem new Date, que erra o dia no Brasil)
function formatarData(valor) {
    const [ano, mes, dia] = String(valor || "").slice(0, 10).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : texto(valor);
}

function qtd(grade, tamanho) {
    return Number(grade?.[tamanho]) || 0;
}

/**
 * Compara o pedido original com a versão editada e devolve a lista
 * de alterações no formato { campo, rotulo, antigo, novo }.
 *
 * original: pedido completo (como vem do service)
 * novo:     { ficha, produtos, arte }
 */
export function gerarAlteracoes(original, novo) {
    const alteracoes = [];

    // ---------- dados gerais ----------
    const fichaAntiga = original.ficha || {};
    for (const [campo, rotulo] of Object.entries(ROTULOS_FICHA)) {
        const antigo = fichaAntiga[campo] ?? "";
        const atual = novo.ficha?.[campo] ?? "";
        if (antigo !== atual) {
            const ehData = campo === "dataPedido" || campo === "entrega";
            alteracoes.push({
                campo,
                rotulo,
                antigo: ehData ? formatarData(antigo) : texto(antigo),
                novo: ehData ? formatarData(atual) : texto(atual),
            });
        }
    }

    // ---------- produtos ----------
    const antigos = original.pedido?.produtos || [];
    const novos = novo.produtos || [];

    for (const p of novos) {
        const base = antigos.find((a) => a.item === p.item);

        if (!base) {
            alteracoes.push({
                campo: `produto:${p.item}`,
                rotulo: `Produto: ${p.item}`,
                antigo: "—",
                novo: "Produto adicionado",
            });
            continue;
        }

        for (const [campo, rotulo] of Object.entries(ROTULOS_DETALHE)) {
            const antigo = base.detalhes?.[campo] ?? "";
            const atual = p.detalhes?.[campo] ?? "";
            if (antigo !== atual) {
                alteracoes.push({
                    campo: `produto:${p.item}:${campo}`,
                    rotulo: `${p.item} · ${rotulo}`,
                    antigo: texto(antigo),
                    novo: texto(atual),
                });
            }
        }

        for (const tam of TAMANHOS) {
            const antigo = qtd(base.grade, tam);
            const atual = qtd(p.grade, tam);
            if (antigo !== atual) {
                alteracoes.push({
                    campo: `produto:${p.item}:grade:${tam}`,
                    rotulo: `${p.item} · Quantidade ${tam}`,
                    antigo: String(antigo),
                    novo: String(atual),
                });
            }
        }
    }

    for (const a of antigos) {
        if (!novos.some((p) => p.item === a.item)) {
            alteracoes.push({
                campo: `produto:${a.item}`,
                rotulo: `Produto: ${a.item}`,
                antigo: "Presente no pedido",
                novo: "Produto removido",
            });
        }
    }

    // ---------- arte por produto ----------
    for (const p of novos) {
        if (p.detalhes?.arteNova) {
            const base = antigos.find((a) => a.item === p.item);
            alteracoes.push({
                campo: `produto:${p.item}:arte`,
                rotulo: `${p.item} · Arte do cliente`,
                antigo: base?.detalhes?.imagem_url ? "Arte atual" : "Sem arte",
                novo: "Nova arte enviada",
            });
        }
    }

    return alteracoes;
}
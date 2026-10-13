/* ======================================================================
   SOLICITAÇÕES DE ALTERAÇÃO DE PEDIDO

   O funcionário NÃO salva direto: ele envia uma solicitação, e o
   administrador aprova ou recusa no Painel Adm.

   Hoje as solicitações ficam no navegador (só para demonstração).
   Quando o back estiver pronto, é só trocar o código dentro de cada
   função por uma chamada à API. As telas continuam iguais.

   Para ver o que falta, busque no projeto: TODO(BACK)
   ====================================================================== */

import { atualizarPedido, excluirPedido } from "./pedidosService";

// TODO(BACK): usar o mesmo endereço da API do pedidosService
// const API = import.meta.env.VITE_API_URL;

const CHAVE = "solicitacoes";

// ----- Só para demonstração: apagar quando o back estiver pronto -----
function ler() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE) || "[]");
    } catch {
        return [];
    }
}

function gravar(lista) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(lista));
    } catch (erro) {
        if (erro.name === "QuotaExceededError") {
            throw new Error(
                "O armazenamento está cheio. Não foi possível registrar a solicitação."
            );
        }
        throw erro;
    }
}

// TODO(BACK): GET /api/solicitacoes  (lista para o Painel Adm e para os avisos)
export async function listarSolicitacoes() {
    // return (await fetch(`${API}/solicitacoes`)).json();
    return ler();
}

// TODO(BACK): POST /api/solicitacoes  (funcionário pede aprovação)
// O back deve criar: id, status inicial ("pendente"), criadoEm, e pegar o
// solicitante a partir do login (token). Deve recusar (HTTP 409) se já
// existir solicitação pendente para o mesmo pedido.
//
// Corpo enviado:
//   pedidoId       id do pedido
//   alteracoes     [{ campo, rotulo, antigo, novo }]  (para o adm ver antes → depois)
//   pedidoNovo     { ficha, pedido }  (como o pedido ficará se for aprovado)
//   tipo           "edicao" (padrão) ou "exclusao"
//   resumo         texto curto para identificar o pedido no Painel Adm
//   justificativa  motivo da exclusão, escrito pelo funcionário (obrigatório em "exclusao")
// Em "exclusao" não há alteracoes nem pedidoNovo. Ao APROVAR, o back apaga o pedido.
//
// TODO(BACK): pedidoNovo pode carregar a arte em base64. Trocar por URL do upload.
export async function criarSolicitacao({
    tipo = "edicao", // "edicao" | "exclusao"
    pedidoId,
    solicitante,
    alteracoes = [],
    pedidoNovo = null,
    resumo = "", // texto curto para o adm identificar o pedido (ex.: nome do cliente)
    justificativa = "", // motivo informado pelo funcionário (só exclusão)
}) {
    // const res = await fetch(`${API}/solicitacoes`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ tipo, pedidoId, resumo, justificativa, alteracoes, pedidoNovo }),
    // });
    // if (!res.ok) throw new Error("Não foi possível enviar a solicitação.");
    // return res.json();

    if (tipo === "exclusao" && justificativa.trim().length < 5) {
        throw new Error("Explique o motivo da exclusão com um pouco mais de detalhe.");
    }

    const lista = ler();

    const jaPendente = lista.some(
        (s) => String(s.pedidoId) === String(pedidoId) && s.status === "pendente"
    );
    if (jaPendente) {
        throw new Error("Já existe uma solicitação pendente para este pedido.");
    }

    const nova = {
        id: Date.now(),
        tipo,
        pedidoId,
        resumo,
        justificativa: justificativa.trim(),
        solicitante: solicitante || "Funcionário",
        status: "pendente", // "pendente" | "aprovada" | "recusada"
        motivo: "",
        visto: false, // vira true quando o funcionário fecha o banner do resultado
        criadoEm: new Date().toISOString(),
        decididoEm: null,
        alteracoes,
        pedidoNovo,
    };

    gravar([nova, ...lista]);
    return nova;
}

// TODO(BACK): PATCH /api/solicitacoes/:id  body: { decisao: "aprovada" | "recusada", motivo }
// Ao APROVAR, o back deve aplicar pedidoNovo no pedido (na mesma transação).
// Ao RECUSAR, o pedido continua como estava e o motivo (opcional) é guardado.
export async function decidirSolicitacao(id, decisao, motivo = "") {
    // const res = await fetch(`${API}/solicitacoes/${id}`, {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ decisao, motivo }),
    // });
    // if (!res.ok) throw new Error("Não foi possível registrar a decisão.");
    // return res.json();

    const lista = ler();
    const i = lista.findIndex((s) => String(s.id) === String(id));
    if (i === -1) throw new Error("Solicitação não encontrada.");
    if (lista[i].status !== "pendente") {
        throw new Error("Esta solicitação já foi respondida.");
    }

    // Aplica primeiro: se falhar, a solicitação continua pendente.
    if (decisao === "aprovada") {
        if (lista[i].tipo === "exclusao") {
            await excluirPedido(lista[i].pedidoId);
        } else {
            await atualizarPedido(lista[i].pedidoId, lista[i].pedidoNovo);
        }
    }

    lista[i] = {
        ...lista[i],
        status: decisao,
        motivo: decisao === "recusada" ? motivo.trim() : "",
        decididoEm: new Date().toISOString(),
    };

    gravar(lista);
    return lista[i];
}

// TODO(BACK): PATCH /api/solicitacoes/:id/visto  (funcionário fechou o banner do resultado)
export async function marcarComoVista(id) {
    // await fetch(`${API}/solicitacoes/${id}/visto`, { method: "PATCH" });

    const lista = ler();
    const i = lista.findIndex((s) => String(s.id) === String(id));
    if (i === -1) return;
    lista[i] = { ...lista[i], visto: true };
    gravar(lista);
}
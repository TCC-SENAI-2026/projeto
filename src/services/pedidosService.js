/* ======================================================================
   PEDIDOS: ONDE O SISTEMA BUSCA E SALVA OS DADOS

   Hoje os pedidos ficam guardados no navegador (só para demonstração).
   Quando o back estiver pronto, é só trocar o código dentro de cada
   função abaixo por uma chamada à API. As telas continuam iguais.

   Para ver o que falta, busque no projeto: TODO(BACK)
   ====================================================================== */

// TODO(BACK): colocar aqui o endereço da API (ex.: VITE_API_URL no .env)
// const API = import.meta.env.VITE_API_URL;

const CHAVE = "pedidos";

// ----- Só para demonstração: apagar quando o back estiver pronto -----
function ler() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE) || "[]");
    } catch {
        return [];
    }
}

// Os status do banco têm outros nomes. A tradução fica só aqui, então as telas
// continuam usando "pendente", "producao" e "finalizado".
const STATUS_PARA_API = {
    pendente: "pendente",
    producao: "em_producao",
    finalizado: "concluido",
};

const STATUS_PARA_FRONT = Object.fromEntries(
    Object.entries(STATUS_PARA_API).map(([front, api]) => [api, front])
);

const statusParaApi = (s) => STATUS_PARA_API[s] ?? s;
const statusParaFront = (s) => STATUS_PARA_FRONT[s] ?? s;

// Converte um pedido que veio da API para o formato que as telas esperam
function doApi(p) {
    return {
        ...p,
        status: statusParaFront(p.status),
        finalizadoEm: p.data_conclusao ?? null, // coluna que já existe no banco
    };
}


function gravar(lista) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(lista));
        return true;
    } catch (erro) {
        if (erro.name === "QuotaExceededError") {
            console.error(
                "Não foi possível salvar os pedidos: armazenamento local cheio."
            );
            throw new Error(
                "O armazenamento dos pedidos está cheio. Nenhum dado existente foi removido."
            );
        }

        throw erro;
    }
}

// TODO(BACK): GET /api/pedidos  (lista de pedidos)

export async function listarPedidos() {
    // return (await fetch(`${API}/pedidos`)).json();
    return ler();
}


// TODO(BACK): GET /api/pedidos/:id  (um pedido completo)
export async function buscarPedido(id) {
    // return (await fetch(`${API}/pedidos/${id}`)).json();
    return ler().find((p) => String(p.id) === String(id)) ?? null;
}

// TODO(BACK): POST /api/pedidos  (criar pedido)
// O back deve criar o id, o status inicial ("pendente") e a data de criação.
export async function salvarPedido({ pedido, ficha }) {
    // const res = await fetch(`${API}/pedidos`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ pedido, ficha }),
    // });
    // return res.json();

    const novo = {
        id: Date.now(),
        status: "pendente",
        criadoEm: new Date().toISOString(),
        pedido,
        ficha,
    };

    const pedidosExistentes = ler();
    const pedidosAtualizados = [novo, ...pedidosExistentes];

    // ATENÇÃO (só demonstração): o localStorage guarda no máximo 5 pedidos.
    // Pedidos mais antigos são descartados. APAGAR este laço quando o back estiver pronto.
    // Tenta salvar começando pelos 5 pedidos mais recentes.
    for (let quantidade = Math.min(5, pedidosAtualizados.length); quantidade >= 1; quantidade--) {
        try {
            gravar(pedidosAtualizados.slice(0, quantidade));
            return novo;
        } catch (erro) {
            if (
                erro.name !== "QuotaExceededError" &&
                !String(erro.message).includes("armazenamento local cheio")
            ) {
                throw erro;
            }
        }
    }

    throw new Error(
        "Não foi possível salvar nem um pedido. O armazenamento local está cheio."
    );
}

// TODO(BACK): DELETE /api/pedidos/:id  (apagar pedido)
export async function excluirPedido(id) {
    // await fetch(`${API}/pedidos/${id}`, { method: "DELETE" });
    gravar(ler().filter((p) => String(p.id) !== String(id)));
}

// TODO(BACK): PUT /api/pedidos/:id  (editar pedido)
export async function atualizarPedido(id, dados) {
    // const res = await fetch(`${API}/pedidos/${id}`, {
    //     method: "PUT",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(dados),
    // });
    // return res.json();

    const lista = ler();
    const i = lista.findIndex((p) => String(p.id) === String(id));
    if (i === -1) throw new Error("Pedido não encontrado.");

    // id e criadoEm nunca mudam numa edição
    lista[i] = { ...lista[i], ...dados, id: lista[i].id, criadoEm: lista[i].criadoEm };

    gravar(lista); // lança erro se o localStorage estiver cheio
    return lista[i];
}

// Só estas mudanças são permitidas: pendente → producao → finalizado
const TRANSICOES = {
    pendente: ["producao"],
    producao: ["finalizado"],
};

// TODO(BACK): PATCH /api/pedidos/:id  body: { status }
// O back deve validar a transição e, ao finalizar, preencher data_conclusao.
// Atenção: no banco os status são em_producao e concluido (no front: producao e finalizado).
export async function atualizarStatus(id, novoStatus) {
    // const res = await fetch(`${API}/pedidos/${id}`, {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ status: novoStatus }),
    // });
    // if (!res.ok) throw new Error("Não foi possível atualizar o pedido.");
    // return res.json();

    const lista = ler();
    const i = lista.findIndex((p) => String(p.id) === String(id));
    if (i === -1) throw new Error("Pedido não encontrado.");

    if (!TRANSICOES[lista[i].status]?.includes(novoStatus)) {
        throw new Error("Esta mudança de status não é permitida.");
    }

    const agora = new Date().toISOString();
    lista[i] = {
        ...lista[i],
        status: novoStatus,
        ...(novoStatus === "producao" && { iniciadoEm: agora }),
        ...(novoStatus === "finalizado" && { finalizadoEm: agora }),
    };

    gravar(lista); // lança erro se o localStorage estiver cheio
    return lista[i];
}
/* ----------------------------------------------------------------------
   COMO É UM PEDIDO (para consulta)

   {  
      id, status, criadoEm, iniciadoEm, finalizadoEm,
     ficha:  { cliente, contato, email, dataPedido, entrega,
               prioridade, local, personalizacao, observacao, referencia },
     pedido: { arte, produtos: [ ... ] }
   }

   status: "pendente", "producao" ou "finalizado" (no banco: pendente, em_producao, concluido)
   criadoEm: data no formato 2026-10-13T12:00:00.000Z
   iniciadoEm: só existe no modo demonstração (o banco não guarda o início)
   finalizadoEm: no banco vem de data_conclusao
   ---------------------------------------------------------------------- */
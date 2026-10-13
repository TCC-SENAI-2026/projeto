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

// TODO(BACK): PATCH /api/pedidos/:id  -> mudar só o status (ainda não existe no front)
/* ----------------------------------------------------------------------
   COMO É UM PEDIDO (para consulta)

   {  
     id, status, criadoEm,
     ficha:  { cliente, contato, email, dataPedido, entrega,
               prioridade, local, personalizacao, observacao, referencia },
     pedido: { arte, produtos: [ ... ] }
   }

   status: "pendente", "producao" ou "finalizado" (minúsculas, sem acento)
   criadoEm: data no formato 2026-10-13T12:00:00.000Z
   ---------------------------------------------------------------------- */
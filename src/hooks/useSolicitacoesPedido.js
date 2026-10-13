import { useState, useEffect, useCallback, useRef } from "react";
import {
    listarSolicitacoes,
    criarSolicitacao,
    marcarComoVista,
} from "../services/solicitacoesService";

const TEMPO_MENSAGEM = 4000; // a mensagem de envio some sozinha em 4 segundos

/**
 * Junta tudo que a tela de pedidos precisa para o fluxo de aprovação:
 *  - temPendente(pedidoId): para bloquear o botão Editar
 *  - solicitar(dados): envia a solicitação e mostra a mensagem no topo
 *  - resultados / fecharResultado: avisos de aprovada/recusada
 */
function useSolicitacoesPedido() {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const timer = useRef(null);

    const recarregar = useCallback(async () => {
        setSolicitacoes(await listarSolicitacoes());
    }, []);

    useEffect(() => {
        recarregar();
        return () => clearTimeout(timer.current);
    }, [recarregar]);

    const temPendente = useCallback(
        (pedidoId) =>
            solicitacoes.some(
                (s) => String(s.pedidoId) === String(pedidoId) && s.status === "pendente"
            ),
        [solicitacoes]
    );

    // Respostas do adm que o funcionário ainda não fechou
    const resultados = solicitacoes.filter((s) => s.status !== "pendente" && !s.visto);

    async function solicitar(dados) {
        // Se der erro, a exceção sobe para o modal, que continua aberto
        await criarSolicitacao(dados);
        await recarregar();

        setMensagem("Solicitação enviada para o adm.");
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setMensagem(""), TEMPO_MENSAGEM);
    }

    async function fecharResultado(id) {
        await marcarComoVista(id);
        await recarregar();
    }

    return { mensagem, resultados, temPendente, solicitar, fecharResultado };
}

export default useSolicitacoesPedido;
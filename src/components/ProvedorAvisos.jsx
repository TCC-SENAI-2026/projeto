import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContextoAvisos } from '../contexts/ContextoAvisos';
import Modal from './Modal';
import { criarFilaAvisos } from '../utils/fila_avisos';
import '../styles/cliente.css';

export default function ProvedorAvisos({ children }) {
    const [atual, setAtual] = useState(null);
    const [fila] = useState(() => criarFilaAvisos(setAtual));
    const botao = useRef(null);
    const abrir = useCallback((mensagem, confirmacao = false) => fila.abrir(mensagem, confirmacao), [fila]);
    const fechar = useCallback((confirmado = false) => fila.fechar(confirmado), [fila]);

    const contexto = useMemo(() => ({
        avisar: mensagem => abrir(mensagem),
        confirmar: mensagem => abrir(mensagem, true),
    }), [abrir]);

    useEffect(() => {
        if (!atual) return;
        const anterior = document.activeElement;
        botao.current?.focus();
        function teclado(evento) {
            if (evento.key === 'Tab') {
                const botoes = botao.current?.closest('[role="dialog"]')?.querySelectorAll('button');
                if (botoes?.length) {
                    const primeiro = botoes[0];
                    const ultimo = botoes[botoes.length - 1];
                    if (evento.shiftKey && document.activeElement === primeiro) {
                        evento.preventDefault();
                        ultimo.focus();
                    } else if (!evento.shiftKey && document.activeElement === ultimo) {
                        evento.preventDefault();
                        primeiro.focus();
                    }
                }
            }
            if (evento.key === 'Escape') {
                evento.preventDefault();
                fechar();
            }
        }
        document.addEventListener('keydown', teclado);
        return () => {
            document.removeEventListener('keydown', teclado);
            anterior?.focus();
        };
    }, [atual, fechar]);

    return <ContextoAvisos.Provider value={contexto}>
        {children}
        <Modal aberto={Boolean(atual)} onClose={() => fechar()}
            className="cliente-detalhes-modal" tituloId="aviso-sistema-titulo">
            <div className="modal-header cliente-modal-header">
                <div className="cliente-modal-identidade">
                    <div className="cliente-modal-logo" aria-hidden="true">
                        <span className="material-icons">{atual?.confirmacao ? 'help_outline' : 'info_outline'}</span>
                    </div>
                    <h2 className="modal-title" id="aviso-sistema-titulo">
                        {atual?.confirmacao ? 'Confirmar ação' : 'Aviso do sistema'}
                    </h2>
                </div>
            </div>
            <div className="modal-body cliente-detalhes-body">
                <div className="cliente-info-section">
                    <p className="cliente-observacoes" style={{ whiteSpace: 'pre-line' }}>{atual?.mensagem}</p>
                </div>
            </div>
            <div className="modal-actions">
                {atual?.confirmacao && <button type="button" className="btn-sec cliente-acao-editar"
                    onClick={() => fechar()}>Cancelar</button>}
                <button ref={botao} type="button" className="btn btn-add cliente-acao-novo"
                    onClick={() => fechar(true)}>{atual?.confirmacao ? 'Confirmar' : 'Entendi'}</button>
            </div>
        </Modal>
    </ContextoAvisos.Provider>;
}

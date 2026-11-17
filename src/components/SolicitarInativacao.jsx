import { useAuth } from '../auth/useAuth';
import { useState } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import '../styles/solicitacoes.css';
import '../styles/cliente.css';

export default function SolicitarInativacao({ alvo, id, nome, reativar = false, onClose, onEnviar, onConcluido }) {
    const { colaborador } = useAuth();
    const administrador = colaborador?.nivel_acesso === 'administrador';
    const [justificativa, setJustificativa] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [enviada, setEnviada] = useState(false);
    const cliente = alvo === 'cliente';
    const tituloSolicitacao = cliente ? (reativar ? 'Solicitar reativação do cliente' : 'Solicitar inativação do cliente')
        : alvo === 'pedido' ? 'Solicitar exclusão do pedido' : reativar ? 'Solicitar reativação do estoque' : 'Solicitar exclusão do estoque';
    const titulo = administrador ? tituloSolicitacao.replace('Solicitar ', '').replace(/^./, letra => letra.toUpperCase()) : tituloSolicitacao;
    async function enviar(evento) {
        evento.preventDefault();
        if (enviando) return;
        setEnviando(true);
        setErro('');
        try {
            const dados = {
                tipo: reativar && alvo !== 'pedido' ? 'edicao' : 'exclusao',
                [cliente ? 'cliente_id' : alvo === 'pedido' ? 'pedido_id' : 'estoque_id']: id,
                resumo: nome,
                justificativa: justificativa.trim(),
            };
            if (onEnviar && !administrador) await onEnviar(justificativa.trim());
            else await api.post('/solicitacoes', dados);
            if (administrador) await onConcluido?.();
            setEnviada(true);
        } catch (erro) {
            setErro(erro.message);
        } finally {
            setEnviando(false);
        }
    }
    return <Modal aberto className="cliente-detalhes-modal solicitacao-justificativa-modal" onClose={() => !enviando && onClose()} tituloId="titulo-inativacao">
        <form onSubmit={enviar}>
            <div className="modal-header cliente-modal-header">
                <div className="cliente-modal-identidade">
                <div className="cliente-modal-logo" aria-hidden="true"><span className="material-icons">{enviada ? 'check_circle' : cliente ? 'business' : alvo === 'pedido' ? 'receipt_long' : 'inventory_2'}</span></div>
                <div>
                    <h2 className="modal-title" id="titulo-inativacao">{titulo}</h2>
                    <p className="modal-subtitle">{administrador ? 'A ação será aplicada imediatamente após a confirmação.' : 'A solicitação será analisada pelo administrador.'}</p>
                </div>
                </div>
            </div>
            <div className="modal-body cliente-detalhes-body">
                <div className="cliente-info-section"><div className="modal-info"><span className="modal-label">{cliente ? 'Cliente' : alvo === 'pedido' ? 'Pedido' : 'Item do estoque'}</span><p className="modal-value">{nome}</p></div></div>
                {enviada ? <div className="cliente-info-section"><p className="cliente-observacoes" role="status">{administrador ? 'Ação realizada com sucesso.' : `Solicitação enviada aos administradores. O registro permanece ${reativar ? 'inativo' : 'ativo'} até a aprovação.`}</p></div> : administrador ? <div className="cliente-info-section"><p>Confirma esta ação?</p>{erro && <p className="erro-acao" role="alert">{erro}</p>}</div> : <div className="cliente-info-section">
                    <div className="modal-info">
                    <label className="modal-label" htmlFor="justificativa-inativacao">Justificativa</label>
                    <textarea className="cliente-observacoes" id="justificativa-inativacao" required minLength={5} maxLength={2000} rows={4}
                        placeholder="Explique por que deseja realizar esta ação…"
                        aria-describedby="ajuda-justificativa"
                        value={justificativa} onChange={e => setJustificativa(e.target.value)} disabled={enviando} />
                    <p className="modal-subtitle" id="ajuda-justificativa">Informe de 5 a 2000 caracteres.</p>
                    {erro && <p className="erro-acao" role="alert">{erro}</p>}
                    </div>
                </div>}
            </div>
            <div className="modal-actions">
                <button type="button" className="btn-sec cliente-acao-editar" disabled={enviando} onClick={onClose}>{enviada ? 'Fechar' : 'Cancelar'}</button>
                {!enviada && <button type="submit" className="btn btn-add cliente-acao-novo" disabled={enviando || (!administrador && justificativa.trim().length < 5)}>{enviando ? 'Processando...' : administrador ? 'Confirmar' : 'Enviar solicitação'}</button>}
            </div>
        </form>
    </Modal>;
}

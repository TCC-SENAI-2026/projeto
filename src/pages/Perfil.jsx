import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import FotoCaptura from '../components/FotoCaptura';
import FotoColaborador from '../components/FotoColaborador';
import { buscarPerfil, salvarPerfil } from '../services/perfilService';
import '../styles/padrao.css';
import '../styles/formulario.css';

const EDITAVEIS = [
    ['nome', 'Nome', 'text'], ['email', 'E-mail', 'email'],
    ['telefone', 'Telefone', 'tel'], ['endereco', 'Endereço', 'text'],
];

function Perfil() {
    const [perfil, setPerfil] = useState(null);
    const [solicitacao, setSolicitacao] = useState(null);
    const [form, setForm] = useState({});
    const [editando, setEditando] = useState(false);
    const [foto, setFoto] = useState(null);
    const [removerFoto, setRemoverFoto] = useState(false);
    const [fotoOcupada, setFotoOcupada] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');

    const carregar = useCallback(async () => {
        setErro('');
        setCarregando(true);
        try {
            const resposta = await buscarPerfil();
            setPerfil(resposta.data);
            setForm(resposta.data);
            setSolicitacao(resposta.solicitacao);
        } catch (error) { setErro(error.message); }
        finally { setCarregando(false); }
    }, []);
    useEffect(() => { carregar(); }, [carregar]);
    useEffect(() => {
        const atualizar = () => { if (!editando && !salvando) carregar(); };
        window.addEventListener('focus', atualizar);
        return () => window.removeEventListener('focus', atualizar);
    }, [carregar, editando, salvando]);

    const pendente = solicitacao?.status === 'pendente';
    const admin = perfil?.nivel_acesso === 'administrador';
    function cancelar() {
        setForm(perfil);
        setFoto(null);
        setRemoverFoto(false);
        setFotoOcupada(false);
        setEditando(false);
        setErro('');
    }
    async function salvar(event) {
        event.preventDefault();
        if (salvando || fotoOcupada || pendente || !editando) return;
        setSalvando(true);
        setErro('');
        try {
            const resposta = await salvarPerfil(form, foto, removerFoto);
            setMensagem(resposta.msg);
            setEditando(false);
            setFoto(null);
            setRemoverFoto(false);
            await carregar();
        } catch (error) { setErro(error.message); }
        finally { setSalvando(false); }
    }

    const bloqueados = perfil ? [
        ['RE', perfil.re], ['Nível de acesso', admin ? 'Administrador' : 'Colaborador'],
        ['Salário', perfil.salario == null ? '—' : Number(perfil.salario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
        ['Data de contrato', perfil.data_contrato], ['Status', perfil.ativo ? 'Ativo' : 'Inativo'], ['CPF', perfil.cpf],
    ] : [];

    return (
        <>
            <Sidebar />
            <div className="container"><main className="form-page-card">
                <div className="form-header">
                    <span className="form-badge"><span className="material-icons">person</span>Meu perfil</span>
                    <h1 className="form-title">Perfil</h1>
                    <p className="form-subtitle">Confira seus dados e acompanhe suas alterações.</p>
                </div>
                {erro && <p role="alert">{erro}</p>}
                {mensagem && <p role="status">{mensagem}</p>}
                {carregando ? <p role="status">Carregando perfil...</p> : perfil ? (
                    <form onSubmit={salvar} autoComplete="off">
                        {pendente && <p role="status">Alteração aguardando aprovação</p>}
                        {solicitacao?.status === 'aprovada' && <p role="status">Sua alteração de perfil foi aprovada.</p>}
                        {solicitacao?.status === 'recusada' && <p role="status">Sua alteração de perfil foi recusada. {solicitacao.motivo}</p>}
                        <section className="form-section">
                            <h2>Foto</h2>
                            {editando ? <FotoCaptura nome={form.nome} arquivo={foto}
                                fotoAtual={perfil.tem_foto && !removerFoto ? `/api/colaboradores/${perfil.id}/foto` : ''}
                                onChange={arquivo => { setFoto(arquivo); setRemoverFoto(arquivo === null); }}
                                onOcupado={setFotoOcupada} disabled={salvando} /> :
                                <FotoColaborador id={perfil.id} nome={perfil.nome} temFoto={!!perfil.tem_foto} />}
                        </section>
                        <section className="form-section">
                            <h2>Dados pessoais</h2>
                            <p className="section-help">{admin ? 'Suas alterações serão aplicadas diretamente.' : 'Suas alterações serão enviadas ao administrador para aprovação.'}</p>
                            <div className="form-grid">
                                {EDITAVEIS.map(([campo, rotulo, tipo]) => (
                                    <div className="form-field" key={campo}>
                                        <label htmlFor={`perfil-${campo}`}>{rotulo}</label>
                                        <input id={`perfil-${campo}`} type={tipo} value={form[campo] ?? ''}
                                            required={campo === 'nome' || campo === 'email'}
                                            maxLength={{ nome: 150, email: 254, telefone: 20, endereco: 255 }[campo]}
                                            readOnly={!editando} disabled={salvando}
                                            onChange={event => setForm(prev => ({ ...prev, [campo]: event.target.value }))} />
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="form-section">
                            <h2>Dados profissionais e identificação</h2>
                            <div className="form-grid">
                                {bloqueados.map(([rotulo, valor]) => <div className="form-field" key={rotulo}>
                                    <label>{rotulo}<input value={valor ?? '—'} readOnly /></label>
                                </div>)}
                            </div>
                        </section>
                        <div className="form-actions">
                            {editando ? <>
                                <button type="button" className="btn-page-sec" disabled={salvando} onClick={cancelar}>Cancelar</button>
                                <button type="submit" className="btn btn-add" disabled={salvando || fotoOcupada}>Salvar alterações</button>
                            </> : <>
                                <button type="button" className="btn-page-sec" onClick={carregar}>Atualizar</button>
                                <button type="button" className="btn btn-add" disabled={pendente}
                                    onClick={() => { setMensagem(''); setEditando(true); }}>Editar perfil</button>
                            </>}
                        </div>
                    </form>
                ) : <button type="button" className="btn-page-sec" onClick={carregar}>Tentar novamente</button>}
            </main></div>
        </>
    );
}

export default Perfil;

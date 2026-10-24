import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/Novopedido.css";

// Aplica máscara de telefone brasileiro conforme o usuário digita
function mascaraTelefone(valor) {
    const nums = valor.replace(/\D/g, '').slice(0, 11);
    if (nums.length === 0) return '';
    if (nums.length <= 2)  return `(${nums}`;
    if (nums.length <= 6)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
}

function validarTelefone(valor) {
    const nums = valor.replace(/\D/g, '');
    return nums.length >= 10 && nums.length <= 11;
}

function NovoPedido() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nomeCliente:       '',
        contato:           '',
        email:             '',
        dataPedido:        '',
        prazoEntrega:      '',
        obsPersonalizacao: '',
        obsGeral:          '',
    });

    const [erroTelefone, setErroTelefone] = useState('');

    function handleChange(e) {
        const { name, value } = e.target;

        if (name === 'contato') {
            const mascarado = mascaraTelefone(value);
            setForm(prev => ({ ...prev, contato: mascarado }));
            setErroTelefone('');
            return;
        }

        setForm(prev => ({ ...prev, [name]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        if (!form.nomeCliente.trim()) {
            alert('Digite o nome do cliente.');
            return;
        }
        if (form.contato && !validarTelefone(form.contato)) {
            setErroTelefone('Telefone inválido. Use o formato (11) 99999-9999.');
            return;
        }
        if (form.prazoEntrega && form.dataPedido && form.prazoEntrega < form.dataPedido) {
            alert('O prazo de entrega não pode ser anterior à data do pedido.');
            return;
        }

        localStorage.setItem('dadosFicha', JSON.stringify({
            cliente:        form.nomeCliente.trim(),
            dataPedido:     form.dataPedido,
            contato:        form.contato,
            email:          form.email,
            entrega:        form.prazoEntrega,
            personalizacao: form.obsPersonalizacao,
            observacao:     form.obsGeral,
            dataCriacao:    new Date().toLocaleDateString('pt-BR'),
        }));

        navigate('/pedidos/novo/produtos');
    }

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="form-page-card">
                    <form onSubmit={handleSubmit} autoComplete="off">

                        {/* HEADER */}
                        <div className="form-header">
                            <span className="form-badge">
                                <span className="material-icons">note_add</span>
                                Novo Pedido
                            </span>
                            <h1 className="form-title">Criar Pedido</h1>
                            <p className="form-subtitle">
                                Preencha os dados do cliente e as informações do pedido.
                            </p>
                        </div>

                        {/* STEPPER */}
                        <div className="pedido-stepper">
                            <div className="pedido-step active">
                                <div className="step-circle">1</div>
                                <span>Identificação</span>
                            </div>
                            <div className="pedido-step-line" />
                            <div className="pedido-step">
                                <div className="step-circle">2</div>
                                <span>Produtos</span>
                            </div>
                            <div className="pedido-step-line" />
                            <div className="pedido-step">
                                <div className="step-circle">3</div>
                                <span>Finalização</span>
                            </div>
                        </div>

                        {/* DADOS DO CLIENTE */}
                        <section className="form-section">
                            <h2>Dados do Cliente</h2>
                            <p className="section-help">Informe os dados do cliente para este pedido.</p>

                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="nomeCliente">Nome do Cliente</label>
                                    <input
                                        id="nomeCliente"
                                        name="nomeCliente"
                                        type="text"
                                        placeholder="Digite o nome do cliente"
                                        value={form.nomeCliente}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="contato">Telefone</label>
                                    <input
                                        id="contato"
                                        name="contato"
                                        placeholder="(11) 99999-9999"
                                        value={form.contato}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                    />
                                    {erroTelefone && (
                                        <span style={{ color: '#991b1b', fontSize: 12, marginTop: 4, display: 'block' }}>
                                            {erroTelefone}
                                        </span>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label htmlFor="email">E-mail</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="contato@empresa.com"
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                </div>

                            </div>
                        </section>

                        {/* LOGÍSTICA */}
                        <section className="form-section">
                            <h2>Detalhes Logísticos</h2>
                            <p className="section-help">Datas de início e entrega do pedido.</p>

                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="dataPedido">Data do Pedido</label>
                                    <input
                                        id="dataPedido"
                                        name="dataPedido"
                                        type="date"
                                        value={form.dataPedido}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="prazoEntrega">Prazo de Entrega</label>
                                    <input
                                        id="prazoEntrega"
                                        name="prazoEntrega"
                                        type="date"
                                        value={form.prazoEntrega}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                            </div>
                        </section>

                        {/* OBSERVAÇÕES */}
                        <section className="form-section">
                            <h2>Observações</h2>
                            <p className="section-help">Detalhes adicionais de personalização e do pedido.</p>

                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="obsPersonalizacao">Observação da Personalização</label>
                                    <input
                                        id="obsPersonalizacao"
                                        name="obsPersonalizacao"
                                        placeholder="Opcional"
                                        value={form.obsPersonalizacao}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="obsGeral">Observações Gerais</label>
                                    <textarea
                                        id="obsGeral"
                                        name="obsGeral"
                                        placeholder="Detalhes adicionais do pedido..."
                                        value={form.obsGeral}
                                        onChange={handleChange}
                                    />
                                </div>

                            </div>
                        </section>

                        <div className="form-actions">
                            <button type="button" className="btn-page-sec" onClick={() => navigate('/pedidos')}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-add">
                                Continuar
                                <span className="material-icons" style={{ fontSize: 18, marginLeft: 6 }}>arrow_forward</span>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

export default NovoPedido;

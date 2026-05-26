import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";
import "../styles/novoPedido.css";

function NovoPedido() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nomeCliente: "",
        dataPedido: "",
        telefone: "",
        email: "",
        prazoEntrega: "",
        prioridade: "",
        localPersonalizacao: "",
        obsPersonalizacao: "",
        obsGeral: "",
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    }

    function handleSubmit(e) {
        e.preventDefault();

        if (!form.prioridade) {
            alert("Selecione a prioridade do pedido.");
            return;
        }

        localStorage.setItem("dadosFicha", JSON.stringify({
            cliente:        form.nomeCliente,
            dataPedido:     form.dataPedido,
            contato:        form.telefone,
            email:          form.email,
            entrega:        form.prazoEntrega,
            prioridade:     form.prioridade,
            local:          form.localPersonalizacao,
            personalizacao: form.obsPersonalizacao,
            observacao:     form.obsGeral,
            dataCriacao:    new Date().toLocaleDateString("pt-BR"),
        }));

        navigate("/pedidos/novo/produtos");
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
                            <p className="section-help">Identificação e contato do cliente para este pedido.</p>

                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="nomeCliente">Nome do Cliente</label>
                                    <input
                                        id="nomeCliente"
                                        name="nomeCliente"
                                        placeholder="Ex: Empresa Caio Induscar"
                                        value={form.nomeCliente}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="telefone">Telefone</label>
                                    <input
                                        id="telefone"
                                        name="telefone"
                                        placeholder="(11) 99999-9999"
                                        value={form.telefone}
                                        onChange={handleChange}
                                        required
                                    />
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
                                        required
                                    />
                                </div>

                            </div>
                        </section>

                        {/* LOGÍSTICA */}
                        <section className="form-section">
                            <h2>Detalhes Logísticos</h2>
                            <p className="section-help">Datas e prioridade de entrega do pedido.</p>

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

                                <div className="form-field full">
                                    <p className="form-label-like">Prioridade (opional)</p>
                                    <div className="status-toggle">

                                        <input
                                            type="radio"
                                            id="prio_baixa"
                                            name="prioridade"
                                            value="baixa"
                                            checked={form.prioridade === "baixa"}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="prio_baixa">Baixa</label>

                                        <input
                                            type="radio"
                                            id="prio_media"
                                            name="prioridade"
                                            value="media"
                                            checked={form.prioridade === "media"}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="prio_media">Média</label>

                                        <input
                                            type="radio"
                                            id="prio_alta"
                                            name="prioridade"
                                            value="alta"
                                            checked={form.prioridade === "alta"}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="prio_alta">Alta</label>

                                    </div>
                                </div>

                            </div>
                        </section>

                        {/* PERSONALIZAÇÃO */}
                        <section className="form-section">
                            <h2>Personalização</h2>
                            <p className="section-help">Local e detalhes da personalização do pedido.</p>

                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="localPersonalizacao">Local da Personalização</label>
                                    <select
                                        id="localPersonalizacao"
                                        name="localPersonalizacao"
                                        value={form.localPersonalizacao}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Frente">Frente</option>
                                        <option value="Costas">Costas</option>
                                        <option value="Manga direita">Manga direita</option>
                                        <option value="Manga esquerda">Manga esquerda</option>
                                        <option value="Peito">Peito</option>
                                        <option value="Gola">Gola</option>
                                    </select>
                                </div>

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
                            <button
                                type="button"
                                className="btn-page-sec"
                                onClick={() => navigate("/pedidos")}
                            >
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

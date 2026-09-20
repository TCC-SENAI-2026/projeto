import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../styles/padrao.css";
import "../styles/formulario.css";

const API_URL = "http://localhost:5000";

function FormUsuario() {

    const navigate = useNavigate();
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");

    // As chaves têm o mesmo nome das colunas da tabela colaboradores
    const [form, setForm] = useState({
        nome_completo: "",
        re: "",
        cpf: "",
        data_nascimento: "",
        telefone: "",
        email: "",
        endereco: "",
        cidade: "",
        cargo: "",
        setor: "",
        data_contratacao: "",
        salario: "",
        nivel_acesso: "operacional",
        senha: "",
        observacoes: "",
        preferencia_notif: "email",
        ativo: "1"
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((atual) => ({ ...atual, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setEnviando(true);
        setErro("");

        try {
            await axios.post(`${API_URL}/cadastrar-colaboradores`, {
                ...form,
                // DECIMAL(10,2) não aceita string vazia
                salario: form.salario === "" ? null : Number(form.salario),
                // colunas opcionais: NULL em vez de ""
                data_nascimento: form.data_nascimento || null,
                telefone: form.telefone || null,
                email: form.email || null,
                endereco: form.endereco || null,
                cidade: form.cidade || null,
                cargo: form.cargo || null,
                observacoes: form.observacoes || null,
                // TINYINT(1)
                ativo: Number(form.ativo)
            });
            navigate("/equipe");
        } catch (e) {
            const msg = e.response?.data?.message;
            setErro(msg || "Não foi possível cadastrar o colaborador. Verifique se o RE e o CPF já não estão em uso.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="page-shell">
            <Sidebar />
            <div className="container">
                <div className="form-page-card">
                    <form onSubmit={handleSubmit} autoComplete="off">

                        <div className="form-header">
                            <span className="form-badge">
                                <span className="material-icons">badge</span>
                                Novo Colaborador
                            </span>
                            <h1 className="form-title">Cadastro de Colaborador</h1>
                            <p className="form-subtitle">
                                Centralize os dados pessoais, profissionais e de acesso do colaborador.
                            </p>
                        </div>

                        {erro && <div className="form-erro">{erro}</div>}

                        <section className="form-section">
                            <h2>Dados Pessoais</h2>
                            <p className="section-help">Informações de identificação e contato do colaborador.</p>
                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="nome_completo">Nome completo</label>
                                    <input id="nome_completo" name="nome_completo" maxLength={100} placeholder="Ex: João Silva" value={form.nome_completo} onChange={handleChange} required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="re">RE</label>
                                    <input id="re" name="re" maxLength={6} placeholder="Ex: 123456" value={form.re} onChange={handleChange} required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="cpf">CPF</label>
                                    <input id="cpf" name="cpf" maxLength={14} placeholder="000.000.000-00" value={form.cpf} onChange={handleChange} required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="data_nascimento">Data de nascimento</label>
                                    <input id="data_nascimento" type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="telefone">Telefone</label>
                                    <input id="telefone" name="telefone" maxLength={20} placeholder="(11) 99999-9999" value={form.telefone} onChange={handleChange} />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="email">E-mail</label>
                                    <input id="email" type="email" name="email" maxLength={100} placeholder="colaborador@empresa.com" value={form.email} onChange={handleChange} />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="endereco">Endereço</label>
                                    <input id="endereco" name="endereco" maxLength={255} placeholder="Ex: Rua das Flores, 123" value={form.endereco} onChange={handleChange} />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="cidade">Cidade</label>
                                    <input id="cidade" name="cidade" maxLength={100} placeholder="Ex: Botucatu" value={form.cidade} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        <section className="form-section">
                            <h2>Dados Profissionais</h2>
                            <p className="section-help">Cargo, setor, vínculo e remuneração do colaborador.</p>
                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="cargo">Cargo</label>
                                    <input id="cargo" name="cargo" maxLength={80} placeholder="Ex: Mecânico" value={form.cargo} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="setor">Setor</label>
                                    <select id="setor" name="setor" value={form.setor} onChange={handleChange} required>
                                        <option value="">Selecione</option>
                                        <option value="Administração">Administração</option>
                                        <option value="Produção">Produção</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="data_contratacao">Data de contratação</label>
                                    <input id="data_contratacao" type="date" name="data_contratacao" value={form.data_contratacao} onChange={handleChange} required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="salario">Salário</label>
                                    <input id="salario" type="number" step="0.01" min="0" name="salario" placeholder="Ex: 3500.00" value={form.salario} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        <section className="form-section">
                            <h2>Acesso ao Sistema</h2>
                            <p className="section-help">Credenciais, permissões e status de acesso do colaborador.</p>
                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="nivel_acesso">Nível de acesso</label>
                                    <select id="nivel_acesso" name="nivel_acesso" value={form.nivel_acesso} onChange={handleChange} required>
                                        <option value="admin">Administrador</option>
                                        <option value="gerente">Gerente</option>
                                        <option value="atendente">Atendente</option>
                                        <option value="operacional">Operacional</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="senha">Senha</label>
                                    <input id="senha" type="password" name="senha" placeholder="••••••••" value={form.senha} onChange={handleChange} required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="preferencia_notif">Receber notificações por</label>
                                    <select id="preferencia_notif" name="preferencia_notif" value={form.preferencia_notif} onChange={handleChange}>
                                        <option value="email">E-mail</option>
                                        <option value="sms">SMS</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="nenhum">Não receber</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <p className="form-label-like">Status</p>
                                    <div className="status-toggle">
                                        <input type="radio" id="func_ativo_page" name="ativo" value="1" checked={form.ativo === "1"} onChange={handleChange} />
                                        <label htmlFor="func_ativo_page">Ativo</label>
                                        <input type="radio" id="func_inativo_page" name="ativo" value="0" checked={form.ativo === "0"} onChange={handleChange} />
                                        <label htmlFor="func_inativo_page">Inativo</label>
                                    </div>
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="observacoes">Observações</label>
                                    <textarea id="observacoes" name="observacoes" maxLength={500} rows={3} placeholder="Anotações internas sobre o colaborador" value={form.observacoes} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        <div className="form-actions">
                            <button type="button" className="btn-page-sec" onClick={() => navigate("/equipe")}>Cancelar</button>
                            <button type="submit" className="btn btn-add" disabled={enviando}>
                                {enviando ? "Salvando…" : "Salvar colaborador"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default FormUsuario;
import Sidebar from "../components/Sidebar";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/padrao.css";
import "../styles/formulario.css";

const API_URL = "http://localhost:5000";

const FORM_VAZIO = {
    nome: "", re: "", cpf: "", dataNascimento: "",
    telefone: "", email: "", endereco: "",
    nivelAcesso: "", dataContrato: "", salario: "",
    preferenciaNotificacoes: "email", status: "ativo"
};

function FormUsuario() {

    const navigate = useNavigate();
    const { id } = useParams();          // vem de /formUsuario/:id (só existe na edição)
    const editando = Boolean(id);

    const [form, setForm] = useState(FORM_VAZIO);
    const [enviando, setEnviando] = useState(false);
    const [carregando, setCarregando] = useState(editando);
    const [senhaDefinida, setSenhaDefinida] = useState(true);

    // Na edição, busca o colaborador e preenche o formulário
    useEffect(() => {
        if (!editando) return;

        async function carregarColaborador() {
            try {
                const resposta = await fetch(`${API_URL}/editar-colaborador/${id}`);
                if (!resposta.ok) throw new Error();
                const c = await resposta.json();

                setForm({
                    nome: c.nome_completo || "",
                    re: c.re || "",
                    cpf: c.cpf || "",
                    dataNascimento: c.data_nascimento || "",
                    telefone: c.telefone || "",
                    email: c.email || "",
                    endereco: c.endereco || "",
                    nivelAcesso: c.nivel_acesso || "",
                    dataContrato: c.data_contratacao || "",
                    salario: c.salario || "",
                    preferenciaNotificacoes: c.preferencia_notificacoes || "email",
                    status: c.ativo ? "ativo" : "inativo"
                });
                setSenhaDefinida(Boolean(c.senha_definida));
            } catch {
                alert("Não foi possível carregar o colaborador.");
                navigate("/equipe");
            } finally {
                setCarregando(false);
            }
        }

        carregarColaborador();
    }, [id, editando, navigate]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setEnviando(true);

        const dados = new FormData();
        dados.append("nome_completo", form.nome);
        dados.append("re", form.re);
        dados.append("cpf", form.cpf);
        dados.append("data_nascimento", form.dataNascimento);
        dados.append("telefone", form.telefone);
        dados.append("email", form.email);
        dados.append("endereco", form.endereco);
        dados.append("nivel_acesso", form.nivelAcesso);
        dados.append("data_contratacao", form.dataContrato);
        dados.append("salario", form.salario);
        dados.append("preferencia_notificacoes", form.preferenciaNotificacoes);
        dados.append("status", form.status);

        const url = editando
            ? `${API_URL}/editar-colaborador/${id}`
            : `${API_URL}/cadastrar-colaborador`;

        try {
            const resposta = await fetch(url, { method: "POST", body: dados });
            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                alert(resultado.msg || "Erro ao salvar colaborador.");
                return;
            }

            alert(
                editando
                    ? "Colaborador atualizado!"
                    : resultado.aviso || "Colaborador cadastrado! O link para definir a senha foi enviado."
            );
            navigate("/equipe");
        } catch {
            alert("Não foi possível conectar ao servidor.");
        } finally {
            setEnviando(false);
        }
    }

    async function excluir() {
        if (!window.confirm(`Deseja excluir ${form.nome}?`)) return;
        try {
            const resposta = await fetch(`${API_URL}/excluir-colaborador/${id}`, { method: "POST" });
            if (!resposta.ok) throw new Error();
            navigate("/equipe");
        } catch {
            alert("Erro ao excluir o colaborador.");
        }
    }

    async function reenviarLink() {
        try {
            const resposta = await fetch(`${API_URL}/reenviar-link/${id}`, { method: "POST" });
            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                alert(resultado.msg || "Não foi possível reenviar o link.");
                return;
            }
            alert("Link reenviado!");
        } catch {
            alert("Não foi possível conectar ao servidor.");
        }
    }

    if (carregando) {
        return (
            <>
                <Sidebar />
                <div className="container">
                    <div className="form-page-card">
                        <p className="form-subtitle">Carregando colaborador...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Sidebar />
            <div className="container">
                <div className="form-page-card">
                    <form onSubmit={handleSubmit} autoComplete="off">

                        <div className="form-header">
                            <span className="form-badge">
                                <span className="material-icons">badge</span>
                                {editando ? "Editar Colaborador" : "Novo Colaborador"}
                            </span>
                            <h1 className="form-title">
                                {editando ? "Edição de Colaborador" : "Cadastro de Colaborador"}
                            </h1>
                            <p className="form-subtitle">
                                Centralize os dados pessoais, profissionais e de acesso do colaborador.
                            </p>
                        </div>

                        <section className="form-section">
                            <h2>Dados Pessoais</h2>
                            <p className="section-help">Informações de identificação e contato do colaborador.</p>
                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="nome">Nome Completo</label>
                                    <input id="nome" name="nome" placeholder="Ex: João Silva" value={form.nome} onChange={handleChange} required />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="re">RE</label>
                                    <input id="re" name="re" placeholder="Ex: 123456" value={form.re} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="cpf">CPF</label>
                                    <input id="cpf" name="cpf" placeholder="000.000.000-00" value={form.cpf} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="dataNascimento">Data de Nascimento</label>
                                    <input id="dataNascimento" type="date" name="dataNascimento" value={form.dataNascimento} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="telefone">Telefone</label>
                                    <input id="telefone" name="telefone" placeholder="(11) 99999-9999" value={form.telefone} onChange={handleChange} />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="email">E-mail</label>
                                    <input id="email" type="email" name="email" placeholder="colaborador@empresa.com" value={form.email} onChange={handleChange} />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="endereco">Endereço</label>
                                    <input id="endereco" name="endereco" placeholder="Ex: Rua das Flores, 123 — São Paulo" value={form.endereco} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        <section className="form-section">
                            <h2>Dados Profissionais</h2>
                            <p className="section-help">Nível de Acesso, vínculo e remuneração do colaborador.</p>
                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="nivelAcesso">Nível de Acesso</label>
                                    <select id="nivelAcesso" name="nivelAcesso" value={form.nivelAcesso} onChange={handleChange}>
                                        <option value="">Selecione</option>
                                        <option value="administrativo">Administrativo</option>
                                        <option value="padrao">Padrão</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="dataContrato">Data de Contratação</label>
                                    <input id="dataContrato" type="date" name="dataContrato" value={form.dataContrato} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="salario">Salário</label>
                                    <input id="salario" name="salario" placeholder="Ex: 3.500,00" value={form.salario} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        <section className="form-section">
                            <h2>Acesso ao Sistema</h2>
                            <p className="section-help">
                                {!editando
                                    ? "O colaborador receberá um link para definir a própria senha, válido por 24 horas."
                                    : senhaDefinida
                                        ? "O colaborador já definiu a própria senha."
                                        : "O colaborador ainda não definiu a senha. Use \"Reenviar link\" para mandar um novo link."}
                            </p>
                            <div className="form-grid">

                                <div className="form-field">
                                    <p className="form-label-like">Status</p>
                                    <div className="status-toggle">
                                        <input type="radio" id="func_ativo_page" name="status" value="ativo" checked={form.status === "ativo"} onChange={handleChange} />
                                        <label htmlFor="func_ativo_page">Ativo</label>
                                        <input type="radio" id="func_inativo_page" name="status" value="inativo" checked={form.status === "inativo"} onChange={handleChange} />
                                        <label htmlFor="func_inativo_page">Inativo</label>
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="preferenciaNotificacoes">
                                        {editando ? "Preferência de notificação" : "Enviar link por"}
                                    </label>
                                    <select id="preferenciaNotificacoes" name="preferenciaNotificacoes"
                                            value={form.preferenciaNotificacoes} onChange={handleChange}>
                                        <option value="email">E-mail</option>
                                        <option value="sms">SMS</option>
                                        <option value="ambos">E-mail e SMS</option>
                                    </select>
                                </div>

                            </div>
                        </section>

                        <div className="form-actions">
                            {editando && (
                                <button type="button" className="btn-page-sec"
                                        style={{ color: "#dc2626", marginRight: "auto" }}
                                        onClick={excluir}>
                                    Excluir
                                </button>
                            )}
                            {editando && !senhaDefinida && (
                                <button type="button" className="btn-page-sec" onClick={reenviarLink}>
                                    Reenviar link
                                </button>
                            )}
                            <button type="button" className="btn-page-sec" onClick={() => navigate("/equipe")}>Cancelar</button>
                            <button type="submit" className="btn btn-add" disabled={enviando}>
                                {enviando ? "Salvando..." : "Salvar"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

export default FormUsuario;
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/padrao.css";
import "../styles/formulario.css";

function FormUsuario() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        nome: "", re: "", cpf: "", dataNascimento: "",
        telefone: "", email: "", endereco: "",
        setor: "", dataContrato: "", salario: "",
        senha: "", status: "ativo"
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    }

    function handleSubmit(e) {
        e.preventDefault();
        console.log(form);
        alert("Colaborador cadastrado!");
        navigate("/colaborador");
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
                                Novo Colaborador
                            </span>
                            <h1 className="form-title">Cadastro de Colaborador</h1>
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
                                    <input id="email" name="email" placeholder="colaborador@empresa.com" value={form.email} onChange={handleChange} />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="endereco">Endereço</label>
                                    <input id="endereco" name="endereco" placeholder="Ex: Rua das Flores, 123 — São Paulo" value={form.endereco} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        <section className="form-section">
                            <h2>Dados Profissionais</h2>
                            <p className="section-help">Setor, vínculo e remuneração do colaborador.</p>
                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="setor">Setor</label>
                                    <select id="setor" name="setor" value={form.setor} onChange={handleChange}>
                                        <option value="">Selecione</option>
                                        <option value="Administração">Administração</option>
                                        <option value="Produção">Produção</option>
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
                            <p className="section-help">Credenciais e status de acesso do colaborador.</p>
                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="senha">Senha</label>
                                    <input id="senha" type="password" name="senha" placeholder="••••••••" value={form.senha} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <p className="form-label-like">Status</p>
                                    <div className="status-toggle">
                                        <input type="radio" id="func_ativo_page" name="status" value="ativo" checked={form.status === "ativo"} onChange={handleChange} />
                                        <label htmlFor="func_ativo_page">Ativo</label>
                                        <input type="radio" id="func_inativo_page" name="status" value="inativo" checked={form.status === "inativo"} onChange={handleChange} />
                                        <label htmlFor="func_inativo_page">Inativo</label>
                                    </div>
                                </div>

                            </div>
                        </section>

                        <div className="form-actions">
                            <button type="button" className="btn-page-sec" onClick={() => navigate("/equipe")}>Cancelar</button>
                            <button type="submit" className="btn btn-add">Salvar</button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

export default FormUsuario;
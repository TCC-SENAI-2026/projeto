import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import '../styles/padrao.css';
import '../styles/formulario.css';

function Perfil() {

    const navigate = useNavigate();
    const [preview, setPreview] = useState(null);

    const [form, setForm] = useState({
        nome: "", email: "", telefone: "", nascimento: "",
        cidade: "", cargo: "", setor: "", admissao: "",
        acesso: "", notif: "", senhaAtual: "", novaSenha: "",
        bio: "Responsável por aprovar pedidos..."
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    }

    function handleFoto(e) {
        const file = e.target.files[0];
        if (!file) return setPreview(null);
        setPreview(URL.createObjectURL(file));
    }

    function handleSubmit(e) {
        e.preventDefault();
        console.log(form);
        alert("Alterações salvas");
    }

    return (
        <>
            <Sidebar />
            <div className="container">
                <div className="form-page-card">
                    <form onSubmit={handleSubmit} autoComplete="off">

                        <div className="form-header">
                            <span className="form-badge">
                                <span className="material-icons">person</span>
                                Meu perfil
                            </span>
                            <h1 className="form-title">Perfil</h1>
                            <p className="form-subtitle">
                                Gerencie suas informações pessoais, profissionais e de acesso ao sistema.
                            </p>
                        </div>

                        {/* FOTO */}
                        <section className="form-section">
                            <h2>Foto</h2>
                            <p className="section-help">Imagem de exibição do seu perfil no sistema.</p>

                            <div className="avatar-wrapper">
                                <label className="avatar-upload" htmlFor="foto-input">
                                    {preview ? (
                                        <img src={preview} className="avatar-img" alt="Foto de perfil" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            <span className="material-icons">person</span>
                                        </div>
                                    )}
                                    <span className="avatar-hint">Clique para alterar</span>
                                </label>
                                <input id="foto-input" type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
                            </div>
                        </section>

                        {/* DADOS PESSOAIS */}
                        <section className="form-section">
                            <h2>Dados Pessoais</h2>
                            <p className="section-help">Suas informações de identificação e contato.</p>
                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="nome">Nome Completo</label>
                                    <input id="nome" name="nome" placeholder="Ex: João Silva" value={form.nome} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="email">E-mail</label>
                                    <input id="email" name="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="telefone">Telefone</label>
                                    <input id="telefone" name="telefone" placeholder="(11) 99999-9999" value={form.telefone} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="nascimento">Data de Nascimento</label>
                                    <input id="nascimento" type="date" name="nascimento" value={form.nascimento} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="cidade">Cidade</label>
                                    <input id="cidade" name="cidade" placeholder="Ex: São Paulo" value={form.cidade} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        {/* PROFISSIONAL */}
                        <section className="form-section">
                            <h2>Profissional</h2>
                            <p className="section-help">Seu cargo, setor e nível de acesso ao sistema.</p>
                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="cargo">Cargo</label>
                                    <input id="cargo" name="cargo" placeholder="Ex: Gerente de Produção" value={form.cargo} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="setor">Setor</label>
                                    <select id="setor" name="setor" value={form.setor} onChange={handleChange}>
                                        <option value="">Selecione</option>
                                        <option value="Administração">Administração</option>
                                        <option value="Produção">Produção</option>
                                        <option value="Comercial">Comercial</option>
                                        <option value="Estoque">Estoque</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="admissao">Data de Admissão</label>
                                    <input id="admissao" type="date" name="admissao" value={form.admissao} onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="acesso">Nível de Acesso</label>
                                    <select id="acesso" name="acesso" value={form.acesso} onChange={handleChange}>
                                        <option value="">Selecione</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Gestor">Gestor</option>
                                        <option value="Operacional">Operacional</option>
                                    </select>
                                </div>

                            </div>
                        </section>

                        {/* SEGURANÇA */}
                        <section className="form-section">
                            <h2>Segurança</h2>
                            <p className="section-help">Notificações, senha e observações da conta.</p>
                            <div className="form-grid">

                                <div className="form-field full">
                                    <p className="form-label-like">Notificações</p>
                                    <div className="status-toggle">
                                        <input type="radio" id="notif_email" name="notif" value="email" checked={form.notif === "email"} onChange={handleChange} />
                                        <label htmlFor="notif_email">E-mail</label>
                                        <input type="radio" id="notif_sistema" name="notif" value="sistema" checked={form.notif === "sistema"} onChange={handleChange} />
                                        <label htmlFor="notif_sistema">Sistema</label>
                                        <input type="radio" id="notif_ambos" name="notif" value="ambos" checked={form.notif === "ambos"} onChange={handleChange} />
                                        <label htmlFor="notif_ambos">Ambos</label>
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label htmlFor="senhaAtual">Senha Atual</label>
                                    <input id="senhaAtual" type="password" name="senhaAtual" placeholder="••••••••" onChange={handleChange} />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="novaSenha">Nova Senha</label>
                                    <input id="novaSenha" type="password" name="novaSenha" placeholder="••••••••" onChange={handleChange} />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="bio">Observações</label>
                                    <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} />
                                </div>

                            </div>
                        </section>

                        <div className="form-actions">
                            <button type="button" className="btn-page-sec" onClick={() => navigate("/")}>Cancelar</button>
                            <button type="submit" className="btn btn-add">Salvar</button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

export default Perfil;
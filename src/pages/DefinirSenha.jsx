import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import "../styles/padrao.css";
import "../styles/formulario.css";

const TAMANHO_MINIMO_SENHA = 8;

function DefinirSenha({ redefinicao = false }) {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    // validando | formulario | invalido
    const [etapa, setEtapa] = useState("validando");
    const [senha, setSenha] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (redefinicao) {
            setEtapa(token ? "formulario" : "invalido");
            return;
        }
        if (!token) {
            setEtapa("invalido");
            return;
        }

        let ativo = true;
        setEtapa("validando");
        setErro("");
        api.get(`/validar-token?token=${encodeURIComponent(token)}`)
            .then((dados) => { if (ativo) setEtapa(dados.valido ? "formulario" : "invalido"); })
            .catch((error) => {
                if (ativo) {
                    setErro(error.message);
                    setEtapa("falha");
                }
            });
        return () => { ativo = false; };
    }, [token, redefinicao]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (enviando) return;
        setErro("");

        if (senha.length < TAMANHO_MINIMO_SENHA) {
            setErro(`A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
            return;
        }
        if (senha !== confirmar) {
            setErro("As senhas não coincidem.");
            return;
        }

        setEnviando(true);
        try {
            await api.post(redefinicao ? '/redefinir-senha' : '/definir-senha', { token, senha });
            setEtapa("concluido");
        } catch (error) {
            setErro(error.message || "Não foi possível conectar ao servidor.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div className="form-page-card" style={{ width: "100%", maxWidth: 480 }}>

                <div className="form-header">
                    <span className="form-badge">
                        <span className="material-icons">lock</span>
                        {redefinicao ? "Redefinição de senha" : "Primeiro acesso"}
                    </span>
                    <h1 className="form-title">Defina sua senha</h1>
                </div>

                {etapa === "validando" && (
                    <p className="form-subtitle">Verificando seu link...</p>
                )}

                {etapa === "falha" && <p role="alert">{erro} Recarregue a página para tentar novamente.</p>}

                {etapa === "invalido" && (
                    <>
                        <p className="form-subtitle">
                            {redefinicao ? "Este link é inválido ou expirou. Solicite outro no login." : "Este link é inválido ou expirou. Peça a um administrador para reenviar o link de acesso."}
                        </p>
                        <div className="form-actions">
                            <button type="button" className="btn btn-add" onClick={() => navigate("/")}>
                                Ir para o login
                            </button>
                        </div>
                    </>
                )}

                {etapa === "concluido" && (
                    <div role="status">
                        <p>{redefinicao ? "Senha redefinida!" : "Senha definida!"} Entre com seu RE e a nova senha.</p>
                        <button type="button" className="btn btn-add" onClick={() => navigate("/")}>Ir para o login</button>
                    </div>
                )}

                {etapa === "formulario" && (
                    <form onSubmit={handleSubmit} autoComplete="off">
                        <p className="form-subtitle">
                            Escolha uma senha com pelo menos {TAMANHO_MINIMO_SENHA} caracteres.
                        </p>

                        <section className="form-section">
                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="senha">Nova senha</label>
                                    <input id="senha" type="password" autoComplete="new-password"
                                           minLength={8} maxLength={1024} disabled={enviando} value={senha} onChange={(e) => setSenha(e.target.value)} required />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="confirmar">Confirmar senha</label>
                                    <input id="confirmar" type="password" autoComplete="new-password"
                                           minLength={8} maxLength={1024} disabled={enviando} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
                                </div>

                            </div>
                        </section>

                        {erro && <p style={{ color: "#c0392b", margin: "0 0 12px" }}>{erro}</p>}

                        <div className="form-actions">
                            <button type="submit" className="btn btn-add" disabled={enviando}>
                                {enviando ? "Salvando..." : "Salvar senha"}
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
}

export default DefinirSenha;

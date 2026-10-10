import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/padrao.css";
import "../styles/formulario.css";

const API_URL = "http://localhost:5000";
const TAMANHO_MINIMO_SENHA = 8;

function DefinirSenha() {

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
        if (!token) {
            setEtapa("invalido");
            return;
        }

        fetch(`${API_URL}/validar-token?token=${encodeURIComponent(token)}`)
            .then((r) => r.json())
            .then((dados) => setEtapa(dados.valido ? "formulario" : "invalido"))
            .catch(() => setEtapa("invalido"));
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
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
            const resposta = await fetch(`${API_URL}/definir-senha`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, senha })
            });
            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                setErro(resultado.msg || "Erro ao definir a senha.");
                return;
            }

            alert("Senha definida! Entre com seu RE ou e-mail e a nova senha.");
            navigate("/login");
        } catch {
            setErro("Não foi possível conectar ao servidor.");
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
                        Primeiro acesso
                    </span>
                    <h1 className="form-title">Defina sua senha</h1>
                </div>

                {etapa === "validando" && (
                    <p className="form-subtitle">Verificando seu link...</p>
                )}

                {etapa === "invalido" && (
                    <>
                        <p className="form-subtitle">
                            Este link é inválido ou expirou. Peça a um administrador para reenviar o link de acesso.
                        </p>
                        <div className="form-actions">
                            <button type="button" className="btn btn-add" onClick={() => navigate("/login")}>
                                Ir para o login
                            </button>
                        </div>
                    </>
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
                                           value={senha} onChange={(e) => setSenha(e.target.value)} required />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="confirmar">Confirmar senha</label>
                                    <input id="confirmar" type="password" autoComplete="new-password"
                                           value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
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

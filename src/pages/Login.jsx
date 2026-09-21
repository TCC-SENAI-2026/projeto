import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import "../styles/login.css";

function Login() {
  const [re, setRe] = useState("");
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    document.body.classList.add("login-body");

    return () => {
      document.body.classList.remove("login-body");
    };
  }, []);


  async function handleLogin(e) {
  e.preventDefault();
  setErro("");

  try {
    const res = await axios.post("http://localhost:5000/login", {
      login: re,      // campo "re" do estado → chave "login" que o Flask espera
      senha: senha,
    });

    console.log('Resposta: ', res.data);

    if(res.data.success){
      navigate('/home');
    }
  } catch (err) {

    console.log('Erro completo: ', err);
    console.log('Status: ', err.response?.status);
    console.log('Dados: ', err.response?.data);

    if (err.response?.status === 401) {
      setErro('Login ou senha incorretos.');
    } else {
      setErro('Erro ao conectar com o servidor')
    }
  }
  

}

  return (
    <main className="login">

      <img src="/img/E-threads.png" className="logo" />

      <div className="login-divisor"></div>

      <form onSubmit={handleLogin}>
        <p className="login-texto">Acesse sua conta para continuar</p>

        {/* ACEITA APENAS NUMERO!! */}
        {/* 
        <div className="campo"> 
          <input
            value={re}
            onChange={(e) =>
              setRe(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Digite seu RE"
          />
        </div> 
        */}

        <div className="campo">
          <input
            value={re}
            onChange={(e) =>
              setRe(e.target.value.slice(0, 20)) // só limita tamanho
            }
            placeholder="Digite seu RE"
          />
        </div>

        <div className="campo senha-wrap">
          <input
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
          />

          <button
            type="button"
            className="toggle-senha"
            onClick={() => setMostrarSenha(!mostrarSenha)}
          >
            {mostrarSenha ? (
                //FECHADO                
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#000000"><path d="M599-361q49-49 49-119t-49-119q-49-49-119-49t-119 49q-49 49-49 119t49 119q49 49 119 49t119-49Zm-187-51q-28-28-28-68t28-68q28-28 68-28t68 28q28 28 28 68t-28 68q-28 28-68 28t-68-28ZM220-270.5Q103-349 48-480q55-131 172-209.5T480-768q143 0 260 78.5T912-480q-55 131-172 209.5T480-192q-143 0-260-78.5ZM480-480Zm207 158q95-58 146-158-51-100-146-158t-207-58q-112 0-207 58T127-480q51 100 146 158t207 58q112 0 207-58Z"/></svg>

              ) : (
                //ABERTO
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#000000"><path d="m637-425-62-62q4-38-23-65.5T487-576l-62-62q13-5 27-7.5t28-2.5q70 0 119 49t49 119q0 14-2.5 28t-8.5 27Zm133 133-52-52q36-28 65.5-61.5T833-480q-49-101-144.5-158.5T480-696q-26 0-51 3t-49 10l-58-58q38-15 77.5-21t80.5-6q143 0 261.5 77.5T912-480q-22 57-58.5 103.5T770-292Zm-2 202L638-220q-38 14-77.5 21t-80.5 7q-143 0-261.5-77.5T48-480q22-57 58-104t84-85L90-769l51-51 678 679-51 51ZM241-617q-35 28-65 61.5T127-480q49 101 144.5 158.5T480-264q26 0 51-3.5t50-9.5l-45-45q-14 5-28 7.5t-28 2.5q-70 0-119-49t-49-119q0-14 3.5-28t6.5-28l-81-81Zm287 89Zm-96 96Z"/></svg>

            )}
          </button>
        </div>

        <p className="erro-login">{erro}</p>

        <button className="bt-entrar" type="submit">
          Entrar
        </button>
      </form>

      <a className="reset-link" onClick={() => setModalAberto(true)}>
        Solicitar redefinição de senha
      </a>

      <Modal aberto={modalAberto} onClose={() => setModalAberto(false)}>
        <div className="modal-header">
          <h2>Redefinir Senha</h2>
        </div>

        <div className="modal-body">
          <input placeholder="Digite seu RE" />
          <button onClick={() => alert("Solicitação enviada")}>
            Enviar
          </button>
          <p className="modal-help">
            Sua solicitação será enviada ao administrador.
          </p>
        </div>
      </Modal>

    </main>
  );
}

export default Login;
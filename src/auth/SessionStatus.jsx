import { useEffect } from 'react';
import { useAuth } from './useAuth';
import '../styles/login.css';

export default function SessionStatus() {
  const { status, erro, tentarNovamente } = useAuth();

  useEffect(() => {
    document.body.classList.add('login-body');
    return () => document.body.classList.remove('login-body');
  }, []);

  return (
    <main className="login">
      <img src="/img/E-threads.png" className="logo" alt="E-Threads" />
      <div className="login-divisor" />
      {status === 'loading' ? (
        <p className="login-texto" role="status">Verificando sessão...</p>
      ) : (
        <>
          <p className="erro-login" role="alert">{erro}</p>
          <button className="bt-entrar" type="button" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </>
      )}
    </main>
  );
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function ProtectedRoute({ adminOnly = false }) {
  const { colaborador } = useAuth();

  if (!colaborador) return <Navigate to="/" replace />;
  if (adminOnly && colaborador.nivel_acesso !== 'administrador') {
    return <Navigate to="/home" replace />;
  }

  // Esta guarda controla a navegação. O Flask valida novamente as permissões da API.
  return <Outlet />;
}

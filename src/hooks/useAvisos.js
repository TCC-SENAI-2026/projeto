import { useContext } from 'react';
import { ContextoAvisos } from '../contexts/ContextoAvisos';

export function useAvisos() {
    const contexto = useContext(ContextoAvisos);
    if (!contexto) throw new Error('useAvisos precisa de ProvedorAvisos.');
    return contexto;
}

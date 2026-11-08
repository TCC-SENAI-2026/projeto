import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export function useTecidosEstoque() {
    const [tecidos, setTecidos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    useEffect(() => {
        let ativo = true;
        api.get('/estoque/tecidos', { lista: true })
            .then(lista => { if (ativo) setTecidos(lista); })
            .catch(error => { if (ativo) setErro(error.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);
    return { tecidos, carregando, erro };
}

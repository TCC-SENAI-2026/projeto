import React from 'react';
import '../styles/FotoCaptura.css';

function FotoColaborador({ id, nome = '', temFoto = true, src, pequena = false }) {
    const [falha, setFalha] = React.useState(null);
    const url = src || (id && temFoto ? `/api/colaboradores/${id}/foto` : null);
    const iniciais = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
    return (
        <span className={`foto-colaborador${pequena ? ' foto-colaborador-pequena' : ''}`}>
            {url && falha !== url ? (
                <img src={url} alt={`Foto de ${nome || 'colaborador'}`} onError={() => setFalha(url)} />
            ) : iniciais ? <span aria-label={nome}>{iniciais}</span> :
                <span className="material-icons" aria-label="Sem foto">person</span>}
        </span>
    );
}

export default FotoColaborador;

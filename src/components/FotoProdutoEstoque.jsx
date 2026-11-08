import React from 'react';

function FotoProdutoEstoque({ estoqueId, nome, temImagem = true }) {
    const [falhaUrl, setFalhaUrl] = React.useState(null);
    const url = estoqueId ? `/api/estoque/${estoqueId}/imagem` : null;
    const mostrarFoto = url && temImagem && falhaUrl !== url;
    return (
        <div className="modelo-icon">
            {mostrarFoto ? (
                <img src={url} alt={nome} width={52} height={52}
                    onError={() => setFalhaUrl(url)} />
            ) : (
                <span className="material-icons" aria-label={nome}>checkroom</span>
            )}
        </div>
    );
}

export default FotoProdutoEstoque;

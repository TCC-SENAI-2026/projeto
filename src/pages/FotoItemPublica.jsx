import { useParams } from "react-router-dom";

// Página pública (sem login, sem Sidebar) — é para onde o QR Code impresso
// aponta. Mostra a foto cadastrada para o produto no estoque.
function FotoItemPublica() {
    const { id } = useParams();

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", background: "#111827", padding: 16,
        }}>
            <img
                src={`/api/pedidos/itens/${id}/imagem-publica`}
                alt="Foto do produto"
                style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }}
                onError={(e) => {
                    e.currentTarget.hidden = true;
                    e.currentTarget.nextSibling.hidden = false;
                }}
            />
            <p hidden style={{ color: "#f9fafb", fontSize: 16 }}>
                Este produto não tem uma foto disponível no estoque.
            </p>
        </div>
    );
}

export default FotoItemPublica;

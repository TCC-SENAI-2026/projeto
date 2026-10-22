import { useState, useEffect } from "react";
import "../styles/padrao.css";
import "../styles/Inicio.css";
import "../styles/ficha-tecnica.css";
import Sidebar from "../components/Sidebar";
import { listarPedidos, buscarPedido } from "../services/pedidosService";
import FichaModal from "../components/FichaModal";
import { useNavigate, Link } from "react-router-dom";
import { infoStatus } from "../utils/status";
import { api } from "../services/api";
import { estaBaixo } from "../utils/estoque";

function Inicio() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // TODO(BACK): GET /api/pedidos (cada pedido precisa de id, status, criadoEm e ficha.cliente).
    // Opcional: GET /api/pedidos/resumo para trazer só as contagens e os 5 recentes.
    listarPedidos().then(setPedidos);
  }, []);

  const pendentes = pedidos.filter(
    (p) => p.status === "pendente"
  ).length;

  const recentes = pedidos
    .filter((p) => p.status !== "finalizado")
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, 5);

  const [estoque, setEstoque] = useState([]);

  useEffect(() => {

    api
      .get("/listar-estoque", { lista: true })
      .then((dados) => setEstoque(dados))
      .catch((erro) => console.log("Erro ao carregar estoque:", erro));
  }, []);

  const totalEstoque = estoque.reduce(
    (soma, item) => soma + Number(item.quantidade_atual || 0),
    0
  );

  const itensBaixos = estoque.filter(estaBaixo);

  // Itens relevantes: os de estoque baixo primeiro, até 3
  const relevantes = [...estoque]
    .sort((a, b) => estaBaixo(b) - estaBaixo(a))
    .slice(0, 3);


  const [fichaAberta, setFichaAberta] = useState(null);

  async function abrirPedido(id) {

    // TODO(BACK): GET /api/pedidos/:id (pedido completo, via buscarPedido no service)
    setFichaAberta(await buscarPedido(id));
  }

  // Props que deixam um card clicável (mouse e teclado)
  function cardProps(rota) {
    return {
      role: "button",
      tabIndex: 0,
      style: { cursor: "pointer" },
      onClick: () => navigate(rota),
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(rota);
        }
      },
    };
  }

  return (
    <>
      {/* SIDEBAR */}
      <Sidebar />

      <div className="container">

        <div className="top">
          <div className="page-header">
            <div className="page-title-row">
              <h1 className="page-title">Dashboard</h1>
            </div>
            <p className="page-subtitle">Visão geral do sistema</p>
          </div>

          <div className="top-right">
            <button
              className="btn btn-add"
              type="button"
              onClick={() => navigate("/pedidos/novo")}
            >
              + Pedido
            </button>
          </div>
        </div>

        <div className="dashboard">

          <div className="dashboard-cards">

            {/* Pendentes → pedidos já filtrados */}
            <div
              className="dashboard-card clicavel"
              {...cardProps("/pedidos?status=pendente")}
            >
              <div className="card-top">
                <span>Pedidos Pendentes</span>
                <div className="card-icon">
                  <span className="material-icons">receipt</span>
                </div>
              </div>

              <h2>{pendentes}</h2>
            </div>

            {/* Estoque */}
            <div
              className="dashboard-card clicavel"
              {...cardProps("/estoque")}
            >
              <div className="card-top">
                <span>Total em Estoque</span>
                <div className="card-icon">
                  <span className="material-icons">insights</span>
                </div>
              </div>

              <h2>{totalEstoque}</h2>
            </div>

            {/* Estoque baixo */}
            <div
              className="dashboard-card-baixo clicavel"
              {...cardProps("/estoque?filtro=baixo")}
            >
              <div className="card-top">
                <span>Estoque Baixo</span>
                <div className="card-icon-baixo">
                  <span className="material-icons">warning</span>
                </div>
              </div>

              <h2>
                {itensBaixos.length} {itensBaixos.length === 1 ? "item" : "itens"}
              </h2>
            </div>

          </div>

          {/* PEDIDOS */}
          <div className="dashboard-section">

            <div className="section-header">
              <h3>Pedidos Recentes</h3>
              <Link to="/pedidos">Ver todos</Link>
            </div>

            <div className="recent-header">
              <span>Pedido</span>
              <span>Empresa</span>
              <span>Status</span>
            </div>

            <div className="recent-orders">
              {recentes.length === 0 && (
                <p style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                  Nenhum pedido recente.
                </p>
              )}

              {recentes.map((p) => {
                const st = infoStatus(p);
                return (
                  <div className="order-row" key={p.id} onClick={() => abrirPedido(p.id)}>
                    <span>#{p.id}</span>
                    <span>{p.ficha?.cliente || "—"}</span>
                    <span className={`status ${st.classe}`}>{st.texto}</span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* ESTOQUE */}
          <div className="dashboard-section">

            <div className="section-header">
              <h3>Itens Relevantes do Estoque</h3>
              <Link to="/estoque">Ver estoque</Link>
            </div>

            <div className="stock-grid">
              {relevantes.length === 0 && (
                <p style={{ color: "#64748b" }}>Nenhum item no estoque.</p>
              )}

              {relevantes.map((item) => (
                <div className="stock-card" key={item.id}>
                  <div className="img"></div>
                  <span>{item.nome_item}</span>
                  <p>{item.quantidade_atual} unidades</p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
      {fichaAberta && (
        <FichaModal ficha={fichaAberta} onFechar={() => setFichaAberta(null)} />
      )}
    </>
  );
}

export default Inicio;

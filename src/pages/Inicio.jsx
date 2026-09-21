import "../styles/padrao.css";
import "../styles/inicio.css";

// ⚠️ depois vamos separar isso em componente
import Sidebar from "../components/Sidebar";

function Inicio() {
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
            <div className="search-box">
              <span className="material-icons search-icon">search</span>
              <input className="search" placeholder="Pesquisar pedido" />
            </div>

            <select className="btn btn-filter">
              <option value="">Todos os pedidos</option>
              <option value="pendente">Pendentes</option>
              <option value="finalizado">Finalizados</option>
              <option value="cancelado">Em produção</option>
            </select>

            <button className="btn btn-add" type="button">+ Pedido</button>
          </div>
        </div>

        <div className="dashboard">

          {/* CARDS  ANTES DA ALTERACAO DO GPT */}
          {/* <div className="dashboard-cards">

            <a href="#" className="dashboard-card">
              <span>Pedidos Pendentes</span>
              <h2>12</h2>
            </a>

            <a href="#" className="dashboard-card">
              <span>Total em Estoque</span>
              <h2>245</h2>
            </a>

            <a href="#" className="dashboard-card">
              <span>Estoque Baixo</span>
              <h2>4 itens</h2>
            </a>

          </div> */}

          {/* CARDS APÓS A ALTERAÇÃO DO GPT */}
          <div className="dashboard-cards">

            <div className="dashboard-card">
              <div className="card-top">
                <span>Pedidos Pendentes</span>

                <div className="card-icon">
                  <span className="material-icons">receipt</span>
                </div>
              </div>

              <h2>12</h2>
            </div>

            <div className="dashboard-card">
              <div className="card-top">
                <span>Total em Estoque</span>

                <div className="card-icon">
                  <span className="material-icons">insights</span>
                </div>
              </div>

              <h2>245</h2>
            </div>

            <div className="dashboard-card-baixo">
              <div className="card-top">
                <span>Estoque Baixo</span>

                <div className="card-icon-baixo">
                  <span className="material-icons">warning</span>
                </div>
              </div>

              <h2>4 itens</h2>
            </div>

          </div>

          {/* PEDIDOS */}
          <div className="dashboard-section">

            <div className="section-header">
              <h3>Pedidos Recentes</h3>
              <a href="#">Ver todos</a>
            </div>

            <div className="recent-header">
              <span>Produto</span>
              <span>Empresa</span>
              <span>Status</span>
            </div>

            <div className="recent-orders">

              {/* ⚠️ onclick → onClick */}
              <div className="order-row" onClick={() => alert("Pedido 1023")}>
                <span>#1023</span>
                <span>Empresa X</span>
                <span className="status pendente">Pendente</span>
              </div>

              <div className="order-row" onClick={() => alert("Pedido 1024")}>
                <span>#1024</span>
                <span>Empresa Y</span>
                <span className="status ok">Finalizado</span>
              </div>

              <div className="order-row" onClick={() => alert("Pedido 1025")}>
                <span>#1025</span>
                <span>Empresa Z</span>
                <span className="status producao">Em produção</span>
              </div>

            </div>

          </div>

          {/* ESTOQUE */}
          <div className="dashboard-section">

            <div className="section-header">
              <h3>Itens Relevantes do Estoque</h3>
              <a href="#">Ver estoque</a>
            </div>

            <div className="stock-grid">

              <div className="stock-card">
                <div className="img"></div>
                <span>Camiseta Polo</span>
                <p>32 unidades</p>
              </div>

              <div className="stock-card">
                <div className="img"></div>
                <span>Tecido Azul</span>
                <p>8 rolos</p>
              </div>

              <div className="stock-card">
                <div className="img"></div>
                <span>Camiseta Oversized</span>
                <p>12 unidades</p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default Inicio;

import { Routes, Route, Navigate } from 'react-router-dom'
import Inicio from './pages/Inicio'
import Pedidos from './pages/Pedidos'
import Estoque from './pages/Estoque'
import Clientes from './pages/Clientes'
import Relatorio from './pages/Relatorio'
import FormCliente from './pages/FormCliente'
import FormUsuario from './pages/FormUsuario'
import Perfil from './pages/Perfil'
import Login from './pages/Login'
import Equipe from './pages/Equipe'
import AddEstoque from './pages/AddEstoque'
import NovoPedido from './pages/Novopedido'
import SelecionarProdutos from './pages/Selecionarprodutos'
import FichaTecnica from './pages/Fichatecnica'

function App() {
  return (
    <Routes>
      <Route path="/"                       element={<Login />} />
      <Route path="/home"                   element={<Inicio />} />
      <Route path="/pedidos"                element={<Pedidos />} />
      <Route path="/estoque"                element={<Estoque />} />
      <Route path="/clientes"               element={<Clientes />} />
      <Route path="/relatorio"              element={<Relatorio />} />
      <Route path="/formCliente"            element={<FormCliente />} />
      <Route path="/formUsuario"            element={<FormUsuario />} />
      <Route path="/perfil"                 element={<Perfil />} />
      <Route path="/equipe"                 element={<Equipe />} />
      <Route path="/add-estoque"            element={<AddEstoque />} />
      <Route path="/pedidos/novo"           element={<NovoPedido />} />
      <Route path="/pedidos/novo/produtos"  element={<SelecionarProdutos />} />
      <Route path="/pedidos/novo/ficha"     element={<FichaTecnica />} />
      <Route path="/novo-pedido"            element={<Navigate to="/pedidos/novo" replace />} />
      <Route path="/novo-pedido/produtos"   element={<Navigate to="/pedidos/novo/produtos" replace />} />
      <Route path="/novo-pedido/ficha"      element={<Navigate to="/pedidos/novo/ficha" replace />} />
    </Routes>
  );
}

export default App

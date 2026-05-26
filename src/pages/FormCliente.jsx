import Sidebar from "../components/Sidebar"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import "../styles/padrao.css"
import "../styles/formulario.css"

function FormCliente() {

    const navigate = useNavigate()

    function handleSubmit(e) {
        e.preventDefault()
        alert("Cliente salvo!")
        navigate("/clientes")
    }

    useEffect(() => {
        const selectEstado = document.getElementById("estado")
        if (!selectEstado) return
        fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
            .then(res => res.json())
            .then(estados => {
                estados.sort((a, b) => a.nome.localeCompare(b.nome))
                selectEstado.innerHTML = '<option value="">Selecione</option>'
                estados.forEach(estado => {
                    const option = document.createElement("option")
                    option.value = estado.sigla
                    option.textContent = estado.sigla
                    selectEstado.appendChild(option)
                })
            })
    }, [])

    useEffect(() => {
        const inputCep = document.getElementById("cep")
        if (!inputCep) return
        inputCep.addEventListener("blur", () => {
            const cep = inputCep.value.replace(/\D/g, "")
            if (cep.length !== 8) return
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(res => res.json())
                .then(dados => {
                    if (dados.erro) { alert("CEP não encontrado."); return }
                    const municipio = document.getElementById("municipio")
                    const rua = document.getElementById("rua")
                    const estado = document.getElementById("estado")
                    if (municipio) municipio.value = dados.localidade || ""
                    if (rua) rua.value = dados.logradouro || ""
                    if (estado) estado.value = dados.uf || ""
                })
        })
    }, [])

    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="form-page-card">
                    <form onSubmit={handleSubmit} autoComplete="off">

                        <div className="form-header">

                            <span className="form-badge">
                                <span className="material-icons">group_add</span>
                                Novo cliente
                            </span>

                            <h1 className="form-title">
                                Cadastro de Cliente
                            </h1>

                            <p className="form-subtitle">
                                Use este formulário para registrar empresas atendidas,
                                definir o responsável principal e manter os contatos organizados.
                            </p>

                        </div>

                        {/* DADOS */}
                        <section className="form-section">

                            <h2>Dados da Empresa</h2>

                            <p className="section-help">
                                Informações principais da empresa cliente.
                            </p>

                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="nome_empresa">Empresa</label>
                                    <input id="nome_empresa" placeholder="Ex: Caio Induscar" required />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="nome_responsavel">Responsável</label>
                                    <input id="nome_responsavel" placeholder="Ex: João Silva (RH)" />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="cnpj">CPF / CNPJ</label>
                                    <input id="cnpj" placeholder="00.000.000/0000-00" />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="telefone">Telefone</label>
                                    <input id="telefone" placeholder="(11) 99999-9999" />
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="email">E-mail</label>
                                    <input id="email" placeholder="contato@empresa.com" />
                                </div>

                            </div>

                        </section>

                        {/* ENDEREÇO */}
                        <section className="form-section">

                            <h2>Endereço</h2>

                            <p className="section-help">
                                Dados de localização e endereço da empresa.
                            </p>

                            <div className="form-grid">

                                <div className="form-field">
                                    <label htmlFor="cep">CEP</label>
                                    <input id="cep" placeholder="00000-000" />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="municipio">Município</label>
                                    <input id="municipio" placeholder="Ex: São Paulo" />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="estado">Estado</label>
                                    <select id="estado"></select>
                                </div>

                                <div className="form-field full">
                                    <label htmlFor="rua">Rua</label>
                                    <input id="rua" placeholder="Ex: Rua das Flores" />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="numero">Número</label>
                                    <input id="numero" placeholder="Ex: 123" />
                                </div>

                            </div>

                        </section>

                        {/* EXTRA */}
                        <section className="form-section">

                            <h2>Informações Adicionais</h2>

                            <p className="section-help">
                                Observações e status do cliente.
                            </p>

                            <div className="form-grid">

                                <div className="form-field full">
                                    <label htmlFor="observacoes">Observações</label>
                                    <textarea id="observacoes" placeholder="Ex: Cliente prefere contato por e-mail" />
                                </div>

                                <div className="form-field">

                                    <p className="form-label-like">Status</p>

                                    <div className="status-toggle">

                                        <input
                                            type="radio"
                                            id="cliente_ativo_page"
                                            name="status"
                                            value="ativo"
                                            defaultChecked
                                        />
                                        <label htmlFor="cliente_ativo_page">Ativo</label>

                                        <input
                                            type="radio"
                                            id="cliente_inativo_page"
                                            name="status"
                                            value="inativo"
                                        />
                                        <label htmlFor="cliente_inativo_page">Inativo</label>

                                    </div>

                                </div>

                            </div>

                        </section>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-page-sec"
                                onClick={() => navigate("/clientes")}
                            >
                                Cancelar
                            </button>

                            <button type="submit" className="btn btn-add">
                                Salvar
                            </button>

                        </div>

                    </form>
                </div>
            </div>
        </>
    )
}

export default FormCliente
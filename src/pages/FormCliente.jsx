import Sidebar from "../components/Sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import "../styles/padrao.css"
import "../styles/formulario.css"

function FormCliente() {

    const navigate = useNavigate()
    const location = useLocation()
    const clienteEditar = location.state
    const [artePreview, setArtePreview] = useState(null);
    const [arteBase64, setArteBase64] = useState(null);

    // function handleSubmit(e) {
    //     e.preventDefault()
    //     alert("Cliente salvo!")
    //     navigate("/clientes")
    // }

    async function handleSubmit(e) {
        e.preventDefault()

        const formData = new FormData()
        formData.append('nome_empresa', document.getElementById('nome_empresa').value)
        formData.append('responsavel', document.getElementById('responsavel').value)
        formData.append('cpf_cnpj', document.getElementById('cpf_cnpj').value)
        formData.append('telefone', document.getElementById('telefone').value)
        formData.append('email', document.getElementById('email').value)
        formData.append('cep', document.getElementById('cep').value)
        formData.append('rua', document.getElementById('rua').value)
        formData.append('numero', document.getElementById('numero').value)
        formData.append('municipio', document.getElementById('municipio').value)
        formData.append('estado', document.getElementById('estado').value)
        formData.append('observacoes', document.getElementById('observacoes').value)


        const status = document.querySelector('input[name="status"]:checked')
        formData.append('status', status ? status.value : 'ativo')

        if (clienteEditar && clienteEditar[11]) {
            formData.append('foto_atual', clienteEditar[11])
        }

        const inputArte = document.getElementById('input-arte')
        if (inputArte.files[0]) {
            formData.append('foto_logo', inputArte.files[0])
        }

        if (clienteEditar) {
            await fetch(`http://localhost:5000/editar-cliente/${clienteEditar[13]}`, {
                method: 'POST',
                body: formData
            })
        } else {
            await fetch(`http://localhost:5000/cadastrar-cliente`, {
                method: 'POST',
                body: formData
            })
        }

        navigate('/clientes')

    }

    function handleArte(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            setArteBase64(ev.target.result);
            setArtePreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    }

    useEffect(() => {
        if (!clienteEditar) return
        console.log(clienteEditar)
        document.getElementById('nome_empresa').value = clienteEditar[0] || ''
        document.getElementById('responsavel').value  = clienteEditar[1] || ''
        document.getElementById('cpf_cnpj').value     = clienteEditar[2] || ''
        document.getElementById('telefone').value     = clienteEditar[3] || ''
        document.getElementById('email').value        = clienteEditar[4] || ''
        document.getElementById('cep').value          = clienteEditar[5] || ''
        document.getElementById('municipio').value    = clienteEditar[8] || ''
        document.getElementById('estado').value       = clienteEditar[9] || ''
        document.getElementById('rua').value          = clienteEditar[6] || ''
        document.getElementById('numero').value       = clienteEditar[7] || ''
        document.getElementById('observacoes').value  = clienteEditar[10] || ''

        if (clienteEditar[11]){
            setArtePreview(`http://localhost:5000/static/uploads/${clienteEditar[11]}`)
        }
    }, [clienteEditar])

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
                                    <label htmlFor="responsavel">Responsável</label>
                                    <input id="responsavel" placeholder="Ex: João Silva (RH)" />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="cpf_cnpj">CPF / CNPJ</label>
                                    <input id="cpf_cnpj" placeholder="00.000.000/0000-00" />
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


                        <h2>Arte do Cliente</h2>
                        <p className="section-help">
                            Envie a arte para personalização. Ela será aplicada nos itens conforme a técnica
                            de cada um. Formatos aceitos: PNG, AI, PDF.
                        </p>

                        <label className="upload-arte" htmlFor="input-arte">
                            <span className="material-icons">upload_file</span>
                            <strong>Arraste sua arte aqui</strong>
                            <span>ou clique para enviar — PNG, AI, PDF</span>
                            <input
                                id="input-arte"
                                type="file"
                                accept=".png,.ai,.pdf,image/*"
                                style={{ display: "none" }}
                                onChange={handleArte}
                            />
                        </label>

                         {/* Preview da arte após upload */}
                        {artePreview && (
                            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
                                <img
                                    src={artePreview}
                                    alt="Preview da arte"
                                    style={{
                                        width: 100,
                                        height: 100,
                                        objectFit: "contain",
                                        borderRadius: 10,
                                        border: "1px solid #e2e8f0",
                                        background: "#f8fafc",
                                    }}
                                />
                                <div>
                                    <p style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
                                        ✓ Arte carregada com sucesso
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-page-sec"
                                        style={{ marginTop: 6, fontSize: 12 }}
                                        onClick={() => { setArtePreview(null); setArteBase64(null); }}
                                    >
                                        Remover arte
                                    </button>
                                </div>
                            </div>
                        )}


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
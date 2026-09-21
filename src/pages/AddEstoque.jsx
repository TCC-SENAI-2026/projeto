import Sidebar from "../components/Sidebar";
import "../styles/padrao.css";
import "../styles/formulario.css";

function AddEstoque() {
    return (
        <>
            <Sidebar />

            <div className="container">
                <div className="form-page-layout">
                    <main className="form-card">
                        <div className="form-header">
                            <span className="form-badge">
                                <span className="material-icons">inventory_2</span>
                                Movimentação
                            </span>

                            <h1 className="form-title">
                                Adicionar Itens
                            </h1>

                            <p className="form-subtitle">
                                Formulário para movimentação de itens do estoque.
                            </p>
                        </div>

                        <form autoComplete="off">
                            <section className="form-section">
                                <h2>Tipo de item</h2>

                                <p className="section-help">
                                    Selecione o tipo que será cadastrado.
                                </p>

                                <div className="type-switch">
                                    <label>
                                        <input
                                            type="radio"
                                            name="tipo_cadastro"
                                            defaultChecked
                                        />

                                        <span className="type-card">
                                            <strong>Produto</strong>

                                            <span>
                                                Item pronto para venda ou entrega.
                                            </span>
                                        </span>
                                    </label>

                                    <label>
                                        <input
                                            type="radio"
                                            name="tipo_cadastro"
                                        />

                                        <span className="type-card">
                                            <strong>Material</strong>

                                            <span>
                                                Matéria-prima ou insumo usado na produção.
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </section>

                            <section className="form-section">
                                <h2>Identificação do item</h2>

                                <p className="section-help">
                                    Informe os dados principais do item.
                                </p>

                                <div className="form-grid">
                                    <div className="form-field full">
                                        <label>Nome do item</label>

                                        <input
                                            type="text"
                                            placeholder="Ex.: Camiseta Polo Azul Marinho"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Categoria</label>

                                        <select>
                                            <option>Selecione</option>
                                            <option>Uniforme</option>
                                            <option>Malharia</option>
                                            <option>Tecido</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Código interno</label>

                                        <input
                                            type="text"
                                            placeholder="Ex.: UNI-001"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Unidade de medida</label>

                                        <select>
                                            <option>Selecione</option>
                                            <option>Unidade</option>
                                            <option>Peça</option>
                                            <option>Metro</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Fornecedor</label>

                                        <input
                                            type="text"
                                            placeholder="Ex.: Tecidos Brasil"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="form-section">
                                <h2>Controle de estoque</h2>

                                <p className="section-help">
                                    Informe quantidade e valor do item.
                                </p>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label>Quantidade atual</label>

                                        <input
                                            type="number"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Estoque mínimo</label>

                                        <input
                                            type="number"
                                            placeholder="Ex.: 20"
                                        />
                                    </div>

                                    <div className="form-field full">
                                        <label>Valor unitário</label>

                                        <input
                                            type="text"
                                            placeholder="Ex.: 39,90"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="form-section">
                                <div className="form-grid">
                                    <div className="form-field full">
                                        <label>Observações gerais</label>

                                        <textarea placeholder="Ex.: item reservado para pedido da empresa X"></textarea>
                                    </div>
                                </div>
                            </section>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-add"
                                >
                                    Cadastrar item
                                </button>
                            </div>
                        </form>
                    </main>

                    <aside className="form-side-card">
                        <h2 className="side-title">
                            Controle de estoque
                        </h2>

                        <div className="side-content">
                            <div className="form-field">
                                <label>Tipo</label>

                                <select>
                                    <option>
                                        Entrada (compra / produção)
                                    </option>

                                    <option>
                                        Saída (venda / uso)
                                    </option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Quantidade</label>

                                <input
                                    type="number"
                                    placeholder="Ex.: 50"
                                />
                            </div>

                            <div className="form-field">
                                <label>Motivo</label>

                                <select>
                                    <option>Selecione</option>
                                    <option>Compra</option>
                                    <option>Produção</option>
                                    <option>Ajuste manual</option>
                                </select>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

export default AddEstoque;
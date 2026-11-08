import { novaCorMaterial } from '../utils/coresMaterial';

function CoresMaterial({ cores, onChange }) {
    function alterarCor(indice, campo, valor) {
        onChange(cores.map((cor, i) => i === indice ? { ...cor, [campo]: valor } : cor));
    }

    return (
        <section className="form-section">
            <h2>Cores</h2>
            <p className="section-help">Informe as cores do tecido e a quantidade em metros de cada uma.</p>
            <div className="cores-material-lista">
                {cores.map((cor, indice) => (
                    <div className="cores-material-linha" key={cor.id ?? `nova-${indice}`}>
                        <div className="form-field">
                            <label htmlFor={`cor-nome-${indice}`}>Cor</label>
                            <input id={`cor-nome-${indice}`} type="text" maxLength={100}
                                value={cor.nome_cor} placeholder="Ex.: Preto"
                                onChange={e => alterarCor(indice, 'nome_cor', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label htmlFor={`cor-metros-${indice}`}>Metros</label>
                            <input id={`cor-metros-${indice}`} type="number" min="0" step="0.01"
                                value={cor.quantidade_atual ?? ''} placeholder="0"
                                onChange={e => alterarCor(indice, 'quantidade_atual', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label htmlFor={`cor-minimo-${indice}`}>Estoque mínimo (m)</label>
                            <input id={`cor-minimo-${indice}`} type="number" min="0" step="0.01"
                                value={cor.estoque_minimo ?? ''} placeholder="Opcional"
                                onChange={e => alterarCor(indice, 'estoque_minimo', e.target.value)} />
                        </div>
                        <button type="button" className="btn-page-sec"
                            aria-label={`Remover cor ${cor.nome_cor || indice + 1}`}
                            onClick={() => onChange(cores.filter((_, i) => i !== indice))}>
                            Remover
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" className="btn-page-sec" aria-label="Adicionar cor"
                onClick={() => onChange([...cores, novaCorMaterial()])}>+</button>
        </section>
    );
}

export default CoresMaterial;

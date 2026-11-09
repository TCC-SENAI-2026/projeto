import { useId } from 'react';
import { Link } from 'react-router-dom';
import { avisoSaldo } from '../utils/produtosEstoque.js';
import { nomeTecidoCor, selecionarTecidoCor } from '../utils/tecidosEstoque.js';

function SelectTecidoCor({ tecidos, carregando, erro, detalhes, onChange, bloqueado = false }) {
    const id = useId();
    const possuiCores = tecidos.some(t => (t.cores || []).some(c => Number(c.quantidade_atual) > 0));
    return (
        <div className="form-field">
            <label htmlFor={id}>Tecido</label>
            {bloqueado ? (
                <input id={id} readOnly value={nomeTecidoCor(detalhes)} />
            ) : (
                <>
                    <select id={id} value={detalhes.material_cor_id ?? ''}
                        disabled={carregando || !!erro || !tecidos.length}
                        onChange={e => onChange(selecionarTecidoCor(tecidos, e.target.value))}>
                        <option value="">{carregando ? 'Carregando tecidos...' :
                            !tecidos.length ? 'Nenhum tecido disponível' : 'Selecione'}</option>
                        {tecidos.map(tecido => (
                            <optgroup key={tecido.id} label={tecido.nome_item}
                                disabled={!(tecido.cores || []).some(c => Number(c.quantidade_atual) > 0)}>
                                {(tecido.cores || []).map(cor => (
                                    <option key={cor.id} value={cor.id} disabled={Number(cor.quantidade_atual) <= 0}>
                                        {String(detalhes.material_cor_id) === String(cor.id)
                                            ? `${tecido.nome_item} · ${cor.nome_cor}` : cor.nome_cor}
                                        {avisoSaldo(cor)}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {erro && <p role="alert">{erro}</p>}
                    {!carregando && !erro && !possuiCores && (
                        <p className="section-help">
                            Cadastre um tecido com cores e saldo em <Link to="/estoque?filtro=materiais">Estoque &gt; Materiais</Link>.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

export default SelectTecidoCor;

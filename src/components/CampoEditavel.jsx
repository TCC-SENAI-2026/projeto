import { useState } from "react";
import "../styles/solicitacoes.css";

// "2026-11-04" -> "04/11/2026"
function formatarData(valor) {
    const [ano, mes, dia] = String(valor || "").slice(0, 10).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
}

/**
 * Campo no estilo "clique para alterar":
 *  1. mostra o valor atual;
 *  2. ao clicar, o valor atual fica com opacidade baixa e aparece
 *     um campo logo abaixo para digitar o novo valor;
 *  3. ao terminar (sair do campo ou Enter), aparece o ícone verde.
 *
 * tipo: "text" | "email" | "date" | "textarea" | "select"
 * opcoes (só para select): [{ value, label }]
 * onChange recebe um evento no mesmo formato do input ({ target: { name, value } }).
 */
function CampoEditavel({
    id,
    name,
    rotulo,
    valorOriginal,
    valor,
    onChange,
    tipo = "text",
    opcoes = [],
    full = false,
    placeholder = "",
}) {
    const [editando, setEditando] = useState(false);
    const [concluido, setConcluido] = useState(false);

    const original = valorOriginal ?? "";
    const atual = valor ?? "";
    const alterado = atual !== original;

    function textoExibido() {
        if (!original) return "—";
        if (tipo === "date") return formatarData(original) || "—";
        if (tipo === "select") {
            return opcoes.find((o) => o.value === original)?.label || original;
        }
        return original;
    }

    function emitir(novoValor) {
        onChange({ target: { name, value: novoValor } });
    }

    function handleChange(e) {
        emitir(e.target.value);
        // No select a escolha já é o fim da digitação
        setConcluido(tipo === "select" && e.target.value !== original);
    }

    function terminar() {
        if (alterado) {
            setConcluido(true);
        } else {
            // Não mudou nada: volta ao estado normal
            setEditando(false);
            setConcluido(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && tipo !== "textarea") {
            e.preventDefault();
            e.currentTarget.blur();
        }
    }

    function desfazer() {
        emitir(original);
        setEditando(false);
        setConcluido(false);
    }

    const propsComuns = {
        id,
        name,
        value: atual,
        onChange: handleChange,
        onBlur: terminar,
        onKeyDown: handleKeyDown,
        autoFocus: true,
        placeholder,
    };

    return (
        <div className={`form-field campo-editavel ${full ? "full" : ""}`}>
            <label htmlFor={editando ? id : undefined}>{rotulo}</label>

            <button
                type="button"
                className={`campo-atual ${editando ? "campo-atual-baixo" : ""}`}
                onClick={() => setEditando(true)}
                aria-label={`Alterar ${rotulo}`}
            >
                <span>{textoExibido()}</span>
                {!editando && <span className="material-icons">edit</span>}
            </button>

            {editando && (
                <div className="campo-novo">
                    {tipo === "textarea" ? (
                        <textarea {...propsComuns} rows={3} />
                    ) : tipo === "select" ? (
                        <select {...propsComuns}>
                            <option value="">Selecione</option>
                            {opcoes.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input {...propsComuns} type={tipo} />
                    )}

                    {concluido && (
                        <span
                            className="campo-ok material-icons"
                            title="Alteração preenchida"
                            aria-label="Alteração preenchida"
                        >
                            check_circle
                        </span>
                    )}

                    <button
                        type="button"
                        className="campo-desfazer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={desfazer}
                    >
                        Desfazer
                    </button>
                </div>
            )}
        </div>
    );
}

export default CampoEditavel;
function SelectOpcoes({ label, groups, value, onChange }) {
    return (
        <div className="form-field">
            <label>{label}</label>
            <select value={value} onChange={onChange}>
                <option value="">Selecione</option>
                {groups.map(g => (
                    <optgroup key={g.group} label={g.group}>
                        {g.options.map(o => (
                            <option key={o} value={o}>{o}</option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
}

export default SelectOpcoes;
function digitos(valor, limite) {
    return String(valor ?? '').replace(/\D/g, '').slice(0, limite);
}

// Mesmo padrão já utilizado no formulário de Novo Pedido.
export function mascaraTelefone(valor) {
    const nums = digitos(valor, 11);
    if (!nums) return '';
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

export function mascaraCpf(valor) {
    return digitos(valor, 11).replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function mascaraCpfCnpj(valor) {
    const nums = digitos(valor, 14);
    if (nums.length <= 11) return mascaraCpf(nums);
    return nums.replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\/\d{4})(\d)/, '$1-$2');
}

export function mascaraCep(valor) {
    return digitos(valor, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export function mascaraSalario(valor) {
    const nums = digitos(valor, 15);
    if (!nums) return '';
    return (Number(nums) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
}

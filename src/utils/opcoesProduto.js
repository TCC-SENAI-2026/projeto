export const TAMANHOS = ["P", "M", "G", "GG", "G1", "G2"];

export const PERSONALIZACOES = [
    { group: "Básicos", options: ["Bordado", "Silk Screen (Serigrafia)", "Estampa Digital (DTG)", "Sublimação", "Transfer", "Vinil Termocolante"] },
    { group: "Intermediários", options: ["Relevo (3D Puff)", "Bordado 3D", "Patch (Aplicação)", "Termocolante", "Foil (Metalizado)", "Flocado (Aveludado)"] },
    { group: "Avançados", options: ["Laser Cut", "Gravação a Laser", "Estampa UV", "Impressão 3D", "Pedraria", "Lantejoulas"] },
    { group: "Efeitos / Estilo", options: ["Transparente", "Degradê", "Brilho (Glitter)", "Fosco"] },
];

export const TECIDOS = [
    { group: "Básicos", options: ["Algodão", "Poliéster", "Malha", "Viscose"] },
    { group: "Intermediários", options: ["Algodão + Poliéster", "Algodão + Elastano", "Poliéster + Elastano", "Viscolycra", "Dry Fit", "Piquet"] },
    { group: "Avançados", options: ["Algodão Pima", "Algodão Egípcio", "Fleece", "Moletom Felpado", "Linho", "Seda"] },
    { group: "Sustentáveis", options: ["Modal", "Fibra de Bambu", "Poliéster de PET Reciclado"] },
    { group: "Especiais", options: ["Jeans", "Sarja", "Nylon", "Helanca", "Suplex"] },
];

export const CORES = [
    { group: "Básicas", options: ["Branco", "Preto", "Cinza", "Azul", "Vermelho"] },
    { group: "Neutras / Sóbrias", options: ["Off-white", "Bege", "Marrom", "Caqui", "Grafite"] },
    { group: "Intermediárias", options: ["Azul Marinho", "Verde Militar", "Vinho", "Mostarda", "Rosa Claro"] },
    { group: "Vibrantes", options: ["Verde Limão", "Azul Ciano", "Laranja", "Pink", "Roxo"] },
    { group: "Especiais", options: ["Metálico", "Neon", "Pastel", "Tie-dye", "Estampado"] },
];

export const LOCAIS = [
    { group: "Frente", options: ["Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito", "Frente — Abaixo do Peito"] },
    { group: "Costas", options: ["Costas — Centro Alto", "Costas — Centro Baixo", "Costas — Full Back"] },
    { group: "Mangas", options: ["Manga Esquerda", "Manga Direita", "Ambas as Mangas"] },
    { group: "Outros", options: ["Gola", "Bolso", "Barra", "Capuz"] },
];

export const MODELOS = [
    { id: "camiseta", label: "Camiseta", icon: "checkroom" },
    { id: "camisa", label: "Camisa", icon: "checkroom" },
    { id: "camisa_longa", label: "Camisa Longa", icon: "checkroom" },
    { id: "moletom", label: "Moletom c/ Capuz", icon: "checkroom" },
    { id: "calca", label: "Calça", icon: "checkroom" },
];

export const LOCAIS_POR_PRODUTO = {
    camiseta:     ["Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
                   "Costas — Centro Alto", "Costas — Centro Baixo", "Manga Esquerda",
                   "Manga Direita", "Gola"],
    camisa:       ["Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
                   "Costas — Centro Alto", "Costas — Centro Baixo", "Manga Esquerda",
                   "Manga Direita", "Gola", "Bolso"],
    camisa_longa: ["Frente — Centro", "Costas — Centro Alto", "Gola",
                   "Manga Esquerda", "Manga Direita", "Ambas as Mangas"],
    moletom:      ["Frente — Centro", "Costas — Centro Alto",
                   "Manga Esquerda", "Manga Direita", "Capuz", "Bolso"],
    calca:        ["Barra"],
};

export const DETALHES_VAZIOS = {
    tecido: "",
    cor: "",
    personalizacao: "",
    local: "",
    observacao: "",
};
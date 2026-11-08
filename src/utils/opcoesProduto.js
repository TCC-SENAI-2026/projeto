export const TAMANHOS = ["P", "M", "G", "GG", "G1", "G2"];

export const PERSONALIZACOES = [
    { group: "Básicos", options: ["Bordado", "Silk Screen (Serigrafia)", "Estampa Digital (DTG)", "Sublimação", "Transfer", "Vinil Termocolante"] },
    { group: "Intermediários", options: ["Relevo (3D Puff)", "Bordado 3D", "Patch (Aplicação)", "Termocolante", "Foil (Metalizado)", "Flocado (Aveludado)"] },
    { group: "Avançados", options: ["Laser Cut", "Gravação a Laser", "Estampa UV", "Impressão 3D", "Pedraria", "Lantejoulas"] },
    { group: "Efeitos / Estilo", options: ["Transparente", "Degradê", "Brilho (Glitter)", "Fosco"] },
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
                   "Costas — Centro Alto", "Costas — Centro Baixo", "Costas — Full Back",
                   "Manga Esquerda", "Manga Direita", "Gola"],
    camisa:       ["Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
                   "Costas — Centro Alto", "Costas — Centro Baixo", "Costas — Full Back",
                   "Manga Esquerda", "Manga Direita", "Gola", "Bolso"],
    camisa_longa: ["Frente — Centro", "Frente — Peito Esquerdo", "Frente — Peito Direito",
                   "Costas — Centro Alto", "Costas — Centro Baixo",
                   "Manga Esquerda", "Manga Direita", "Ambas as Mangas",
                   "Punho Esquerdo", "Punho Direito", "Gola"],
    moletom:      ["Frente — Centro", "Frente — Peito Esquerdo",
                   "Costas — Centro Alto", "Costas — Full Back",
                   "Manga Esquerda", "Manga Direita", "Capuz", "Bolso"],
    calca:        ["Coxa Direita", "Coxa Esquerda", "Lateral da Perna",
                   "Parte Traseira", "Bolso Traseiro", "Barra"],
};

export const DETALHES_VAZIOS = {
    material_id: null,
    material_cor_id: null,
    tecido: "",
    cor: "",
    personalizacao: "",
    local: "",
};
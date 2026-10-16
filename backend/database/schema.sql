-- E-Threads | T02: schema das 10 tabelas aprovadas.
-- Fonte: docs/ARQUITETURA_TCC.md, secoes 2.2 e 7.
-- Aplicacao manual no MySQL Workbench, em uma base vazia, pelo time.
-- Requer MySQL Server >= 8.0.16 para aplicar os CHECKs.
-- Servidor instalado identificado: MySQL Community Server 8.0.46 (mysqld --version).
-- A versao do Workbench/cliente nao substitui a versao do servidor conectado.
-- Este arquivo nao migra dados ou estruturas existentes. CREATE TABLE sem
-- IF NOT EXISTS evidencia tabelas preexistentes e evita ocultar divergencias.

CREATE DATABASE IF NOT EXISTS ethreads_db
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ethreads_db;

CREATE TABLE colaboradores (
    id                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    re                       VARCHAR(20) COLLATE utf8mb4_bin NOT NULL,
    nome                     VARCHAR(150) NOT NULL,
    cpf                      VARCHAR(14) NULL,
    email                    VARCHAR(254) NOT NULL,
    telefone                 VARCHAR(20) NULL,
    endereco                 VARCHAR(255) NULL,
    nivel_acesso             ENUM('administrador', 'colaborador') NOT NULL DEFAULT 'colaborador',
    senha_hash               VARCHAR(255) NULL,
    conta_ativada            BOOLEAN NOT NULL DEFAULT 0,
    ativo                    BOOLEAN NOT NULL DEFAULT 1,
    data_contrato            DATE NULL,
    salario                  DECIMAL(10,2) NULL,
    preferencia_notificacoes VARCHAR(20) NOT NULL DEFAULT 'email',
    created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_colaboradores_re UNIQUE (re),
    CONSTRAINT uq_colaboradores_cpf UNIQUE (cpf),
    CONSTRAINT uq_colaboradores_email UNIQUE (email),
    KEY idx_colaboradores_nome (nome),
    KEY idx_colaboradores_perfil_ativo (nivel_acesso, ativo)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- RE e textual e preserva zeros iniciais. Os scripts usam os 4 digitos
-- aprovados; VARCHAR(20) permanece conforme a modelagem de referencia.
-- conta_ativada (ativacao concluida) e independente de ativo (acesso permitido).
CREATE TABLE tokens (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    colaborador_id INT UNSIGNED NOT NULL,
    tipo           ENUM('ativacao', 'redefinicao') NOT NULL,
    token_hash     VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    expira_em      DATETIME NOT NULL,
    usado_em       DATETIME NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tokens_colaborador_tipo (colaborador_id, tipo),
    KEY idx_tokens_hash (token_hash),
    KEY idx_tokens_expira_em (expira_em),
    CONSTRAINT fk_tokens_colaborador FOREIGN KEY (colaborador_id)
        REFERENCES colaboradores (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- A secao 2.2 nao aprova colaborador_id em clientes; a relacao "cadastra"
-- ilustrada no diagrama nao acrescenta uma coluna a esta tabela.
CREATE TABLE clientes (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome       VARCHAR(150) NOT NULL,
    email      VARCHAR(254) NULL,
    telefone   VARCHAR(20) NULL,
    endereco   VARCHAR(255) NULL,
    logo_url   VARCHAR(2048) NULL,
    ativo      BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_clientes_nome (nome),
    KEY idx_clientes_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE catalogo_itens (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    tipo       ENUM('produto', 'personalizacao', 'tecido', 'cor', 'local') NOT NULL,
    nome       VARCHAR(150) NOT NULL,
    ativo      BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_catalogo_itens_tipo_nome UNIQUE (tipo, nome),
    KEY idx_catalogo_itens_nome (nome),
    KEY idx_catalogo_itens_tipo_ativo (tipo, ativo)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE pedidos (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    numero_pedido  INT NOT NULL,
    cliente_id     INT UNSIGNED NOT NULL,
    colaborador_id INT UNSIGNED NOT NULL,
    data_pedido    DATE NOT NULL,
    prazo_entrega  DATE NULL,
    prioridade     ENUM('baixa', 'media', 'alta') NOT NULL,
    obs_geral      TEXT NULL,
    status         ENUM('pendente', 'em_producao', 'concluido', 'cancelado') NOT NULL DEFAULT 'pendente',
    data_conclusao DATETIME NULL,
    excluido_em    DATETIME NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_pedidos_numero UNIQUE (numero_pedido),
    KEY idx_pedidos_cliente (cliente_id),
    KEY idx_pedidos_colaborador (colaborador_id),
    KEY idx_pedidos_status_excluido (status, excluido_em),
    KEY idx_pedidos_data_pedido (data_pedido),
    KEY idx_pedidos_data_conclusao (data_conclusao),
    KEY idx_pedidos_created_at (created_at),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_pedidos_colaborador FOREIGN KEY (colaborador_id)
        REFERENCES colaboradores (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- A aplicacao preenche data_conclusao ao concluir e mantem excluido_em
-- independente do status de negocio. Exclusao aprovada e logica.
CREATE TABLE pedido_itens (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id         INT UNSIGNED NOT NULL,
    tipo_produto_id   INT UNSIGNED NOT NULL,
    personalizacao_id INT UNSIGNED NULL,
    tecido_id         INT UNSIGNED NOT NULL,
    cor_id            INT UNSIGNED NOT NULL,
    local_arte_id     INT UNSIGNED NOT NULL,
    observacao        TEXT NULL,
    imagem_url        VARCHAR(2048) NULL,
    PRIMARY KEY (id),
    KEY idx_pedido_itens_pedido (pedido_id),
    KEY idx_pedido_itens_produto (tipo_produto_id),
    KEY idx_pedido_itens_personalizacao (personalizacao_id),
    KEY idx_pedido_itens_tecido (tecido_id),
    KEY idx_pedido_itens_cor (cor_id),
    KEY idx_pedido_itens_local (local_arte_id),
    CONSTRAINT fk_pedido_itens_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_pedido_itens_produto FOREIGN KEY (tipo_produto_id)
        REFERENCES catalogo_itens (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_pedido_itens_personalizacao FOREIGN KEY (personalizacao_id)
        REFERENCES catalogo_itens (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_pedido_itens_tecido FOREIGN KEY (tecido_id)
        REFERENCES catalogo_itens (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_pedido_itens_cor FOREIGN KEY (cor_id)
        REFERENCES catalogo_itens (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_pedido_itens_local FOREIGN KEY (local_arte_id)
        REFERENCES catalogo_itens (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- As FKs garantem a existencia do catalogo. A aplicacao valida seu tipo:
-- produto, personalizacao, tecido, cor ou local, conforme cada coluna.
CREATE TABLE pedido_item_tamanhos (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_item_id INT UNSIGNED NOT NULL,
    tamanho        VARCHAR(10) NOT NULL,
    quantidade     INT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_pedido_item_tamanhos_item (pedido_item_id),
    CONSTRAINT fk_pedido_item_tamanhos_item FOREIGN KEY (pedido_item_id)
        REFERENCES pedido_itens (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE estoque (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    tipo_item        ENUM('produto', 'material') NOT NULL,
    nome_item        VARCHAR(150) NOT NULL,
    categoria        VARCHAR(100) NULL,
    unidade_medida   VARCHAR(30) NULL,
    fornecedor       VARCHAR(150) NULL,
    quantidade_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
    estoque_minimo   DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_unitario   DECIMAL(10,2) NULL,
    observacoes      TEXT NULL,
    ativo            BOOLEAN NOT NULL DEFAULT 1,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_estoque_quantidade_nao_negativa CHECK (quantidade_atual >= 0),
    KEY idx_estoque_nome (nome_item),
    KEY idx_estoque_tipo_ativo (tipo_item, ativo),
    KEY idx_estoque_ativo_quantidade (ativo, quantidade_atual)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- O status disponivel/baixo/indisponivel e calculado pela consulta;
-- inativacao usa ativo=0. Toda mudanca de saldo registra uma movimentacao.
CREATE TABLE estoque_movimentacoes (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    estoque_id     INT UNSIGNED NOT NULL,
    tipo           ENUM('entrada', 'saida') NOT NULL,
    quantidade     DECIMAL(10,2) NOT NULL,
    motivo         TEXT NULL,
    colaborador_id INT UNSIGNED NOT NULL,
    data           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_estoque_movimentacoes_estoque_data (estoque_id, data),
    KEY idx_estoque_movimentacoes_colaborador (colaborador_id),
    KEY idx_estoque_movimentacoes_data (data),
    CONSTRAINT fk_estoque_movimentacoes_estoque FOREIGN KEY (estoque_id)
        REFERENCES estoque (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_estoque_movimentacoes_colaborador FOREIGN KEY (colaborador_id)
        REFERENCES colaboradores (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE solicitacoes (
    id                          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    tipo                        ENUM('edicao', 'exclusao') NOT NULL,
    pedido_id                   INT UNSIGNED NULL,
    estoque_id                  INT UNSIGNED NULL,
    colaborador_solicitante_id   INT UNSIGNED NOT NULL,
    dados_propostos             JSON NULL,
    status                      ENUM('pendente', 'aprovada', 'recusada') NOT NULL DEFAULT 'pendente',
    administrador_id            INT UNSIGNED NULL,
    data_solicitacao            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_decisao                DATETIME NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_solicitacoes_alvo_exclusivo CHECK (
        (pedido_id IS NOT NULL AND estoque_id IS NULL)
        OR (pedido_id IS NULL AND estoque_id IS NOT NULL)
    ),
    KEY idx_solicitacoes_pedido_status (pedido_id, status),
    KEY idx_solicitacoes_estoque_status (estoque_id, status),
    KEY idx_solicitacoes_solicitante (colaborador_solicitante_id),
    KEY idx_solicitacoes_administrador (administrador_id),
    KEY idx_solicitacoes_status_data (status, data_solicitacao),
    CONSTRAINT fk_solicitacoes_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_solicitacoes_estoque FOREIGN KEY (estoque_id)
        REFERENCES estoque (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_solicitacoes_solicitante FOREIGN KEY (colaborador_solicitante_id)
        REFERENCES colaboradores (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_solicitacoes_administrador FOREIGN KEY (administrador_id)
        REFERENCES colaboradores (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- A aplicacao impede duas solicitacoes pendentes simultaneas para o mesmo alvo.
-- Nao ha trigger nem alteracao automatica de negocio neste schema.
-- Transacoes na aplicacao devem abranger:
-- 1. pedido + itens + tamanhos;
-- 2. movimentacao + saldo, bloqueando o item com SELECT ... FOR UPDATE;
-- 3. aprovacao: aplicar alteracao real + registrar a decisao atomicamente.
-- As entidades centrais usam exclusao logica; as FKs RESTRICT preservam
-- pedidos, catalogo, estoque e seus relacionamentos enquanto referenciados.

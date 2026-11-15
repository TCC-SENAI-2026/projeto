-- Aplicar uma vez no banco existente antes de usar o fluxo.
ALTER TABLE solicitacoes
    ADD COLUMN cliente_id INT UNSIGNED NULL,
    ADD KEY idx_solicitacoes_cliente_status (cliente_id, status),
    ADD CONSTRAINT fk_solicitacoes_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    DROP CHECK chk_solicitacoes_alvo_exclusivo,
    ADD CONSTRAINT chk_solicitacoes_alvo_exclusivo CHECK (
        ((pedido_id IS NOT NULL) + (estoque_id IS NOT NULL) +
         (colaborador_alvo_id IS NOT NULL) + (cliente_id IS NOT NULL)) = 1
    );

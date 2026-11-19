-- Aplicar uma vez nos bancos existentes que ainda não têm estas colunas.
ALTER TABLE clientes
    ADD COLUMN responsavel VARCHAR(150) NULL AFTER nome,
    ADD COLUMN cpf_cnpj VARCHAR(18) NULL AFTER responsavel;

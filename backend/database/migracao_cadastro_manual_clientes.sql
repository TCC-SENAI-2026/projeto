-- Aplicar uma vez nos bancos existentes que ainda não têm esta coluna.
-- Os clientes existentes mantêm a visibilidade anterior como cadastro manual.
ALTER TABLE clientes ADD COLUMN cadastro_manual BOOLEAN NOT NULL DEFAULT 1 AFTER ativo;

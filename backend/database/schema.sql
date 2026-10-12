DROP DATABASE IF EXISTS ethreads_db;
CREATE DATABASE ethreads_db;
USE ethreads_db;

CREATE TABLE colaboradores (
    id_colaborador           INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo            VARCHAR(150)  NOT NULL,
    re                       VARCHAR(20)   UNIQUE,
    cpf                      VARCHAR(14)   UNIQUE,
    data_nascimento          DATE          NULL,
    telefone                 VARCHAR(20),
    email                    VARCHAR(150) , 
    endereco                 VARCHAR(255),
    nivel_acesso             VARCHAR(30)   NOT NULL DEFAULT 'padrao',
    data_contratacao         DATE          NULL,
    salario                  DECIMAL(10,2) NULL,
    senha_hash               VARCHAR(255),
    preferencia_notificacoes VARCHAR(20)   NOT NULL DEFAULT 'email',
    ativo                    TINYINT(1)    NOT NULL DEFAULT 1,
    criado_em                TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE colaboradores
    ADD COLUMN token_ativacao_hash VARCHAR(255) NULL,
    ADD COLUMN token_expira_em DATETIME NULL;

SELECT * FROM colaboradores;

CREATE TABLE clientes (
    id_cliente     INT NOT NULL AUTO_INCREMENT,
    nome_empresa   VARCHAR(100) NOT NULL,
    responsavel VARCHAR(100),
    cpf_cnpj        VARCHAR(18),
    telefone       VARCHAR(20),
    email          VARCHAR(100),
    cep            VARCHAR(9),
    rua            VARCHAR(150),
    numero         VARCHAR(10),
    municipio      VARCHAR(100),
    estado         CHAR(2),
    observacoes    VARCHAR(500),
    foto_logo      VARCHAR(255),
    ativo          TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id_cliente)
);

SELECT * FROM clientes;
SELECT * FROM clientes WHERE ativo=0;
SELECT id_cliente, nome_empresa, foto_logo FROM clientes; tudo oq temos
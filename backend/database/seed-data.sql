INSERT INTO categories (id, name, description) VALUES
    (1, 'Jogos Digitais', 'Jogos em formato digital para PC e consola.'),
    (2, 'Jogos Físicos', 'Edições físicas, novas e usadas.'),
    (3, 'Retrogaming', 'Jogos clássicos e colecionáveis.'),
    (4, 'Acessórios', 'Comandos, headsets e periféricos para jogar.');

INSERT INTO products (id, name, description, price, stock, image_url, active, category_id, created_at, updated_at, version) VALUES
    (1, 'PEAK', 'Jogo cooperativo de escalada com amigos e quedas caóticas.', 19.99, 35, 'cover-peak', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (2, 'R.E.P.O.', 'Horror cooperativo com física, sustos e voz por proximidade.', 14.99, 42, 'cover-repo', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (3, 'Content Warning', 'Filma criaturas assustadoras com amigos e tenta ficar famoso.', 9.99, 25, 'cover-content', TRUE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (4, 'Comando Wireless Pro', 'Comando sem fios compatível com PC e consola.', 49.90, 18, 'controller-pro', TRUE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (5, 'Pacote Retro 16-bit', 'Coleção física inspirada em clássicos de 16-bit.', 34.90, 8, 'retro-pack', TRUE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

INSERT INTO customers (id, name, email, password_hash, phone, address, role, enabled, created_at) VALUES
    (1, 'Administrador Checkpoint', 'admin@checkpoint.local', '$2a$10$QmCzKksPjK.qWHvYW962suDc2V7jubHWmkWl9ULnsnhADRekL9eBK', '210000000', 'Loja Checkpoint', 'ADMIN', TRUE, CURRENT_TIMESTAMP),
    (2, 'Cliente Demo', 'cliente@checkpoint.local', '$2a$10$Suq7ROmnmvJTGpo7WfiB7.u/MW8dRvuvGYEcF6NkWuUmhMwR6H/92', '910000000', 'Rua Demo, 1', 'CUSTOMER', TRUE, CURRENT_TIMESTAMP);

ALTER TABLE categories ALTER COLUMN id RESTART WITH 5;
ALTER TABLE products ALTER COLUMN id RESTART WITH 6;
ALTER TABLE customers ALTER COLUMN id RESTART WITH 3;

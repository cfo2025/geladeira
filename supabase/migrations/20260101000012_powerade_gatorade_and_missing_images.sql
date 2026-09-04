-- ============================================================================
-- Detalha Powerade e Gatorade por sabor (com foto) e completa a foto dos
-- produtos que ainda estavam sem imagem. Idempotente igual às anteriores.
--
-- Sem imagem encontrada para os 6 sabores de "Juninho — Coroa/Coca-Cola":
-- a marca Coroa não é vendida pelas grandes redes/varejo online (nem
-- Mercado Livre nem Carrefour têm o produto), então não achei foto
-- confiável de novo. Segue sem imagem por enquanto.
-- ============================================================================

-- ----------------------------------------------------------------------
-- Powerade: Frutas Tropicais, Mountain Blast, Limão, Laranja, Uva
-- ----------------------------------------------------------------------

delete from products where name = 'Powerade';
insert into products (name, category, price, image_url) values
  ('Powerade Frutas Tropicais', 'Bebida', 7.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/119707299-200-auto/3508c58be221451a979f2bcec8ad37db.jpg'),
  ('Powerade Mountain Blast', 'Bebida', 7.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/118849170-200-auto/50eac5c384194dfc970c94e7145223b0.jpg'),
  ('Powerade Limão', 'Bebida', 7.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/119516442-200-auto/aafab0a87fde4ec0b80b096595dcfc5e.jpg'),
  ('Powerade Laranja', 'Bebida', 7.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/119515829-200-auto/76e7a612ee4243d4b8beb7e4c372639d.jpg'),
  ('Powerade Uva', 'Bebida', 7.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/118743132-200-auto/af67cd5feb754ee2ab4971fff8579a2f.jpg');

-- ----------------------------------------------------------------------
-- Gatorade: Limão, Laranja, Uva, Morango e Maracujá, Tangerina
-- ----------------------------------------------------------------------

delete from products where name = 'Gatorade';
insert into products (name, category, price, image_url) values
  ('Gatorade Limão', 'Bebida', 7.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/118849759-200-auto/9c524192035f4771b943d85e1774ccc4.jpg'),
  ('Gatorade Laranja', 'Bebida', 7.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/119286825-200-auto/3d2a940e12c743bb816839cc274df8f9.jpg'),
  ('Gatorade Uva', 'Bebida', 7.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/118907727-200-auto/6f54643621754fa2a411513658dc948b.jpg'),
  ('Gatorade Morango e Maracujá', 'Bebida', 7.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/118848168-200-auto/918a6bb46c884b75af5cdc159f6a3665.jpg'),
  ('Gatorade Tangerina', 'Bebida', 7.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/118362430-200-auto/6f158438d8614a90b560aba4e1785219.jpg');

-- ----------------------------------------------------------------------
-- Fotos que faltavam nos demais produtos
-- ----------------------------------------------------------------------

update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/183191307-200-auto/image-0.jpg'
  where name = 'Coca-Cola Zero (Lata)';
update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/169438393-200-auto/9530a19e5e4e4e34818b75588cdb1ef5.jpg'
  where name = 'Guaraná Antarctica (Lata)';
update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/49895930-200-auto/c9230554652d43cfb1db7d7d500220a5.jpg'
  where name = 'Kit Kat Ao Leite';
update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/118906825-200-auto/5d19e490d2f84671b393fe36d9212aad.jpg'
  where name = 'Kit Kat Dark';
update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/31413579-200-auto/b37e2ba1b49b4eaa9a68373c464dc03a.jpg'
  where name = 'Kit Kat Branco';

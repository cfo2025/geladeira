-- ============================================================================
-- Detalha por sabor os produtos que ainda estavam genéricos e adiciona foto
-- (fundo branco, catálogo público do Carrefour) a cada um. Idempotente: cada
-- bloco apaga pelo nome exato antes de inserir, então rodar de novo não
-- duplica nada (e não falha se a migration 10 ainda não tiver sido aplicada).
--
-- Sem imagem encontrada para os 6 sabores de "Juninho" (marca Coroa não é
-- vendida pelas grandes redes/varejo online — não achei foto confiável).
-- ============================================================================

-- ----------------------------------------------------------------------
-- Monster: adiciona 3 sabores reais que faltavam + foto em todos os 7
-- ----------------------------------------------------------------------

update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/115297088-200-auto/78aca634a33d466f8fb65e05baadbca0.jpg'
  where name = 'Monster Ultra (Branco)';
update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/181474039-200-auto/image-0.jpg'
  where name = 'Monster Mango (Sem Açúcar)';
update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/204995962-200-auto/image-0.jpg'
  where name = 'Monster Rio Punch';
update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/115297090-200-auto/ab6923a3f23240bb88ac13d505b5f5c2.jpg'
  where name = 'Monster Pacific Punch';

delete from products where name in ('Monster Original (Verde)', 'Monster Absolutely Zero', 'Monster Ultra Violet');
insert into products (name, category, price, image_url) values
  ('Monster Original (Verde)', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/147567321-200-auto/c4fc2f877e8e48d2a25ea071c436113b.jpg'),
  ('Monster Absolutely Zero', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/181478692-200-auto/image-0.jpg'),
  ('Monster Ultra Violet', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/115302731-200-auto/4b590e33a37742a2b3bcedfdb176396c.jpg');

-- ----------------------------------------------------------------------
-- Bis Extra: Ao Leite, Dark, Oreo
-- ----------------------------------------------------------------------

delete from products where name = 'Bis Extra';
insert into products (name, category, price, image_url) values
  ('Bis Extra Ao Leite', 'Doce', 3.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/186172614-200-auto/image-0.jpg'),
  ('Bis Extra Dark', 'Doce', 3.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/183119927-200-auto/image-0.jpg'),
  ('Bis Extra Oreo', 'Doce', 3.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/183119925-200-auto/image-0.jpg');

-- ----------------------------------------------------------------------
-- Juninho: 6 sabores (sem foto — marca Coroa/mini Coca-Cola não encontrada
-- em varejo online com imagem confiável)
-- ----------------------------------------------------------------------

delete from products where name = 'Juninho';
insert into products (name, category, price) values
  ('Juninho - Guaraná Coroa', 'Bebida', 2.50),
  ('Juninho - Cola Coroa', 'Bebida', 2.50),
  ('Juninho - Laranja Coroa', 'Bebida', 2.50),
  ('Juninho - Uva Coroa', 'Bebida', 2.50),
  ('Juninho - Coca-Cola Zero', 'Bebida', 2.50),
  ('Juninho - Coca-Cola', 'Bebida', 2.50);

-- ----------------------------------------------------------------------
-- Red Bull: Original, Sugarfree, Zero, Tropical, Melancia
-- ----------------------------------------------------------------------

delete from products where name = 'Red Bull 250 ml';
insert into products (name, category, price, image_url) values
  ('Red Bull Original', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/160026770-200-auto/f9ab3e17cb014155b6ee39679e942b66.jpg'),
  ('Red Bull Sugarfree', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/100816400-200-auto/f5a3b41c25454923acf85a4313d80595.jpg'),
  ('Red Bull Zero', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/213986457-200-auto/image-0.jpg'),
  ('Red Bull Tropical Edition', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/181476729-200-auto/image-0.jpg'),
  ('Red Bull Melancia', 'Bebida', 11.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/183189807-200-auto/image-0.jpg');

-- ----------------------------------------------------------------------
-- Snickers: Original, Dark, Pé de Moleque (portfólio fixo no Brasil)
-- ----------------------------------------------------------------------

delete from products where name = 'Snickers';
insert into products (name, category, price, image_url) values
  ('Snickers Original', 'Doce', 3.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/115295741-200-auto/19d088f69ee347a3b3c85c2362a76270.jpg'),
  ('Snickers Dark', 'Doce', 3.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/115300411-200-auto/c59641b4205d4849882ad902df07febe.jpg'),
  ('Snickers Pé de Moleque', 'Doce', 3.50, 'https://carrefourbr.vtexassets.com/arquivos/ids/115438869-200-auto/64b6b7409abd45c09dc2cf40f6f0eb5c.jpg');

-- ----------------------------------------------------------------------
-- Whey Pro: 3 Corações, Nescau
-- ----------------------------------------------------------------------

delete from products where name = 'Whey Pro';
insert into products (name, category, price, image_url) values
  ('Whey Pro 3 Corações', 'Bebida', 7.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/119706604-200-auto/d03012e3c0e54c189cde07383414fc3e.jpg'),
  ('Whey Pro Nescau', 'Bebida', 7.00, 'https://carrefourbr.vtexassets.com/arquivos/ids/118902947-200-auto/e3a658a9701a42cb91833afec998c34d.jpg');

-- ----------------------------------------------------------------------
-- Toddynho: mantém o nome (é o apelido que todo mundo usa), só adiciona foto
-- (produto real é o Achocolatado Ibituruna)
-- ----------------------------------------------------------------------

update products set image_url = 'https://carrefourbr.vtexassets.com/arquivos/ids/118150893-200-auto/640daf3d19bc41baaf40802fc87bdd18.jpg'
  where name = 'Toddynho';

-- Idempotent demo reference data. Loaded in dev and test only (see
-- application.properties); production deployments create reference data
-- through the application.

insert into client (id, client_key, name, country, contact_name, created_at)
select '11111111-1111-4111-8111-111111111111', 'client-maison-textile',
       'Maison Textile', 'TN', 'Ines Baklouti', now()
where not exists (select 1 from client where client_key = 'client-maison-textile');

insert into client (id, client_key, name, country, contact_name, created_at)
select '22222222-2222-4222-8222-222222222222', 'client-atelier-nord',
       'Atelier du Nord', 'FR', 'Luc Martin', now()
where not exists (select 1 from client where client_key = 'client-atelier-nord');

insert into article (id, reference, label, client_id, size_type, unit, created_at)
select '33333333-3333-4333-8333-333333333333', 'ART-100',
       'Chemise popeline homme',
       (select id from client where client_key = 'client-maison-textile'),
       'Alpha', 'pcs', now()
where not exists (select 1 from article where lower(reference) = 'art-100');

insert into article (id, reference, label, client_id, size_type, unit, created_at)
select '44444444-4444-4444-8444-444444444444', 'ART-200',
       'Blouse lin femme',
       (select id from client where client_key = 'client-atelier-nord'),
       'Alpha', 'pcs', now()
where not exists (select 1 from article where lower(reference) = 'art-200');

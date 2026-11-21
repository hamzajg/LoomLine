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

insert into colour (id, code, label, created_at)
select '55555555-5555-4555-8555-555555555551', 'NOIR', 'Noir', now()
where not exists (select 1 from colour where lower(code) = 'noir');

insert into colour (id, code, label, created_at)
select '55555555-5555-4555-8555-555555555552', 'ECRU', 'Ecru', now()
where not exists (select 1 from colour where lower(code) = 'ecru');

insert into colour (id, code, label, created_at)
select '55555555-5555-4555-8555-555555555553', 'BLEU', 'Bleu roi', now()
where not exists (select 1 from colour where lower(code) = 'bleu');

insert into size (id, code, label, size_type, created_at)
select '66666666-6666-4666-8666-666666666661', 'S', 'S', 'Alpha', now()
where not exists (select 1 from size where lower(code) = 's' and lower(size_type) = 'alpha');

insert into size (id, code, label, size_type, created_at)
select '66666666-6666-4666-8666-666666666662', 'M', 'M', 'Alpha', now()
where not exists (select 1 from size where lower(code) = 'm' and lower(size_type) = 'alpha');

insert into size (id, code, label, size_type, created_at)
select '66666666-6666-4666-8666-666666666663', 'L', 'L', 'Alpha', now()
where not exists (select 1 from size where lower(code) = 'l' and lower(size_type) = 'alpha');

insert into size (id, code, label, size_type, created_at)
select '66666666-6666-4666-8666-666666666664', 'XL', 'XL', 'Alpha', now()
where not exists (select 1 from size where lower(code) = 'xl' and lower(size_type) = 'alpha');

insert into phase (id, code, label, created_at)
select '77777777-7777-4777-8777-777777777771', 'CUT', 'Cutting', now()
where not exists (select 1 from phase where lower(code) = 'cut');

insert into phase (id, code, label, created_at)
select '77777777-7777-4777-8777-777777777772', 'SEW', 'Sewing', now()
where not exists (select 1 from phase where lower(code) = 'sew');

insert into phase (id, code, label, created_at)
select '77777777-7777-4777-8777-777777777773', 'ASM', 'Assembly', now()
where not exists (select 1 from phase where lower(code) = 'asm');

insert into phase (id, code, label, created_at)
select '77777777-7777-4777-8777-777777777774', 'FIN', 'Finishing', now()
where not exists (select 1 from phase where lower(code) = 'fin');

insert into phase (id, code, label, created_at)
select '77777777-7777-4777-8777-777777777775', 'QC', 'Quality check', now()
where not exists (select 1 from phase where lower(code) = 'qc');

insert into phase (id, code, label, created_at)
select '77777777-7777-4777-8777-777777777776', 'PACK', 'Packing', now()
where not exists (select 1 from phase where lower(code) = 'pack');

insert into machine (id, reference, label, active, created_at)
select '88888888-8888-4888-8888-888888888881', 'MC-01', 'Overlock machine', true, now()
where not exists (select 1 from machine where lower(reference) = 'mc-01');

insert into machine (id, reference, label, active, created_at)
select '88888888-8888-4888-8888-888888888882', 'MC-02', 'Straight-stitch machine', true, now()
where not exists (select 1 from machine where lower(reference) = 'mc-02');

insert into machine (id, reference, label, active, created_at)
select '88888888-8888-4888-8888-888888888883', 'MC-03', 'Cutting table', true, now()
where not exists (select 1 from machine where lower(reference) = 'mc-03');

insert into machine (id, reference, label, active, created_at)
select '88888888-8888-4888-8888-888888888884', 'MC-04', 'Press station', false, now()
where not exists (select 1 from machine where lower(reference) = 'mc-04');

-- Order composition: colour/size reference data and order quantity lines.

create table colour (
    id         uuid primary key,
    code       text        not null,
    label      text        not null,
    created_at timestamptz not null
);

create unique index colour_code_lower_uq on colour (lower(code));

create table size (
    id         uuid primary key,
    code       text        not null,
    label      text        not null,
    size_type  text        not null,
    created_at timestamptz not null
);

create unique index size_code_type_lower_uq on size (lower(code), lower(size_type));

create table order_quantity_line (
    id         uuid primary key,
    order_id   uuid        not null references orders (id) on delete cascade,
    colour_id  uuid        not null references colour (id),
    size_id    uuid        not null references size (id),
    quantity   integer     not null,
    constraint order_quantity_line_positive check (quantity > 0),
    constraint order_quantity_line_unique unique (order_id, colour_id, size_id)
);

create index order_quantity_line_order_idx on order_quantity_line (order_id);

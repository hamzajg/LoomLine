-- Reference data and production orders.

create table client (
    id           uuid primary key,
    client_key   text        not null,
    name         text        not null,
    country      text,
    contact_name text,
    created_at   timestamptz not null,
    constraint client_key_uq unique (client_key)
);

create table article (
    id         uuid primary key,
    reference  text        not null,
    label      text        not null,
    client_id  uuid        not null references client (id),
    size_type  text,
    unit       text        not null,
    created_at timestamptz not null
);

create unique index article_reference_lower_uq on article (lower(reference));

create table orders (
    id         uuid primary key,
    reference  text        not null,
    client_id  uuid        not null references client (id),
    article_id uuid        not null references article (id),
    quantity   integer     not null,
    due_date   date        not null,
    status     text        not null,
    version    bigint      not null default 0,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint orders_quantity_positive check (quantity > 0),
    constraint orders_status_known check (
        status in ('DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    )
);

create unique index orders_reference_lower_uq on orders (lower(reference));

create table order_status_history (
    id          uuid primary key,
    order_id    uuid        not null references orders (id) on delete cascade,
    from_status text,
    to_status   text        not null,
    reason      text,
    changed_at  timestamptz not null,
    changed_by  text        not null
);

create index order_status_history_order_idx
    on order_status_history (order_id, changed_at);

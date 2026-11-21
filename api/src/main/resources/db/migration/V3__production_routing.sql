-- Production routing: phases, machines, and ordered routing steps per order.

create table phase (
    id         uuid primary key,
    code       text        not null,
    label      text        not null,
    created_at timestamptz not null
);

create unique index phase_code_lower_uq on phase (lower(code));
create unique index phase_label_lower_uq on phase (lower(label));

create table machine (
    id         uuid primary key,
    reference  text        not null,
    label      text        not null,
    active     boolean     not null default true,
    created_at timestamptz not null
);

create unique index machine_reference_lower_uq on machine (lower(reference));
create index machine_active_idx on machine (active);

create table order_routing_step (
    id           uuid primary key,
    order_id     uuid        not null references orders (id) on delete cascade,
    position     integer     not null,
    label        text        not null,
    phase_id     uuid        not null references phase (id),
    machine_id   uuid        references machine (id),
    repetitions  integer     not null,
    minutes      integer     not null,
    created_at   timestamptz not null,
    constraint order_routing_step_repetitions_positive check (repetitions > 0),
    constraint order_routing_step_minutes_positive check (minutes > 0),
    constraint order_routing_step_position_positive check (position > 0),
    constraint order_routing_step_unique unique (order_id, position)
);

create index order_routing_step_order_idx on order_routing_step (order_id, position);

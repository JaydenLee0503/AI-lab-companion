-- AI Lab Companion — shared experiment library.
--
-- Experiments are the shared core for both modes (Real Lab Guide / Simulation
-- Lab). Each row stores one experiment definition as JSONB, keyed by its id.
-- The browser reads this table directly with the public anon key, so RLS allows
-- anonymous SELECT only. Writes happen via migrations/seed (service role).

create table if not exists public.experiments (
    id         text primary key,
    data       jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.experiments enable row level security;

-- Public, read-only access. No login required; no other operation is exposed.
drop policy if exists "experiments are publicly readable" on public.experiments;
create policy "experiments are publicly readable"
    on public.experiments
    for select
    to anon, authenticated
    using (true);

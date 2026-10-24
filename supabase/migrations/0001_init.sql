-- ============================================================================
-- MIGRASI SKEMA DATABASE ACOPTIMIZER (SUPABASE / POSTGRESQL)
-- Gedung Fakultas Sains dan Teknologi (FST) UIN Syarif Hidayatullah Jakarta
-- ============================================================================

create type public.user_role as enum ('admin', 'operator', 'manager', 'viewer');
create type public.ac_mode as enum ('normal', 'eco', 'off');
create type public.device_mode as enum ('auto', 'override', 'monitor');
create type public.command_action as enum ('ac_normal', 'ac_eco', 'ac_off', 'set_temp', 'release');
create type public.command_status as enum ('pending', 'sent', 'acked', 'failed', 'expired');

-- 1. Tabel Master Ruangan Gedung FST (168 Slot Spasial Lantai 1 s/d 7)
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  slot_id     text not null unique,          -- Contoh: '6-U1' (Ruang Pilot R.601)
  name        text not null,                 -- Contoh: 'Ruang 601'
  floor       smallint not null,             -- 1 s/d 7
  kind        text not null default 'classroom',
  ac_power_kw numeric(4,2) not null default 1.20,
  device_id   text unique,                   -- 'esp32-r601' untuk 6-U1, null untuk non-IoT
  has_device  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 2. Tabel Status Real-Time Ruangan (Di-upsert oleh Backend MQTT Bridge)
create table if not exists public.room_state (
  slot_id             text primary key references public.rooms(slot_id) on delete cascade,
  online              boolean not null default false,
  is_demo             boolean not null default false,
  presence            boolean,
  temperature         numeric(4,1),
  humidity            numeric(4,1),
  minutes_empty       int not null default 0,
  ac_mode             public.ac_mode,
  target_temp         smallint,
  ir_action           text,
  dashboard_status    text,
  mode                public.device_mode not null default 'auto',
  rule                smallint,
  override_until      timestamptz,
  presence_changed_at timestamptz,
  ac_changed_at       timestamptz,
  rssi                int,
  firmware_version    text,
  last_seen           timestamptz,
  updated_at          timestamptz not null default now()
);

-- 3. Tabel Riwayat Telemetri Sensor (DHT22 + mmWave)
create table if not exists public.sensor_logs (
  id           bigint generated always as identity primary key,
  slot_id      text not null references public.rooms(slot_id) on delete cascade,
  recorded_at  timestamptz not null default now(),
  temperature  numeric(4,1),
  humidity     numeric(4,1),
  presence     boolean,
  minutes_empty int default 0,
  ac_mode      public.ac_mode,
  target_temp  smallint,
  rule         smallint,
  power_kw     numeric(4,2),
  is_demo      boolean not null default false
);
create index if not exists idx_sensor_logs_slot_time on public.sensor_logs (slot_id, recorded_at desc);

-- 4. Tabel Riwayat Perintah Remote Override (Web App -> Backend -> ESP32 IR)
create table if not exists public.commands (
  id           text primary key,             -- Contoh: 'cmd-1729600000'
  slot_id      text not null references public.rooms(slot_id) on delete cascade,
  action       public.command_action not null,
  target_temp  smallint,
  duration_min int not null default 60,
  status       public.command_status not null default 'pending',
  ir_action    text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz,
  acked_at     timestamptz,
  error        text
);

-- 5. Tabel Peringatan Dini / Alert Sistem (Anomali Panas, Lembur Malam, Pemborosan, Offline)
create table if not exists public.alerts (
  id              text primary key,
  slot_id         text not null references public.rooms(slot_id) on delete cascade,
  room_name       text not null,
  type            text not null check (type in ('after_hours_occupied','anomaly','waste','offline')),
  severity        text not null default 'warning',
  message         text not null,
  started_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  acknowledged    boolean not null default false
);

-- 6. Tabel Pengaturan Sistem Global
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

-- Seed Data Awal Ruang Pilot R.601 (Slot 6-U1)
insert into public.rooms (slot_id, name, floor, kind, ac_power_kw, device_id, has_device)
values ('6-U1', 'Ruang 601', 6, 'classroom', 1.20, 'esp32-r601', true)
on conflict (slot_id) do nothing;


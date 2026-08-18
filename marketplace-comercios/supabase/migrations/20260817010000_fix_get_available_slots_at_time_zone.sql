-- Fix: get_available_slots concatenaba p_date || ' ' || v_range_open (text)
-- y aplicaba AT TIME ZONE directo, pero esa cláusula requiere un timestamp
-- sin zona a la izquierda, no text. Postgres buscaba timezone(text, text),
-- que no existe -> 42883.
CREATE OR REPLACE FUNCTION "public"."get_available_slots"(
  "p_shop_id" uuid,
  "p_date" date
) RETURNS TABLE ("starts_at" timestamptz, "ends_at" timestamptz)
    LANGUAGE "plpgsql" SECURITY DEFINER STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_duration_minutes int;
  v_weekly_hours jsonb;
  v_timezone text;
  v_is_enabled boolean;
  v_weekday int;
  v_ranges jsonb;
  v_range jsonb;
  v_day_start timestamptz;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_range_open time;
  v_range_close time;
begin
  select slot_duration_minutes, weekly_hours, timezone, is_enabled
  into v_duration_minutes, v_weekly_hours, v_timezone, v_is_enabled
  from public.shop_booking_settings
  where shop_id = p_shop_id;

  if v_duration_minutes is null or v_is_enabled is distinct from true then
    return;
  end if;

  v_weekday := extract(dow from p_date);
  v_ranges := coalesce(v_weekly_hours -> v_weekday::text, '[]'::jsonb);
  v_day_start := p_date::timestamptz;

  for v_range in select * from jsonb_array_elements(v_ranges)
  loop
    v_range_open := (v_range ->> 'open')::time;
    v_range_close := (v_range ->> 'close')::time;

    v_slot_start := (p_date || ' ' || v_range_open)::timestamp AT TIME ZONE v_timezone;
    v_slot_end := v_slot_start + make_interval(mins => v_duration_minutes);

    while v_slot_end <= ((p_date || ' ' || v_range_close)::timestamp AT TIME ZONE v_timezone) loop
      if not exists (
        select 1 from public.appointments a
        where a.shop_id = p_shop_id
          and a.starts_at = v_slot_start
          and (
            a.status in ('confirmed', 'blocked', 'completed')
            or (a.status = 'pending' and a.hold_expires_at > now())
          )
      ) then
        starts_at := v_slot_start;
        ends_at := v_slot_end;
        return next;
      end if;

      v_slot_start := v_slot_end;
      v_slot_end := v_slot_start + make_interval(mins => v_duration_minutes);
    end loop;
  end loop;
end;
$$;

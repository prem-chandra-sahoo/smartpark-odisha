
-- Cleaner operating-hours rule for bookings
CREATE OR REPLACE FUNCTION public.create_booking(
  _slot_id uuid,
  _start_at timestamptz,
  _duration_hours numeric,
  _customer_name text,
  _customer_phone text,
  _customer_email text,
  _vehicle_number text
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_slot public.parking_slots;
  v_fac public.parking_facilities;
  v_end timestamptz;
  v_hourly numeric;
  v_daily numeric;
  v_amount numeric;
  v_local_start timestamp;
  v_local_end timestamp;
  v_booking public.bookings;
  v_code text;
  v_vehicle text := upper(regexp_replace(coalesce(_vehicle_number, ''), '[\s-]', '', 'g'));
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to book a parking slot.' USING ERRCODE = '28000';
  END IF;
  IF char_length(trim(coalesce(_customer_name, ''))) < 2 OR char_length(_customer_name) > 100 THEN
    RAISE EXCEPTION 'Please enter a valid name.' USING ERRCODE = '22023';
  END IF;
  IF coalesce(_customer_phone, '') !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Please enter a valid 10-digit Indian mobile number.' USING ERRCODE = '22023';
  END IF;
  IF coalesce(_customer_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(_customer_email) > 255 THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;
  IF v_vehicle !~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$' AND v_vehicle !~ '^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$' THEN
    RAISE EXCEPTION 'Please enter a valid vehicle registration number (e.g. OD02AB1234).' USING ERRCODE = '22023';
  END IF;
  IF _duration_hours IS NULL OR _duration_hours < 1 OR _duration_hours > 72 OR _duration_hours <> floor(_duration_hours) THEN
    RAISE EXCEPTION 'Parking duration must be between 1 and 72 whole hours.' USING ERRCODE = '22023';
  END IF;
  IF _start_at < now() - interval '10 minutes' THEN
    RAISE EXCEPTION 'Arrival time must be in the future.' USING ERRCODE = '22023';
  END IF;
  IF _start_at > now() + interval '30 days' THEN
    RAISE EXCEPTION 'Bookings can be made up to 30 days in advance.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_slot FROM public.parking_slots WHERE id = _slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected slot does not exist.' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_fac FROM public.parking_facilities WHERE id = v_slot.facility_id;
  IF v_fac.status <> 'verified' THEN
    RAISE EXCEPTION 'This facility is not accepting bookings.' USING ERRCODE = '42501';
  END IF;
  IF v_slot.state = 'unavailable' THEN
    RAISE EXCEPTION 'This slot is currently unavailable.' USING ERRCODE = 'P0001';
  END IF;
  IF v_slot.state = 'occupied' AND _start_at < now() + interval '3 hours' THEN
    RAISE EXCEPTION 'This slot is currently occupied. Please choose another slot.' USING ERRCODE = 'P0001';
  END IF;

  v_end := _start_at + make_interval(hours => _duration_hours::int);

  IF NOT v_fac.open_24h THEN
    v_local_start := _start_at AT TIME ZONE 'Asia/Kolkata';
    v_local_end := v_end AT TIME ZONE 'Asia/Kolkata';
    IF v_local_start::time < v_fac.opens_at
       OR v_local_end > (v_local_start::date + v_fac.closes_at) THEN
      RAISE EXCEPTION 'Booking must fit within operating hours (% – %).',
        to_char(v_fac.opens_at, 'HH24:MI'), to_char(v_fac.closes_at, 'HH24:MI') USING ERRCODE = '22023';
    END IF;
  END IF;

  IF v_slot.vehicle_type = 'two_wheeler' THEN
    v_hourly := v_fac.rate_2w_hourly; v_daily := v_fac.rate_2w_daily;
  ELSE
    v_hourly := v_fac.rate_4w_hourly; v_daily := v_fac.rate_4w_daily;
  END IF;
  IF v_hourly IS NOT NULL THEN
    v_amount := v_hourly * _duration_hours;
    IF v_daily IS NOT NULL THEN
      v_amount := least(v_amount, v_daily * ceil(_duration_hours / 24.0));
    END IF;
  ELSIF v_daily IS NOT NULL THEN
    v_amount := v_daily * ceil(_duration_hours / 24.0);
  END IF;

  v_code := 'SPO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  BEGIN
    INSERT INTO public.bookings (
      booking_code, user_id, facility_id, slot_id, customer_name, customer_phone, customer_email,
      vehicle_number, vehicle_type, start_at, end_at, duration_hours, estimated_amount, status
    ) VALUES (
      v_code, uid, v_fac.id, v_slot.id, trim(_customer_name), _customer_phone, lower(trim(_customer_email)),
      v_vehicle, v_slot.vehicle_type, _start_at, v_end, _duration_hours, v_amount, 'confirmed'
    ) RETURNING * INTO v_booking;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Sorry, this slot was just reserved for an overlapping time. Please pick another slot or time.'
      USING ERRCODE = 'P0001';
  END;

  RETURN v_booking;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, timestamptz, numeric, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, timestamptz, numeric, text, text, text, text) TO authenticated;

-- ===== DEMO DATA – clearly flagged with is_demo = true. Not real operators, not live. =====
INSERT INTO public.parking_facilities
  (id, owner_id, name, operator_name, operator_type, address, city, latitude, longitude, contact_phone, contact_email,
   description, rules, vehicle_types, is_covered, rate_2w_hourly, rate_2w_daily, rate_4w_hourly, rate_4w_daily,
   open_24h, opens_at, closes_at, cancellation_cutoff_hours, status, is_demo)
VALUES
  ('11111111-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'Demo Lot A – Patia', 'Sample Operator (Demo)', 'private',
   'Sample address, Patia area, Bhubaneswar (demo listing)', 'Bhubaneswar', 20.3540, 85.8200,
   '9000000001', 'demo@smartpark.example', 'Sample covered multi-level facility used to demonstrate SmartPark Odisha. Not a real operator.',
   E'Park only in your reserved slot.\nKeep your booking QR code ready at entry.\nNo overnight parking without a daily booking.',
   '{two_wheeler,four_wheeler}', true, 10, 60, 30, 200, false, '06:00', '23:00', 1, 'verified', true),
  ('11111111-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'Demo Lot B – Unit 3', 'Sample Operator (Demo)', 'municipal',
   'Sample address, Unit 3 area, Bhubaneswar (demo listing)', 'Bhubaneswar', 20.2700, 85.8420,
   '9000000002', 'demo@smartpark.example', 'Sample open-air lot used for demonstration only.',
   E'Follow attendant instructions.\nTwo-wheelers in marked bays only.',
   '{two_wheeler,four_wheeler}', false, 5, 40, 20, 150, false, '07:00', '22:00', 2, 'verified', true),
  ('11111111-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'Demo Lot C – Airport Road', 'Sample Operator (Demo)', 'private',
   'Sample address, Airport Road area, Bhubaneswar (demo listing)', 'Bhubaneswar', 20.2560, 85.8150,
   '9000000003', 'demo@smartpark.example', 'Sample 24-hour lot used for demonstration only.',
   E'24-hour facility.\nLong-stay parking available with daily rate.',
   '{four_wheeler}', true, NULL, NULL, 40, 300, true, '00:00', '23:59', 3, 'verified', true),
  ('11111111-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000',
   'Demo Lot D – Cantonment Road', 'Sample Operator (Demo)', 'private',
   'Sample address, Cantonment Road area, Cuttack (demo listing)', 'Cuttack', 20.4700, 85.8870,
   '9000000004', 'demo@smartpark.example', 'Sample lot used for demonstration only.',
   E'Helmet storage not provided.\nKeep vehicle locked.',
   '{two_wheeler,four_wheeler}', false, 5, 30, 20, 120, false, '06:00', '22:00', 1, 'verified', true),
  ('11111111-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000',
   'Demo Lot E – Station Area', 'Sample Operator (Demo)', 'railway',
   'Sample address, station area, Cuttack (demo listing)', 'Cuttack', 20.4640, 85.8790,
   '9000000005', 'demo@smartpark.example', 'Sample lot used for demonstration only.',
   E'Show booking QR at exit.',
   '{two_wheeler,four_wheeler}', true, 10, 50, 25, 180, true, '00:00', '23:59', 2, 'verified', true),
  ('11111111-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000',
   'Demo Lot F – Marine Drive', 'Sample Operator (Demo)', 'private',
   'Sample address, Marine Drive area, Puri (demo listing)', 'Puri', 19.7990, 85.8270,
   '9000000006', 'demo@smartpark.example', 'Sample beach-side lot used for demonstration only.',
   E'Do not leave valuables in the vehicle.\nSand on slot floors – drive slowly.',
   '{two_wheeler,four_wheeler}', false, 10, 50, 30, 200, false, '05:00', '23:00', 1, 'verified', true),
  ('11111111-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000',
   'Demo Lot G – Grand Road', 'Sample Operator (Demo)', 'municipal',
   'Sample address, Grand Road area, Puri (demo listing)', 'Puri', 19.8060, 85.8160,
   '9000000007', 'demo@smartpark.example', 'Sample lot used for demonstration only.',
   E'Footwear and mobile phones are not allowed inside the temple – plan accordingly.',
   '{two_wheeler,four_wheeler}', false, 10, 40, 40, 250, false, '04:30', '23:00', 2, 'verified', true),
  ('11111111-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000',
   'Demo Lot H – Konark', 'Sample Operator (Demo)', 'private',
   'Sample address, Konark (demo listing)', 'Konark', 19.8880, 86.0960,
   '9000000008', 'demo@smartpark.example', 'Sample lot used for demonstration only.',
   E'Tourist buses use the separate bay.',
   '{two_wheeler,four_wheeler}', false, 10, 40, 30, 150, false, '06:00', '20:00', 1, 'verified', true),
  ('11111111-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000',
   'Demo Lot I – Rourkela', 'Sample Operator (Demo)', 'mall',
   'Sample address, Rourkela (demo listing)', 'Rourkela', 22.2610, 84.8550,
   '9000000009', 'demo@smartpark.example', 'Sample covered lot used for demonstration only.',
   E'Covered basement parking.\nHeight limit 2.1 m.',
   '{two_wheeler,four_wheeler}', true, 10, 50, 30, 180, false, '09:00', '22:00', 1, 'verified', true),
  ('11111111-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000',
   'Demo Lot J – Sambalpur', 'Sample Operator (Demo)', 'hospital',
   'Sample address, Sambalpur (demo listing)', 'Sambalpur', 21.4680, 83.9800,
   '9000000010', 'demo@smartpark.example', 'Sample lot used for demonstration only.',
   E'Keep ambulance lanes clear at all times.',
   '{two_wheeler,four_wheeler}', false, 5, 30, 20, 100, true, '00:00', '23:59', 1, 'verified', true),
  ('11111111-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000',
   'Demo Lot K – Berhampur', 'Sample Operator (Demo)', 'private',
   'Sample address, Berhampur (demo listing)', 'Berhampur', 19.3150, 84.7930,
   '9000000011', 'demo@smartpark.example', 'Sample lot used for demonstration only.',
   E'Pay at exit if you overstay.',
   '{two_wheeler,four_wheeler}', false, 5, 30, 20, 120, false, '07:00', '22:00', 1, 'verified', true),
  ('11111111-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000',
   'Demo Lot L – Balasore', 'Sample Operator (Demo)', 'private',
   'Sample address, Balasore (demo listing)', 'Balasore', 21.4950, 86.9330,
   '9000000012', 'demo@smartpark.example', 'Sample lot used for demonstration only.',
   E'Two-wheeler bays near the entrance.',
   '{two_wheeler,four_wheeler}', true, 5, 30, 20, 120, false, '06:00', '22:00', 1, 'verified', true);

-- Demo slots: deterministic pattern so availability is obviously sample data
DO $$
DECLARE
  f record;
  fl text;
  floors text[];
  n2 int;
  n4 int;
  i int;
  ord int;
  st public.slot_state;
BEGIN
  FOR f IN SELECT id, is_covered, vehicle_types, row_number() OVER (ORDER BY id) AS rn
           FROM public.parking_facilities WHERE is_demo LOOP
    IF f.is_covered THEN floors := ARRAY['Ground', 'Level 1']; ELSE floors := ARRAY['Ground']; END IF;
    ord := 0;
    FOREACH fl IN ARRAY floors LOOP
      n4 := CASE WHEN 'four_wheeler' = ANY(f.vehicle_types) THEN 16 ELSE 0 END;
      n2 := CASE WHEN 'two_wheeler' = ANY(f.vehicle_types) THEN 8 ELSE 0 END;
      FOR i IN 1..n4 LOOP
        ord := ord + 1;
        st := CASE WHEN (i + f.rn) % 5 = 0 THEN 'occupied'::public.slot_state
                   WHEN (i * f.rn) % 13 = 0 THEN 'unavailable'::public.slot_state
                   WHEN f.rn % 4 = 0 AND i % 3 <> 0 THEN 'occupied'::public.slot_state
                   ELSE 'available'::public.slot_state END;
        INSERT INTO public.parking_slots (facility_id, floor_label, slot_code, vehicle_type, state, sort_order)
        VALUES (f.id, fl, CASE WHEN fl = 'Ground' THEN 'G' ELSE 'L1' END || '-C' || lpad(i::text, 2, '0'),
                'four_wheeler', st, ord);
      END LOOP;
      FOR i IN 1..n2 LOOP
        ord := ord + 1;
        st := CASE WHEN (i + f.rn) % 4 = 0 THEN 'occupied'::public.slot_state ELSE 'available'::public.slot_state END;
        INSERT INTO public.parking_slots (facility_id, floor_label, slot_code, vehicle_type, state, sort_order)
        VALUES (f.id, fl, CASE WHEN fl = 'Ground' THEN 'G' ELSE 'L1' END || '-B' || lpad(i::text, 2, '0'),
                'two_wheeler', st, ord);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

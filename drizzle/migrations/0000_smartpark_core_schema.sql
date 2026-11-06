
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.operator_type AS ENUM ('municipal', 'railway', 'airport', 'mall', 'hospital', 'private', 'other');
CREATE TYPE public.vehicle_kind AS ENUM ('two_wheeler', 'four_wheeler');
CREATE TYPE public.slot_state AS ENUM ('available', 'occupied', 'unavailable');
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled', 'completed');

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Roles =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- New user -> profile + 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Parking facilities =====
CREATE TABLE public.parking_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 120),
  operator_name text NOT NULL CHECK (char_length(operator_name) BETWEEN 2 AND 120),
  operator_type public.operator_type NOT NULL DEFAULT 'private',
  address text NOT NULL CHECK (char_length(address) BETWEEN 5 AND 300),
  city text NOT NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  google_maps_url text,
  contact_phone text NOT NULL,
  contact_email text,
  description text,
  rules text,
  vehicle_types public.vehicle_kind[] NOT NULL DEFAULT '{two_wheeler,four_wheeler}',
  is_covered boolean NOT NULL DEFAULT false,
  rate_2w_hourly numeric(10,2) CHECK (rate_2w_hourly >= 0),
  rate_2w_daily numeric(10,2) CHECK (rate_2w_daily >= 0),
  rate_4w_hourly numeric(10,2) CHECK (rate_4w_hourly >= 0),
  rate_4w_daily numeric(10,2) CHECK (rate_4w_daily >= 0),
  open_24h boolean NOT NULL DEFAULT false,
  opens_at time NOT NULL DEFAULT '06:00',
  closes_at time NOT NULL DEFAULT '22:00',
  cancellation_cutoff_hours integer NOT NULL DEFAULT 1 CHECK (cancellation_cutoff_hours BETWEEN 0 AND 72),
  images text[] NOT NULL DEFAULT '{}',
  status public.verification_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX parking_facilities_status_idx ON public.parking_facilities (status);
CREATE INDEX parking_facilities_owner_idx ON public.parking_facilities (owner_id);
CREATE INDEX parking_facilities_city_idx ON public.parking_facilities (city);

GRANT SELECT ON public.parking_facilities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_facilities TO authenticated;
GRANT ALL ON public.parking_facilities TO service_role;
ALTER TABLE public.parking_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sees verified facilities" ON public.parking_facilities FOR SELECT TO anon, authenticated
  USING (status = 'verified');
CREATE POLICY "Owners see own facilities" ON public.parking_facilities FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Admins see all facilities" ON public.parking_facilities FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners register facilities" ON public.parking_facilities FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update own facilities" ON public.parking_facilities FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins update facilities" ON public.parking_facilities FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete facilities" ON public.parking_facilities FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Guard: only admins can change verification fields. Owners editing identity fields
-- (name/address/location/operator) of a verified facility send it back to review.
CREATE OR REPLACE FUNCTION public.guard_facility_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin boolean := auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin');
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- migrations / service role
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.status := 'pending';
      NEW.is_demo := false;
      NEW.reviewed_by := NULL;
      NEW.reviewed_at := NULL;
      NEW.rejection_reason := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  NEW.owner_id := OLD.owner_id;
  IF NOT is_admin THEN
    NEW.status := OLD.status;
    NEW.is_demo := OLD.is_demo;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.rejection_reason := OLD.rejection_reason;
    IF (NEW.name, NEW.operator_name, NEW.operator_type, NEW.address, NEW.city, NEW.latitude, NEW.longitude)
       IS DISTINCT FROM
       (OLD.name, OLD.operator_name, OLD.operator_type, OLD.address, OLD.city, OLD.latitude, OLD.longitude)
       AND OLD.status <> 'pending' THEN
      NEW.status := 'pending';
      NEW.reviewed_by := NULL;
      NEW.reviewed_at := NULL;
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
    IF NEW.status <> 'rejected' THEN
      NEW.rejection_reason := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER parking_facilities_guard BEFORE INSERT OR UPDATE ON public.parking_facilities
  FOR EACH ROW EXECUTE FUNCTION public.guard_facility_fields();
CREATE TRIGGER parking_facilities_updated_at BEFORE UPDATE ON public.parking_facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Registering a facility gives the user the 'owner' role
CREATE OR REPLACE FUNCTION public.grant_owner_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.owner_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.owner_id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER parking_facilities_owner_role AFTER INSERT ON public.parking_facilities
  FOR EACH ROW EXECUTE FUNCTION public.grant_owner_role();

-- ===== Parking slots =====
CREATE TABLE public.parking_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.parking_facilities(id) ON DELETE CASCADE,
  floor_label text NOT NULL DEFAULT 'Ground',
  slot_code text NOT NULL CHECK (char_length(slot_code) BETWEEN 1 AND 20),
  vehicle_type public.vehicle_kind NOT NULL,
  state public.slot_state NOT NULL DEFAULT 'available',
  sort_order integer NOT NULL DEFAULT 0,
  sensor_id text,
  last_state_change timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, slot_code)
);
CREATE INDEX parking_slots_facility_idx ON public.parking_slots (facility_id);

GRANT SELECT ON public.parking_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_slots TO authenticated;
GRANT ALL ON public.parking_slots TO service_role;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sees slots of verified facilities" ON public.parking_slots FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.status = 'verified'));
CREATE POLICY "Owners see own slots" ON public.parking_slots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Owners insert own slots" ON public.parking_slots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Owners update own slots" ON public.parking_slots FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Owners delete own slots" ON public.parking_slots FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Admins manage slots" ON public.parking_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_slot_state()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.state IS DISTINCT FROM OLD.state THEN
    NEW.last_state_change = now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER parking_slots_state_touch BEFORE UPDATE ON public.parking_slots
  FOR EACH ROW EXECUTE FUNCTION public.touch_slot_state();

-- ===== Bookings =====
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.parking_facilities(id) ON DELETE RESTRICT,
  slot_id uuid NOT NULL REFERENCES public.parking_slots(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  vehicle_number text NOT NULL,
  vehicle_type public.vehicle_kind NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  duration_hours numeric(6,2) NOT NULL,
  estimated_amount numeric(10,2),
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    slot_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status = 'confirmed')
);
CREATE INDEX bookings_user_idx ON public.bookings (user_id);
CREATE INDEX bookings_facility_idx ON public.bookings (facility_id);

GRANT SELECT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own bookings" ON public.bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Owners see bookings at own facilities" ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Admins see all bookings" ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== Verification documents =====
CREATE TABLE public.verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.parking_facilities(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  document_type text NOT NULL,
  issuing_authority text NOT NULL,
  document_number text NOT NULL,
  issue_date date,
  expiry_date date,
  file_path text NOT NULL,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verification_documents_facility_idx ON public.verification_documents (facility_id);
GRANT SELECT, INSERT, DELETE ON public.verification_documents TO authenticated;
GRANT ALL ON public.verification_documents TO service_role;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners see own documents" ON public.verification_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Admins see all documents" ON public.verification_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners add documents" ON public.verification_documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.parking_facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Owners delete own documents" ON public.verification_documents FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

-- ===== Saved facilities =====
CREATE TABLE public.saved_facilities (
  user_id uuid NOT NULL,
  facility_id uuid NOT NULL REFERENCES public.parking_facilities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, facility_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_facilities TO authenticated;
GRANT ALL ON public.saved_facilities TO service_role;
ALTER TABLE public.saved_facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved" ON public.saved_facilities FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== Visibility helper =====
CREATE OR REPLACE FUNCTION public.can_view_facility(_facility_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parking_facilities f
    WHERE f.id = _facility_id
      AND (f.status = 'verified' OR f.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
$$;

-- ===== Availability stats (counts only, no personal data) =====
CREATE OR REPLACE FUNCTION public.facility_stats(_facility_ids uuid[])
RETURNS TABLE (
  facility_id uuid,
  total_slots integer,
  available_slots integer,
  occupied_slots integer,
  reserved_slots integer,
  unavailable_slots integer,
  total_2w integer,
  available_2w integer,
  total_4w integer,
  available_4w integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH s AS (
    SELECT sl.facility_id, sl.vehicle_type, sl.state,
      EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.slot_id = sl.id AND b.status = 'confirmed'
          AND b.start_at <= now() AND b.end_at > now()
      ) AS reserved_now
    FROM public.parking_slots sl
    WHERE sl.facility_id = ANY(_facility_ids)
      AND public.can_view_facility(sl.facility_id)
  )
  SELECT s.facility_id,
    count(*)::int,
    count(*) FILTER (WHERE s.state = 'available' AND NOT s.reserved_now)::int,
    count(*) FILTER (WHERE s.state = 'occupied')::int,
    count(*) FILTER (WHERE s.state = 'available' AND s.reserved_now)::int,
    count(*) FILTER (WHERE s.state = 'unavailable')::int,
    count(*) FILTER (WHERE s.vehicle_type = 'two_wheeler')::int,
    count(*) FILTER (WHERE s.vehicle_type = 'two_wheeler' AND s.state = 'available' AND NOT s.reserved_now)::int,
    count(*) FILTER (WHERE s.vehicle_type = 'four_wheeler')::int,
    count(*) FILTER (WHERE s.vehicle_type = 'four_wheeler' AND s.state = 'available' AND NOT s.reserved_now)::int
  FROM s
  GROUP BY s.facility_id
$$;
GRANT EXECUTE ON FUNCTION public.facility_stats(uuid[]) TO anon, authenticated;

-- Slots reserved during a time window (ids only)
CREATE OR REPLACE FUNCTION public.reserved_slot_ids(_facility_id uuid, _start timestamptz, _end timestamptz)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT b.slot_id FROM public.bookings b
  WHERE b.facility_id = _facility_id
    AND b.status = 'confirmed'
    AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(_start, _end, '[)')
    AND public.can_view_facility(_facility_id)
$$;
GRANT EXECUTE ON FUNCTION public.reserved_slot_ids(uuid, timestamptz, timestamptz) TO anon, authenticated;

-- ===== Atomic booking =====
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

  -- Lock the slot row so concurrent requests for the same slot serialise
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
    IF v_local_start::date <> v_local_end::date AND v_local_end::time <> '00:00'
       OR v_local_start::time < v_fac.opens_at
       OR (v_local_end::time > v_fac.closes_at AND v_local_end::date = v_local_start::date) THEN
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

CREATE OR REPLACE FUNCTION public.cancel_booking(_booking_id uuid)
RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_b public.bookings;
  v_cutoff integer;
  is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in.' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO v_b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND OR (v_b.user_id <> uid AND NOT is_admin) THEN
    RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
  END IF;
  IF v_b.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can be cancelled.' USING ERRCODE = 'P0001';
  END IF;
  SELECT cancellation_cutoff_hours INTO v_cutoff FROM public.parking_facilities WHERE id = v_b.facility_id;
  IF NOT is_admin AND now() > v_b.start_at - make_interval(hours => v_cutoff) THEN
    RAISE EXCEPTION 'This booking can no longer be cancelled (cancellation closes % hour(s) before arrival).', v_cutoff
      USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.bookings SET status = 'cancelled', cancelled_at = now() WHERE id = _booking_id RETURNING * INTO v_b;
  RETURN v_b;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

-- ===== Storage policies =====
CREATE POLICY "Owners upload verification docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners read own verification docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners delete own verification docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view facility images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'facility-images');
CREATE POLICY "Owners upload facility images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'facility-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete facility images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'facility-images' AND (storage.foldername(name))[1] = auth.uid()::text);

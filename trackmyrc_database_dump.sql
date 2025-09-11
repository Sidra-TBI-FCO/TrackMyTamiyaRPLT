--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

-- Started on 2025-09-11 09:44:45 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.photos DROP CONSTRAINT IF EXISTS photos_model_id_models_id_fk;
ALTER TABLE IF EXISTS ONLY public.models DROP CONSTRAINT IF EXISTS models_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.hop_up_parts DROP CONSTRAINT IF EXISTS hop_up_parts_photo_id_photos_id_fk;
ALTER TABLE IF EXISTS ONLY public.hop_up_parts DROP CONSTRAINT IF EXISTS hop_up_parts_model_id_models_id_fk;
ALTER TABLE IF EXISTS ONLY public.build_log_photos DROP CONSTRAINT IF EXISTS build_log_photos_photo_id_photos_id_fk;
ALTER TABLE IF EXISTS ONLY public.build_log_photos DROP CONSTRAINT IF EXISTS build_log_photos_build_log_entry_id_build_log_entries_id_fk;
ALTER TABLE IF EXISTS ONLY public.build_log_entries DROP CONSTRAINT IF EXISTS build_log_entries_model_id_models_id_fk;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.photos DROP CONSTRAINT IF EXISTS photos_pkey;
ALTER TABLE IF EXISTS ONLY public.models DROP CONSTRAINT IF EXISTS models_pkey;
ALTER TABLE IF EXISTS ONLY public.hop_up_parts DROP CONSTRAINT IF EXISTS hop_up_parts_pkey;
ALTER TABLE IF EXISTS ONLY public.build_log_photos DROP CONSTRAINT IF EXISTS build_log_photos_pkey;
ALTER TABLE IF EXISTS ONLY public.build_log_entries DROP CONSTRAINT IF EXISTS build_log_entries_pkey;
ALTER TABLE IF EXISTS public.photos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.models ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hop_up_parts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.build_log_photos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.build_log_entries ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.sessions;
DROP SEQUENCE IF EXISTS public.photos_id_seq;
DROP TABLE IF EXISTS public.photos;
DROP SEQUENCE IF EXISTS public.models_id_seq;
DROP TABLE IF EXISTS public.models;
DROP SEQUENCE IF EXISTS public.hop_up_parts_id_seq;
DROP TABLE IF EXISTS public.hop_up_parts;
DROP SEQUENCE IF EXISTS public.build_log_photos_id_seq;
DROP TABLE IF EXISTS public.build_log_photos;
DROP SEQUENCE IF EXISTS public.build_log_entries_id_seq;
DROP TABLE IF EXISTS public.build_log_entries;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 24577)
-- Name: build_log_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_log_entries (
    id integer NOT NULL,
    model_id integer NOT NULL,
    title text NOT NULL,
    content text,
    voice_note_url text,
    transcription text,
    entry_date timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    entry_number integer NOT NULL
);


--
-- TOC entry 215 (class 1259 OID 24576)
-- Name: build_log_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.build_log_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3420 (class 0 OID 0)
-- Dependencies: 215
-- Name: build_log_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_log_entries_id_seq OWNED BY public.build_log_entries.id;


--
-- TOC entry 218 (class 1259 OID 24588)
-- Name: build_log_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_log_photos (
    id integer NOT NULL,
    build_log_entry_id integer NOT NULL,
    photo_id integer NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 24587)
-- Name: build_log_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.build_log_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3421 (class 0 OID 0)
-- Dependencies: 217
-- Name: build_log_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.build_log_photos_id_seq OWNED BY public.build_log_photos.id;


--
-- TOC entry 220 (class 1259 OID 24595)
-- Name: hop_up_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hop_up_parts (
    id integer NOT NULL,
    model_id integer NOT NULL,
    name text NOT NULL,
    item_number text,
    category text NOT NULL,
    supplier text,
    cost numeric(10,2),
    installation_status text DEFAULT 'planned'::text NOT NULL,
    installation_date timestamp without time zone,
    notes text,
    photo_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_tamiya_brand boolean DEFAULT false,
    product_url text,
    tamiya_base_url text,
    compatibility text[] DEFAULT '{}'::text[],
    color text,
    material text,
    manufacturer text,
    store_urls jsonb DEFAULT '{}'::jsonb,
    quantity integer DEFAULT 1 NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 24594)
-- Name: hop_up_parts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hop_up_parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3422 (class 0 OID 0)
-- Dependencies: 219
-- Name: hop_up_parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hop_up_parts_id_seq OWNED BY public.hop_up_parts.id;


--
-- TOC entry 222 (class 1259 OID 24606)
-- Name: models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.models (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name text NOT NULL,
    item_number text NOT NULL,
    chassis text,
    release_year integer,
    build_status text DEFAULT 'planning'::text NOT NULL,
    total_cost numeric(10,2) DEFAULT '0'::numeric,
    box_art text,
    manual_url text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    scale text,
    drive_type text,
    chassis_material text,
    differential_type text,
    motor_size text,
    battery_type text,
    build_type text DEFAULT 'kit'::text NOT NULL,
    body_name text,
    body_item_number text,
    body_manufacturer text,
    tamiya_url text,
    tamiya_base_url text
);


--
-- TOC entry 221 (class 1259 OID 24605)
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3423 (class 0 OID 0)
-- Dependencies: 221
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;


--
-- TOC entry 224 (class 1259 OID 24619)
-- Name: photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photos (
    id integer NOT NULL,
    model_id integer NOT NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    url text NOT NULL,
    caption text,
    metadata jsonb,
    is_box_art boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 24618)
-- Name: photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3424 (class 0 OID 0)
-- Dependencies: 223
-- Name: photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.photos_id_seq OWNED BY public.photos.id;


--
-- TOC entry 227 (class 1259 OID 131106)
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 24631)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    email character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    updated_at timestamp without time zone DEFAULT now(),
    password character varying,
    auth_provider character varying DEFAULT 'email'::character varying NOT NULL,
    is_verified boolean DEFAULT false,
    verification_token character varying,
    reset_password_token character varying,
    reset_password_expires timestamp without time zone
);


--
-- TOC entry 225 (class 1259 OID 24630)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3425 (class 0 OID 0)
-- Dependencies: 225
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3209 (class 2604 OID 24580)
-- Name: build_log_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_log_entries ALTER COLUMN id SET DEFAULT nextval('public.build_log_entries_id_seq'::regclass);


--
-- TOC entry 3212 (class 2604 OID 24591)
-- Name: build_log_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_log_photos ALTER COLUMN id SET DEFAULT nextval('public.build_log_photos_id_seq'::regclass);


--
-- TOC entry 3213 (class 2604 OID 24598)
-- Name: hop_up_parts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hop_up_parts ALTER COLUMN id SET DEFAULT nextval('public.hop_up_parts_id_seq'::regclass);


--
-- TOC entry 3220 (class 2604 OID 24609)
-- Name: models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);


--
-- TOC entry 3227 (class 2604 OID 24622)
-- Name: photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos ALTER COLUMN id SET DEFAULT nextval('public.photos_id_seq'::regclass);


--
-- TOC entry 3403 (class 0 OID 24577)
-- Dependencies: 216
-- Data for Name: build_log_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.build_log_entries (id, model_id, title, content, voice_note_url, transcription, entry_date, created_at, entry_number) FROM stdin;
26	53	wheels are on	Hello I'm testing the voice on windows. 	\N	\N	2025-07-23 14:43:04.75	2025-07-24 12:09:59.308242	2
20	45	Test elani	   this this this car this car this car is this car is a this car is a without this car is a without this car is a without this car is a without this car is a without this car is a without and this car is a without and its this car is a without and its this car is a without and its a this car is a without and its a very this car is a without and its a very this car is a without and its a very cool this car is a without and its a very cool car this car is a without and its a very cool car this car is a without and its a very cool car this car is a without and its a very cool car and this car is a without and its a very cool car and this car is a without and its a very cool car and this car is a without and its a very cool car and its this car is a without and its a very cool car and its this car is a without and its a very cool car and its magnificant 	\N	\N	2025-07-23 15:10:35.221	2025-07-24 10:14:30.749371	1
21	48	test again		\N	\N	2025-07-23 14:40:09.851	2025-07-24 10:14:30.796385	1
22	48	wheels are on	Hello I'm testing the voice on windows. 	\N	\N	2025-07-23 14:43:04.75	2025-07-24 10:14:30.887776	2
23	48	final test	ok	\N	\N	2025-07-23 14:44:44.446	2025-07-24 10:14:30.976892	3
25	53	test again		\N	\N	2025-07-23 14:40:09.851	2025-07-24 12:09:59.212198	1
27	53	final test	ok	\N	\N	2025-07-23 14:44:44.446	2025-07-24 12:09:59.402457	3
28	54	Test elani	   this this this car this car this car is this car is a this car is a without this car is a without this car is a without this car is a without this car is a without this car is a without and this car is a without and its this car is a without and its this car is a without and its a this car is a without and its a very this car is a without and its a very this car is a without and its a very cool this car is a without and its a very cool car this car is a without and its a very cool car this car is a without and its a very cool car this car is a without and its a very cool car and this car is a without and its a very cool car and this car is a without and its a very cool car and this car is a without and its a very cool car and its this car is a without and its a very cool car and its this car is a without and its a very cool car and its magnificant 	\N	\N	2025-07-23 15:10:35.221	2025-07-24 12:37:48.259462	1
29	45	test pk	I'm sitting here with PK showing him. The construction of a new RC car which is going super well. 	\N	\N	2025-08-24 19:28:10.233	2025-08-24 19:29:07.460348	2
\.


--
-- TOC entry 3405 (class 0 OID 24588)
-- Dependencies: 218
-- Data for Name: build_log_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.build_log_photos (id, build_log_entry_id, photo_id) FROM stdin;
15	21	117
16	22	119
17	23	118
18	23	117
19	25	129
20	26	131
21	27	130
22	27	129
23	29	110
\.


--
-- TOC entry 3407 (class 0 OID 24595)
-- Dependencies: 220
-- Data for Name: hop_up_parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hop_up_parts (id, model_id, name, item_number, category, supplier, cost, installation_status, installation_date, notes, photo_id, created_at, is_tamiya_brand, product_url, tamiya_base_url, compatibility, color, material, manufacturer, store_urls, quantity) FROM stdin;
48	44	7075 Aluminum Universal Steel Shaft Swing 30mm	TAMC-008BU	Drivetrain	RC Mart	10.90	installed	\N		\N	2025-07-24 10:14:31.110718	f	https://www.rcmart.com/yeah-racing-7075-aluminum-universal-steel-shaft-swing-30mm-for-tamiya-m05-m06-mf01x-tamc-008bu-00059572		{M05,M06,MF01X}	Black and Blue	Aluminum	Yeah Racing	{}	1
49	44	Aluminum Motor Mount	54660	Motor	RC Mart	13.80	installed	\N		\N	2025-07-24 10:14:31.158553	t	https://www.rcmart.com/tamiya-mf01x-aluminum-motor-mount-blue-54660-00063371		{MF01X}	Blue	Aluminum		{}	1
50	45	Yeah racing steel bearing set 22pcs	YBS-0048	Drivetrain	RC Mart	12.50	installed	\N		\N	2025-07-24 10:14:31.203543	f	https://www.rcmart.com/yeah-racing-steel-bearing-set-22pcs-for-tamiya-ta01-ta02-df01-ybs-0048-00126330		{TA01,DF01,TA02}		Steel	Yeah Racing	{}	1
51	45	Xtra Speed Aluminum Front Uprights	XS-TA29171RD	Drivetrain	RC Mart	15.90	installed	\N		\N	2025-07-24 10:14:31.248486	f	https://www.rcmart.com/xtra-speed-damper-set-for-tamiya-super-hot-shot-xs-ta29171sv-00130939		{TA29171,TA02}	Red	Aluminum	Xtra Speed	{}	1
52	45	Carbon chassis conversion	47479	Chassis	RC Mart	86.90	installed	\N		\N	2025-07-24 10:14:31.293765	t	https://www.rcmart.com/tamiya-ta02-carbon-chassis-conversion-47479-00112749		{TA02}		Carbon Fiber	Tamiya	{}	1
53	45	Servo Saver High Torque	51000	Servo	RC Mart	8.99	installed	\N		\N	2025-07-24 10:14:31.339038	t	https://www.rcmart.com/tamiya-servo-saver-high-torque-type-black-51000-00014487		{}	Black	Plastic & Steel	Tamiya	{}	1
54	45	Aluminum Modified Motor Mount (16-21T)	TA01-013BU	Motor	RC Mart	11.00	installed	\N		\N	2025-07-24 10:14:31.383899	f	https://www.rcmart.com/yeah-racing-alum-modified-motor-mount-16-21t-for-ta01-ta02-df01-top-force-manta-ray-ta01-013bu-00027517		{TA01,TA02,DF01}	Blue	Aluminum	Yeah Racing	{}	1
55	45	55mm Low Friction Aluminium Damper Set	 53155	Suspension	RC Mart	20.30	installed	\N		\N	2025-07-24 10:14:31.429014	t	https://www.rcmart.com/tamiya-55mm-low-friction-alu-damper-set-53155-00017414		{}	Pink	Aluminium	Tamiya	{}	2
56	45	Xtra speed aluminum main drive shaft g45 steel	XS-TA29143BK	Drivetrain	RC Mart	10.50	installed	\N		\N	2025-07-24 10:14:31.474812	f	https://www.rcmart.com/xtra-speed-aluminum-main-drive-shaft-w-g45-steel-joint-black-for-tamiya-ta02-xs-ta29143bk-00126640		{TA02}	Black	Aluminum	Xtra Speed	{}	1
57	45	Aluminum Hex Adaptor Set 12x5.5mm	WA-032RD	Wheels	RC Mart	9.87	installed	\N		\N	2025-07-24 10:14:31.519676	f	https://www.rcmart.com/yeah-racing-aluminum-hex-adaptor-set-12x5-5mm-for-1-10-rc-touring-drift-crawler-red-wa-032rd-00076831		{}	Red	Aluminum	Yeah Racing	{}	1
58	48	Aluminum Servo Stays 	XS-TA29091BK	Servo	RC Mart	5.99	installed	\N		\N	2025-07-24 10:14:31.563437	f	https://www.rcmart.com/xtra-speed-aluminum-servo-stays-black-for-tamiya-top-force-super-astute-grasshopper-egress-buggy-kyosho-xs-ta29091bk-00114116		{}	Black	Aluminum	Xtra Speed	{}	1
59	48	Aluminum Wing Washers	54848	Body	RC Mart	10.80	installed	\N		\N	2025-07-24 10:14:31.608117	t	https://www.rcmart.com/tamiya-aluminum-wing-washers-black-54848-00081073		{}	Black	Aluminum	Tamiya	{}	1
60	48	Clamp Type Aluminium Wheel Hub 5mm 	53823	Wheels	RC Mart	15.70	installed	\N		\N	2025-07-24 10:14:31.65298	t	https://www.rcmart.com/tamiya-clamp-type-alum-wheel-hub-5mm-53823-00016433		{}	Blue	Aluminium	Tamiya	{}	1
61	48	Aluminum Main Drive Shaft	XS-TA29151SV	Drivetrain	RC Mart	11.50	installed	\N		\N	2025-07-24 10:14:31.697921	f	https://www.rcmart.com/xtra-speed-aluminum-main-drive-shaft-w-g45-steel-joint-red-for-tamiya-ta01-top-force-xs-ta29151sv-00127566		{TA29,DF01,TA01}	Silver	Aluminum	Xtra Speed	{}	1
62	49	7075 Aluminum Universal Steel Shaft Swing 30mm	TAMC-008BU	Drivetrain	RC Mart	10.90	installed	\N		\N	2025-07-24 12:09:59.541468	f	https://www.rcmart.com/yeah-racing-7075-aluminum-universal-steel-shaft-swing-30mm-for-tamiya-m05-m06-mf01x-tamc-008bu-00059572		{M05,M06,MF01X}	Black and Blue	Aluminum	Yeah Racing	{}	1
63	49	Aluminum Motor Mount	54660	Motor	RC Mart	13.80	installed	\N		\N	2025-07-24 12:09:59.59153	t	https://www.rcmart.com/tamiya-mf01x-aluminum-motor-mount-blue-54660-00063371		{MF01X}	Blue	Aluminum		{}	1
76	57	Tamiya 1280 Sealed Ball Bearings Pcs 42375	MIYA-1280	Drivetrain	RC Mart	8.50	planned	\N		\N	2025-07-26 08:56:16.298392	t	https://www.rcmart.com/tamiya-1280-sealed-ball-bearings-2-pcs-42375-00111484		{}			Tamiya	{}	1
72	53	Aluminum Servo Stays 	XS-TA29091BK	Servo	RC Mart	5.99	installed	\N		\N	2025-07-24 12:10:00.01684	f	https://www.rcmart.com/xtra-speed-aluminum-servo-stays-black-for-tamiya-top-force-super-astute-grasshopper-egress-buggy-kyosho-xs-ta29091bk-00114116		{}	Black	Aluminum	Xtra Speed	{}	1
73	53	Aluminum Wing Washers	54848	Body	RC Mart	10.80	installed	\N		\N	2025-07-24 12:10:00.063744	t	https://www.rcmart.com/tamiya-aluminum-wing-washers-black-54848-00081073		{}	Black	Aluminum	Tamiya	{}	1
74	53	Clamp Type Aluminium Wheel Hub 5mm 	53823	Wheels	RC Mart	15.70	installed	\N		\N	2025-07-24 12:10:00.11075	t	https://www.rcmart.com/tamiya-clamp-type-alum-wheel-hub-5mm-53823-00016433		{}	Blue	Aluminium	Tamiya	{}	1
75	53	Aluminum Main Drive Shaft	XS-TA29151SV	Drivetrain	RC Mart	11.50	installed	\N		\N	2025-07-24 12:10:00.158886	f	https://www.rcmart.com/xtra-speed-aluminum-main-drive-shaft-w-g45-steel-joint-red-for-tamiya-ta01-top-force-xs-ta29151sv-00127566		{TA29,DF01,TA01}	Silver	Aluminum	Xtra Speed	{}	1
\.


--
-- TOC entry 3409 (class 0 OID 24606)
-- Dependencies: 222
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.models (id, user_id, name, item_number, chassis, release_year, build_status, total_cost, box_art, manual_url, notes, created_at, updated_at, tags, scale, drive_type, chassis_material, differential_type, motor_size, battery_type, build_type, body_name, body_item_number, body_manufacturer, tamiya_url, tamiya_base_url) FROM stdin;
44	204924ed-d74b-4dfe-8b82-e50e5e4540a5	Volkswagen Golf II GtI 16V	58714	MF-01X	\N	built	92.90	\N	\N		2025-07-24 10:14:29.972741	2025-07-24 10:14:29.972741	{Rally,Mini}	1/10	4WD	Plastic		540	7.4V LiPo 2S	kit	\N	\N	\N	\N	\N
45	204924ed-d74b-4dfe-8b82-e50e5e4540a5	Opel Calibra V6	47461	TA-02	2021	building	229.10	\N	\N		2025-07-24 10:14:30.019179	2025-07-24 10:14:30.019179	{Touring,Re-Release}	1/10	4WD	Carbon Fiber	Ball Diff	540	7.4V LiPo 2S	kit	\N	\N	\N	\N	\N
46	204924ed-d74b-4dfe-8b82-e50e5e4540a5	XV-02 Pro 	58707	XV-02	2019	built	229.97	\N	\N		2025-07-24 10:14:30.064837	2025-07-24 10:14:30.064837	{Rally}	1/10	4WD	Plastic	Ball Diff	540	7.4V LiPo 2S	custom	Tamiya Audi Quattro Rallye A2	51615	Tamiya	https://www.tamiya.com/english/products/58707/index.html	https://tamiyabase.com/tamiya-models/58707-58707
47	204924ed-d74b-4dfe-8b82-e50e5e4540a5	XM-01 Pro	58738	XM-01	\N	planning	185.90	\N	\N		2025-07-24 10:14:30.111989	2025-07-24 10:14:30.111989	{Minni,Rally}	1/10	4WD	Plastic	Gears	540	7.4V LiPo 2S	custom				https://www.tamiya.com/english/products/58738/index.html	https://tamiyabase.com/tamiya-models/58738-58738
48	204924ed-d74b-4dfe-8b82-e50e5e4540a5	Top-Force Evo	47470	DF-01	2021	built	309.90	\N	\N		2025-07-24 10:14:30.160856	2025-07-24 10:14:30.160856	{Buggy,Re-Release}	1/10	4WD	Carbon Fiber	Ball Diff		7.4V LiPo 2S	kit					
49	dev-user-123	Volkswagen Golf II GtI 16V	58714	MF-01X	\N	built	92.90	\N	\N		2025-07-24 12:09:58.332499	2025-07-24 12:09:58.332499	{Rally,Mini}	1/10	4WD	Plastic		540	7.4V LiPo 2S	kit	\N	\N	\N	\N	\N
51	dev-user-123	XV-02 Pro 	58707	XV-02	2019	built	229.97	\N	\N		2025-07-24 12:09:58.444867	2025-07-24 12:09:58.444867	{Rally}	1/10	4WD	Plastic	Ball Diff	540	7.4V LiPo 2S	custom	Tamiya Audi Quattro Rallye A2	51615	Tamiya	https://www.tamiya.com/english/products/58707/index.html	https://tamiyabase.com/tamiya-models/58707-58707
52	dev-user-123	XM-01 Pro	58738	XM-01	\N	planning	185.90	\N	\N		2025-07-24 12:09:58.493761	2025-07-24 12:09:58.493761	{Minni,Rally}	1/10	4WD	Plastic	Gears	540	7.4V LiPo 2S	custom				https://www.tamiya.com/english/products/58738/index.html	https://tamiyabase.com/tamiya-models/58738-58738
53	dev-user-123	Top-Force Evo	47470	DF-01	2021	built	309.90	\N	\N		2025-07-24 12:09:58.543215	2025-07-24 12:09:58.543215	{Buggy,Re-Release}	1/10	4WD	Carbon Fiber	Ball Diff		7.4V LiPo 2S	kit					
54	dev-user-123	Opel Calibra V6	47461	TA-02	2021	building	229.10	\N	\N		2025-07-24 12:37:43.84629	2025-07-24 12:37:43.84629	{Touring,Re-Release}	1/10	4WD	Carbon Fiber	Ball Diff	540	7.4V LiPo 2S	kit	\N	\N	\N	\N	\N
56	204924ed-d74b-4dfe-8b82-e50e5e4540a5	Lancia Delta HF Integrale	58117	TA-01	1992	built	0.00	\N	\N		2025-07-25 08:59:52.831791	2025-07-25 08:59:52.831791	{Rally,Vintage}	1/10	4WD	Plastic	Ball Diff	17.5T	7.4V LiPo 2S	custom	Toyota Celica GT-4	51708	Tamiya		https://tamiyabase.com/tamiya-models/58117-58117
55	204924ed-d74b-4dfe-8b82-e50e5e4540a5	Lancia Delta HF Integrale	58117	TA-01	1992	built	0.00	\N	\N	Shelf Queen	2025-07-25 08:36:32.998535	2025-07-25 09:03:24.227	{Rally,Vintage}	1/10	4WD	Plastic	Ball Diff	540	7.2V NiMH	kit					https://tamiyabase.com/tamiya-models/58117
57	36c2c2a2-d7f4-4d42-a770-5989e7925126	Tamiya classic car R/C r	47510	TT-02	\N	planning	109.00	\N	\N		2025-07-26 08:51:21.402272	2025-07-26 08:51:21.402272	{Rally,Competition,Carbon,4WD}	1/10	4WD	Plastic				kit					
\.


--
-- TOC entry 3411 (class 0 OID 24619)
-- Dependencies: 224
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.photos (id, model_id, filename, original_name, url, caption, metadata, is_box_art, sort_order, created_at) FROM stdin;
135	55	photos-1753432756623-821113722.jpg	1000040927.jpg	/api/files/photos-1753432756623-821113722.jpg	\N	\N	t	0	2025-07-25 08:39:17.368923
138	55	photos-1753433462066-539514530.jpg	1000040930.jpg	/api/files/photos-1753433462066-539514530.jpg	\N	\N	f	0	2025-07-25 08:51:04.496444
139	55	photos-1753433464897-115626487.jpg	1000040929.jpg	/api/files/photos-1753433464897-115626487.jpg	\N	\N	f	0	2025-07-25 08:51:06.173806
140	55	photos-1753433466743-658257991.jpg	1000040928.jpg	/api/files/photos-1753433466743-658257991.jpg	\N	\N	f	0	2025-07-25 08:51:11.403238
108	44	photos-1753184575086-225670850.jpg	golf2box.jpg	/api/files/photos-1753184575086-225670850.jpg	\N	\N	f	0	2025-07-24 10:14:30.207812
109	45	photos-1753087604781-888234650.jpg	1000040759.jpg	/api/files/photos-1753087604781-888234650.jpg	\N	\N	f	0	2025-07-24 10:14:30.257143
110	45	photos-1753087607760-646616505.jpg	1000040755.jpg	/api/files/photos-1753087607760-646616505.jpg	\N	\N	f	0	2025-07-24 10:14:30.302489
111	45	photos-1753087599109-548382228.jpg	1000040803.jpg	/api/files/photos-1753087599109-548382228.jpg	\N	\N	t	0	2025-07-24 10:14:30.34727
112	46	photos-1753178308286-962971065.jpg	box_58707_01.jpg	/api/files/photos-1753178308286-962971065.jpg	\N	\N	t	0	2025-07-24 10:14:30.392221
113	46	photos-1753189876417-740213910.jpg	s-l1200.jpg	/api/files/photos-1753189876417-740213910.jpg	\N	\N	t	0	2025-07-24 10:14:30.437324
114	46	photos-1753189877182-420599299.jpg	s-l400.jpg	/api/files/photos-1753189877182-420599299.jpg	\N	\N	f	0	2025-07-24 10:14:30.483238
115	47	photos-1753275942746-617118868.jpg	58738 Tamiya XM01 review Tips Build (3).jpg	/api/files/photos-1753275942746-617118868.jpg	\N	\N	t	0	2025-07-24 10:14:30.527853
116	48	photos-1753089207109-833307332.jpg	1000040813.jpg	/api/files/photos-1753089207109-833307332.jpg	\N	\N	t	0	2025-07-24 10:14:30.571273
117	48	photos-1753175370589-815056120.jpg	PXL_20250404_121646838.jpg	/api/files/photos-1753175370589-815056120.jpg	\N	\N	f	0	2025-07-24 10:14:30.616021
118	48	photos-1753175373574-385532310.jpg	PXL_20250404_124455415.jpg	/api/files/photos-1753175373574-385532310.jpg	\N	\N	f	0	2025-07-24 10:14:30.66078
119	48	photos-1753175375043-875804105.jpg	PXL_20250404_124500850.jpg	/api/files/photos-1753175375043-875804105.jpg	\N	\N	f	0	2025-07-24 10:14:30.705471
120	49	photos-1753184575086-225670850.jpg	golf2box.jpg	/api/files/photos-1753184575086-225670850.jpg	\N	\N	f	0	2025-07-24 12:09:58.591024
142	56	photos-1753434132748-943660994.jpg	1000040933.jpg	/api/files/photos-1753434132748-943660994.jpg	\N	\N	t	0	2025-07-25 09:02:15.29534
143	57	photos-1753519993543-209231233.png	IMG_0166.png	/api/files/photos-1753519993543-209231233.png	\N	\N	f	0	2025-07-26 08:53:14.139755
124	51	photos-1753178308286-962971065.jpg	box_58707_01.jpg	/api/files/photos-1753178308286-962971065.jpg	\N	\N	t	0	2025-07-24 12:09:58.783142
125	51	photos-1753189876417-740213910.jpg	s-l1200.jpg	/api/files/photos-1753189876417-740213910.jpg	\N	\N	t	0	2025-07-24 12:09:58.83011
126	51	photos-1753189877182-420599299.jpg	s-l400.jpg	/api/files/photos-1753189877182-420599299.jpg	\N	\N	f	0	2025-07-24 12:09:58.877322
127	52	photos-1753275942746-617118868.jpg	58738 Tamiya XM01 review Tips Build (3).jpg	/api/files/photos-1753275942746-617118868.jpg	\N	\N	t	0	2025-07-24 12:09:58.923944
128	53	photos-1753089207109-833307332.jpg	1000040813.jpg	/api/files/photos-1753089207109-833307332.jpg	\N	\N	t	0	2025-07-24 12:09:58.972972
129	53	photos-1753175370589-815056120.jpg	PXL_20250404_121646838.jpg	/api/files/photos-1753175370589-815056120.jpg	\N	\N	f	0	2025-07-24 12:09:59.020424
130	53	photos-1753175373574-385532310.jpg	PXL_20250404_124455415.jpg	/api/files/photos-1753175373574-385532310.jpg	\N	\N	f	0	2025-07-24 12:09:59.067238
131	53	photos-1753175375043-875804105.jpg	PXL_20250404_124500850.jpg	/api/files/photos-1753175375043-875804105.jpg	\N	\N	f	0	2025-07-24 12:09:59.114046
132	54	photos-1753087604781-888234650.jpg	1000040759.jpg	/api/files/photos-1753087604781-888234650.jpg	\N	\N	f	0	2025-07-24 12:37:46.502769
133	54	photos-1753087607760-646616505.jpg	1000040755.jpg	/api/files/photos-1753087607760-646616505.jpg	\N	\N	f	0	2025-07-24 12:37:46.502769
134	54	photos-1753087599109-548382228.jpg	1000040803.jpg	/api/files/photos-1753087599109-548382228.jpg	\N	\N	t	0	2025-07-24 12:37:46.502769
\.


--
-- TOC entry 3414 (class 0 OID 131106)
-- Dependencies: 227
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
nYvLwfvWTkj32psMIUyrZqkcHtRF0_KH	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-31T19:31:02.922Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-08-31 19:32:41
tabOqDNIAGMEN4uQlWN0LmEIe1VLcp7x	{"cookie": {"path": "/", "secure": true, "expires": "2025-08-31T19:34:42.796Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "204924ed-d74b-4dfe-8b82-e50e5e4540a5", "email": "fluodude@gmail.com", "last_name": "Hendrickx", "first_name": "Wouter", "profile_image_url": null}, "expires_at": 1756150482, "access_token": "email-auth-token"}}}	2025-08-31 19:35:02
\.


--
-- TOC entry 3413 (class 0 OID 24631)
-- Dependencies: 226
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, created_at, email, first_name, last_name, profile_image_url, updated_at, password, auth_provider, is_verified, verification_token, reset_password_token, reset_password_expires) FROM stdin;
42719141	2025-07-24 09:19:43.434866	wouterhendrickx79@gmail.com	Wouter	Hendrickx	\N	2025-07-24 09:19:43.434866	\N	email	f	\N	\N	\N
204924ed-d74b-4dfe-8b82-e50e5e4540a5	2025-07-24 10:00:03.56499	fluodude@gmail.com	Wouter	Hendrickx	\N	2025-07-24 10:00:03.56499	$2b$12$cKv1JmlEJ/DpRgrm5xftCevaYhkmWvhdNKw2Si43jMPfzFU8hX44y	email	f	0493bc653e7cec0150d74e71af92c3e1b5ef8c09c0483bda3f21eb3adfa4ac12	\N	\N
dev-user-123	2025-07-24 10:12:57.508132	developer@tamiya.test	Test	User	https://replit.com/public/images/evalMarkIcon.png	2025-07-24 10:12:57.508132	\N	email	f	\N	\N	\N
3f7fbc92-9f9c-42ec-afa7-fdee2c53dc61	2025-07-24 14:27:18.20885	elanihendrickx@gmail.com	Elani	Hendrick	\N	2025-07-24 14:27:18.20885	$2b$12$eZAnGGJ6TPTa7kVVwSo8GukgwgarS6hJS1JmSMYZfYqvcbYVyErDy	email	f	29a3d8af3e702bab0ef9022699af0dc7d34b91b00419bc5d96f25b45fb20c9e5	\N	\N
36c2c2a2-d7f4-4d42-a770-5989e7925126	2025-07-24 11:42:09.937248	giovanni.moguez@telenet.be	Gio	Mo	\N	2025-07-24 11:42:09.937248	$2b$12$XqZqc8SAD3AqeX/6TkrRWOxE3y/cLIcTvNGomS8.vbfCzMbcP.V26	email	f	1792ed3778f24726f59ccdb58734fdbc92c1c09679f0504b7ae3ced5e7b0ada0	\N	\N
\.


--
-- TOC entry 3426 (class 0 OID 0)
-- Dependencies: 215
-- Name: build_log_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_log_entries_id_seq', 29, true);


--
-- TOC entry 3427 (class 0 OID 0)
-- Dependencies: 217
-- Name: build_log_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.build_log_photos_id_seq', 23, true);


--
-- TOC entry 3428 (class 0 OID 0)
-- Dependencies: 219
-- Name: hop_up_parts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hop_up_parts_id_seq', 76, true);


--
-- TOC entry 3429 (class 0 OID 0)
-- Dependencies: 221
-- Name: models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.models_id_seq', 57, true);


--
-- TOC entry 3430 (class 0 OID 0)
-- Dependencies: 223
-- Name: photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.photos_id_seq', 143, true);


--
-- TOC entry 3431 (class 0 OID 0)
-- Dependencies: 225
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 3236 (class 2606 OID 24586)
-- Name: build_log_entries build_log_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_log_entries
    ADD CONSTRAINT build_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 3238 (class 2606 OID 24593)
-- Name: build_log_photos build_log_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_log_photos
    ADD CONSTRAINT build_log_photos_pkey PRIMARY KEY (id);


--
-- TOC entry 3240 (class 2606 OID 24604)
-- Name: hop_up_parts hop_up_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hop_up_parts
    ADD CONSTRAINT hop_up_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 3242 (class 2606 OID 24617)
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- TOC entry 3244 (class 2606 OID 24629)
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- TOC entry 3251 (class 2606 OID 131112)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 3246 (class 2606 OID 139265)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3248 (class 2606 OID 131091)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3249 (class 1259 OID 139274)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- TOC entry 3252 (class 2606 OID 24642)
-- Name: build_log_entries build_log_entries_model_id_models_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_log_entries
    ADD CONSTRAINT build_log_entries_model_id_models_id_fk FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE CASCADE;


--
-- TOC entry 3253 (class 2606 OID 24647)
-- Name: build_log_photos build_log_photos_build_log_entry_id_build_log_entries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_log_photos
    ADD CONSTRAINT build_log_photos_build_log_entry_id_build_log_entries_id_fk FOREIGN KEY (build_log_entry_id) REFERENCES public.build_log_entries(id) ON DELETE CASCADE;


--
-- TOC entry 3254 (class 2606 OID 24652)
-- Name: build_log_photos build_log_photos_photo_id_photos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_log_photos
    ADD CONSTRAINT build_log_photos_photo_id_photos_id_fk FOREIGN KEY (photo_id) REFERENCES public.photos(id) ON DELETE CASCADE;


--
-- TOC entry 3255 (class 2606 OID 24657)
-- Name: hop_up_parts hop_up_parts_model_id_models_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hop_up_parts
    ADD CONSTRAINT hop_up_parts_model_id_models_id_fk FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE CASCADE;


--
-- TOC entry 3256 (class 2606 OID 24662)
-- Name: hop_up_parts hop_up_parts_photo_id_photos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hop_up_parts
    ADD CONSTRAINT hop_up_parts_photo_id_photos_id_fk FOREIGN KEY (photo_id) REFERENCES public.photos(id);


--
-- TOC entry 3257 (class 2606 OID 139269)
-- Name: models models_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3258 (class 2606 OID 24672)
-- Name: photos photos_model_id_models_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_model_id_models_id_fk FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE CASCADE;


-- Completed on 2025-09-11 09:44:49 UTC

--
-- PostgreSQL database dump complete
--


-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建表结构
CREATE TABLE IF NOT EXISTS public.daily_records (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    total_predictions integer DEFAULT 0,
    correct_predictions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_history_point boolean DEFAULT false,
    latest_session_id integer,
    CONSTRAINT check_latest_session_id_positive CHECK (((latest_session_id IS NULL) OR (latest_session_id > 0))),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.moves (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    "position" jsonb NOT NULL,
    color text NOT NULL,
    sequence_number integer NOT NULL,
    prediction jsonb,
    created_at timestamp with time zone DEFAULT now(),
    session_id integer NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sequence_patterns (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    pattern text[] NOT NULL,
    pattern_length integer NOT NULL,
    next_color text NOT NULL,
    occurrence_count integer DEFAULT 1,
    first_seen_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sequence_stats (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    pattern text[] NOT NULL,
    pattern_length integer NOT NULL,
    total_occurrences integer DEFAULT 0,
    red_next_count integer DEFAULT 0,
    black_next_count integer DEFAULT 0,
    last_updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- 插入数据
-- daily_records 数据
INSERT INTO public.daily_records (id, date, total_predictions, correct_predictions, created_at, updated_at, is_history_point, latest_session_id)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2025-03-11', 0, 0, '2025-03-11 09:00:00+00', '2025-03-11 09:00:00+00', false, 7),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '2025-03-12', 0, 0, '2025-03-12 09:00:00+00', '2025-03-12 09:00:00+00', false, 2);

-- moves 数据 (部分示例，实际数据较多)
INSERT INTO public.moves (id, date, "position", color, sequence_number, prediction, created_at, session_id)
VALUES
    ('e593a32f-b5cb-428b-ae2e-447853b38425', '2025-03-11', '{"col": 0, "row": 0}', 'red', 0, NULL, '2025-03-11 11:02:36.325+00', 4),
    ('8c05a10e-ada3-40e7-ac30-11cae6516517', '2025-03-11', '{"col": 0, "row": 1}', 'black', 1, NULL, '2025-03-11 11:02:38.885+00', 4),
    ('b99e3111-c789-4f71-a827-8d6e4ae7dd82', '2025-03-11', '{"col": 0, "row": 2}', 'red', 2, NULL, '2025-03-11 11:02:40.749+00', 4),
    ('e191574d-edb0-49fd-bbd1-b782ddf3b593', '2025-03-11', '{"col": 1, "row": 0}', 'red', 3, NULL, '2025-03-11 11:02:40.941+00', 4),
    ('dd8837c5-c770-41cd-945c-2c45175ea696', '2025-03-11', '{"col": 1, "row": 1}', 'red', 4, NULL, '2025-03-11 11:02:41.165+00', 4),
    ('be69f0eb-2b67-4764-b8d6-6478b1cb07f9', '2025-03-11', '{"col": 1, "row": 2}', 'red', 5, NULL, '2025-03-11 11:02:41.374+00', 4),
    ('9dbb5b2d-c1d3-4d97-8b7d-a6d18a6e7f5f', '2025-03-11', '{"col": 2, "row": 0}', 'black', 6, NULL, '2025-03-11 11:02:42.037+00', 4),
    ('09753837-738c-4a53-be18-b829bf23beb6', '2025-03-11', '{"col": 2, "row": 1}', 'red', 7, NULL, '2025-03-11 11:02:42.494+00', 4),
    ('c88d0967-a389-4b64-841d-dad69323c8af', '2025-03-11', '{"col": 2, "row": 2}', 'black', 8, NULL, '2025-03-11 11:03:21.374+00', 4),
    ('6acb65aa-714b-42d5-896d-6dccab03eeb2', '2025-03-11', '{"col": 3, "row": 0}', 'red', 9, NULL, '2025-03-11 11:03:54.517+00', 4),
    ('0e4bdd63-c0c6-4ac2-8caf-75bb7b470cad', '2025-03-11', '{"col": 3, "row": 1}', 'black', 10, NULL, '2025-03-11 11:09:58.008+00', 4),
    ('b8cf5348-dc3b-4654-a5f5-e5602b449240', '2025-03-11', '{"col": 3, "row": 2}', 'black', 11, NULL, '2025-03-11 11:09:58.192+00', 4),
    ('1de06cdb-e047-4f04-907a-3406d6354a9f', '2025-03-11', '{"col": 4, "row": 0}', 'red', 12, NULL, '2025-03-11 11:10:02.008+00', 4),
    ('3b586cb5-7e90-4728-bd07-3af49aa8d0e8', '2025-03-11', '{"col": 4, "row": 1}', 'black', 13, NULL, '2025-03-11 11:10:03.673+00', 4),
    ('d6767205-1162-45fd-90a3-d66dab8d40d4', '2025-03-11', '{"col": 4, "row": 2}', 'red', 14, NULL, '2025-03-11 11:10:04.208+00', 4),
    ('85a2be99-8026-4bb3-b94f-349ab2274209', '2025-03-11', '{"col": 5, "row": 0}', 'black', 15, NULL, '2025-03-11 11:10:05.216+00', 4),
    ('d275f429-c5f3-4399-a0af-90bcf25dc0f6', '2025-03-11', '{"col": 5, "row": 1}', 'black', 16, NULL, '2025-03-11 11:10:05.408+00', 4),
    ('9d934b12-e46e-4a72-b52b-5fdf20d3770c', '2025-03-11', '{"col": 5, "row": 2}', 'black', 17, NULL, '2025-03-11 11:10:05.553+00', 4),
    ('485c418b-f155-4756-998a-1ad1bb131393', '2025-03-11', '{"col": 6, "row": 0}', 'red', 18, NULL, '2025-03-11 11:11:01.153+00', 4),
    ('45734e19-ac06-4795-8a51-20da3055a8cb', '2025-03-11', '{"col": 6, "row": 1}', 'red', 19, NULL, '2025-03-11 11:11:45.521+00', 4),
    ('b3d3f15f-3955-4e77-9fec-57737ee165ac', '2025-03-11', '{"col": 6, "row": 2}', 'black', 20, NULL, '2025-03-11 11:12:31.113+00', 4),
    ('1caf1f64-5331-445c-9a46-50fc90dad25c', '2025-03-11', '{"col": 7, "row": 0}', 'red', 21, NULL, '2025-03-11 11:13:21.017+00', 4),
    ('d3dcfbb5-dc94-498f-891b-4cd46f160c6f', '2025-03-11', '{"col": 7, "row": 1}', 'red', 22, NULL, '2025-03-11 11:14:10.45+00', 4),
    ('7bef0c4c-0110-4590-b1c6-f94c59678708', '2025-03-11', '{"col": 7, "row": 2}', 'black', 23, NULL, '2025-03-11 11:15:55.051+00', 4),
    ('b480989a-2370-4d95-b43c-35994bb01a0b', '2025-03-11', '{"col": 8, "row": 0}', 'red', 24, NULL, '2025-03-11 11:16:44.875+00', 4),
    ('46d19083-4a98-4bcf-9522-345181ffae26', '2025-03-11', '{"col": 8, "row": 1}', 'red', 25, NULL, '2025-03-11 11:17:37.075+00', 4),
    ('0e563109-b705-4d59-99d3-fd8ca312a0e6', '2025-03-11', '{"col": 8, "row": 2}', 'black', 26, NULL, '2025-03-11 11:18:26.988+00', 4),
    ('2d667e7c-c239-4c49-8af6-aec4235d7124', '2025-03-11', '{"col": 9, "row": 0}', 'red', 27, NULL, '2025-03-11 11:19:18.644+00', 4),
    ('d578abd1-29d8-4128-99b5-4817282e97e0', '2025-03-11', '{"col": 9, "row": 1}', 'red', 28, NULL, '2025-03-11 11:20:22.949+00', 4),
    ('b5e77c02-13f9-496c-bc23-4b1d8e37833b', '2025-03-11', '{"col": 9, "row": 2}', 'black', 29, NULL, '2025-03-11 11:21:00.757+00', 4),
    ('38b0d202-5405-4f6b-b18a-fba6b326c78e', '2025-03-11', '{"col": 10, "row": 0}', 'red', 30, NULL, '2025-03-11 11:21:49.87+00', 4),
    ('be434e5f-c3ca-4633-8c1e-18b101b4cf53', '2025-03-11', '{"col": 10, "row": 1}', 'red', 31, NULL, '2025-03-11 11:22:29.805+00', 4),
    ('06dfaf2f-01a2-4615-a1ae-2cbbe71e1dfd', '2025-03-11', '{"col": 10, "row": 2}', 'red', 32, NULL, '2025-03-11 11:23:26.422+00', 4),
    ('3f6216a8-3354-49e0-b26d-646a27097bab', '2025-03-11', '{"col": 11, "row": 0}', 'black', 33, NULL, '2025-03-11 11:24:14.686+00', 4),
    ('d33046a5-11a8-4204-a887-ee0735db9c35', '2025-03-11', '{"col": 11, "row": 1}', 'red', 34, NULL, '2025-03-11 11:24:59.886+00', 4),
    ('bee49e81-7a58-4548-a96c-838717436fef', '2025-03-11', '{"col": 11, "row": 2}', 'black', 35, NULL, '2025-03-11 11:25:44.807+00', 4),
    ('b9648734-6bc2-48cb-88a8-3967282a57cb', '2025-03-11', '{"col": 12, "row": 0}', 'red', 36, NULL, '2025-03-11 11:26:46.575+00', 4),
    ('0d2e35ee-9726-4c5b-9ce5-55d76d189dfd', '2025-03-11', '{"col": 12, "row": 1}', 'black', 37, NULL, '2025-03-11 11:27:32.92+00', 4),
    ('6f490b58-84b2-4f03-8013-ffc59fd05a2d', '2025-03-11', '{"col": 12, "row": 2}', 'black', 38, NULL, '2025-03-11 11:28:26.552+00', 4),
    ('ba8507e4-9068-4caa-ad78-883cb4b6a656', '2025-03-11', '{"col": 13, "row": 0}', 'black', 39, NULL, '2025-03-11 11:29:38.6+00', 4),
    ('58936c22-f21e-4ef0-bc56-f2cd8c71df57', '2025-03-11', '{"col": 13, "row": 1}', 'red', 40, NULL, '2025-03-11 11:30:07.345+00', 4),
    ('40aef1dc-5091-4485-92fb-b4da35f6b582', '2025-03-11', '{"col": 13, "row": 2}', 'red', 41, NULL, '2025-03-11 11:31:40.553+00', 4),
    ('195a4e27-5594-4ceb-97df-4f1bce38ead4', '2025-03-11', '{"col": 14, "row": 0}', 'black', 42, NULL, '2025-03-11 11:32:29.762+00', 4),
    ('909a7ff9-9d92-4fef-8f1a-2c9b01432cd9', '2025-03-11', '{"col": 14, "row": 1}', 'red', 43, NULL, '2025-03-11 11:33:11.067+00', 4),
    ('9aa8c596-85a7-46ce-b26b-2200ffc6c599', '2025-03-11', '{"col": 14, "row": 2}', 'red', 44, NULL, '2025-03-11 11:33:51.426+00', 4),
    ('02bf6c58-9c2e-4b3b-923e-b74409609b7e', '2025-03-11', '{"col": 15, "row": 0}', 'red', 45, NULL, '2025-03-11 11:34:40.883+00', 4),
    ('b00e8707-71f9-4aa9-8c67-2137c9b58ae4', '2025-03-11', '{"col": 15, "row": 1}', 'black', 46, NULL, '2025-03-11 11:35:24.771+00', 4),
    ('2a79d3ab-bb9f-4f25-b863-1328a8b39a9f', '2025-03-11', '{"col": 15, "row": 2}', 'red', 47, NULL, '2025-03-11 11:36:07.171+00', 4);

-- 添加更多的session_id=2的数据
INSERT INTO public.moves (id, date, "position", color, sequence_number, prediction, created_at, session_id)
VALUES
    ('6db081a9-46c1-4535-ba54-b3bec920412e', '2025-03-12', '{"col": 0, "row": 0}', 'black', 0, NULL, '2025-03-12 14:50:10.298+00', 2),
    ('654e7735-d18a-40c3-8ac8-63a3c665c885', '2025-03-12', '{"col": 0, "row": 1}', 'red', 1, NULL, '2025-03-12 14:50:13.018+00', 2),
    ('7a86ac74-3bd6-45f3-b4e7-2e7a8fedf29e', '2025-03-12', '{"col": 0, "row": 2}', 'red', 2, NULL, '2025-03-12 14:50:13.202+00', 2),
    ('d9a8aa2b-3f3e-4493-a8ff-17951829e6cf', '2025-03-12', '{"col": 1, "row": 0}', 'black', 3, NULL, '2025-03-12 14:50:14.746+00', 2),
    ('1171d162-a231-4df1-bce6-e47dd280d72b', '2025-03-12', '{"col": 1, "row": 1}', 'black', 4, NULL, '2025-03-12 14:50:23.554+00', 2),
    ('7866e345-b8a5-4967-8493-afb425bfcb35', '2025-03-12', '{"col": 1, "row": 2}', 'red', 5, NULL, '2025-03-12 14:50:25.386+00', 2),
    ('6d07b8df-524f-4674-850c-3b92595d73a0', '2025-03-12', '{"col": 2, "row": 0}', 'red', 6, NULL, '2025-03-12 14:50:25.666+00', 2),
    ('2ae42eab-8b9a-41ee-b337-25b866b70ee3', '2025-03-12', '{"col": 2, "row": 1}', 'red', 7, NULL, '2025-03-12 14:50:26.13+00', 2),
    ('a43e18ac-3f10-45f0-9c15-e63603bd3872', '2025-03-12', '{"col": 2, "row": 2}', 'red', 8, NULL, '2025-03-12 14:50:26.578+00', 2),
    ('30c8cfb7-9e85-4f7d-8746-df5c3e831ae0', '2025-03-12', '{"col": 3, "row": 0}', 'black', 9, NULL, '2025-03-12 14:51:30.874+00', 2);

-- 添加session_id=1的数据
INSERT INTO public.moves (id, date, "position", color, sequence_number, prediction, created_at, session_id)
VALUES
    ('1a7e8319-48c5-4050-9f16-c325d12766c9', '2025-03-12', '{"col": 0, "row": 0}', 'red', 0, NULL, '2025-03-12 13:06:25.026+00', 1),
    ('1851e5c0-f75d-4d3d-b75f-05f302e2aa6e', '2025-03-12', '{"col": 0, "row": 1}', 'red', 1, NULL, '2025-03-12 13:06:26.29+00', 1),
    ('907de13b-7175-43e5-bc40-101a29a5f22f', '2025-03-12', '{"col": 0, "row": 2}', 'black', 2, NULL, '2025-03-12 13:06:27.346+00', 1),
    ('1dfa198c-3b3b-48c6-8445-1da4ede76422', '2025-03-12', '{"col": 1, "row": 0}', 'black', 3, NULL, '2025-03-12 13:06:28.042+00', 1),
    ('808ed015-7faa-4513-a942-ca5b174a54b1', '2025-03-12', '{"col": 1, "row": 1}', 'red', 4, NULL, '2025-03-12 13:06:29.362+00', 1),
    ('0b612d9a-df64-467d-97e9-35f9d1ad6f57', '2025-03-12', '{"col": 1, "row": 2}', 'black', 5, NULL, '2025-03-12 13:06:32.362+00', 1),
    ('8d5191f6-18a9-448d-b904-0bafc33b0b55', '2025-03-12', '{"col": 2, "row": 0}', 'black', 6, NULL, '2025-03-12 13:06:33.177+00', 1),
    ('fd91e82b-5e60-4f3d-a7d5-9cda0e4ed109', '2025-03-12', '{"col": 2, "row": 1}', 'black', 7, NULL, '2025-03-12 13:06:34.921+00', 1),
    ('0abf9629-9859-47d8-b315-72c17308bb4a', '2025-03-12', '{"col": 2, "row": 2}', 'red', 8, NULL, '2025-03-12 13:06:37.226+00', 1),
    ('66e11b12-87eb-45d9-a28a-a09267d2e6cb', '2025-03-12', '{"col": 3, "row": 0}', 'red', 9, NULL, '2025-03-12 13:06:44.386+00', 1),
    ('fecca298-0ef3-4052-b2b3-48c4b418dfef', '2025-03-12', '{"col": 3, "row": 1}', 'red', 10, NULL, '2025-03-12 13:06:52.65+00', 1);

-- 创建索引
CREATE INDEX IF NOT EXISTS moves_date_idx ON public.moves (date);
CREATE INDEX IF NOT EXISTS moves_session_id_idx ON public.moves (session_id);
CREATE INDEX IF NOT EXISTS moves_sequence_number_idx ON public.moves (sequence_number);
CREATE INDEX IF NOT EXISTS daily_records_date_idx ON public.daily_records (date);

-- 设置行级安全策略
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_stats ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Enable read access for all users" ON public.moves FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.moves FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.moves FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.moves FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.daily_records FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.daily_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.daily_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.daily_records FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.sequence_patterns FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.sequence_patterns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.sequence_patterns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.sequence_patterns FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.sequence_stats FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.sequence_stats FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.sequence_stats FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.sequence_stats FOR DELETE USING (auth.role() = 'authenticated'); 
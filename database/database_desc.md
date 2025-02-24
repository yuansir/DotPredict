1. 查看所有表格

```
SELECT 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

| tablename         |
| ----------------- |
| daily_records     |
| moves             |
| sequence_patterns |
| sequence_stats    |


2. 查看特定表的结构

daily_records 表

| column_name         | data_type                | character_maximum_length | column_default     | is_nullable |
| ------------------- | ------------------------ | ------------------------ | ------------------ | ----------- |
| id                  | uuid                     | null                     | uuid_generate_v4() | NO          |
| date                | date                     | null                     | null               | NO          |
| total_predictions   | integer                  | null                     | 0                  | YES         |
| correct_predictions | integer                  | null                     | 0                  | YES         |
| created_at          | timestamp with time zone | null                     | now()              | YES         |
| updated_at          | timestamp with time zone | null                     | now()              | YES         |
| is_history_point    | boolean                  | null                     | false              | YES         |

moves表

| column_name     | data_type                | character_maximum_length | column_default     | is_nullable |
| --------------- | ------------------------ | ------------------------ | ------------------ | ----------- |
| id              | uuid                     | null                     | uuid_generate_v4() | NO          |
| date            | date                     | null                     | null               | NO          |
| position        | jsonb                    | null                     | null               | NO          |
| color           | text                     | null                     | null               | NO          |
| sequence_number | integer                  | null                     | null               | NO          |
| prediction      | jsonb                    | null                     | null               | YES         |
| created_at      | timestamp with time zone | null                     | now()              | YES         |
| session_id      | integer                  | null                     | 1                  | NO          |

sequence_patterns表

| column_name      | data_type                | character_maximum_length | column_default     | is_nullable |
| ---------------- | ------------------------ | ------------------------ | ------------------ | ----------- |
| id               | uuid                     | null                     | uuid_generate_v4() | NO          |
| pattern          | ARRAY                    | null                     | null               | NO          |
| pattern_length   | integer                  | null                     | null               | NO          |
| next_color       | text                     | null                     | null               | NO          |
| occurrence_count | integer                  | null                     | 1                  | YES         |
| first_seen_at    | timestamp with time zone | null                     | now()              | YES         |
| last_seen_at     | timestamp with time zone | null                     | now()              | YES         |

sequence_stats表

| column_name       | data_type                | character_maximum_length | column_default     | is_nullable |
| ----------------- | ------------------------ | ------------------------ | ------------------ | ----------- |
| id                | uuid                     | null                     | uuid_generate_v4() | NO          |
| pattern           | ARRAY                    | null                     | null               | NO          |
| pattern_length    | integer                  | null                     | null               | NO          |
| total_occurrences | integer                  | null                     | 0                  | YES         |
| red_next_count    | integer                  | null                     | 0                  | YES         |
| black_next_count  | integer                  | null                     | 0                  | YES         |
| last_updated_at   | timestamp with time zone | null                     | now()              | YES         |

3. 查看索引信息

| tablename         | indexname                                               | indexdef                                                                                                                                                  |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| daily_records     | daily_records_date_key                                  | CREATE UNIQUE INDEX daily_records_date_key ON public.daily_records USING btree (date)                                                                     |
| daily_records     | daily_records_pkey                                      | CREATE UNIQUE INDEX daily_records_pkey ON public.daily_records USING btree (id)                                                                           |
| daily_records     | idx_daily_records_history_point                         | CREATE INDEX idx_daily_records_history_point ON public.daily_records USING btree (is_history_point) WHERE (is_history_point = true)                       |
| moves             | idx_moves_date                                          | CREATE INDEX idx_moves_date ON public.moves USING btree (date)                                                                                            |
| moves             | idx_moves_sequence                                      | CREATE INDEX idx_moves_sequence ON public.moves USING btree (sequence_number)                                                                             |
| moves             | idx_moves_session                                       | CREATE INDEX idx_moves_session ON public.moves USING btree (date, session_id)                                                                             |
| moves             | moves_date_session_id_sequence_number_key               | CREATE UNIQUE INDEX moves_date_session_id_sequence_number_key ON public.moves USING btree (date, session_id, sequence_number)                             |
| moves             | moves_pkey                                              | CREATE UNIQUE INDEX moves_pkey ON public.moves USING btree (id)                                                                                           |
| sequence_patterns | idx_sequence_patterns_length                            | CREATE INDEX idx_sequence_patterns_length ON public.sequence_patterns USING btree (pattern_length)                                                        |
| sequence_patterns | idx_sequence_patterns_pattern                           | CREATE INDEX idx_sequence_patterns_pattern ON public.sequence_patterns USING gin (pattern)                                                                |
| sequence_patterns | sequence_patterns_pattern_pattern_length_next_color_key | CREATE UNIQUE INDEX sequence_patterns_pattern_pattern_length_next_color_key ON public.sequence_patterns USING btree (pattern, pattern_length, next_color) |
| sequence_patterns | sequence_patterns_pkey                                  | CREATE UNIQUE INDEX sequence_patterns_pkey ON public.sequence_patterns USING btree (id)                                                                   |
| sequence_stats    | idx_sequence_stats_length                               | CREATE INDEX idx_sequence_stats_length ON public.sequence_stats USING btree (pattern_length)                                                              |
| sequence_stats    | idx_sequence_stats_pattern                              | CREATE INDEX idx_sequence_stats_pattern ON public.sequence_stats USING gin (pattern)                                                                      |
| sequence_stats    | sequence_stats_pattern_pattern_length_key               | CREATE UNIQUE INDEX sequence_stats_pattern_pattern_length_key ON public.sequence_stats USING btree (pattern, pattern_length)                              |
| sequence_stats    | sequence_stats_pkey                                     | CREATE UNIQUE INDEX sequence_stats_pkey ON public.sequence_stats USING btree (id)                                                                         |

4. 查看外键关系

| table_schema | constraint_name                           | table_name                 | column_name     | foreign_table_schema | foreign_table_name   | foreign_column_name |
| ------------ | ----------------------------------------- | -------------------------- | --------------- | -------------------- | -------------------- | ------------------- |
| auth         | refresh_tokens_session_id_fkey            | refresh_tokens             | session_id      | auth                 | sessions             | id                  |
| storage      | objects_bucketId_fkey                     | objects                    | bucket_id       | storage              | buckets              | id                  |
| storage      | s3_multipart_uploads_parts_bucket_id_fkey | s3_multipart_uploads_parts | bucket_id       | storage              | buckets              | id                  |
| storage      | s3_multipart_uploads_parts_upload_id_fkey | s3_multipart_uploads_parts | upload_id       | storage              | s3_multipart_uploads | id                  |
| storage      | s3_multipart_uploads_bucket_id_fkey       | s3_multipart_uploads       | bucket_id       | storage              | buckets              | id                  |
| auth         | saml_relay_states_flow_state_id_fkey      | saml_relay_states          | flow_state_id   | auth                 | flow_state           | id                  |
| auth         | saml_relay_states_sso_provider_id_fkey    | saml_relay_states          | sso_provider_id | auth                 | sso_providers        | id                  |
| auth         | sessions_user_id_fkey                     | sessions                   | user_id         | auth                 | users                | id                  |
| auth         | sso_domains_sso_provider_id_fkey          | sso_domains                | sso_provider_id | auth                 | sso_providers        | id                  |
| auth         | mfa_amr_claims_session_id_fkey            | mfa_amr_claims             | session_id      | auth                 | sessions             | id                  |
| auth         | saml_providers_sso_provider_id_fkey       | saml_providers             | sso_provider_id | auth                 | sso_providers        | id                  |
| auth         | identities_user_id_fkey                   | identities                 | user_id         | auth                 | users                | id                  |
| auth         | one_time_tokens_user_id_fkey              | one_time_tokens            | user_id         | auth                 | users                | id                  |
| auth         | mfa_factors_user_id_fkey                  | mfa_factors                | user_id         | auth                 | users                | id                  |
| auth         | mfa_challenges_auth_factor_id_fkey        | mfa_challenges             | factor_id       | auth                 | mfa_factors          | id                  |
| public       | moves_date_fkey                           | moves                      | date            | public               | daily_records        | date                |
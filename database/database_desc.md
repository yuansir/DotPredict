SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

结果如下：
| table_name        |
| ----------------- |
| daily_records     |
| moves             |
| sequence_patterns |
| sequence_stats    |

'daily_records'表的结构;

| column_name         | data_type                | is_nullable | column_default     |
| ------------------- | ------------------------ | ----------- | ------------------ |
| id                  | uuid                     | NO          | uuid_generate_v4() |
| date                | date                     | NO          | null               |
| total_predictions   | integer                  | YES         | 0                  |
| correct_predictions | integer                  | YES         | 0                  |
| created_at          | timestamp with time zone | YES         | now()              |
| updated_at          | timestamp with time zone | YES         | now()              |
| is_history_point    | boolean                  | YES         | false              |
| latest_session_id   | integer                  | YES         | null               |

'moves'表的结构;

| column_name     | data_type                | is_nullable | column_default     |
| --------------- | ------------------------ | ----------- | ------------------ |
| id              | uuid                     | NO          | uuid_generate_v4() |
| date            | date                     | NO          | null               |
| position        | jsonb                    | NO          | null               |
| color           | text                     | NO          | null               |
| sequence_number | integer                  | NO          | null               |
| prediction      | jsonb                    | YES         | null               |
| created_at      | timestamp with time zone | YES         | now()              |
| session_id      | integer                  | NO          | null               |

'sequence_patterns'表的结构;
| column_name      | data_type                | is_nullable | column_default     |
| ---------------- | ------------------------ | ----------- | ------------------ |
| id               | uuid                     | NO          | uuid_generate_v4() |
| pattern          | ARRAY                    | NO          | null               |
| pattern_length   | integer                  | NO          | null               |
| next_color       | text                     | NO          | null               |
| occurrence_count | integer                  | YES         | 1                  |
| first_seen_at    | timestamp with time zone | YES         | now()              |
| last_seen_at     | timestamp with time zone | YES         | now()              |

'sequence_stats'表的结构;

| column_name       | data_type                | is_nullable | column_default     |
| ----------------- | ------------------------ | ----------- | ------------------ |
| id                | uuid                     | NO          | uuid_generate_v4() |
| pattern           | ARRAY                    | NO          | null               |
| pattern_length    | integer                  | NO          | null               |
| total_occurrences | integer                  | YES         | 0                  |
| red_next_count    | integer                  | YES         | 0                  |
| black_next_count  | integer                  | YES         | 0                  |
| last_updated_at   | timestamp with time zone | YES         | now()              |


'daily_records'表的索引;
| index_name                      | column_name      | is_unique | is_primary |
| ------------------------------- | ---------------- | --------- | ---------- |
| idx_daily_records_history_point | is_history_point | false     | false      |
| daily_records_pkey              | id               | true      | true       |
| daily_records_date_key          | date             | true      | false      |

'moves'表的索引;
| index_name                                | column_name     | is_unique | is_primary |
| ----------------------------------------- | --------------- | --------- | ---------- |
| idx_moves_date                            | date            | false     | false      |
| idx_moves_sequence                        | sequence_number | false     | false      |
| moves_date_session_id_sequence_number_key | date            | true      | false      |
| moves_date_session_id_sequence_number_key | sequence_number | true      | false      |
| moves_date_session_id_sequence_number_key | session_id      | true      | false      |
| idx_moves_session                         | date            | false     | false      |
| idx_moves_session                         | session_id      | false     | false      |
| idx_moves_session_id                      | session_id      | false     | false      |
| idx_moves_date_session                    | date            | false     | false      |
| idx_moves_date_session                    | session_id      | false     | false      |
| moves_pkey                                | id              | true      | true       |

'sequence_patterns'表的索引;
| index_name                                              | column_name    | is_unique | is_primary |
| ------------------------------------------------------- | -------------- | --------- | ---------- |
| idx_sequence_patterns_pattern                           | pattern        | false     | false      |
| idx_sequence_patterns_length                            | pattern_length | false     | false      |
| sequence_patterns_pkey                                  | id             | true      | true       |
| sequence_patterns_pattern_pattern_length_next_color_key | pattern        | true      | false      |
| sequence_patterns_pattern_pattern_length_next_color_key | pattern_length | true      | false      |
| sequence_patterns_pattern_pattern_length_next_color_key | next_color     | true      | false      |

'sequence_stats'表的索引;
| index_name                                | column_name    | is_unique | is_primary |
| ----------------------------------------- | -------------- | --------- | ---------- |
| idx_sequence_stats_pattern                | pattern        | false     | false      |
| idx_sequence_stats_length                 | pattern_length | false     | false      |
| sequence_stats_pkey                       | id             | true      | true       |
| sequence_stats_pattern_pattern_length_key | pattern        | true      | false      |
| sequence_stats_pattern_pattern_length_key | pattern_length | true      | false      |
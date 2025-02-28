[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "is_identity": "NO"
  },
  {
    "column_name": "date",
    "data_type": "date",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "NO",
    "is_identity": "NO"
  },
  {
    "column_name": "total_predictions",
    "data_type": "integer",
    "character_maximum_length": null,
    "column_default": "0",
    "is_nullable": "YES",
    "is_identity": "NO"
  },
  {
    "column_name": "correct_predictions",
    "data_type": "integer",
    "character_maximum_length": null,
    "column_default": "0",
    "is_nullable": "YES",
    "is_identity": "NO"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "now()",
    "is_nullable": "YES",
    "is_identity": "NO"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "column_default": "now()",
    "is_nullable": "YES",
    "is_identity": "NO"
  },
  {
    "column_name": "is_history_point",
    "data_type": "boolean",
    "character_maximum_length": null,
    "column_default": "false",
    "is_nullable": "YES",
    "is_identity": "NO"
  },
  {
    "column_name": "latest_session_id",
    "data_type": "integer",
    "character_maximum_length": null,
    "column_default": null,
    "is_nullable": "YES",
    "is_identity": "NO"
  }
]
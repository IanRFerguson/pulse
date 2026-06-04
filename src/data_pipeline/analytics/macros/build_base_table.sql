{%- macro build_base_table(source_name, table_name, include_metadata=false) %}
{%- if include_metadata %}
WITH
    _dlt AS (
        SELECT
            load_id,
            inserted_at
        FROM {{ source(source_name, "_dlt_loads") }}
    )
{% endif -%}
SELECT

    {{ 
        dbt_utils.star(
            from=source(source_name, table_name)
        ) 
    }},
    {%- if include_metadata %}
    _dlt.inserted_at AS _inserted_at,
    {% endif -%}
    CURRENT_TIMESTAMP AS _transformed_at

FROM {{ source(source_name, table_name) }} AS _base_table
{%- if include_metadata %}
LEFT JOIN _dlt
    ON _base_table._dlt_load_id = _dlt.load_id
{% endif -%}
{% endmacro -%}
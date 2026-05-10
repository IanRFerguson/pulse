{% macro get_status_label(status_column) %}
    CASE
        {% for status_code, status_label in var("freshdesk_status_lookup").items() %}
            WHEN {{ status_column }} = {{ status_code }} THEN '{{ status_label }}'
        {% endfor %}
        ELSE 'unknown'
    END
{% endmacro %}
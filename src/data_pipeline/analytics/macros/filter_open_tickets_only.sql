{% macro filter_open_tickets_only(status_label) %}
    UPPER({{ status_label }}) NOT IN ('RESOLVED', 'CLOSED')
{% endmacro %}
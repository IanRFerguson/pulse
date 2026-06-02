{%- macro aggregate_by_column(sprint_label, target_column) %}
    COUNT(
        CASE
            WHEN {{ target_column }} = '{{ sprint_label }}' THEN 1
            ELSE NULL
        END
    ) AS {{ target_column | replace(' ', '_') | replace('-', '_') | lower }}_{{ sprint_label | replace(' ', '_') | replace('-', '_') | lower }}
{% endmacro -%}
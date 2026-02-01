"""
OACIQ Compliance Rule Engine
Validates form data against compliance rules (required, comparison, regex, conditional_required, date_comparison).
"""

import re
from datetime import datetime
from typing import Any, Dict, List


def _get_value(data: Dict[str, Any], field: str) -> Any:
    """Get value from form_data, supporting dot notation for nested keys."""
    if "." not in field:
        return data.get(field)
    parts = field.split(".")
    value = data
    for p in parts:
        value = value.get(p) if isinstance(value, dict) else None
        if value is None:
            break
    return value


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ""
    if isinstance(value, (list, dict)):
        return len(value) == 0
    return False


def _parse_date(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(value[:19] if len(value) > 19 else value, fmt)
            except ValueError:
                continue
    return None


def validate(form_rules: Dict[str, Any], form_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Run compliance rules against form data.
    form_rules: {"rules": [{"code", "description", "field", "type", "params", "severity", "message"}, ...]}
    form_data: current form field values (flat or nested).
    Returns list of issues: [{"code", "field", "severity", "message", "description?"}, ...]
    """
    issues: List[Dict[str, Any]] = []
    rules = form_rules.get("rules") if isinstance(form_rules, dict) else []
    if not rules:
        return issues

    for rule in rules:
        if not isinstance(rule, dict):
            continue
        code = rule.get("code", "")
        rtype = rule.get("type", "")
        field = rule.get("field")
        params = rule.get("params") or {}
        severity = rule.get("severity", "error")
        message = rule.get("message", "")
        description = rule.get("description", "")

        try:
            if rtype == "required":
                target_field = rule.get("field") or params.get("field")
                if not target_field:
                    continue
                value = _get_value(form_data, target_field)
                if _is_empty(value):
                    issues.append({"code": code, "field": target_field, "severity": severity, "message": message, "description": description})

            elif rtype == "comparison":
                target_field = rule.get("field") or params.get("field")
                if not target_field:
                    continue
                value = _get_value(form_data, target_field)
                if value is None or value == "":
                    continue
                operator = params.get("operator", ">")
                threshold = params.get("value", 0)
                try:
                    num_value = float(value) if not isinstance(value, (int, float)) else value
                    threshold_num = float(threshold) if not isinstance(threshold, (int, float)) else threshold
                except (TypeError, ValueError):
                    continue
                failed = False
                if operator == ">":
                    failed = num_value <= threshold_num
                elif operator == ">=":
                    failed = num_value < threshold_num
                elif operator == "<":
                    failed = num_value >= threshold_num
                elif operator == "<=":
                    failed = num_value > threshold_num
                elif operator == "==":
                    failed = num_value != threshold_num
                elif operator == "!=":
                    failed = num_value == threshold_num
                if failed:
                    issues.append({"code": code, "field": target_field, "severity": severity, "message": message, "description": description})

            elif rtype == "regex":
                target_field = rule.get("field") or params.get("field")
                pattern = params.get("pattern")
                if not target_field or not pattern:
                    continue
                value = _get_value(form_data, target_field)
                if _is_empty(value):
                    continue
                if not re.match(pattern, str(value)):
                    issues.append({"code": code, "field": target_field, "severity": severity, "message": message, "description": description})

            elif rtype == "conditional_required":
                if_field = params.get("if_field")
                if_value = params.get("if_value")
                then_field = params.get("then_field_is_required") or params.get("then_field")
                if not if_field or not then_field:
                    continue
                cond_value = _get_value(form_data, if_field)
                # Check if condition is met (if_value matches, or truthy when if_value is True)
                if if_value is True or if_value == "true" or if_value == 1:
                    cond_met = cond_value in (True, "true", "1", 1, "yes", "oui") or (isinstance(cond_value, str) and cond_value.strip().lower() in ("true", "yes", "oui", "1"))
                elif if_value is False or if_value == "false" or if_value == 0:
                    cond_met = cond_value in (False, "false", "0", 0, "", "no", "non") or _is_empty(cond_value)
                else:
                    cond_met = cond_value == if_value
                if not cond_met:
                    continue
                then_value = _get_value(form_data, then_field)
                if _is_empty(then_value):
                    issues.append({"code": code, "field": then_field, "severity": severity, "message": message, "description": description})

            elif rtype == "date_comparison":
                date_field = rule.get("field") or params.get("field")
                other_field = params.get("other_field") or params.get("before") or params.get("after")
                comparison = params.get("comparison", "before")  # before = date_field < other
                if not date_field or not other_field:
                    continue
                d1 = _parse_date(_get_value(form_data, date_field))
                d2 = _parse_date(_get_value(form_data, other_field))
                if d1 is None or d2 is None:
                    continue
                failed = False
                if comparison in ("before", "<"):
                    failed = d1 >= d2
                elif comparison in ("after", ">"):
                    failed = d1 <= d2
                elif comparison == "<=":
                    failed = d1 > d2
                elif comparison == ">=":
                    failed = d1 < d2
                if failed:
                    issues.append({"code": code, "field": date_field, "severity": severity, "message": message, "description": description})

        except Exception:
            continue

    return issues

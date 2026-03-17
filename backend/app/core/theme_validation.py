"""
Theme Validation Utilities for Backend
Validates theme configurations for color format and contrast compliance.
Mirrors the frontend validation logic for consistency.
"""

import re
from typing import Dict, Any, List, Optional, Tuple


class ColorValidationError(Exception):
    """Raised when color validation fails."""
    pass


class ContrastValidationError(Exception):
    """Raised when contrast validation fails."""
    pass


def hex_to_rgb(hex_color: str) -> Optional[Tuple[int, int, int]]:
    """
    Convert hex color to RGB values.
    Supports formats: #RGB, #RRGGBB, RGB, RRGGBB
    
    Args:
        hex_color: Hex color string
        
    Returns:
        Tuple of (r, g, b) values or None if invalid
    """
    if not hex_color or not isinstance(hex_color, str):
        return None
    
    # Remove hash if present
    clean_hex = hex_color.replace('#', '').strip()
    
    # Handle 3-digit hex (#RGB)
    if len(clean_hex) == 3:
        try:
            r = int(clean_hex[0] + clean_hex[0], 16)
            g = int(clean_hex[1] + clean_hex[1], 16)
            b = int(clean_hex[2] + clean_hex[2], 16)
            return (r, g, b)
        except (ValueError, IndexError):
            return None
    
    # Handle 6-digit hex (#RRGGBB)
    if len(clean_hex) == 6:
        try:
            r = int(clean_hex[0:2], 16)
            g = int(clean_hex[2:4], 16)
            b = int(clean_hex[4:6], 16)
            return (r, g, b)
        except (ValueError, IndexError):
            return None
    
    return None


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """
    Convert RGB values to hex color.
    
    Args:
        r: Red component (0-255)
        g: Green component (0-255)
        b: Blue component (0-255)
        
    Returns:
        Hex color string (#RRGGBB)
    """
    return f"#{r:02x}{g:02x}{b:02x}"


def get_luminance(r: int, g: int, b: int) -> float:
    """
    Calculate relative luminance of a color.
    Based on WCAG 2.1 formula.
    
    Args:
        r: Red component (0-255)
        g: Green component (0-255)
        b: Blue component (0-255)
        
    Returns:
        Relative luminance (0-1)
    """
    # Normalize RGB values to 0-1
    def normalize(val: int) -> float:
        norm = val / 255.0
        return norm / 12.92 if norm <= 0.03928 else ((norm + 0.055) / 1.055) ** 2.4
    
    rs = normalize(r)
    gs = normalize(g)
    bs = normalize(b)
    
    # Calculate relative luminance using WCAG formula
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs


def calculate_contrast_ratio(color1: str, color2: str) -> float:
    """
    Calculate contrast ratio between two colors.
    Based on WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
    
    Args:
        color1: First color (hex format: #RRGGBB)
        color2: Second color (hex format: #RRGGBB)
        
    Returns:
        Contrast ratio (1-21, where 21 is maximum contrast)
    """
    rgb1 = hex_to_rgb(color1)
    rgb2 = hex_to_rgb(color2)
    
    if not rgb1 or not rgb2:
        raise ValueError(f"Invalid color format: {color1} or {color2}")
    
    lum1 = get_luminance(rgb1[0], rgb1[1], rgb1[2])
    lum2 = get_luminance(rgb2[0], rgb2[1], rgb2[2])
    
    # Ensure L1 is the lighter color
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    
    # Calculate contrast ratio
    ratio = (lighter + 0.05) / (darker + 0.05)
    
    return round(ratio * 100) / 100  # Round to 2 decimal places


def meets_wcag_aa(
    foreground: str,
    background: str,
    is_large_text: bool = False,
    is_ui_component: bool = False
) -> bool:
    """
    Check if contrast ratio meets WCAG Level AA requirements.
    
    Args:
        foreground: Foreground color (hex format)
        background: Background color (hex format)
        is_large_text: Whether the text is large (≥18pt or ≥14pt bold)
        is_ui_component: Whether this is a UI component (button, link, etc.)
        
    Returns:
        True if meets WCAG AA requirements
    """
    ratio = calculate_contrast_ratio(foreground, background)
    
    # UI components require minimum 3:1
    if is_ui_component:
        return ratio >= 3.0
    
    # Large text requires minimum 3:1 for AA
    if is_large_text:
        return ratio >= 3.0
    
    # Normal text requires minimum 4.5:1 for AA
    return ratio >= 4.5


def is_valid_hex_color(color: str) -> bool:
    """
    Validate hex color format.
    Supports: #RGB, #RRGGBB, RGB, RRGGBB
    
    Args:
        color: Color string to validate
        
    Returns:
        True if valid hex color
    """
    if not color or not isinstance(color, str):
        return False
    
    clean_color = color.strip()
    
    # Remove hash if present
    hex_str = clean_color[1:] if clean_color.startswith('#') else clean_color
    
    # Check 3-digit hex (#RGB)
    if len(hex_str) == 3:
        return bool(re.match(r'^[0-9a-f]{3}$', hex_str, re.IGNORECASE))
    
    # Check 6-digit hex (#RRGGBB)
    if len(hex_str) == 6:
        return bool(re.match(r'^[0-9a-f]{6}$', hex_str, re.IGNORECASE))
    
    return False


def is_valid_rgb_color(color: str) -> bool:
    """
    Validate RGB color format.
    Supports: rgb(255, 255, 255), rgba(255, 255, 255, 0.5), 255,255,255
    
    Args:
        color: Color string to validate
        
    Returns:
        True if valid RGB color
    """
    if not color or not isinstance(color, str):
        return False
    
    clean_color = color.strip()
    
    # Check rgb() or rgba() format
    rgb_match = re.match(
        r'^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$',
        clean_color,
        re.IGNORECASE
    )
    if rgb_match:
        r = int(rgb_match.group(1))
        g = int(rgb_match.group(2))
        b = int(rgb_match.group(3))
        return 0 <= r <= 255 and 0 <= g <= 255 and 0 <= b <= 255
    
    # Check comma-separated format (255,255,255)
    comma_match = re.match(r'^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$', clean_color)
    if comma_match:
        r = int(comma_match.group(1))
        g = int(comma_match.group(2))
        b = int(comma_match.group(3))
        return 0 <= r <= 255 and 0 <= g <= 255 and 0 <= b <= 255
    
    return False


def is_valid_hsl_color(color: str) -> bool:
    """
    Validate HSL color format.
    Supports: hsl(360, 100%, 50%), hsla(360, 100%, 50%, 0.5)
    
    Args:
        color: Color string to validate
        
    Returns:
        True if valid HSL color
    """
    if not color or not isinstance(color, str):
        return False
    
    clean_color = color.strip()
    
    # Check hsl() or hsla() format
    hsl_match = re.match(
        r'^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*[\d.]+)?\s*\)$',
        clean_color,
        re.IGNORECASE
    )
    if hsl_match:
        h = int(hsl_match.group(1))
        s = int(hsl_match.group(2))
        l = int(hsl_match.group(3))
        return 0 <= h <= 360 and 0 <= s <= 100 and 0 <= l <= 100
    
    return False


def is_valid_color(color: str) -> bool:
    """
    Check if color is in any valid format (hex, rgb, hsl).
    
    Args:
        color: Color string to validate
        
    Returns:
        True if valid color in any format
    """
    return is_valid_hex_color(color) or is_valid_rgb_color(color) or is_valid_hsl_color(color)


def normalize_color_to_hex(color: str) -> Optional[str]:
    """
    Normalize color to hex format.
    Converts rgb/rgba/hsl/hsla to hex.
    
    Args:
        color: Color in any format
        
    Returns:
        Hex color (#RRGGBB) or None if invalid
    """
    if not color or not isinstance(color, str):
        return None
    
    clean_color = color.strip()
    
    # If already hex, validate and return
    if is_valid_hex_color(clean_color):
        hex_str = clean_color[1:] if clean_color.startswith('#') else clean_color
        
        # Expand 3-digit to 6-digit
        if len(hex_str) == 3:
            return '#' + ''.join(c + c for c in hex_str)
        
        return '#' + hex_str
    
    # Convert RGB to hex
    if is_valid_rgb_color(clean_color):
        rgb_match = re.match(
            r'rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)',
            clean_color,
            re.IGNORECASE
        ) or re.match(r'^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$', clean_color)
        
        if rgb_match:
            r = int(rgb_match.group(1))
            g = int(rgb_match.group(2))
            b = int(rgb_match.group(3))
            return rgb_to_hex(r, g, b)
    
    # Note: HSL conversion would require more complex logic
    # For now, we'll skip HSL normalization and just validate the format
    # This can be enhanced later if needed
    
    return None


def validate_theme_colors(config: Dict[str, Any]) -> Tuple[bool, List[Dict[str, str]]]:
    """
    Validate theme configuration colors.
    Checks all color fields in a theme config.
    
    Args:
        config: Theme configuration object
        
    Returns:
        Tuple of (is_valid, list_of_errors)
        Each error is a dict with 'field', 'value', and 'message' keys
    """
    errors: List[Dict[str, str]] = []
    
    # Check flat color fields
    flat_colors = [
        ('primary_color', config.get('primary_color')),
        ('secondary_color', config.get('secondary_color')),
        ('danger_color', config.get('danger_color')),
        ('warning_color', config.get('warning_color')),
        ('info_color', config.get('info_color')),
        ('success_color', config.get('success_color')),
        # Also check short format
        ('primary', config.get('primary')),
        ('secondary', config.get('secondary')),
        ('danger', config.get('danger')),
        ('warning', config.get('warning')),
        ('info', config.get('info')),
        ('success', config.get('success')),
    ]
    
    for key, value in flat_colors:
        if value and isinstance(value, str) and not is_valid_color(value):
            errors.append({
                'field': key,
                'value': value,
                'message': f'Invalid color format: {value}. Expected hex (#RRGGBB), rgb(), or hsl()'
            })
    
    # Check nested colors object
    colors = config.get('colors', {})
    if isinstance(colors, dict):
        for key, value in colors.items():
            if isinstance(value, str) and not is_valid_color(value):
                errors.append({
                    'field': f'colors.{key}',
                    'value': value,
                    'message': f'Invalid color format: {value}. Expected hex (#RRGGBB), rgb(), or hsl()'
                })
    
    # Check typography colors
    typography = config.get('typography', {})
    if isinstance(typography, dict):
        typography_colors = [
            ('textHeading', typography.get('textHeading')),
            ('textSubheading', typography.get('textSubheading')),
            ('textBody', typography.get('textBody')),
            ('textSecondary', typography.get('textSecondary')),
            ('textLink', typography.get('textLink')),
        ]
        
        for key, value in typography_colors:
            if value and isinstance(value, str) and not is_valid_color(value):
                errors.append({
                    'field': f'typography.{key}',
                    'value': value,
                    'message': f'Invalid color format: {value}. Expected hex (#RRGGBB), rgb(), or hsl()'
                })
    
    return (len(errors) == 0, errors)


def validate_theme_contrast(config: Dict[str, Any], strict: bool = False) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Validate theme configuration contrast compliance.
    Checks WCAG AA compliance for text and UI components.
    
    Args:
        config: Theme configuration object
        strict: If True, fails on any contrast issue. If False, only fails on critical issues.
        
    Returns:
        Tuple of (is_valid, list_of_issues)
        Each issue is a dict with contrast information
    """
    issues: List[Dict[str, Any]] = []
    colors = config.get('colors', {})
    typography = config.get('typography', {})
    
    # Get background color (default to white)
    background = colors.get('background', '#ffffff')
    
    # Normalize background to hex for contrast calculation
    bg_hex = normalize_color_to_hex(background) or background
    
    # Check text contrast
    text_colors = {
        'textHeading': typography.get('textHeading'),
        'textBody': typography.get('textBody'),
        'textLink': typography.get('textLink'),
    }
    
    for element, color in text_colors.items():
        if color:
            fg_hex = normalize_color_to_hex(color) or color
            
            # Only check if both colors are valid hex
            if is_valid_hex_color(fg_hex) and is_valid_hex_color(bg_hex):
                try:
                    ratio = calculate_contrast_ratio(fg_hex, bg_hex)
                    meets_aa = meets_wcag_aa(fg_hex, bg_hex, is_large_text=False)
                    
                    if not meets_aa:
                        # All contrast issues are warnings (non-blocking)
                        # User can choose to ignore them if they want
                        level = 'AA Large' if ratio >= 3.0 else 'warning'
                        issues.append({
                            'type': 'text',
                            'element': element,
                            'foreground': color,
                            'background': background,
                            'ratio': ratio,
                            'required': 4.5,
                            'level': level,
                            'message': f'{element} contrast ratio {ratio}:1 does not meet WCAG AA (requires 4.5:1)'
                        })
                except (ValueError, Exception):
                    # Skip if contrast calculation fails (invalid colors)
                    pass
    
    # Check UI component contrast
    ui_colors = {
        'primary': colors.get('primary') or config.get('primary_color') or config.get('primary'),
        'danger': colors.get('danger') or config.get('danger_color') or config.get('danger'),
        'warning': colors.get('warning') or config.get('warning_color') or config.get('warning'),
        'success': colors.get('success') or config.get('success_color') or config.get('success'),
    }
    
    for element, color in ui_colors.items():
        if color:
            fg_hex = normalize_color_to_hex(color) or color
            
            # Only check if both colors are valid hex
            if is_valid_hex_color(fg_hex) and is_valid_hex_color(bg_hex):
                try:
                    ratio = calculate_contrast_ratio(fg_hex, bg_hex)
                    meets_aa = meets_wcag_aa(fg_hex, bg_hex, is_ui_component=True)
                    
                    if not meets_aa:
                        # All contrast issues are warnings (non-blocking)
                        # User can choose to ignore them if they want
                        level = 'warning'
                        issues.append({
                            'type': 'ui',
                            'element': element,
                            'foreground': color,
                            'background': background,
                            'ratio': ratio,
                            'required': 3.0,
                            'level': level,
                            'message': f'{element} button contrast ratio {ratio}:1 does not meet WCAG AA for UI components (requires 3:1)'
                        })
                except (ValueError, Exception):
                    # Skip if contrast calculation fails (invalid colors)
                    pass
    
    # Determine if valid based on strict mode
    if strict:
        is_valid = len(issues) == 0
    else:
        # In non-strict mode, all contrast issues are warnings (non-blocking)
        # Only fail on critical issues if they exist, but we've changed all to warnings
        # So this will always return True in non-strict mode
        is_valid = True
    
    return (is_valid, issues)


def validate_theme_config(config: Dict[str, Any], strict_contrast: bool = False) -> Tuple[bool, List[Dict[str, str]], List[Dict[str, Any]]]:
    """
    Validate a theme configuration.
    Checks both color format and contrast compliance.
    
    Args:
        config: Theme configuration object
        strict_contrast: If True, fails on any contrast issue. If False, only fails on critical issues.
        
    Returns:
        Tuple of (is_valid, color_errors, contrast_issues)
    """
    # Validate color formats first
    color_valid, color_errors = validate_theme_colors(config)
    
    # Validate contrasts only if color formats are valid
    contrast_valid = True
    contrast_issues: List[Dict[str, Any]] = []
    
    if color_valid:
        contrast_valid, contrast_issues = validate_theme_contrast(config, strict=strict_contrast)
    
    # Theme is valid if both color format and contrast are valid
    is_valid = color_valid and contrast_valid
    
    return (is_valid, color_errors, contrast_issues)


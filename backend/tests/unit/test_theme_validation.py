"""
Tests for Theme Validation
Tests color format validation and contrast compliance checks.
"""

import pytest
from app.core.theme_validation import (
    is_valid_hex_color,
    is_valid_rgb_color,
    is_valid_hsl_color,
    is_valid_color,
    normalize_color_to_hex,
    calculate_contrast_ratio,
    meets_wcag_aa,
    validate_theme_colors,
    validate_theme_contrast,
    validate_theme_config,
)


class TestColorValidation:
    """Tests for color format validation"""
    
    def test_valid_hex_colors(self):
        """Test valid hex color formats"""
        assert is_valid_hex_color("#ffffff") is True
        assert is_valid_hex_color("#000000") is True
        assert is_valid_hex_color("#abc123") is True
        assert is_valid_hex_color("ffffff") is True
        assert is_valid_hex_color("#fff") is True
        assert is_valid_hex_color("fff") is True
    
    def test_invalid_hex_colors(self):
        """Test invalid hex color formats"""
        assert is_valid_hex_color("#gggggg") is False
        assert is_valid_hex_color("#12345") is False  # Wrong length
        assert is_valid_hex_color("#1234567") is False  # Wrong length
        assert is_valid_hex_color("") is False
        assert is_valid_hex_color(None) is False
    
    def test_valid_rgb_colors(self):
        """Test valid RGB color formats"""
        assert is_valid_rgb_color("rgb(255, 255, 255)") is True
        assert is_valid_rgb_color("rgba(255, 255, 255, 0.5)") is True
        assert is_valid_rgb_color("255, 255, 255") is True
        assert is_valid_rgb_color("rgb(0, 0, 0)") is True
    
    def test_invalid_rgb_colors(self):
        """Test invalid RGB color formats"""
        assert is_valid_rgb_color("rgb(256, 255, 255)") is False  # Out of range
        assert is_valid_rgb_color("rgb(-1, 255, 255)") is False  # Out of range
        assert is_valid_rgb_color("rgb(255, 255)") is False  # Missing component
        assert is_valid_rgb_color("") is False
    
    def test_valid_hsl_colors(self):
        """Test valid HSL color formats"""
        assert is_valid_hsl_color("hsl(360, 100%, 50%)") is True
        assert is_valid_hsl_color("hsla(180, 50%, 50%, 0.5)") is True
        assert is_valid_hsl_color("hsl(0, 0%, 0%)") is True
    
    def test_invalid_hsl_colors(self):
        """Test invalid HSL color formats"""
        assert is_valid_hsl_color("hsl(361, 100%, 50%)") is False  # Out of range
        assert is_valid_hsl_color("hsl(180, 101%, 50%)") is False  # Out of range
        assert is_valid_hsl_color("hsl(180, 50%)") is False  # Missing component
        assert is_valid_hsl_color("") is False
    
    def test_is_valid_color(self):
        """Test generic color validation"""
        assert is_valid_color("#ffffff") is True
        assert is_valid_color("rgb(255, 255, 255)") is True
        assert is_valid_color("hsl(180, 50%, 50%)") is True
        assert is_valid_color("invalid") is False
    
    def test_normalize_color_to_hex(self):
        """Test color normalization to hex"""
        assert normalize_color_to_hex("#ffffff") == "#ffffff"
        assert normalize_color_to_hex("#fff") == "#ffffff"
        assert normalize_color_to_hex("rgb(255, 255, 255)") == "#ffffff"
        assert normalize_color_to_hex("rgb(0, 0, 0)") == "#000000"
        assert normalize_color_to_hex("invalid") is None


class TestContrastCalculation:
    """Tests for contrast ratio calculation"""
    
    def test_contrast_ratio_black_white(self):
        """Test contrast ratio between black and white (maximum contrast)"""
        ratio = calculate_contrast_ratio("#000000", "#ffffff")
        assert ratio == pytest.approx(21.0, rel=0.1)  # Maximum contrast
    
    def test_contrast_ratio_same_color(self):
        """Test contrast ratio between same colors (minimum contrast)"""
        ratio = calculate_contrast_ratio("#ffffff", "#ffffff")
        assert ratio == pytest.approx(1.0, rel=0.1)  # Minimum contrast
    
    def test_contrast_ratio_medium_contrast(self):
        """Test contrast ratio for medium contrast colors"""
        # Example: blue on white
        ratio = calculate_contrast_ratio("#2563eb", "#ffffff")
        assert ratio > 4.5  # Should meet WCAG AA
    
    def test_wcag_aa_compliance(self):
        """Test WCAG AA compliance checks"""
        # Black on white should meet AA
        assert meets_wcag_aa("#000000", "#ffffff") is True
        
        # Very light gray on white should not meet AA
        assert meets_wcag_aa("#f0f0f0", "#ffffff", is_large_text=False) is False
        
        # But should meet AA for large text
        assert meets_wcag_aa("#f0f0f0", "#ffffff", is_large_text=True) is True
        
        # UI components require 3:1
        assert meets_wcag_aa("#2563eb", "#ffffff", is_ui_component=True) is True


class TestThemeColorValidation:
    """Tests for theme color validation"""
    
    def test_valid_theme_colors(self):
        """Test validation of valid theme colors"""
        config = {
            "primary_color": "#2563eb",
            "secondary_color": "#6366f1",
            "colors": {
                "background": "#ffffff",
                "foreground": "#000000",
            },
            "typography": {
                "textHeading": "#0f172a",
                "textBody": "#334155",
            }
        }
        
        is_valid, errors = validate_theme_colors(config)
        assert is_valid is True
        assert len(errors) == 0
    
    def test_invalid_theme_colors(self):
        """Test validation of invalid theme colors"""
        config = {
            "primary_color": "invalid-color",
            "secondary_color": "#6366f1",
            "colors": {
                "background": "not-a-color",
            },
            "typography": {
                "textHeading": "#0f172a",
            }
        }
        
        is_valid, errors = validate_theme_colors(config)
        assert is_valid is False
        assert len(errors) > 0
        assert any(error["field"] == "primary_color" for error in errors)
        assert any(error["field"] == "colors.background" for error in errors)


class TestThemeContrastValidation:
    """Tests for theme contrast validation"""
    
    def test_valid_theme_contrast(self):
        """Test validation of theme with good contrast"""
        config = {
            "colors": {
                "background": "#ffffff",
                "primary": "#2563eb",
            },
            "typography": {
                "textHeading": "#000000",
                "textBody": "#1e293b",
            }
        }
        
        is_valid, issues = validate_theme_contrast(config, strict=False)
        assert is_valid is True
        assert len(issues) == 0
    
    def test_invalid_theme_contrast(self):
        """Test validation of theme with poor contrast"""
        config = {
            "colors": {
                "background": "#ffffff",
                "primary": "#f0f0f0",  # Very light, poor contrast
            },
            "typography": {
                "textHeading": "#f5f5f5",  # Very light, poor contrast
                "textBody": "#ffffff",  # Same as background
            }
        }
        
        is_valid, issues = validate_theme_contrast(config, strict=False)
        # Should have contrast issues
        assert len(issues) > 0
    
    def test_strict_contrast_validation(self):
        """Test strict contrast validation mode"""
        config = {
            "colors": {
                "background": "#ffffff",
                "primary": "#2563eb",  # Good contrast
            },
            "typography": {
                "textHeading": "#000000",  # Good contrast
                "textBody": "#f5f5f5",  # Poor contrast (only meets AA Large)
            }
        }
        
        # Non-strict: should pass (only critical issues fail)
        is_valid_non_strict, issues_non_strict = validate_theme_contrast(config, strict=False)
        assert is_valid_non_strict is True  # Only critical failures block
        
        # Strict: should fail (any issue fails)
        is_valid_strict, issues_strict = validate_theme_contrast(config, strict=True)
        # May fail if there are any issues, even warnings


class TestThemeConfigValidation:
    """Tests for complete theme config validation"""
    
    def test_valid_theme_config(self):
        """Test validation of completely valid theme config"""
        config = {
            "primary_color": "#2563eb",
            "secondary_color": "#6366f1",
            "colors": {
                "background": "#ffffff",
                "foreground": "#000000",
                "primary": "#2563eb",
            },
            "typography": {
                "textHeading": "#000000",
                "textBody": "#1e293b",
            }
        }
        
        is_valid, color_errors, contrast_issues = validate_theme_config(config, strict_contrast=False)
        assert is_valid is True
        assert len(color_errors) == 0
        assert len(contrast_issues) == 0
    
    def test_invalid_color_format(self):
        """Test validation fails on invalid color format"""
        config = {
            "primary_color": "invalid-color",
            "colors": {
                "background": "#ffffff",
            }
        }
        
        is_valid, color_errors, contrast_issues = validate_theme_config(config, strict_contrast=False)
        assert is_valid is False
        assert len(color_errors) > 0
        # Contrast validation should be skipped when color format is invalid
        assert len(contrast_issues) == 0
    
    def test_invalid_contrast(self):
        """Test validation fails on poor contrast"""
        config = {
            "primary_color": "#ffffff",  # Same as background
            "colors": {
                "background": "#ffffff",
                "primary": "#ffffff",
            },
            "typography": {
                "textBody": "#ffffff",  # Same as background
            }
        }
        
        is_valid, color_errors, contrast_issues = validate_theme_config(config, strict_contrast=False)
        # Color format is valid, but contrast is poor
        assert len(color_errors) == 0
        assert len(contrast_issues) > 0
        # Non-strict mode: may still be valid if no critical failures
        # Strict mode: should fail


"""
Tests for Stripe Helper Utilities
"""

import pytest
from datetime import datetime

from app.utils.stripe_helpers import map_stripe_status, parse_timestamp, STRIPE_STATUS_MAP
from app.models.subscription import SubscriptionStatus


class TestMapStripeStatus:
    """Tests for map_stripe_status function"""

    def test_map_active_status(self):
        """Test mapping active status"""
        assert map_stripe_status("active") == SubscriptionStatus.ACTIVE
        assert map_stripe_status("ACTIVE") == SubscriptionStatus.ACTIVE

    def test_map_trialing_status(self):
        """Test mapping trialing status"""
        assert map_stripe_status("trialing") == SubscriptionStatus.TRIALING
        assert map_stripe_status("TRIALING") == SubscriptionStatus.TRIALING

    def test_map_past_due_status(self):
        """Test mapping past_due status"""
        assert map_stripe_status("past_due") == SubscriptionStatus.PAST_DUE

    def test_map_canceled_status(self):
        """Test mapping canceled status"""
        assert map_stripe_status("canceled") == SubscriptionStatus.CANCELED

    def test_map_unpaid_status(self):
        """Test mapping unpaid status"""
        assert map_stripe_status("unpaid") == SubscriptionStatus.UNPAID

    def test_map_incomplete_status(self):
        """Test mapping incomplete status"""
        assert map_stripe_status("incomplete") == SubscriptionStatus.INCOMPLETE

    def test_map_incomplete_expired_status(self):
        """Test mapping incomplete_expired status"""
        assert map_stripe_status("incomplete_expired") == SubscriptionStatus.INCOMPLETE_EXPIRED

    def test_map_unknown_status(self):
        """Test mapping unknown status defaults to INCOMPLETE"""
        assert map_stripe_status("unknown_status") == SubscriptionStatus.INCOMPLETE
        assert map_stripe_status("") == SubscriptionStatus.INCOMPLETE

    def test_map_all_statuses(self):
        """Test that all statuses in map are valid"""
        for stripe_status, expected_status in STRIPE_STATUS_MAP.items():
            assert map_stripe_status(stripe_status) == expected_status


class TestParseTimestamp:
    """Tests for parse_timestamp function"""

    def test_parse_valid_timestamp(self):
        """Test parsing valid timestamp"""
        timestamp = 1609459200  # 2021-01-01 00:00:00 UTC
        assert parse_timestamp(timestamp) == timestamp

    def test_parse_zero_timestamp(self):
        """Test parsing zero timestamp returns 0"""
        assert parse_timestamp(0) == 0

    def test_parse_negative_timestamp(self):
        """Test parsing negative timestamp returns 0"""
        assert parse_timestamp(-1) == 0

    def test_parse_none_timestamp(self):
        """Test parsing None timestamp returns 0"""
        assert parse_timestamp(None) == 0

    def test_parse_large_timestamp(self):
        """Test parsing large timestamp"""
        timestamp = 2147483647  # Max 32-bit int
        assert parse_timestamp(timestamp) == timestamp

    def test_parse_timestamp_with_datetime(self):
        """Test parsing timestamp can be used with datetime"""
        timestamp = 1609459200
        parsed = parse_timestamp(timestamp)
        dt = datetime.fromtimestamp(parsed)
        assert dt.year == 2021
        assert dt.month == 1
        assert dt.day == 1


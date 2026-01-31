"""
Tests for Email Service
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import os

from app.services.email_service import EmailService


class TestEmailService:
    """Tests for EmailService"""
    
    def test_is_configured_with_api_key(self):
        """Test is_configured returns True when API key is set"""
        with patch.dict(os.environ, {"SENDGRID_API_KEY": "test_key"}):
            service = EmailService()
            assert service.is_configured() is True
    
    def test_is_configured_without_api_key(self):
        """Test is_configured returns False when API key is not set"""
        with patch.dict(os.environ, {}, clear=True):
            service = EmailService()
            assert service.is_configured() is False
    
    def test_send_email_not_configured(self):
        """Test send_email raises ValueError when not configured"""
        with patch.dict(os.environ, {}, clear=True):
            service = EmailService()
            with pytest.raises(ValueError, match="not configured"):
                service.send_email(
                    to_email="test@example.com",
                    subject="Test",
                    html_content="<p>Test</p>"
                )
    
    @patch.dict(os.environ, {"SENDGRID_API_KEY": "test_key", "SENDGRID_FROM_EMAIL": "test@example.com"})
    def test_send_email_success(self):
        """Test send_email sends email successfully"""
        service = EmailService()
        
        # Mock SendGrid client
        mock_response = Mock()
        mock_response.status_code = 202
        mock_response.headers = {"X-Message-Id": "test_message_id"}
        service.client.send = Mock(return_value=mock_response)
        
        result = service.send_email(
            to_email="recipient@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>"
        )
        
        assert result["status"] == "sent"
        assert result["status_code"] == 202
        assert result["message_id"] == "test_message_id"
        assert result["to"] == "recipient@example.com"
        service.client.send.assert_called_once()
    
    @patch.dict(os.environ, {"SENDGRID_API_KEY": "test_key"})
    def test_send_email_with_cc_bcc(self):
        """Test send_email with CC and BCC"""
        service = EmailService()
        
        mock_response = Mock()
        mock_response.status_code = 202
        mock_response.headers = {}
        service.client.send = Mock(return_value=mock_response)
        
        result = service.send_email(
            to_email="recipient@example.com",
            subject="Test",
            html_content="<p>Test</p>",
            cc=["cc@example.com"],
            bcc=["bcc@example.com"]
        )
        
        assert result["status"] == "sent"
        service.client.send.assert_called_once()
    
    @patch.dict(os.environ, {"SENDGRID_API_KEY": "test_key"})
    def test_send_email_with_custom_from(self):
        """Test send_email with custom from email and name"""
        service = EmailService()
        
        mock_response = Mock()
        mock_response.status_code = 202
        mock_response.headers = {}
        service.client.send = Mock(return_value=mock_response)
        
        result = service.send_email(
            to_email="recipient@example.com",
            subject="Test",
            html_content="<p>Test</p>",
            from_email="custom@example.com",
            from_name="Custom Name"
        )
        
        assert result["status"] == "sent"
        service.client.send.assert_called_once()
    
    @patch.dict(os.environ, {"SENDGRID_API_KEY": "test_key"})
    def test_send_email_sendgrid_exception(self):
        """Test send_email handles SendGrid exceptions"""
        from sendgrid.helpers.mail.exceptions import SendGridException
        
        service = EmailService()
        service.client.send = Mock(side_effect=SendGridException("API Error"))
        
        with pytest.raises(RuntimeError, match="Failed to send email"):
            service.send_email(
                to_email="recipient@example.com",
                subject="Test",
                html_content="<p>Test</p>"
            )
    
    @patch.dict(os.environ, {"SENDGRID_API_KEY": "test_key"})
    def test_send_welcome_email(self):
        """Test send_welcome_email helper method"""
        service = EmailService()
        
        mock_response = Mock()
        mock_response.status_code = 202
        mock_response.headers = {}
        service.client.send = Mock(return_value=mock_response)
        
        result = service.send_welcome_email("user@example.com", "John Doe")
        
        assert result["status"] == "sent"
        service.client.send.assert_called_once()
    
    @patch.dict(os.environ, {"SENDGRID_API_KEY": "test_key"})
    def test_send_password_reset_email(self):
        """Test send_password_reset_email helper method"""
        service = EmailService()
        
        mock_response = Mock()
        mock_response.status_code = 202
        mock_response.headers = {}
        service.client.send = Mock(return_value=mock_response)
        
        result = service.send_password_reset_email("user@example.com", "reset_token_123")
        
        assert result["status"] == "sent"
        service.client.send.assert_called_once()


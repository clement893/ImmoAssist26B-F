"""
Email Templates

Professional email templates for SaaS application using SendGrid.

This module provides a collection of pre-designed email templates for common
transactional emails including welcome, password reset, invoices, subscriptions, etc.

All templates use a responsive design with both HTML and plain text versions.

Usage:
    from app.services.email_templates import EmailTemplates
    
    template = EmailTemplates.welcome("John Doe", "https://app.com/login")
    email_service.send_email(
        to_email="user@example.com",
        subject=template["subject"],
        html_content=template["html"],
        text_content=template["text"]
    )

Available Templates:
    - welcome: Welcome email for new users
    - password_reset: Password reset email with token
    - email_verification: Email verification link
    - invoice: Invoice email with details and items
    - subscription_created: Subscription confirmation email
    - subscription_cancelled: Subscription cancellation confirmation
    - trial_ending: Trial period ending reminder
"""

from typing import Optional, Dict, Any
import os


class EmailTemplates:
    """Collection of email templates"""

    @staticmethod
    def get_base_template(html_content: str, footer_text: Optional[str] = None) -> str:
        """Get base email template with header and footer"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        footer = footer_text or f"© {app_name}. All rights reserved."
        
        return f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                        {app_name}
                                    </h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    {html_content}
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                                    <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
                                        {footer}
                                    </p>
                                    <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                        <a href="{frontend_url}" style="color: #667eea; text-decoration: none;">Visitez notre site</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

    @staticmethod
    def welcome(name: str, login_url: Optional[str] = None) -> Dict[str, str]:
        """Welcome email template"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        login_url = login_url or f"{frontend_url}/auth/login"
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        
        html_content = f"""
            <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Bienvenue {name} ! 🎉
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Merci de vous être inscrit sur {app_name} ! Nous sommes ravis de vous avoir parmi nous.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Votre compte est maintenant actif et prêt à être utilisé. Commencez dès maintenant à explorer toutes les fonctionnalités disponibles.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{login_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Accéder à mon compte
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Si vous avez des questions, n'hésitez pas à nous contacter. Notre équipe est là pour vous aider !
            </p>
        """
        
        text_content = f"""
Bienvenue {name} !

Merci de vous être inscrit sur {app_name} ! Nous sommes ravis de vous avoir parmi nous.

Votre compte est maintenant actif et prêt à être utilisé.

Accédez à votre compte : {login_url}

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe {app_name}
        """
        
        return {
            "subject": f"Bienvenue sur {app_name} !",
            "html": EmailTemplates.get_base_template(html_content),
            "text": text_content.strip(),
        }

    @staticmethod
    def password_reset(name: str, reset_token: str, reset_url: Optional[str] = None) -> Dict[str, str]:
        """Password reset email template"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = reset_url or f"{frontend_url}/auth/reset-password?token={reset_token}"
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        
        html_content = f"""
            <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Réinitialisation de mot de passe
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {name},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte {app_name}.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Réinitialiser mon mot de passe
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Ou copiez ce lien dans votre navigateur :
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 20px 0;">
                {reset_url}
            </p>
            <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                ⚠️ Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
        """
        
        text_content = f"""
Réinitialisation de mot de passe

Bonjour {name},

Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte {app_name}.

Cliquez sur ce lien pour réinitialiser votre mot de passe :
{reset_url}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe {app_name}
        """
        
        return {
            "subject": f"Réinitialisation de mot de passe - {app_name}",
            "html": EmailTemplates.get_base_template(html_content),
            "text": text_content.strip(),
        }

    @staticmethod
    def email_verification(name: str, verification_token: str, verification_url: Optional[str] = None) -> Dict[str, str]:
        """Email verification template"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verification_url = verification_url or f"{frontend_url}/auth/verify-email?token={verification_token}"
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        
        html_content = f"""
            <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Vérifiez votre adresse email
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {name},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Merci de vous être inscrit sur {app_name} ! Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Vérifier mon email
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Ou copiez ce lien dans votre navigateur :
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 20px 0;">
                {verification_url}
            </p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Ce lien expire dans 24 heures.
            </p>
        """
        
        text_content = f"""
Vérifiez votre adresse email

Bonjour {name},

Merci de vous être inscrit sur {app_name} ! Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous.

{verification_url}

Ce lien expire dans 24 heures.

Cordialement,
L'équipe {app_name}
        """
        
        return {
            "subject": f"Vérifiez votre email - {app_name}",
            "html": EmailTemplates.get_base_template(html_content),
            "text": text_content.strip(),
        }

    @staticmethod
    def invoice(
        name: str,
        invoice_number: str,
        invoice_date: str,
        amount: float,
        currency: str = "EUR",
        invoice_url: Optional[str] = None,
        items: Optional[list] = None,
    ) -> Dict[str, str]:
        """Invoice email template"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        invoice_url = invoice_url or f"{frontend_url}/invoices/{invoice_number}"
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        
        items_html = ""
        if items:
            items_html = """
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">Description</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">Montant</th>
                    </tr>
                </thead>
                <tbody>
            """
            for item in items:
                items_html += f"""
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">{item.get('description', '')}</td>
                        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #6b7280;">{item.get('amount', 0)} {currency}</td>
                    </tr>
                """
            items_html += """
                </tbody>
            </table>
            """
        
        html_content = f"""
            <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Facture #{invoice_number}
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {name},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Votre facture est prête. Vous trouverez les détails ci-dessous.
            </p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Numéro de facture :</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 5px 0; text-align: right;">#{invoice_number}</td>
                    </tr>
                    <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Date :</td>
                        <td style="color: #111827; font-size: 14px; padding: 5px 0; text-align: right;">{invoice_date}</td>
                    </tr>
                    <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">Montant total :</td>
                        <td style="color: #111827; font-size: 18px; font-weight: 700; padding: 5px 0; text-align: right;">{amount} {currency}</td>
                    </tr>
                </table>
            </div>
            
            {items_html}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{invoice_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Voir la facture
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Merci pour votre confiance !
            </p>
        """
        
        text_content = f"""
Facture #{invoice_number}

Bonjour {name},

Votre facture est prête. Vous trouverez les détails ci-dessous.

Numéro de facture : #{invoice_number}
Date : {invoice_date}
Montant total : {amount} {currency}

Voir la facture : {invoice_url}

Merci pour votre confiance !

Cordialement,
L'équipe {app_name}
        """
        
        return {
            "subject": f"Facture #{invoice_number} - {app_name}",
            "html": EmailTemplates.get_base_template(html_content),
            "text": text_content.strip(),
        }

    @staticmethod
    def subscription_created(name: str, plan_name: str, amount: float, currency: str = "EUR") -> Dict[str, str]:
        """Subscription created email template"""
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        html_content = f"""
            <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Abonnement activé ! 🎉
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {name},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Votre abonnement <strong>{plan_name}</strong> a été activé avec succès !
            </p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
                    ✅ Abonnement actif
                </p>
                <p style="margin: 5px 0 0 0; color: #047857; font-size: 14px;">
                    Plan : {plan_name} - {amount} {currency}/mois
                </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{frontend_url}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Accéder au dashboard
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan.
            </p>
        """
        
        text_content = f"""
Abonnement activé !

Bonjour {name},

Votre abonnement {plan_name} a été activé avec succès !

Plan : {plan_name} - {amount} {currency}/mois

Accédez à votre dashboard : {frontend_url}/dashboard

Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan.

Cordialement,
L'équipe {app_name}
        """
        
        return {
            "subject": f"Votre abonnement {plan_name} est actif - {app_name}",
            "html": EmailTemplates.get_base_template(html_content),
            "text": text_content.strip(),
        }

    @staticmethod
    def subscription_cancelled(name: str, plan_name: str, end_date: str) -> Dict[str, str]:
        """Subscription cancelled email template"""
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        html_content = f"""
            <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Abonnement annulé
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {name},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Votre abonnement <strong>{plan_name}</strong> a été annulé. Il restera actif jusqu'au <strong>{end_date}</strong>.
            </p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                    ⚠️ Abonnement annulé
                </p>
                <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 14px;">
                    Actif jusqu'au : {end_date}
                </p>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Vous pouvez réactiver votre abonnement à tout moment depuis votre compte.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{frontend_url}/dashboard/billing" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Gérer mon abonnement
                </a>
            </div>
        """
        
        text_content = f"""
Abonnement annulé

Bonjour {name},

Votre abonnement {plan_name} a été annulé. Il restera actif jusqu'au {end_date}.

Vous pouvez réactiver votre abonnement à tout moment depuis votre compte.

Gérer mon abonnement : {frontend_url}/dashboard/billing

Cordialement,
L'équipe {app_name}
        """
        
        return {
            "subject": f"Abonnement annulé - {app_name}",
            "html": EmailTemplates.get_base_template(html_content),
            "text": text_content.strip(),
        }

    @staticmethod
    def trial_ending(name: str, days_remaining: int, upgrade_url: Optional[str] = None) -> Dict[str, str]:
        """Trial ending soon email template"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        upgrade_url = upgrade_url or f"{frontend_url}/pricing"
        app_name = os.getenv("SENDGRID_FROM_NAME", "MODELE")
        
        html_content = f"""
            <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Votre période d'essai se termine bientôt
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour {name},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Votre période d'essai se termine dans <strong>{days_remaining} jour{'s' if days_remaining > 1 else ''}</strong>.
            </p>
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                    ⏰ {days_remaining} jour{'s' if days_remaining > 1 else ''} restant{'s' if days_remaining > 1 else ''}
                </p>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Ne perdez pas l'accès à toutes les fonctionnalités ! Abonnez-vous maintenant pour continuer à profiter de {app_name}.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{upgrade_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Choisir un plan
                </a>
            </div>
        """
        
        text_content = f"""
Votre période d'essai se termine bientôt

Bonjour {name},

Votre période d'essai se termine dans {days_remaining} jour{'s' if days_remaining > 1 else ''}.

Ne perdez pas l'accès à toutes les fonctionnalités ! Abonnez-vous maintenant.

Choisir un plan : {upgrade_url}

Cordialement,
L'équipe {app_name}
        """
        
        return {
            "subject": f"Votre essai se termine dans {days_remaining} jour{'s' if days_remaining > 1 else ''} - {app_name}",
            "html": EmailTemplates.get_base_template(html_content),
            "text": text_content.strip(),
        }


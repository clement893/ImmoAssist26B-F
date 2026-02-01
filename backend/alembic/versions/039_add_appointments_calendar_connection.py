"""Add appointments and calendar_connections tables

Revision ID: 039_appointments
Revises: 038_add_completed_steps
Create Date: 2026-02-01

Creates appointments, appointment_attendees, calendar_connections.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "039_appointments"
down_revision: Union[str, None] = "038_add_completed_steps"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.Enum("confirmed", "pending", "cancelled", name="appointmentstatus"), nullable=False, server_default="confirmed"),
        sa.Column("broker_id", sa.Integer(), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=True),
        sa.Column("google_event_id", sa.String(length=255), nullable=True),
        sa.Column("outlook_event_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["broker_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["transaction_id"], ["real_estate_transactions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_appointments_broker_id", "appointments", ["broker_id"])
    op.create_index("idx_appointments_start_time", "appointments", ["start_time"])
    op.create_index("idx_appointments_status", "appointments", ["status"])
    op.create_index("idx_appointments_transaction_id", "appointments", ["transaction_id"])
    op.create_index(op.f("ix_appointments_id"), "appointments", ["id"])
    op.create_index("ix_appointments_google_event_id", "appointments", ["google_event_id"], unique=True)
    op.create_index("ix_appointments_outlook_event_id", "appointments", ["outlook_event_id"], unique=True)

    op.create_table(
        "appointment_attendees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=False),
        sa.Column("contact_id", sa.Integer(), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.Enum("accepted", "declined", "tentative", "needs_action", name="attendeestatus"), nullable=False, server_default="needs_action"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["contact_id"], ["real_estate_contacts.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_appointment_attendees_appointment_id", "appointment_attendees", ["appointment_id"])
    op.create_index("idx_appointment_attendees_contact_id", "appointment_attendees", ["contact_id"])
    op.create_index(op.f("ix_appointment_attendees_id"), "appointment_attendees", ["id"])

    op.create_table(
        "calendar_connections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.Enum("google", "outlook", name="calendarprovider"), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "provider", name="uq_calendar_connection_user_provider"),
    )
    op.create_index(op.f("ix_calendar_connections_id"), "calendar_connections", ["id"])
    op.create_index("ix_calendar_connections_user_id", "calendar_connections", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_calendar_connections_user_id", table_name="calendar_connections")
    op.drop_index(op.f("ix_calendar_connections_id"), table_name="calendar_connections")
    op.drop_table("calendar_connections")
    op.drop_index(op.f("ix_appointment_attendees_id"), table_name="appointment_attendees")
    op.drop_index("idx_appointment_attendees_contact_id", table_name="appointment_attendees")
    op.drop_index("idx_appointment_attendees_appointment_id", table_name="appointment_attendees")
    op.drop_table("appointment_attendees")
    op.drop_index("ix_appointments_outlook_event_id", table_name="appointments")
    op.drop_index("ix_appointments_google_event_id", table_name="appointments")
    op.drop_index(op.f("ix_appointments_id"), table_name="appointments")
    op.drop_index("idx_appointments_transaction_id", table_name="appointments")
    op.drop_index("idx_appointments_status", table_name="appointments")
    op.drop_index("idx_appointments_start_time", table_name="appointments")
    op.drop_index("idx_appointments_broker_id", table_name="appointments")
    op.drop_table("appointments")
    op.execute("DROP TYPE IF EXISTS calendarprovider")
    op.execute("DROP TYPE IF EXISTS attendeestatus")
    op.execute("DROP TYPE IF EXISTS appointmentstatus")

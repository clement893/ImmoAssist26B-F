"""create masterclass tables

Revision ID: 029
Revises: 028
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '029'
down_revision = '028'
branch_labels = None
depends_on = None


def upgrade():
    """Create masterclass and booking tables"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create masterclass_events table
    if 'masterclass_events' not in existing_tables:
        op.create_table(
            'masterclass_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title_en', sa.String(length=200), nullable=False),
            sa.Column('title_fr', sa.String(length=200), nullable=False),
            sa.Column('description_en', sa.Text(), nullable=True),
            sa.Column('description_fr', sa.Text(), nullable=True),
            sa.Column('duration_days', sa.Integer(), nullable=False, server_default='2'),
            sa.Column('language', sa.String(length=50), nullable=False, server_default='English'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_masterclass_events_created_at', 'masterclass_events', ['created_at'])
    
    # Create cities table
    if 'cities' not in existing_tables:
        op.create_table(
            'cities',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name_en', sa.String(length=100), nullable=False),
            sa.Column('name_fr', sa.String(length=100), nullable=False),
            sa.Column('province', sa.String(length=50), nullable=True),
            sa.Column('country', sa.String(length=50), nullable=False, server_default='Canada'),
            sa.Column('timezone', sa.String(length=50), nullable=False, server_default='America/Toronto'),
            sa.Column('image_url', sa.String(length=500), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_cities_name_en', 'cities', ['name_en'])
        op.create_index('idx_cities_province', 'cities', ['province'])
    
    # Create venues table
    if 'venues' not in existing_tables:
        op.create_table(
            'venues',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('city_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('address', sa.String(length=300), nullable=True),
            sa.Column('postal_code', sa.String(length=20), nullable=True),
            sa.Column('capacity', sa.Integer(), nullable=False),
            sa.Column('amenities', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['city_id'], ['cities.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_venues_city_id', 'venues', ['city_id'])
    
    # Create city_events table
    if 'city_events' not in existing_tables:
        op.create_table(
            'city_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('event_id', sa.Integer(), nullable=False),
            sa.Column('city_id', sa.Integer(), nullable=False),
            sa.Column('venue_id', sa.Integer(), nullable=False),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('end_date', sa.Date(), nullable=False),
            sa.Column('start_time', sa.Time(), nullable=False, server_default='09:00:00'),
            sa.Column('end_time', sa.Time(), nullable=False, server_default='17:00:00'),
            sa.Column('total_capacity', sa.Integer(), nullable=False, server_default='30'),
            sa.Column('available_spots', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
            sa.Column('early_bird_deadline', sa.Date(), nullable=True),
            sa.Column('early_bird_price', sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column('regular_price', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('group_discount_percentage', sa.Integer(), nullable=False, server_default='10'),
            sa.Column('group_minimum', sa.Integer(), nullable=False, server_default='3'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['event_id'], ['masterclass_events.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['city_id'], ['cities.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['venue_id'], ['venues.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_city_events_event_id', 'city_events', ['event_id'])
        op.create_index('idx_city_events_city_id', 'city_events', ['city_id'])
        op.create_index('idx_city_events_status', 'city_events', ['status'])
        op.create_index('idx_city_events_start_date', 'city_events', ['start_date'])
        op.create_index('idx_city_events_venue_id', 'city_events', ['venue_id'])
    
    # Create bookings table
    if 'bookings' not in existing_tables:
        op.create_table(
            'bookings',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('city_event_id', sa.Integer(), nullable=False),
            sa.Column('booking_reference', sa.String(length=20), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
            sa.Column('attendee_name', sa.String(length=200), nullable=False),
            sa.Column('attendee_email', sa.String(length=200), nullable=False),
            sa.Column('attendee_phone', sa.String(length=50), nullable=True),
            sa.Column('ticket_type', sa.String(length=20), nullable=False, server_default='regular'),
            sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('discount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
            sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='pending'),
            sa.Column('payment_intent_id', sa.String(length=200), nullable=True),
            sa.Column('payment_method_id', sa.String(length=200), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['city_event_id'], ['city_events.id'], ondelete='RESTRICT'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('booking_reference')
        )
        op.create_index('idx_bookings_city_event_id', 'bookings', ['city_event_id'])
        op.create_index('idx_bookings_reference', 'bookings', ['booking_reference'])
        op.create_index('idx_bookings_email', 'bookings', ['attendee_email'])
        op.create_index('idx_bookings_status', 'bookings', ['status'])
        op.create_index('idx_bookings_payment_status', 'bookings', ['payment_status'])
        op.create_index('idx_bookings_created_at', 'bookings', ['created_at'])
    
    # Create attendees table
    if 'attendees' not in existing_tables:
        op.create_table(
            'attendees',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('booking_id', sa.Integer(), nullable=False),
            sa.Column('first_name', sa.String(length=100), nullable=False),
            sa.Column('last_name', sa.String(length=100), nullable=False),
            sa.Column('email', sa.String(length=200), nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('role', sa.String(length=100), nullable=True),
            sa.Column('experience_level', sa.String(length=50), nullable=True),
            sa.Column('dietary_restrictions', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_attendees_booking_id', 'attendees', ['booking_id'])
        op.create_index('idx_attendees_email', 'attendees', ['email'])
    
    # Create booking_payments table
    if 'booking_payments' not in existing_tables:
        op.create_table(
            'booking_payments',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('booking_id', sa.Integer(), nullable=False),
            sa.Column('payment_intent_id', sa.String(length=200), nullable=False),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='CAD'),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
            sa.Column('stripe_charge_id', sa.String(length=200), nullable=True),
            sa.Column('refund_id', sa.String(length=200), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('refunded_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('payment_intent_id')
        )
        op.create_index('idx_booking_payments_booking_id', 'booking_payments', ['booking_id'])
        op.create_index('idx_booking_payments_payment_intent_id', 'booking_payments', ['payment_intent_id'])
        op.create_index('idx_booking_payments_status', 'booking_payments', ['status'])
        op.create_index('idx_booking_payments_created_at', 'booking_payments', ['created_at'])


def downgrade():
    """Drop masterclass and booking tables"""
    # Drop tables in reverse order (respecting foreign key constraints)
    op.drop_index('idx_booking_payments_created_at', table_name='booking_payments')
    op.drop_index('idx_booking_payments_status', table_name='booking_payments')
    op.drop_index('idx_booking_payments_payment_intent_id', table_name='booking_payments')
    op.drop_index('idx_booking_payments_booking_id', table_name='booking_payments')
    op.drop_table('booking_payments')
    
    op.drop_index('idx_attendees_email', table_name='attendees')
    op.drop_index('idx_attendees_booking_id', table_name='attendees')
    op.drop_table('attendees')
    
    op.drop_index('idx_bookings_created_at', table_name='bookings')
    op.drop_index('idx_bookings_payment_status', table_name='bookings')
    op.drop_index('idx_bookings_status', table_name='bookings')
    op.drop_index('idx_bookings_email', table_name='bookings')
    op.drop_index('idx_bookings_reference', table_name='bookings')
    op.drop_index('idx_bookings_city_event_id', table_name='bookings')
    op.drop_table('bookings')
    
    op.drop_index('idx_city_events_venue_id', table_name='city_events')
    op.drop_index('idx_city_events_start_date', table_name='city_events')
    op.drop_index('idx_city_events_status', table_name='city_events')
    op.drop_index('idx_city_events_city_id', table_name='city_events')
    op.drop_index('idx_city_events_event_id', table_name='city_events')
    op.drop_table('city_events')
    
    op.drop_index('idx_venues_city_id', table_name='venues')
    op.drop_table('venues')
    
    op.drop_index('idx_cities_province', table_name='cities')
    op.drop_index('idx_cities_name_en', table_name='cities')
    op.drop_table('cities')
    
    op.drop_index('idx_masterclass_events_created_at', table_name='masterclass_events')
    op.drop_table('masterclass_events')
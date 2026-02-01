"""
Alembic Environment Configuration
"""

from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection

from alembic import context

# Import your models and config
from app.core.config import settings
from app.core.database import Base

# Import all models here for autogenerate
# This ensures Alembic can detect all table changes
from app.models import user  # noqa: F401
from app.models import role  # noqa: F401
from app.models import team  # noqa: F401
from app.models import invitation  # noqa: F401
from app.models import theme  # noqa: F401
from app.models import project  # noqa: F401
from app.models import file  # noqa: F401
from app.models import plan  # noqa: F401
from app.models import subscription  # noqa: F401
from app.models import invoice  # noqa: F401
from app.models import api_key  # noqa: F401
from app.models import webhook_event  # noqa: F401
from app.models import integration  # noqa: F401
from app.models import page  # noqa: F401
from app.models import form  # noqa: F401
from app.models import menu  # noqa: F401
from app.models import support_ticket  # noqa: F401
from app.models import contact  # noqa: F401
from app.models import company  # noqa: F401
# from app.models import masterclass  # noqa: F401  # Removed: masterclass models deleted
from app.models import booking  # noqa: F401
from app.models import client_invitation  # noqa: F401
from app.models import portail_transaction  # noqa: F401
from app.models import transaction_document  # noqa: F401
from app.models import transaction_message  # noqa: F401
from app.models import transaction_tache  # noqa: F401
from app.models import transaction_etape  # noqa: F401
from app.models import property_listing  # noqa: F401
from app.core.security_audit import SecurityAuditLog  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Set the database URL from settings
# Convert async URL to sync URL for Alembic (Alembic uses sync SQLAlchemy)
database_url = str(settings.DATABASE_URL)
# Replace asyncpg with psycopg2 for Alembic
if "postgresql+asyncpg://" in database_url:
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
elif "postgresql://" in database_url and "+" not in database_url:
    # If it's plain postgresql://, add psycopg2 driver
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")

config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    
    Uses synchronous engine with psycopg2 driver.
    """
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

"""Merge migration heads: contacts and documents

Revision ID: d7ba68446070
Revises: 43745c683641, 7a8b9c0d1e2f
Create Date: 2026-01-31 16:22:52.894021

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7ba68446070'
down_revision: Union[str, None] = ('43745c683641', '7a8b9c0d1e2f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass


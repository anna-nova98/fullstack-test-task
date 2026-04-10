"""add indexes for pagination queries

Revision ID: a1b2c3d4e5f6
Revises: 0d6439d2e79f
Create Date: 2026-04-10 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0d6439d2e79f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_files_created_at", "files", ["created_at"])
    op.create_index("ix_alerts_created_at", "alerts", ["created_at"])
    op.create_index("ix_alerts_file_id", "alerts", ["file_id"])


def downgrade() -> None:
    op.drop_index("ix_alerts_file_id", table_name="alerts")
    op.drop_index("ix_alerts_created_at", table_name="alerts")
    op.drop_index("ix_files_created_at", table_name="files")

"""uuid pks

Revision ID: 2003ac400242
Revises: f9b0ec193f4b
Create Date: 2026-04-03 14:09:58.475440

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2003ac400242"
down_revision: Union[str, Sequence[str], None] = "f9b0ec193f4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Cannot cast INTEGER to UUID automatically - drop and recreate tables.
    # team_members must be dropped first due to FK constraints.
    op.drop_table("team_members")
    op.drop_table("users")
    op.drop_table("teams")

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("username", sa.String(80), unique=True, nullable=False),
        sa.Column("email", sa.String(120), unique=True, nullable=False),
    )
    op.create_table(
        "teams",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(80), unique=True, nullable=False),
    )
    op.create_table(
        "team_members",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("team_id", sa.Uuid(), sa.ForeignKey("teams.id"), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("team_members")
    op.drop_table("users")
    op.drop_table("teams")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(80), unique=True, nullable=False),
        sa.Column("email", sa.String(120), unique=True, nullable=False),
    )
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(80), unique=True, nullable=False),
    )
    op.create_table(
        "team_members",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id"), nullable=False),
    )

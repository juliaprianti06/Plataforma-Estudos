"""Add privacy and reversible group archival."""
from alembic import op
import sqlalchemy as sa

revision = 'g20a20261002'
down_revision = 't10a20260913'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('grupos', sa.Column('privado', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('grupos', sa.Column('arquivado', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    op.drop_column('grupos', 'arquivado')
    op.drop_column('grupos', 'privado')

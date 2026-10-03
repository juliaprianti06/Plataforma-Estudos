"""Persist notification read state per account."""
from alembic import op
import sqlalchemy as sa

revision = 'd20a20261002'
down_revision = 'g20a20261002'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('notificacoes_lidas',
        sa.Column('usuario_id', sa.Integer(), sa.ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), primary_key=True),
        sa.Column('chave', sa.String(100), primary_key=True))


def downgrade():
    op.drop_table('notificacoes_lidas')

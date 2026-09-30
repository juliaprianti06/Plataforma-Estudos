
from alembic import op
import sqlalchemy as sa


revision = 'd10a20260923'
down_revision = '5b50aa7a80cd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tarefas', sa.Column('criado_em', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tarefas', sa.Column('concluido_em', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('tarefas', 'criado_em', server_default=sa.func.now())


def downgrade() -> None:
    op.drop_column('tarefas', 'concluido_em')
    op.drop_column('tarefas', 'criado_em')

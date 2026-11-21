"""Persist study sessions without inserting demonstration records."""
from alembic import op
import sqlalchemy as sa

revision = 's10a20261121'
down_revision = 'e10a20261022'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'sessoes_estudo',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('disciplina_id', sa.Integer(), nullable=False),
        sa.Column('data', sa.Date(), nullable=False),
        sa.Column('inicio', sa.Time(), nullable=False),
        sa.Column('termino', sa.Time(), nullable=False),
        sa.Column('duracao_minutos', sa.Integer(), nullable=False),
        sa.Column('observacao', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id_usuario'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['disciplina_id'], ['disciplinas.id'], ondelete='CASCADE'),
        sa.CheckConstraint('termino > inicio', name='ck_sessoes_estudo_horarios'),
        sa.CheckConstraint('duracao_minutos > 0 AND duracao_minutos < 1440', name='ck_sessoes_estudo_duracao'),
    )
    op.create_index('ix_sessoes_estudo_usuario_data', 'sessoes_estudo', ['usuario_id', 'data'])


def downgrade():
    op.drop_index('ix_sessoes_estudo_usuario_data', table_name='sessoes_estudo')
    op.drop_table('sessoes_estudo')

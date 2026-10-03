"""Persist group activity and support group deletion without deleting personal files."""
from alembic import op
import sqlalchemy as sa

revision = 'g30a20261002'
down_revision = 'd30a20261003'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('grupos', sa.Column('excluido_em', sa.DateTime(timezone=True), nullable=True))
    op.create_table('atividades_grupo',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('id_grupo', sa.Integer(), sa.ForeignKey('grupos.id_grupo', ondelete='CASCADE'), nullable=False),
        sa.Column('id_usuario', sa.Integer(), sa.ForeignKey('usuarios.id_usuario', ondelete='SET NULL'), nullable=True),
        sa.Column('tipo', sa.String(20), nullable=False),
        sa.Column('texto', sa.Text(), nullable=True),
        sa.Column('id_material', sa.Integer(), sa.ForeignKey('materiais.id_material', ondelete='SET NULL'), nullable=True),
        sa.Column('titulo_material', sa.String(150), nullable=True),
        sa.Column('tamanho_material', sa.Integer(), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
    op.create_index('ix_atividades_grupo_feed', 'atividades_grupo', ['id_grupo', 'id'])


def downgrade():
    op.drop_table('atividades_grupo')
    op.drop_column('grupos', 'excluido_em')

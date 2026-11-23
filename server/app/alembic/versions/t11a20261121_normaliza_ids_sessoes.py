"""Normalize study-session identifiers to integers."""
from alembic import op
import sqlalchemy as sa


revision = 't11a20261121'
down_revision = 's10a20261121'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('sessoes_estudo', sa.Column('id_novo', sa.Integer(), nullable=True))
    op.execute("""
        UPDATE sessoes_estudo
        SET id_novo = numeracao.id_novo
        FROM (
            SELECT id, row_number() OVER (ORDER BY usuario_id, data, inicio, id)::integer AS id_novo
            FROM sessoes_estudo
        ) AS numeracao
        WHERE sessoes_estudo.id = numeracao.id
    """)
    op.drop_constraint('sessoes_estudo_pkey', 'sessoes_estudo', type_='primary')
    op.drop_column('sessoes_estudo', 'id')
    op.alter_column('sessoes_estudo', 'id_novo', new_column_name='id', nullable=False)
    op.create_primary_key('sessoes_estudo_pkey', 'sessoes_estudo', ['id'])
    op.execute("CREATE SEQUENCE IF NOT EXISTS sessoes_estudo_id_seq")
    op.execute("""
        SELECT setval(
            'sessoes_estudo_id_seq',
            COALESCE((SELECT MAX(id) FROM sessoes_estudo), 0) + 1,
            false
        )
    """)
    op.execute("ALTER SEQUENCE sessoes_estudo_id_seq OWNED BY sessoes_estudo.id")
    op.execute("ALTER TABLE sessoes_estudo ALTER COLUMN id SET DEFAULT nextval('sessoes_estudo_id_seq')")


def downgrade():
    op.execute("ALTER TABLE sessoes_estudo ALTER COLUMN id DROP DEFAULT")
    op.execute("DROP SEQUENCE IF EXISTS sessoes_estudo_id_seq")
    op.add_column('sessoes_estudo', sa.Column('id_texto', sa.String(36), nullable=True))
    op.execute("UPDATE sessoes_estudo SET id_texto = id::text")
    op.drop_constraint('sessoes_estudo_pkey', 'sessoes_estudo', type_='primary')
    op.drop_column('sessoes_estudo', 'id')
    op.alter_column('sessoes_estudo', 'id_texto', new_column_name='id', nullable=False)
    op.create_primary_key('sessoes_estudo_pkey', 'sessoes_estudo', ['id'])

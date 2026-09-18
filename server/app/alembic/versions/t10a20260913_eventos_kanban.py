"""Add group events and ensure canonical Kanban columns."""
from alembic import op
import sqlalchemy as sa

revision = "t10a20260913"
down_revision = "g10a20260913"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("eventos_grupo",
        sa.Column("id_evento", sa.Integer(), primary_key=True),
        sa.Column("id_grupo", sa.Integer(), sa.ForeignKey("grupos.id_grupo"), nullable=False),
        sa.Column("id_criador", sa.Integer(), sa.ForeignKey("usuarios.id_usuario"), nullable=False),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("inicio_em", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_eventos_grupo_id_grupo", "eventos_grupo", ["id_grupo"])
    op.create_index("ix_eventos_grupo_inicio_em", "eventos_grupo", ["inicio_em"])
    op.execute("""INSERT INTO colunas_kanban (id_grupo, nome, ordem)
      SELECT grupos.id_grupo, columns.nome, columns.ordem FROM grupos
      CROSS JOIN (VALUES ('A fazer', 0), ('Em andamento', 1), ('Conclu\u00eddo', 2)) AS columns(nome, ordem)
      WHERE NOT EXISTS (SELECT 1 FROM colunas_kanban existing WHERE existing.id_grupo = grupos.id_grupo AND existing.ordem = columns.ordem)""")


def downgrade():
    op.drop_table("eventos_grupo")
    # Keep existing Kanban columns and their tasks to preserve group data.

"""Add group presentation and invitation codes."""
from alembic import op
import sqlalchemy as sa

revision = "g10a20260913"
down_revision = "c10a20260912"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("grupos", sa.Column("categoria", sa.String(30), nullable=False, server_default="Programa\u00e7\u00e3o"))
    op.add_column("grupos", sa.Column("icone", sa.String(20), nullable=False, server_default="react"))
    op.add_column("grupos", sa.Column("codigo_convite", sa.String(6), nullable=True))
    op.execute("""DO $$ DECLARE row_id integer; candidate text;
    BEGIN FOR row_id IN SELECT id_grupo FROM grupos LOOP
      LOOP
        candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM grupos WHERE codigo_convite = candidate);
      END LOOP;
      UPDATE grupos SET codigo_convite = candidate WHERE id_grupo = row_id;
    END LOOP; END $$;""")
    op.alter_column("grupos", "codigo_convite", nullable=False)
    op.create_unique_constraint("uq_grupos_codigo_convite", "grupos", ["codigo_convite"])


def downgrade():
    op.drop_constraint("uq_grupos_codigo_convite", "grupos", type_="unique")
    op.drop_column("grupos", "codigo_convite")
    op.drop_column("grupos", "icone")
    op.drop_column("grupos", "categoria")

"""Allow events owned by an individual student."""
from alembic import op
import sqlalchemy as sa

revision = "e10a20261022"
down_revision = "g30a20261002"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("eventos_grupo", "id_grupo", existing_type=sa.Integer(), nullable=True)


def downgrade():
    connection = op.get_bind()
    if connection.scalar(sa.text("SELECT count(*) FROM eventos_grupo WHERE id_grupo IS NULL")):
        raise RuntimeError("Existem eventos pessoais; remova-os antes do downgrade.")
    op.alter_column("eventos_grupo", "id_grupo", existing_type=sa.Integer(), nullable=False)

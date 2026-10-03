"""Restore the task-responsible association table."""
from alembic import op
import sqlalchemy as sa


revision = "d30a20261003"
down_revision = "d20a20261002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if not sa.inspect(bind).has_table("tarefas_responsaveis"):
        op.create_table(
            "tarefas_responsaveis",
            sa.Column("id_tarefa", sa.Integer(), nullable=False),
            sa.Column("id_usuario", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["id_tarefa"], ["tarefas.id"]),
            sa.ForeignKeyConstraint(["id_usuario"], ["usuarios.id_usuario"]),
            sa.PrimaryKeyConstraint("id_tarefa", "id_usuario"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    if sa.inspect(bind).has_table("tarefas_responsaveis"):
        op.drop_table("tarefas_responsaveis")

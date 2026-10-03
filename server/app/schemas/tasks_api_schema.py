from datetime import datetime
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, AwareDatetime, model_validator


class TaskFields(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
    description: str = Field(default="", max_length=2000)
    priority: Literal["high", "medium", "low"] = "medium"
    status: Literal["todo", "progress", "done"] = "todo"
    dueAt: AwareDatetime | None = None
    disciplineId: int | None = Field(default=None, gt=0)


class TaskCreate(TaskFields):
    groupId: int | None = Field(default=None, gt=0)

    @model_validator(mode='after')
    def validate_context(self):
        if self.groupId is not None and not 3 <= len(self.title) <= 150:
            raise ValueError('Tarefas de grupo precisam de títulos entre 3 e 150 caracteres.')
        if self.groupId is None and self.disciplineId is None:
            raise ValueError('Selecione uma disciplina para a tarefa pessoal.')
        return self


class TaskMove(BaseModel):
    model_config = ConfigDict(extra='forbid')
    status: Literal['todo', 'progress', 'done']


class TaskResponse(BaseModel):
    # Persisted personal tasks follow the existing /tarefas contract, whose
    # names have no maximum length and may contain fewer than three characters.
    # Input constraints must not prevent reading those records.
    id: int
    title: str
    description: str
    priority: Literal["high", "medium", "low"]
    status: Literal["todo", "progress", "done"]
    dueAt: AwareDatetime | None = None
    disciplineId: int | None = None
    groupId: str
    groupName: str
    detail: str
    canEdit: bool


class EventFields(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]
    startsAt: AwareDatetime


class EventInput(EventFields):
    groupId: int = Field(gt=0)


class EventResponse(BaseModel):
    id: str
    title: str
    startsAt: datetime
    groupId: str
    groupName: str
    canEdit: bool

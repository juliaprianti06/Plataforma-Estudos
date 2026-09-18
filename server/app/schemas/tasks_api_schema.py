from datetime import datetime
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, AwareDatetime


class TaskFields(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]
    description: str = Field(default="", max_length=2000)
    priority: Literal["high", "medium", "low"] = "medium"
    status: Literal["todo", "progress", "done"] = "todo"
    dueAt: AwareDatetime | None = None
    disciplineId: int | None = Field(default=None, gt=0)


class TaskCreate(TaskFields):
    groupId: int = Field(gt=0)


class TaskResponse(TaskFields):
    id: int
    groupId: str
    groupName: str
    detail: str
    canEdit: bool


class EventInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]
    startsAt: AwareDatetime
    groupId: int = Field(gt=0)


class EventResponse(BaseModel):
    id: str
    title: str
    startsAt: datetime
    groupId: str
    groupName: str
    canEdit: bool

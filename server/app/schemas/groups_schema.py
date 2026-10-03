import re
from typing import Annotated, Literal
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints, field_validator

Category = Literal["Programa\u00e7\u00e3o", "Design", "Matem\u00e1tica"]
Icon = Literal["react", "pencil", "laptop", "math", "phone", "robot"]


class GroupInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=60)]
    description: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=240)]
    category: Category
    icon: Icon
    private: bool = False


class InviteInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=6, max_length=12)

    @field_validator("code")
    @classmethod
    def normalize(cls, value):
        value = re.sub(r"[\s-]", "", value).upper()
        if not re.fullmatch(r"[A-Z0-9]{6}", value):
            raise ValueError("Informe um c\u00f3digo de seis letras ou n\u00fameros.")
        return value


class GroupCreate(GroupInput):
    inviteCode: str | None = Field(default=None, min_length=6, max_length=6, pattern=r"^[A-Z0-9]{6}$")


class GroupPreview(BaseModel):
    id: str
    name: str
    description: str
    category: str
    icon: str
    members: int
    private: bool = False
    archived: bool = False


class GroupResponse(GroupPreview):
    inviteCode: str
    role: Literal["admin", "member"]


class MemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: Literal['admin', 'member']
    avatar: str | None = None


class MemberRoleInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    role: Literal['admin', 'member']


class ArchiveInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    archived: bool


class ResponsibilityInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    userIds: list[int] = Field(min_length=1, max_length=50)


class CommentInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class ActivityActor(BaseModel):
    id: int | None
    name: str
    avatar: str | None = None


class ActivityMaterial(BaseModel):
    id: int | None
    title: str
    size: int
    available: bool


class GroupActivity(BaseModel):
    id: int
    kind: Literal['comment', 'joined', 'material']
    actor: ActivityActor
    createdAt: AwareDatetime
    text: str | None = None
    material: ActivityMaterial | None = None
    canDelete: bool


class GroupFeed(BaseModel):
    items: list[GroupActivity]
    nextCursor: int | None


from app.schemas.tasks_api_schema import TaskResponse, EventResponse
from app.schemas.material_schema import MaterialResponse


class GroupWorkspace(BaseModel):
    group: GroupResponse
    members: list[MemberResponse]
    tasks: list[TaskResponse]
    events: list[EventResponse]
    materials: list[MaterialResponse]
    responsibilities: dict[int, list[int]]

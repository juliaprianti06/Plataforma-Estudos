import re
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

Category = Literal["Programa\u00e7\u00e3o", "Design", "Matem\u00e1tica"]
Icon = Literal["react", "pencil", "laptop", "math", "phone", "robot"]


class GroupInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=60)]
    description: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=240)]
    category: Category
    icon: Icon


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


class GroupResponse(GroupPreview):
    inviteCode: str
    role: Literal["admin", "member"]

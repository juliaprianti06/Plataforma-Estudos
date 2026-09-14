import base64
import binascii
from datetime import datetime
from io import BytesIO
from typing import Annotated, Literal

from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field, StrictBool, StringConstraints, field_validator

StudyInterest = Literal["Programa\u00e7\u00e3o", "Design", "Matem\u00e1tica", "Ci\u00eancia de dados", "Idiomas", "Ci\u00eancias"]


class Notifications(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tasks: StrictBool
    groups: StrictBool


class ProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    bio: str = Field(max_length=300)
    interests: list[StudyInterest] = Field(max_length=3)
    avatar: str | None = Field(max_length=300000)
    notifications: Notifications

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("bio")
    @classmethod
    def trim_bio(cls, value: str) -> str:
        return value.strip()

    @field_validator("interests")
    @classmethod
    def unique_interests(cls, value: list[StudyInterest]) -> list[StudyInterest]:
        return list(dict.fromkeys(value))

    @field_validator("avatar")
    @classmethod
    def validate_avatar(cls, value: str | None) -> str | None:
        if value is None:
            return None
        formats = {"data:image/jpeg;base64": "JPEG", "data:image/png;base64": "PNG", "data:image/webp;base64": "WEBP"}
        header, separator, encoded = value.partition(",")
        if not separator or header not in formats:
            raise ValueError("Escolha uma foto JPG, PNG ou WebP v\u00e1lida.")
        try:
            raw = base64.b64decode(encoded, validate=True)
            with Image.open(BytesIO(raw), formats=[formats[header]]) as image:
                if image.format != formats[header] or max(image.size) > 1024 or getattr(image, "n_frames", 1) != 1:
                    raise ValueError("Foto incompat\u00edvel: use uma imagem est\u00e1tica de at\u00e9 1024 pixels.")
                image.verify()
            with Image.open(BytesIO(raw), formats=[formats[header]]) as image:
                image.load()
        except (binascii.Error, UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError) as exc:
            raise ValueError("N\u00e3o foi poss\u00edvel abrir a foto.") from exc
        return value


class UserProfile(ProfileInput):
    updatedAt: datetime | None


class ProfileExport(UserProfile):
    email: str

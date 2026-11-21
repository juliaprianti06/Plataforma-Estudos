from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator, model_validator


class SessaoEstudoInput(BaseModel):
    model_config = ConfigDict(extra='forbid')

    disciplina_id: int = Field(gt=0)
    data: date
    inicio: time
    termino: time
    observacao: str = Field(default='', max_length=4000)

    @field_validator('inicio', 'termino')
    @classmethod
    def validar_horario(cls, valor: time) -> time:
        if valor.tzinfo is not None or valor.second or valor.microsecond:
            raise ValueError('Informe o horário em horas e minutos, sem fuso.')
        return valor

    @field_validator('observacao')
    @classmethod
    def limpar_observacao(cls, valor: str) -> str:
        return valor.strip()

    @model_validator(mode='after')
    def validar_intervalo(self):
        if self.termino <= self.inicio:
            raise ValueError('O término deve ser após o início.')
        return self

    @property
    def duracao_minutos(self) -> int:
        return (self.termino.hour - self.inicio.hour) * 60 + self.termino.minute - self.inicio.minute


class DisciplinaSessaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    cor: str


class SessaoEstudoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    disciplina: DisciplinaSessaoResponse
    data: date
    inicio: time
    termino: time
    duracao_minutos: int = Field(serialization_alias='duracaoMinutos')
    observacao: str

    @field_serializer('inicio', 'termino')
    def formatar_horario(self, valor: time) -> str:
        return valor.strftime('%H:%M')

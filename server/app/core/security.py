class UsuarioMock:
    
    def __init__(self, id, nome, email):
        self.id = id
        self.nome = nome
        self.email = email

def get_current_user():
    return UsuarioMock(id=1, nome="Desenvolvedor Mock", email="mock@dev.com")
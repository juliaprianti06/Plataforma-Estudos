import pytest
import os

def register_user(client, email="user@example.com"):
    response = client.post("/api/v1/auth/register", json={"name": "Test User", "email": email, "password": "password123"})
    if response.status_code == 201:
        return response.json()["access_token"]
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return response.json()["access_token"]

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_deletar_disciplina_com_materiais_limpeza_fisica(client):
    token = register_user(client, "disc_cascade@example.com")
    headers = get_headers(token)
    
    res_disc = client.post("/api/v1/disciplinas/", json={"nome": "Física", "professor": "", "cor": ""}, headers=headers)
    assert res_disc.status_code == 201
    disc_id = res_disc.json()["id"]
    
    dummy_file_path = "test_upload_cascade.txt"
    with open(dummy_file_path, "w") as f:
        f.write("Hello, World!")
    
    try:
        with open(dummy_file_path, "rb") as f:
            files = {"file": ("test_upload_cascade.txt", f, "text/plain")}
            data = {"titulo": "Material Cascade", "disciplina_id": str(disc_id)}
            res_mat = client.post("/api/v1/materiais/", data=data, files=files, headers=headers)
    finally:
        if os.path.exists(dummy_file_path):
            os.remove(dummy_file_path)
    
    assert res_mat.status_code == 201
    url_arquivo = res_mat.json()["url_arquivo"]
   
    filename = url_arquivo.replace("/uploads/", "")
    file_path = f"uploads/{filename}"
    assert os.path.exists(file_path), f"File {file_path} was not created"
    
    res_del = client.delete(f"/api/v1/disciplinas/{disc_id}", headers=headers)
    assert res_del.status_code == 204
    
    assert not os.path.exists(file_path), f"File {file_path} was not deleted physically"
    
    res_mat_get = client.get(f"/api/v1/materiais/", headers=headers)
    materials = [m for m in res_mat_get.json() if m["disciplina_id"] == disc_id]
    assert len(materials) == 0

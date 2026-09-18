from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import select
from app.models.tarefa import Tarefa
from app.models.coluna_kanban import ColunaKanban
from test_groups import account, DATA


def setup_group(client):
    owner = account(client, "owner@example.com")
    member = account(client, "member@example.com")
    stranger = account(client, "stranger@example.com")
    group = client.post("/api/v1/groups", headers=owner, json=DATA).json()
    client.post("/api/v1/groups/" + group["id"] + "/join", headers=member)
    return owner, member, stranger, group


def test_task_lifecycle_permissions_and_kanban(client, db):
    owner, member, stranger, group = setup_group(client)
    fields = {"title": "Estudar Python", "description": "Capitulo um", "priority": "high", "status": "todo"}
    assert client.post("/api/v1/tasks", headers=stranger, json=fields | {"groupId": group["id"]}).status_code == 404
    result = client.post("/api/v1/tasks", headers=member, json=fields | {"groupId": group["id"]})
    assert result.status_code == 201, result.text
    task = result.json()
    path = "/api/v1/tasks/" + str(task["id"])
    assert task["canEdit"] and task["groupName"] == DATA["name"]
    assert client.get("/api/v1/tasks", headers=stranger).json() == []
    assert client.put(path, headers=stranger, json=fields).status_code == 404
    for status, order in [("progress", 1), ("done", 2), ("todo", 0)]:
        saved = client.put(path, headers=member, json=fields | {"status": status})
        assert saved.status_code == 200, saved.text
        db.expire_all()
        row = db.get(Tarefa, task["id"])
        assert db.get(ColunaKanban, row.id_coluna).ordem == order
        assert row.data_inicio is not None
    assert client.delete(path, headers=owner).status_code == 204
    assert client.get("/api/v1/tasks", headers=member).json() == []


def test_member_cannot_edit_another_responsibles_task(client):
    owner, member, stranger, group = setup_group(client)
    fields = {"title": "Tarefa do administrador"}
    task = client.post("/api/v1/tasks", headers=owner, json=fields | {"groupId": group["id"]}).json()
    path = "/api/v1/tasks/" + str(task["id"])
    assert client.get("/api/v1/tasks", headers=member).json()[0]["canEdit"] is False
    assert client.put(path, headers=member, json=fields).status_code == 403
    assert client.delete(path, headers=member).status_code == 403
    assert client.delete(path, headers=stranger).status_code == 404
    assert client.get("/api/v1/tasks?groupId=" + group["id"], headers=stranger).status_code == 404


@pytest.mark.parametrize("change", [{"title": "a"}, {"status": "invalid"}, {"priority": "invalid"}, {"dueAt": "2026-01-01T10:00:00"}, {"id_usuario": 4}])
def test_invalid_task_does_not_persist(client, db, change):
    owner, _, _, group = setup_group(client)
    result = client.post("/api/v1/tasks", headers=owner, json={"groupId": group["id"], "title": "Estudar Python"} | change)
    assert result.status_code == 422
    assert db.scalar(select(Tarefa)) is None


def test_task_rejects_unrelated_discipline(client):
    owner, _, _, group = setup_group(client)
    assert client.post("/api/v1/tasks", headers=owner, json={"groupId": group["id"], "title": "Estudar Python", "disciplineId": 999999}).status_code == 404


def test_events_dashboard_progress_and_preferences(client):
    owner, member, stranger, group = setup_group(client)
    now = datetime.now(timezone.utc)
    fields = {"groupId": group["id"], "title": "Revisar Python", "dueAt": (now + timedelta(hours=1)).isoformat()}
    task = client.post("/api/v1/tasks", headers=owner, json=fields).json()
    client.post("/api/v1/tasks", headers=owner, json=fields | {"title": "Tarefa completa", "status": "done"})
    event = {"groupId": group["id"], "title": "Encontro Python", "startsAt": (now + timedelta(days=1)).isoformat()}
    assert client.post("/api/v1/events", headers=member, json=event).status_code == 403
    assert client.post("/api/v1/events", headers=stranger, json=event).status_code == 404
    assert client.post("/api/v1/events", headers=owner, json=event | {"startsAt": (now - timedelta(days=1)).isoformat()}).status_code == 400
    saved = client.post("/api/v1/events", headers=owner, json=event)
    assert saved.status_code == 201, saved.text
    dashboard = client.get("/api/v1/dashboard", headers=owner)
    assert dashboard.headers["cache-control"] == "no-store"
    result = dashboard.json()
    assert result["summary"]["total"] == 2 and result["summary"]["progress"] == 50
    assert result["summary"]["activeTask"]["id"] == task["id"]
    assert len(result["notifications"]) == 2 and len(result["events"]) == 1
    assert client.get("/api/v1/dashboard", headers=member).json()["summary"]["activeTask"] is None
    empty = client.get("/api/v1/dashboard", headers=stranger).json()
    assert empty["tasks"] == empty["events"] == empty["notifications"] == []
    assert empty["summary"]["progress"] == 0
    profile = client.get("/api/v1/profile/me", headers=owner).json()
    profile.pop("updatedAt", None)
    profile["notifications"] = {"tasks": False, "groups": False}
    updated = client.put("/api/v1/profile/me", headers=owner, json=profile)
    assert updated.status_code == 200, updated.text
    assert client.get("/api/v1/dashboard", headers=owner).json()["notifications"] == []
    path = "/api/v1/events/" + saved.json()["id"]
    assert client.delete(path, headers=member).status_code == 403
    assert client.delete(path, headers=stranger).status_code == 404
    assert client.delete(path, headers=owner).status_code == 204
    assert client.get("/api/v1/events", headers=owner).json() == []


@pytest.mark.parametrize("path", ["tasks", "events", "dashboard"])
def test_requires_authentication(client, path):
    assert client.get("/api/v1/" + path).status_code == 401

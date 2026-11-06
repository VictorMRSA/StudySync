import json
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from services.catalog import build_catalog_prompt, build_library_instruction, MAX_GENERATION_CHARS
from services.langchain_service import LangChainService


class FakeChunk:
    def __init__(self, text):
        self.text = text


class FakeLLM:
    """LLM falso: grava as mensagens e devolve texto fixo."""

    def __init__(self, reply="ok"):
        self.reply = reply
        self.messages = None

    async def astream(self, messages):
        self.messages = messages
        yield FakeChunk(self.reply)

    def bind(self, **_kwargs):
        return self

    async def ainvoke(self, messages):
        self.messages = messages
        return FakeChunk(self.reply)


def make_service(reply="ok") -> tuple[LangChainService, FakeLLM]:
    service = LangChainService.__new__(LangChainService)
    llm = FakeLLM(reply)
    service._llm = llm
    return service, llm


async def collect(agen) -> str:
    return "".join([c async for c in agen])


CATALOG = [
    {"ref": "D1", "title": "Aula 3", "class_name": "Cálculo I", "subject": "Matemática",
     "summary": "Derivadas.", "topics": ["Unidade 3: Derivadas"], "date": None},
    {"ref": "D2", "title": "Aula 5", "class_name": "Física II", "subject": "Física",
     "summary": "Ondas.", "topics": ["Unidade 5: Ondas"], "date": None},
]


class PromptTests(unittest.TestCase):
    def test_library_instruction_has_rules_and_catalog(self):
        text = build_library_instruction("[D1] Aula 3")
        self.assertIn("<studyset>", text)
        self.assertIn("SOMENTE no catálogo", text)
        self.assertIn("[D1] Aula 3", text)
        self.assertNotIn("truncado", text)

    def test_library_instruction_warns_when_truncated(self):
        self.assertIn("truncado", build_library_instruction("x", truncated=True))

    def test_catalog_prompt_limits_content_and_asks_json(self):
        prompt = build_catalog_prompt("§" * (MAX_GENERATION_CHARS + 5000), title="T", class_name="Cálculo I")
        self.assertEqual(prompt.count("§"), MAX_GENERATION_CHARS)
        self.assertIn("Cálculo I", prompt)
        self.assertIn('"topics"', prompt)
        self.assertIn("Unidade 3", prompt)


class ServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_library_mode_sends_catalog_not_full_text(self):
        service, llm = make_service("resposta")
        out = await collect(service.chat_stream("Quais docs têm a unidade 3?", mode="library", catalog=CATALOG))
        self.assertEqual(out, "resposta")
        system = llm.messages[0].content
        self.assertIn("[D1] Aula 3", system)
        self.assertIn("[D2] Aula 5", system)
        self.assertIn("Turma: Física II", system)
        self.assertIn("Biblioteca", system)

    async def test_library_without_catalog_falls_back_to_general(self):
        service, llm = make_service()
        await collect(service.chat_stream("oi", mode="library", catalog=[]))
        self.assertIn("assistente educacional", llm.messages[0].content)

    async def test_sources_mode_unchanged(self):
        service, llm = make_service()
        await collect(service.chat_stream(
            "oi", mode="sources", sources=[{"title": "Doc", "content": "conteudo"}]))
        self.assertIn("SyncDocs", llm.messages[0].content)
        self.assertIn("conteudo", llm.messages[0].content)

    async def test_catalog_entry_parses_json(self):
        reply = json.dumps({"subject": "Cálculo I", "summary": "Resumo.", "topics": ["Unidade 3: Derivadas"]})
        service, _ = make_service(reply)
        entry = await service.catalog_entry("texto", title="Aula")
        self.assertEqual(entry["subject"], "Cálculo I")
        self.assertEqual(entry["topics"], ["Unidade 3: Derivadas"])

    async def test_catalog_entry_fallback_on_garbage(self):
        service, _ = make_service("isto não é json")
        entry = await service.catalog_entry("texto", title="Aula", description="Descrição")
        self.assertEqual(entry["summary"], "Descrição")
        self.assertEqual(entry["topics"], [])


class EndpointTests(unittest.TestCase):
    def setUp(self):
        from routers import catalog, chat
        app = FastAPI()
        app.include_router(catalog.router)
        app.include_router(chat.router)
        self.client = TestClient(app)

    def test_generate_requires_content(self):
        r = self.client.post("/api/catalog/generate", json={"content": "   "})
        self.assertEqual(r.status_code, 400)

    def test_generate_ok(self):
        entry = {"subject": "Física", "summary": "Ondas.", "topics": ["Unidade 5"]}
        with patch("routers.catalog.langchain_service.catalog_entry", new=AsyncMock(return_value=entry)):
            r = self.client.post("/api/catalog/generate", json={"content": "texto", "title": "Aula"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), {**entry, "success": True})

    def test_generate_500_on_llm_error(self):
        with patch("routers.catalog.langchain_service.catalog_entry", new=AsyncMock(side_effect=RuntimeError("boom"))):
            r = self.client.post("/api/catalog/generate", json={"content": "texto"})
        self.assertEqual(r.status_code, 500)

    def test_chat_passes_catalog_to_service(self):
        captured = {}

        async def fake_stream(**kwargs):
            captured.update(kwargs)
            yield "olá"

        payload = {"message": "separe docs", "mode": "library",
                   "catalog": [{"ref": "D1", "title": "Aula 3", "class_name": "Cálculo I", "topics": ["U3"]}]}
        with patch("routers.chat.langchain_service.chat_stream", new=fake_stream):
            r = self.client.post("/api/chat", json=payload)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(captured["mode"], "library")
        self.assertEqual(captured["catalog"][0]["ref"], "D1")
        self.assertEqual(captured["catalog"][0]["class_name"], "Cálculo I")
        chunks = [json.loads(line[6:]) for line in r.text.splitlines() if line.startswith("data: ")]
        self.assertIn("olá", [c.get("chunk") for c in chunks])

    def test_chat_old_payload_still_valid(self):
        async def fake_stream(**kwargs):
            yield "x"

        with patch("routers.chat.langchain_service.chat_stream", new=fake_stream):
            r = self.client.post("/api/chat", json={"message": "oi"})
        self.assertEqual(r.status_code, 200)


if __name__ == "__main__":
    unittest.main()

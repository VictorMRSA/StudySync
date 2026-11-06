import unittest

from services.catalog import (
    DEFAULT_BUDGET_CHARS,
    format_catalog,
    normalize_entry,
    parse_study_set,
    strip_study_set,
)


def make_entry(i: int, **over) -> dict:
    base = {
        "ref": f"D{i}",
        "title": f"Documento {i}",
        "class_name": "Cálculo I",
        "subject": "Matemática",
        "summary": "Resumo curto do documento.",
        "topics": ["Unidade 3: Derivadas", "Unidade 4: Integrais"],
        "date": "2026-10-01",
    }
    base.update(over)
    return base


class NormalizeEntryTests(unittest.TestCase):
    def test_empty_input(self):
        self.assertEqual(normalize_entry(None), {"subject": "", "summary": "", "topics": []})

    def test_accepts_category_as_subject(self):
        self.assertEqual(normalize_entry({"category": "História"})["subject"], "História")

    def test_topics_string_is_split_and_deduplicated(self):
        entry = normalize_entry({"topics": "Unidade 1\nUnidade 2; Unidade 1"})
        self.assertEqual(entry["topics"], ["Unidade 1", "Unidade 2"])

    def test_limits_are_enforced(self):
        entry = normalize_entry({"summary": "x" * 5000, "topics": [f"t{i}" for i in range(50)]})
        self.assertLessEqual(len(entry["summary"]), 400)
        self.assertEqual(len(entry["topics"]), 12)


class FormatCatalogTests(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(format_catalog([]), ("", False))

    def test_contains_ref_class_subject_and_topics(self):
        text, truncated = format_catalog([make_entry(1)])
        self.assertFalse(truncated)
        for needle in ("[D1]", "Documento 1", "Turma: Cálculo I", "Matéria: Matemática", "Unidade 3: Derivadas"):
            self.assertIn(needle, text)

    def test_missing_class_is_labelled(self):
        text, _ = format_catalog([make_entry(1, class_name=None)])
        self.assertIn("Sem turma", text)

    def test_budget_drops_topics_first(self):
        entries = [make_entry(i, topics=["tópico longo " * 8] * 6) for i in range(1, 31)]
        full, _ = format_catalog(entries, budget=10**9)
        text, truncated = format_catalog(entries, budget=len(full) - 1)
        self.assertNotIn("Tópicos:", text)
        self.assertFalse(truncated)
        self.assertIn("[D30]", text)

    def test_budget_truncates_documents_as_last_resort(self):
        entries = [make_entry(i) for i in range(1, 200)]
        text, truncated = format_catalog(entries, budget=2_000)
        self.assertTrue(truncated)
        self.assertLessEqual(len(text), 2_000)
        self.assertIn("[D1]", text)
        self.assertNotIn("[D199]", text)

    def test_default_budget_is_sane(self):
        self.assertGreaterEqual(DEFAULT_BUDGET_CHARS, 10_000)


class StudySetTests(unittest.TestCase):
    def test_parse_basic(self):
        self.assertEqual(parse_study_set("Aqui:\n<studyset>D1, D4,d7</studyset>"), ["D1", "D4", "D7"])

    def test_parse_deduplicates_and_ignores_noise(self):
        self.assertEqual(parse_study_set("<studyset>D2 D2 abc D10</studyset>"), ["D2", "D10"])

    def test_parse_absent_or_empty(self):
        self.assertEqual(parse_study_set("sem bloco"), [])
        self.assertEqual(parse_study_set("<studyset></studyset>"), [])
        self.assertEqual(parse_study_set(""), [])

    def test_strip_removes_block(self):
        self.assertEqual(strip_study_set("Lista pronta.\n<studyset>D1</studyset>"), "Lista pronta.")


if __name__ == "__main__":
    unittest.main()

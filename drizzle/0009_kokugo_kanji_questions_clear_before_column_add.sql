-- 次のマイグレーションでkanji_questionsにNOT NULLカラムを2つ追加する（example_word,
-- reading_template）。0008で入れた80件は既存カラムしか持たないため、先に空にしておく
-- ことでNOT NULL追加を安全にする（データは次の--customマイグレーションで作り直す）。
DELETE FROM "kanji_questions";

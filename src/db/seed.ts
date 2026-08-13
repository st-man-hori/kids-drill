import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subjects, difficultyLevels } from "@/db/schema";
import { ADD_LEVELS, ADD_SKILL_TYPE } from "@/lib/practice";

// docs/data-model.md の運用方針どおり、管理画面を作らずこのスクリプトを
// 再実行する形でコンテンツを追加する。何度実行しても重複登録しないよう、
// 挿入前にSELECTで存在確認する（difficulty_levelsにunique制約は
// 付けていないため、この冪等性はアプリ側の責務）。
const seed = async () => {
  let mathSubject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, "math"),
  });

  if (!mathSubject) {
    const [created] = await db
      .insert(subjects)
      .values({ name: "算数", slug: "math" })
      .returning();
    mathSubject = created;
    console.log("created subject: 算数 (math)");
  } else {
    console.log("subject already exists: 算数 (math)");
  }

  for (const [index, config] of ADD_LEVELS.entries()) {
    const levelNumber = index + 1;
    const existing = await db.query.difficultyLevels.findFirst({
      where: and(
        eq(difficultyLevels.subjectId, mathSubject.id),
        eq(difficultyLevels.skillType, ADD_SKILL_TYPE),
        eq(difficultyLevels.levelNumber, levelNumber),
      ),
    });

    if (existing) {
      console.log(`level already exists: add Lv${levelNumber}`);
      continue;
    }

    await db.insert(difficultyLevels).values({
      subjectId: mathSubject.id,
      skillType: ADD_SKILL_TYPE,
      levelNumber,
      config,
    });
    console.log(`created level: add Lv${levelNumber}`);
  }
};

seed()
  .then(() => {
    console.log("seed done");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

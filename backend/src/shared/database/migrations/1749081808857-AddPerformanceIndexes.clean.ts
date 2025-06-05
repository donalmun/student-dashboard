import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1749081808857 implements MigrationInterface {
  name = 'AddPerformanceIndexes1749081808857';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only log in development to avoid production noise
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      console.log(
        '🔧 Creating performance indexes for analytics optimization...',
      );
    }

    // 1. 📊 Compound index for subject + score queries (most common)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_subject_score" 
      ON "subject_score" ("subject", "score")
    `);
    if (isDev) console.log('✅ Created compound index: subject + score');

    // 2. 🎯 Partial index for score range filtering (high performance queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_score_range" 
      ON "subject_score" ("score") 
      WHERE "score" IS NOT NULL
    `);
    if (isDev) console.log('✅ Created partial index: score range filtering');

    // 3. 🌐 Student Foreign Language Filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_foreign_language" 
      ON "student" ("ma_ngoai_ngu") 
      WHERE "ma_ngoai_ngu" IS NOT NULL
    `);
    if (isDev) console.log('✅ Created index: foreign language filtering');

    // 4. 🔍 SBD search optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_sbd_search" 
      ON "student" ("sbd")
    `);
    if (isDev) console.log('✅ Created index: SBD search optimization');

    // 5. 📈 Complex analytics compound index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_analytics" 
      ON "subject_score" ("subject", "score", "studentId")
    `);
    if (isDev) console.log('✅ Created compound index: complex analytics');

    // 6. Score level categorization (8+, 6-8, 4-6, <4)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_level_excellent" 
      ON "subject_score" ("subject", "score") 
      WHERE "score" >= 8
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_level_good" 
      ON "subject_score" ("subject", "score") 
      WHERE "score" >= 6 AND "score" < 8
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_level_average" 
      ON "subject_score" ("subject", "score") 
      WHERE "score" >= 4 AND "score" < 6
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_level_poor" 
      ON "subject_score" ("subject", "score") 
      WHERE "score" < 4
    `);
    if (isDev)
      console.log('✅ Created partial indexes: score level categorization');

    // 7. Top performers query optimization (ORDER BY score DESC)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_score_top_performers" 
      ON "subject_score" ("subject", "score" DESC, "studentId")
    `);
    if (isDev) console.log('✅ Created index: top performers optimization');

    if (isDev) console.log('🎉 All performance indexes created successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) console.log('🗑️ Dropping performance indexes...');

    // Drop indexes in reverse order
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_top_performers"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_level_poor"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_level_average"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_level_good"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_level_excellent"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_analytics"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_student_sbd_search"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_student_foreign_language"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_score_range"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_score_subject_score"`,
    );

    if (isDev) console.log('✅ All performance indexes dropped');
  }
}

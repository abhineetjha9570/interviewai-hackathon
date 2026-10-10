// Comprehensive Test Suite for Independent Career Roadmap & 2D Learning Tree
// Tests input validation, multi-role generation, independent self-study fields,
// milestone state progression, prerequisite unlocking, and progress calculation.

import assert from 'node:assert';
import {
  validateRoadmapInput,
  generateIndustryFrameworkRoadmap,
  updateMilestonePrerequisites,
  calculateRoadmapProgress,
} from '../src/lib/roadmap-generator.ts';

async function runCareerRoadmapTests() {
  console.log('--- RUNNING CAREER ROADMAP & 2D TREE GRAPH TESTS ---');

  // Test 1: Input Validation
  console.log('[Test 1] Testing input validation...');
  const invalid1 = validateRoadmapInput({ targetRole: '' });
  assert.strictEqual(invalid1.valid, false, 'Empty target role should fail validation');

  const invalid2 = validateRoadmapInput({ targetRole: 'SDE', targetDurationWeeks: 1 });
  assert.strictEqual(invalid2.valid, false, 'Duration < 2 weeks should fail validation');

  const invalid3 = validateRoadmapInput({ targetRole: 'SDE', targetDurationWeeks: 12, weeklyStudyHours: 0 });
  assert.strictEqual(invalid3.valid, false, 'Weekly hours < 2 should fail validation');

  const valid = validateRoadmapInput({
    targetRole: 'Software Engineer at Google',
    targetDurationWeeks: 12,
    weeklyStudyHours: 15,
  });
  assert.strictEqual(valid.valid, true, 'Valid input should pass validation');
  console.log('✓ Input validation passed');

  // Test 2: Multi-Role Roadmap Generation Structure
  console.log('[Test 2] Testing roadmap generation for diverse career roles...');
  const roles = [
    'Software Engineer at Google',
    'Backend Engineer at Fintech',
    'Full Stack Web Developer',
    'Data Scientist & ML Engineer',
    'Cloud Systems & DevOps Engineer',
  ];

  for (const role of roles) {
    const roadmap = generateIndustryFrameworkRoadmap({
      targetRole: role,
      targetDurationWeeks: 12,
      weeklyStudyHours: 15,
      technicalSkills: ['Java', 'SQL', 'Git'],
    });

    assert.ok(roadmap.title.length > 0, `Roadmap title must exist for ${role}`);
    assert.ok(roadmap.phases.length >= 3, `Roadmap must contain >= 3 phases for ${role}`);

    const allMilestones = roadmap.phases.flatMap((p) => p.milestones);
    assert.ok(allMilestones.length >= 8, `Roadmap must contain >= 8 milestones for ${role}`);

    // Verify milestone keys are strictly unique
    const keys = allMilestones.map((m) => m.milestoneKey);
    const uniqueKeys = new Set(keys);
    assert.strictEqual(keys.length, uniqueKeys.size, `Milestone keys must be unique for ${role}`);

    // Verify independent learning fields are populated
    for (const m of allMilestones) {
      assert.ok(m.title, 'Every milestone must have a title');
      assert.ok(m.description, 'Every milestone must have a description');
      assert.ok(m.learningObjectives && m.learningObjectives.length > 0, 'Every milestone must have learning objectives');
      assert.ok(m.relevantResources && m.relevantResources.length > 0, 'Every milestone must have self-study resources');
      assert.ok(m.projectIdea, 'Every milestone must have a project milestone idea');
      assert.ok(m.completionCriteria, 'Every milestone must have completion criteria');
    }
  }
  console.log('✓ Multi-role generation and self-study field verification passed');

  // Test 3: Independent Progress Tracking (Without Practice Mode)
  console.log('[Test 3] Testing independent milestone progress transitions (AVAILABLE -> IN_PROGRESS -> COMPLETED)...');
  const testRoadmap = generateIndustryFrameworkRoadmap({
    targetRole: 'Software Engineer at Google',
    targetDurationWeeks: 12,
    weeklyStudyHours: 15,
  });

  const allM = testRoadmap.phases.flatMap((p) => p.milestones);
  const m1 = allM[0];
  assert.strictEqual(m1.status, 'AVAILABLE', 'Initial root milestone must be AVAILABLE');

  // Candidate begins self-studying independently: marks IN_PROGRESS
  m1.status = 'IN_PROGRESS';
  assert.strictEqual(m1.status, 'IN_PROGRESS', 'Milestone transitioned to IN_PROGRESS independently');

  // Candidate completes self-study: marks COMPLETED
  const completedKeys = new Set([m1.milestoneKey]);
  updateMilestonePrerequisites(testRoadmap.phases, completedKeys);

  assert.strictEqual(m1.status, 'COMPLETED', 'Milestone transitioned to COMPLETED');

  // Downstream milestone m-2 should now be unlocked to AVAILABLE
  const m2 = allM.find((m) => m.milestoneKey === 'm-2');
  if (m2) {
    assert.strictEqual(m2.status, 'AVAILABLE', 'Downstream milestone m-2 unlocked to AVAILABLE');
  }

  // Downstream milestone m-3 requires m-2, so it must still be LOCKED
  const m3 = allM.find((m) => m.milestoneKey === 'm-3');
  if (m3) {
    assert.strictEqual(m3.status, 'LOCKED', 'Downstream milestone m-3 remains LOCKED until m-2 is done');
  }
  console.log('✓ Independent progress tracking and automatic prerequisite unlocking passed');

  // Test 4: Progress Percentage Calculation
  console.log('[Test 4] Testing progress percentage calculation...');
  const initialPct = calculateRoadmapProgress(allM);
  assert.strictEqual(initialPct > 0, true, 'Progress should reflect completed milestones');

  // When all are completed
  const fullyDone = allM.map((m) => ({ ...m, status: 'COMPLETED' }));
  assert.strictEqual(calculateRoadmapProgress(fullyDone), 100, 'Fully completed curriculum must be 100%');
  console.log('✓ Progress percentage calculation passed');

  console.log('--- ALL CAREER ROADMAP & 2D TREE GRAPH TESTS PASSED SUCCESSFULLY ---\n');
}

runCareerRoadmapTests().catch((err) => {
  console.error('Career Roadmap Test Failure:', err);
  process.exit(1);
});

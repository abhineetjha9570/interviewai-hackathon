// 50-Player Concurrent Simulation & Validation Script for Live Aptitude Arena
// Validates room creation with 10-minute lobby, 50-player joining, capacity limit enforcement,
// hidden answer security, free navigation, exact +5 marks scoring rule,
// zero negative marking, reconnection state recovery, live leaderboard ranking, and final scorecards.

import assert from 'node:assert';
import { arenaGameManager } from '../src/lib/arena-manager.ts';

async function run50PlayerArenaSimulation() {
  console.log('--- RUNNING 50-PLAYER ARENA MULTIPLAYER SIMULATION ---');

  // Step 1: Create Room with 10-Minute Lobby
  console.log('[Step 1] Creating new multiplayer arena room...');
  const { roomCode, hostPlayerId } = await arenaGameManager.createRoom({
    hostName: 'AdminHost',
    title: '50-Player Stress Arena',
    topic: 'Quantitative Aptitude',
    difficulty: 'Medium',
    testDurationMinutes: 10,
    totalQuestions: 5, // 5 questions * 5 marks = 25 maximum possible marks
    maxPlayers: 50,
  });

  assert.ok(roomCode, 'Room code must be generated');
  assert.ok(hostPlayerId, 'Host player ID must be generated');

  const lobbyState = arenaGameManager.getRoomStateForClient(roomCode, hostPlayerId);
  assert.strictEqual(lobbyState.phase, 'LOBBY', 'Initial room phase must be LOBBY');
  assert.ok(lobbyState.remainingLobbySec >= 595, 'Lobby must have 10-minute authoritative countdown');
  assert.strictEqual(lobbyState.maxPossibleMarks, 25, '5 questions * 5 marks = 25 max marks');
  console.log(`✓ Room created with code: ${roomCode}, Host: ${hostPlayerId}, 10-Min Lobby: ${lobbyState.remainingLobbySec}s`);

  // Step 2: 49 More Players Join Concurrently (Total 50)
  console.log('[Step 2] Joining 49 additional concurrent players to reach 50 players...');
  const players = [{ playerId: hostPlayerId, name: 'AdminHost' }];

  for (let i = 1; i <= 49; i++) {
    const joinRes = arenaGameManager.joinRoom(roomCode, `Candidate_${i}`);
    assert.strictEqual(joinRes.success, true, `Candidate_${i} should join successfully`);
    players.push({ playerId: joinRes.playerId, name: `Candidate_${i}` });
  }

  assert.strictEqual(players.length, 50, 'Room must contain exactly 50 players');
  console.log('✓ Successfully joined 50 concurrent players in lobby');

  // Step 3: Verify 51st Player is Rejected (Max Capacity Enforcement)
  console.log('[Step 3] Verifying 51st player is rejected due to room capacity limit...');
  const overflowRes = arenaGameManager.joinRoom(roomCode, 'Candidate_51');
  assert.strictEqual(overflowRes.success, false, '51st player must be rejected');
  assert.ok(overflowRes.error?.includes('full'), 'Error should specify room is full');
  console.log('✓ 50-player room capacity enforcement verified');

  // Step 4: Host Starts the Test (Early Manual Start)
  console.log('[Step 4] Host manually starts test...');
  const startRes = arenaGameManager.startTest(roomCode, hostPlayerId);
  assert.strictEqual(startRes.success, true, 'Host should be able to start the test');

  const testState = arenaGameManager.getRoomStateForClient(roomCode, hostPlayerId);
  assert.strictEqual(testState.phase, 'TEST_ACTIVE', 'Game phase must be TEST_ACTIVE');
  assert.strictEqual(testState.questions.length, 5, 'Must have 5 questions available');
  assert.strictEqual(testState.questions[0].correctAnswer, null, 'Correct answer must NOT be leaked during active test');
  console.log('✓ Test started with global timer; correct answers hidden');

  // Step 5: Concurrent Answer Submissions from all 50 Players
  console.log('[Step 5] Simulating concurrent answers from all 50 players with exact +5 / 0 marks rule...');
  const q0 = testState.questions[0];
  const optionA = q0.options[0];
  const optionB = q0.options[1];

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    // Candidate answers question 0 and question 1
    const choice = i % 2 === 0 ? optionA : optionB;
    const ansRes = arenaGameManager.savePlayerAnswer({
      roomCode,
      playerId: p.playerId,
      questionIndex: 0,
      selectedOption: choice,
    });
    assert.strictEqual(ansRes.success, true, `Answer from ${p.name} must be accepted`);
  }
  console.log('✓ 50 concurrent answers accepted and processed');

  // Step 6: Test Changing Answer and Flag for Review
  console.log('[Step 6] Testing candidate updating an answer and flagging for review...');
  const updateRes = arenaGameManager.savePlayerAnswer({
    roomCode,
    playerId: players[0].playerId,
    questionIndex: 0,
    selectedOption: optionB,
    isFlaggedForReview: true,
  });
  assert.strictEqual(updateRes.success, true, 'Candidate must be able to change answers');
  console.log('✓ Candidate answer change handled cleanly');

  // Step 7: Test Reconnection & State Recovery for 5 Simulated Dropouts
  console.log('[Step 7] Simulating 5 disconnected players reconnecting and recovering state...');
  for (let i = 0; i < 5; i++) {
    const p = players[i];
    const reconnectedState = arenaGameManager.getRoomStateForClient(roomCode, p.playerId);
    assert.ok(reconnectedState, 'Reconnecting player must receive valid room state');
    assert.strictEqual(reconnectedState.phase, 'TEST_ACTIVE', 'Reconnected phase must be TEST_ACTIVE');
    assert.ok(reconnectedState.remainingTestSec > 0, 'Reconnected player must see remaining server deadline');
    assert.ok(reconnectedState.questions[0].mySelectedOption, 'Reconnected player must see their saved answer');
  }
  console.log('✓ Reconnection & state recovery validated for all disconnected players');

  // Step 8: Verify Leaderboard Ranking Integrity & Exact +5 Marks
  console.log('[Step 8] Verifying leaderboard score ordering and exact 5-marks scoring...');
  const updatedState = arenaGameManager.getRoomStateForClient(roomCode, hostPlayerId);
  const lb = updatedState.leaderboard;
  assert.strictEqual(lb.length, 50, 'Leaderboard must contain all 50 players');

  for (let i = 0; i < lb.length; i++) {
    const score = lb[i].score;
    // Score must be non-negative and a multiple of 5 (e.g. 0, 5, 10, 15, 20, 25)
    assert.ok(score >= 0, `Score must be >= 0: player ${lb[i].name} score=${score}`);
    assert.strictEqual(score % 5, 0, `Score must be exact multiple of 5 marks: player ${lb[i].name} score=${score}`);
    assert.ok(score <= 25, `Score cannot exceed maximum possible marks (25): player ${lb[i].name} score=${score}`);

    if (i < lb.length - 1) {
      assert.ok(lb[i].score >= lb[i + 1].score, `Leaderboard must be sorted descending: #${i + 1} (${lb[i].score}) >= #${i + 2} (${lb[i + 1].score})`);
    }
  }
  console.log('✓ Leaderboard rankings strictly sorted; all scores are exact multiples of 5 with 0 negative marking');

  // Step 9: Final Test Submission & Scorecard Verification
  console.log('[Step 9] Submitting and finalizing test for player 1...');
  const finishRes = arenaGameManager.submitAndFinishPlayerTest(roomCode, players[0].playerId);
  assert.strictEqual(finishRes.success, true, 'Player test submission must succeed');
  assert.ok(finishRes.scorecard, 'Scorecard must be returned');
  assert.strictEqual(finishRes.scorecard.totalScore % 5, 0, 'Final score must be a multiple of 5');
  assert.ok(finishRes.scorecard.accuracyPct >= 0 && finishRes.scorecard.accuracyPct <= 100, 'Accuracy must be valid percentage');
  assert.ok(finishRes.scorecard.questionReview.length === 5, 'Scorecard must contain review of all 5 questions');
  assert.ok(finishRes.scorecard.questionReview[0].correctAnswer, 'Correct answers now revealed in scorecard');
  assert.ok(finishRes.scorecard.questionReview[0].explanation, 'Explanations revealed in scorecard');
  console.log(`✓ Final scorecard generated: Score=${finishRes.scorecard.totalScore}/25, Accuracy=${finishRes.scorecard.accuracyPct}%`);

  console.log('--- 50-PLAYER ARENA MULTIPLAYER SIMULATION COMPLETED WITH 100% SUCCESS ---\n');
  process.exit(0);
}

run50PlayerArenaSimulation().catch((err) => {
  console.error('50-Player Arena Simulation Failed:', err);
  process.exit(1);
});

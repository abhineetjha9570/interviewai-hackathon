// HTTP Live Endpoints Smoke Test for GD Arena
async function testHttpEndpoints() {
  const baseUrl = 'http://localhost:3000';

  console.log('1. Testing POST /api/gd/room/create...');
  const createRes = await fetch(`${baseUrl}/api/gd/room/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'AI in Healthcare: Diagnostic Precision vs Human Touch',
      category: 'Artificial Intelligence',
      durationMinutes: 10,
      maxParticipants: 6,
      language: 'English',
      difficulty: 'Intermediate',
      hasAiModerator: true,
      hostName: 'Dr. TestHost',
    }),
  });

  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.success) {
    throw new Error(`Failed to create room: ${JSON.stringify(createJson)}`);
  }
  console.log(`✓ Room created over HTTP: Code=${createJson.roomCode}, Invite=${createJson.inviteUrl}`);

  console.log('2. Testing POST /api/gd/room/join...');
  const joinRes = await fetch(`${baseUrl}/api/gd/room/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode: createJson.roomCode,
      playerName: 'Dr. Alice',
    }),
  });
  const joinJson = await joinRes.json();
  if (!joinRes.ok || !joinJson.success) {
    throw new Error(`Failed to join room: ${JSON.stringify(joinJson)}`);
  }
  console.log(`✓ Joined room over HTTP: PlayerId=${joinJson.playerId}`);

  console.log('3. Testing GET /api/gd/room/state...');
  const stateRes = await fetch(`${baseUrl}/api/gd/room/state?code=${createJson.roomCode}&playerId=${createJson.hostPlayerId}`);
  const stateJson = await stateRes.json();
  if (!stateRes.ok || !stateJson.success) {
    throw new Error(`Failed to get room state: ${JSON.stringify(stateJson)}`);
  }
  console.log(`✓ Room state fetched over HTTP: Phase=${stateJson.roomState.phase}, Participants=${stateJson.roomState.totalParticipantsCount}`);

  console.log('4. Testing POST /api/gd/ai/turn (Mode B)...');
  const aiTurnRes = await fetch(`${baseUrl}/api/gd/ai/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'AI in Healthcare',
      durationMinutes: 10,
      language: 'English',
      action: 'NEXT_TURN',
      candidateUtterance: 'I think AI diagnostics will drastically reduce human error.',
      history: [],
      totalElapsedSec: 45,
    }),
  });
  const aiTurnJson = await aiTurnRes.json();
  if (!aiTurnRes.ok || !aiTurnJson.success) {
    throw new Error(`Failed to get AI turn: ${JSON.stringify(aiTurnJson)}`);
  }
  console.log(`✓ AI turn generated over HTTP: Speaker=${aiTurnJson.turn.speakerName} (${aiTurnJson.turn.speakerId}), Pitch=${aiTurnJson.turn.audioVoicePitch}`);

  console.log('5. Testing POST /api/gd/report...');
  const reportRes = await fetch(`${baseUrl}/api/gd/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: `HTTP_${Date.now()}`,
      userName: 'Dr. TestHost',
      topic: 'AI in Healthcare',
      durationMinutes: 10,
      mode: 'AI_PRACTICE',
      transcript: [
        {
          speakerId: 'cand_1',
          speakerName: 'Dr. TestHost',
          speakerRole: 'HUMAN',
          text: 'AI algorithms should be validated using randomized clinical trials before deployment.',
          timestampSec: 20,
          durationSec: 16,
        },
        {
          speakerId: 'cand_1',
          speakerName: 'Dr. TestHost',
          speakerRole: 'HUMAN',
          text: 'Furthermore, as Meera highlighted earlier, patient data privacy must be safeguarded under HIPAA and DPDP standards.',
          timestampSec: 75,
          durationSec: 18,
        },
      ],
    }),
  });
  const reportJson = await reportRes.json();
  if (!reportRes.ok || !reportJson.success) {
    throw new Error(`Failed to generate report: ${JSON.stringify(reportJson)}`);
  }
  console.log(`✓ Evidence report generated over HTTP: Score=${reportJson.report.overallScore}, SpeakingTime=${reportJson.report.speakingTimeSec}s, EvidenceQuote="${reportJson.report.strengths[0].evidenceQuote.slice(0, 35)}..."`);

  console.log('--- ALL HTTP SMOKE TESTS PASSED (100%) ---');
}

testHttpEndpoints().catch((e) => {
  console.error('HTTP Test Failure:', e);
  process.exit(1);
});

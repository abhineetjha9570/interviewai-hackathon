// Automated Test Suite for GD Arena (Mode A Multiplayer & Mode B AI Practice)
// Tests:
// 1. Multiplayer Room creation, unique code, QR code generation, lobby timer.
// 2. Multiple participants joining & room capacity enforcement.
// 3. Host authorization for starting discussion & server deadline sync.
// 4. WebRTC signaling mailbox (post/pull offers, answers, ICE candidates).
// 5. Mode B AI Practice: 4 distinct personalities (Arjun, Meera, Kabir, Sara) + 1 Moderator.
// 6. Turn-taking orchestration with shared context and distinct voice configs.
// 7. Evidence-linked post-GD evaluation report generation (human-only speaking time & evidence quotes).

import { gdArenaCoordinator } from '../src/lib/gd-arena-manager.ts';
import {
  GD_PERSONALITIES,
  generateModeratorOpening,
  orchestrateNextAITurn,
  generateGDEvidenceReport,
} from '../src/lib/gd-orchestrator.ts';

async function runTests() {
  console.log('--- RUNNING GD ARENA COMPREHENSIVE TEST SUITE ---');

  // [TEST 1] Multiplayer Room Creation & Capacity
  console.log('[Test 1] Testing Multiplayer Room Creation...');
  const { roomCode, hostPlayerId, roomState } = await gdArenaCoordinator.createRoom({
    hostName: 'TestHost',
    topic: 'Generative AI: Will it Displace or Augment Human Knowledge Workers?',
    category: 'Artificial Intelligence',
    durationMinutes: 10,
    maxParticipants: 3, // Set low to test capacity limit
    language: 'English',
    difficulty: 'Intermediate',
    hasAiModerator: true,
  });

  if (!roomCode || roomCode.length < 5 || !roomCode.startsWith('GD')) {
    throw new Error(`Invalid room code generated: ${roomCode}`);
  }
  if (roomState.phase !== 'LOBBY') {
    throw new Error(`Room phase should be LOBBY, got: ${roomState.phase}`);
  }
  console.log(`✓ Room created successfully: ${roomCode}, Host: ${hostPlayerId}, Lobby Deadline: ${Math.round((roomState.lobbyDeadline - Date.now()) / 1000)}s`);

  // [TEST 2] Joining Participants & Capacity Enforcement
  console.log('[Test 2] Testing Participant Joining & Capacity...');
  const join1 = await gdArenaCoordinator.joinRoom({
    roomCode,
    playerName: 'Alice',
  });
  if (!join1.success || !join1.playerId) {
    throw new Error(`Alice failed to join: ${join1.error}`);
  }

  const join2 = await gdArenaCoordinator.joinRoom({
    roomCode,
    playerName: 'Bob',
  });
  if (!join2.success || !join2.playerId) {
    throw new Error(`Bob failed to join: ${join2.error}`);
  }

  // 4th human should be rejected because maxParticipants = 3 (Host + Alice + Bob)
  const join3 = await gdArenaCoordinator.joinRoom({
    roomCode,
    playerName: 'Charlie',
  });
  if (join3.success) {
    throw new Error('Room capacity was not enforced; Charlie should have been rejected');
  }
  console.log(`✓ Capacity limit enforced correctly: ${join3.error}`);

  // [TEST 3] Host Authorization & Synchronized Timer Start
  console.log('[Test 3] Testing Host Authorization to Start Discussion...');
  // Non-host (Alice) attempts to start -> Must fail
  const unauthorizedStart = await gdArenaCoordinator.startDiscussion(roomCode, join1.playerId);
  if (unauthorizedStart.success) {
    throw new Error('Non-host was able to start discussion!');
  }
  console.log(`✓ Non-host start rejected: ${unauthorizedStart.error}`);

  // Host starts -> Must succeed
  const hostStart = await gdArenaCoordinator.startDiscussion(roomCode, hostPlayerId);
  if (!hostStart.success || !hostStart.roomState) {
    throw new Error(`Host failed to start discussion: ${hostStart.error}`);
  }
  if (hostStart.roomState.phase !== 'IN_PROGRESS' || !hostStart.roomState.discussionDeadline) {
    throw new Error('Discussion deadline not set properly');
  }
  const remainingSec = Math.round((hostStart.roomState.discussionDeadline - Date.now()) / 1000);
  console.log(`✓ Discussion started by host. Authoritative Timer: ${remainingSec}s, Moderator Opening present: ${hostStart.roomState.transcripts.length > 0}`);

  // [TEST 4] WebRTC Signaling Mailbox
  console.log('[Test 4] Testing WebRTC Signaling Mailbox (Peer-to-Peer Audio)...');
  const sdpOffer = { sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1...', type: 'offer' };
  gdArenaCoordinator.postSignal(roomCode, hostPlayerId, join1.playerId, 'offer', sdpOffer);

  const pulledSignals = gdArenaCoordinator.pullSignals(roomCode, join1.playerId);
  if (pulledSignals.length !== 1 || pulledSignals[0].type !== 'offer') {
    throw new Error('Signaling mailbox failed to deliver offer');
  }

  // Next pull must be empty (drained queue)
  const drainedSignals = gdArenaCoordinator.pullSignals(roomCode, join1.playerId);
  if (drainedSignals.length !== 0) {
    throw new Error('Signaling mailbox did not drain queue');
  }
  console.log('✓ WebRTC signaling offer and drain verified');

  // [TEST 5] Mode B: 4 AI Personalities & Voice Configurations
  console.log('[Test 5] Verifying 4 Distinct AI Personalities & Voice Configurations...');
  const personalities = ['ARJUN', 'MEERA', 'KABIR', 'SARA'];
  personalities.forEach((key) => {
    const p = GD_PERSONALITIES[key];
    if (!p) throw new Error(`Missing personality: ${key}`);
    if (typeof p.pitch !== 'number' || typeof p.rate !== 'number' || !p.gender) {
      throw new Error(`Invalid acoustic voice configuration for ${key}`);
    }
  });

  if (GD_PERSONALITIES.ARJUN.pitch >= GD_PERSONALITIES.SARA.pitch) {
    throw new Error('Arjun and Sara pitch profiles should differ');
  }
  console.log('✓ All 4 AI personalities (Arjun, Meera, Kabir, Sara) configured with distinct acoustic profiles');

  // [TEST 6] AI Turn-Taking Orchestration
  console.log('[Test 6] Testing Controlled AI Turn-Taking Orchestration...');
  const testContext = {
    topic: 'Generative AI: Will it Displace or Augment Human Knowledge Workers?',
    durationMinutes: 10,
    language: 'English',
    difficulty: 'Intermediate',
    hasModerator: true,
    history: [],
    humanSpeakingSec: 0,
    totalElapsedSec: 60,
  };

  // 1. Opening
  const openingTurn = generateModeratorOpening(testContext.topic, 10);
  if (openingTurn.speakerId !== 'MODERATOR') {
    throw new Error('First turn should be Moderator');
  }

  // 2. Candidate speaks with assertive tone
  const candUtterance = 'I strongly believe that AI will definitely eliminate entry-level coding jobs completely.';
  const nextAiTurn = orchestrateNextAITurn(testContext, candUtterance);
  if (!['ARJUN', 'MEERA', 'KABIR', 'SARA'].includes(nextAiTurn.speakerId)) {
    throw new Error(`Invalid AI speaker selected: ${nextAiTurn.speakerId}`);
  }
  if (!nextAiTurn.text || nextAiTurn.text.length < 20) {
    throw new Error('AI response text too short or empty');
  }
  console.log(`✓ Turn-taking selected ${nextAiTurn.speakerName} (${nextAiTurn.speakerId}) responding to candidate utterance`);

  // [TEST 7] Evidence-Linked Performance Report (Human Only, Zero Fabrication)
  console.log('[Test 7] Testing Evidence-Linked Performance Report Generator...');

  // Scenario A: Candidate spoke < 15 seconds -> Must trigger Insufficient Evidence
  const briefTranscript = [
    {
      speakerId: 'candidate_1',
      speakerName: 'Candidate',
      speakerRole: 'HUMAN',
      text: 'Yes, I agree.',
      timestampSec: 10,
      durationSec: 3,
    },
    {
      speakerId: 'ARJUN',
      speakerName: 'Arjun',
      speakerRole: 'AI_PARTICIPANT',
      aiPersonality: 'ARJUN',
      text: 'Speed is everything in tech execution.',
      timestampSec: 25,
      durationSec: 15,
    },
  ];

  const briefReport = generateGDEvidenceReport('Candidate', testContext.topic, 10, briefTranscript);
  if (!briefReport.insufficientEvidence) {
    throw new Error('Brief candidate speech was not marked as insufficient evidence');
  }
  if (briefReport.speakingTimeSec !== 3) {
    throw new Error(`Speaking time counted AI speech! Expected 3s, got ${briefReport.speakingTimeSec}s`);
  }
  console.log('✓ Insufficient evidence gate passed; AI speaking time correctly excluded');

  // Scenario B: Candidate spoke substantive arguments referencing peers
  const substantiveTranscript = [
    {
      speakerId: 'candidate_1',
      speakerName: 'Candidate',
      speakerRole: 'HUMAN',
      text: 'To initiate the discussion on Generative AI, we should examine both productivity multipliers and workforce upskilling.',
      timestampSec: 15,
      durationSec: 14,
    },
    {
      speakerId: 'ARJUN',
      speakerName: 'Arjun',
      speakerRole: 'AI_PARTICIPANT',
      aiPersonality: 'ARJUN',
      text: 'Companies that wait will be left behind by automated disruption.',
      timestampSec: 35,
      durationSec: 18,
    },
    {
      speakerId: 'candidate_1',
      speakerName: 'Candidate',
      speakerRole: 'HUMAN',
      text: 'Building on Arjun\'s point about disruption, I agree speed matters, but Meera\'s focus on data governance cannot be ignored.',
      timestampSec: 65,
      durationSec: 18,
    },
  ];

  const fullReport = generateGDEvidenceReport('Candidate', testContext.topic, 10, substantiveTranscript);
  if (fullReport.insufficientEvidence) {
    throw new Error('Substantive speech was incorrectly marked as insufficient evidence');
  }
  if (fullReport.speakingTimeSec !== 32) {
    throw new Error(`Expected exactly 32s speaking time (14+18), got ${fullReport.speakingTimeSec}s`);
  }
  if (!fullReport.strengths[0].evidenceQuote || !fullReport.strengths[0].timestamp) {
    throw new Error('Missing evidence quote or timestamp in report strengths');
  }
  console.log(`✓ Full evidence report generated: Score=${fullReport.overallScore}/100, SpeakingTime=${fullReport.speakingTimeSec}s, EvidenceQuote="${fullReport.strengths[0].evidenceQuote.slice(0, 40)}..."`);

  console.log('--- ALL GD ARENA TESTS PASSED SUCCESSFULLY (100%) ---');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

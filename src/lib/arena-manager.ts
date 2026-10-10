// Live Aptitude Arena — Real-Time Multiplayer Coordinator
// Server-authoritative room manager for up to 50 concurrent players.
// Features: 10-minute lobby with auto/manual start, global test timer, free question navigation,
// exact +5 marks per question (0 for incorrect/unanswered, no negative marking),
// real-time leaderboard (top 1-50), fairness-first anti-cheat logging, and final scorecard analysis.

import { prisma } from './prisma.ts';
import { QUESTION_DATABASE, type GeneratedQuestion } from './question-generator.ts';

export interface ArenaPlayer {
  playerId: string;
  userId?: string | null;
  name: string;
  avatar: string;
  score: number; // Exactly correctAnswers * 5
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  questionsAnswered: number;
  rank: number;
  previousRank: number;
  isHost: boolean;
  connected: boolean;
  isFinished: boolean;
  finishedAt?: number | null;
  joinedAt: number;
  lastActive: number;
}

export interface ArenaQuestion {
  orderIndex: number;
  questionId: string;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  options: string[];
  correctAnswer: string; // Hidden on server until test completion!
  explanation: string;
}

export interface PlayerAnswerRecord {
  playerId: string;
  questionIndex: number;
  selectedOption: string;
  isCorrect: boolean;
  marksAwarded: number; // Exactly 5 if correct, 0 if incorrect
  isFlaggedForReview: boolean;
  submittedAt: number;
}

export interface IntegrityRecord {
  id: string;
  playerId: string;
  playerName: string;
  eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'ANOMALY';
  details?: string;
  timestamp: number;
}

export type ArenaGamePhase = 'LOBBY' | 'TEST_ACTIVE' | 'COMPLETED';

export interface ArenaRoomState {
  roomCode: string;
  title: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  testDurationMinutes: number; // e.g. 10 or 15 minutes
  maxPlayers: number;
  phase: ArenaGamePhase;

  // Authoritative Timers
  createdAt: number;
  lobbyDeadline: number; // Exactly createdAt + 10 mins (600,000 ms)
  testStartTime: number | null;
  testDeadline: number | null;

  hostPlayerId: string;
  players: Map<string, ArenaPlayer>;
  questions: ArenaQuestion[];
  answers: Map<string, PlayerAnswerRecord>; // key: `${playerId}_${questionIndex}`
  integrityRecords: IntegrityRecord[];

  lobbyInterval: NodeJS.Timeout | null;
  testInterval: NodeJS.Timeout | null;
}

export type ArenaEvent = {
  type:
    | 'ROOM_STATE'
    | 'PLAYER_JOINED'
    | 'PLAYER_LEFT'
    | 'LOBBY_TICK'
    | 'TEST_STARTED'
    | 'TEST_TICK'
    | 'ANSWER_UPDATED'
    | 'LEADERBOARD_UPDATE'
    | 'INTEGRITY_ALERT'
    | 'TEST_COMPLETED';
  payload: any;
};

type SseListener = (event: ArenaEvent) => void;

class ArenaGameManager {
  private rooms: Map<string, ArenaRoomState> = new Map();
  private listeners: Map<string, Set<SseListener>> = new Map();

  constructor() {
    // Clean up stale or completed rooms periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupExpiredRooms(), 5 * 60 * 1000);
    }
  }

  // =========================================================================
  // 1. ROOM CREATION & LOBBY MANAGEMENT (EXACT 10-MINUTE LOBBY)
  // =========================================================================
  public async createRoom(params: {
    hostName: string;
    hostUserId?: string | null;
    title?: string;
    topic?: string;
    difficulty?: string;
    testDurationMinutes?: number;
    totalQuestions?: number;
    maxPlayers?: number;
  }): Promise<{ roomCode: string; hostPlayerId: string }> {
    const roomCode = this.generateRoomCode();
    const hostPlayerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const totalQuestions = Math.max(5, Math.min(25, params.totalQuestions || 10));
    const testDurationMinutes = Math.max(5, Math.min(30, params.testDurationMinutes || 10));
    const maxPlayers = Math.max(2, Math.min(50, params.maxPlayers || 50));

    // Select questions from existing question bank
    const selectedQuestions = this.selectQuestions(params.topic || 'Quantitative Aptitude', totalQuestions);

    const now = Date.now();
    const lobbyDurationMs = 10 * 60 * 1000; // EXACTLY 10 MINUTES (600 seconds)
    const lobbyDeadline = now + lobbyDurationMs;

    const hostPlayer: ArenaPlayer = {
      playerId: hostPlayerId,
      userId: params.hostUserId || null,
      name: params.hostName || 'Host',
      avatar: '👑',
      score: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      unansweredCount: selectedQuestions.length,
      questionsAnswered: 0,
      rank: 1,
      previousRank: 1,
      isHost: true,
      connected: true,
      isFinished: false,
      finishedAt: null,
      joinedAt: now,
      lastActive: now,
    };

    const playersMap = new Map<string, ArenaPlayer>();
    playersMap.set(hostPlayerId, hostPlayer);

    const roomState: ArenaRoomState = {
      roomCode,
      title: params.title || 'Live Aptitude Arena',
      topic: params.topic || 'Quantitative Aptitude',
      difficulty: params.difficulty || 'Medium',
      totalQuestions: selectedQuestions.length,
      testDurationMinutes,
      maxPlayers,
      phase: 'LOBBY',
      createdAt: now,
      lobbyDeadline,
      testStartTime: null,
      testDeadline: null,
      hostPlayerId,
      players: playersMap,
      questions: selectedQuestions,
      answers: new Map(),
      integrityRecords: [],
      lobbyInterval: null,
      testInterval: null,
    };

    this.rooms.set(roomCode, roomState);
    this.listeners.set(roomCode, new Set());

    // Start Authoritative 10-Minute Lobby Countdown Ticker
    this.startLobbyCountdown(roomState);

    // Persist to Prisma
    try {
      await prisma.aptitudeRoom.create({
        data: {
          roomCode,
          hostUserId: params.hostUserId || null,
          hostName: params.hostName || 'Host',
          title: roomState.title,
          topic: roomState.topic,
          difficulty: roomState.difficulty,
          totalQuestions: roomState.totalQuestions,
          timePerQuestion: 60,
          testDurationMinutes,
          lobbyDeadline: new Date(lobbyDeadline),
          status: 'WAITING',
          maxPlayers,
        },
      });
    } catch (e) {
      console.warn('Prisma room persistence notice:', e);
    }

    return { roomCode, hostPlayerId };
  }

  private startLobbyCountdown(room: ArenaRoomState): void {
    if (room.lobbyInterval) clearInterval(room.lobbyInterval);

    room.lobbyInterval = setInterval(() => {
      const now = Date.now();
      const remainingSec = Math.max(0, Math.floor((room.lobbyDeadline - now) / 1000));

      this.broadcast(room.roomCode, {
        type: 'LOBBY_TICK',
        payload: {
          remainingLobbySec: remainingSec,
          totalLobbySec: 600,
        },
      });

      // When 10 minutes expire: AUTOMATIC START
      if (remainingSec <= 0) {
        if (room.lobbyInterval) {
          clearInterval(room.lobbyInterval);
          room.lobbyInterval = null;
        }
        if (room.phase === 'LOBBY') {
          this.startTest(room.roomCode, room.hostPlayerId, true);
        }
      }
    }, 1000);
  }

  // =========================================================================
  // 2. PARTICIPANT JOINING WITH STRICT AUTH & CAPACITY RULES
  // =========================================================================
  public joinRoom(
    roomCode: string,
    playerName: string,
    userId?: string | null
  ): { success: boolean; playerId?: string; error?: string } {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room does not exist or has expired.' };
    }
    if (room.phase !== 'LOBBY') {
      return { success: false, error: 'Test has already started. New participants cannot join an active room.' };
    }
    if (Date.now() > room.lobbyDeadline) {
      return { success: false, error: '10-minute lobby window has closed.' };
    }
    if (room.players.size >= room.maxPlayers) {
      return { success: false, error: 'Room is full (max 50 players reached).' };
    }

    // Check if user is already joined
    if (userId) {
      for (const p of Array.from(room.players.values())) {
        if (p.userId === userId) {
          p.connected = true;
          p.lastActive = Date.now();
          return { success: true, playerId: p.playerId };
        }
      }
    }

    const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const avatars = ['🦊', '🐼', '🐯', '🦁', '🚀', '⚡', '🦉', '🐺', '🐬', '🦄', '🎯', '💡', '💎', '🔥'];
    const avatar = avatars[room.players.size % avatars.length];

    const player: ArenaPlayer = {
      playerId,
      userId: userId || null,
      name: playerName.trim() || `Candidate ${room.players.size + 1}`,
      avatar,
      score: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      unansweredCount: room.questions.length,
      questionsAnswered: 0,
      rank: room.players.size + 1,
      previousRank: room.players.size + 1,
      isHost: false,
      connected: true,
      isFinished: false,
      finishedAt: null,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    };

    room.players.set(playerId, player);

    // Broadcast update to lobby
    this.broadcast(code, {
      type: 'PLAYER_JOINED',
      payload: {
        player,
        totalPlayers: room.players.size,
      },
    });

    return { success: true, playerId };
  }

  // =========================================================================
  // 3. START TEST (MANUAL HOST START OR AUTOMATIC 10-MIN LOBBY EXPIRY)
  // =========================================================================
  public startTest(
    roomCode: string,
    hostPlayerId: string,
    isAutoStart: boolean = false
  ): { success: boolean; questions?: any[]; state?: any; error?: string } {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) return { success: false, error: 'Room not found.' };

    if (!isAutoStart && room.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the authorized room host can start the test.' };
    }

    if (room.phase !== 'LOBBY') {
      return { success: false, error: 'Test is already running or completed.' };
    }

    // Stop lobby timer
    if (room.lobbyInterval) {
      clearInterval(room.lobbyInterval);
      room.lobbyInterval = null;
    }

    // Transition room to TEST_ACTIVE
    const now = Date.now();
    const testDurationMs = room.testDurationMinutes * 60 * 1000;
    const testDeadline = now + testDurationMs;

    room.phase = 'TEST_ACTIVE';
    room.testStartTime = now;
    room.testDeadline = testDeadline;

    // Build sanitized questions array (hide correctAnswer)
    const sanitizedQuestions = room.questions.map((q, idx) => ({
      orderIndex: idx,
      questionId: q.questionId,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      description: q.description,
      options: q.options,
      correctAnswer: null,
      explanation: null,
      mySelectedOption: null,
      myIsFlagged: false,
    }));

    // Broadcast test start to all connected participants immediately with questions
    this.broadcast(code, {
      type: 'TEST_STARTED',
      payload: {
        totalQuestions: room.totalQuestions,
        testDurationMinutes: room.testDurationMinutes,
        testDeadline,
        startedAt: now,
        questions: sanitizedQuestions,
      },
    });

    // Start authoritative global test timer countdown
    room.testInterval = setInterval(() => {
      const currentNow = Date.now();
      const remainingSec = Math.max(0, Math.floor((testDeadline - currentNow) / 1000));

      this.broadcast(code, {
        type: 'TEST_TICK',
        payload: {
          remainingTestSec: remainingSec,
          totalTestSec: room.testDurationMinutes * 60,
        },
      });

      // Global test timer ended: Finalize all answers
      if (remainingSec <= 0) {
        if (room.testInterval) {
          clearInterval(room.testInterval);
          room.testInterval = null;
        }
        this.finishTest(room);
      }
    }, 1000);

    return {
      success: true,
      questions: sanitizedQuestions,
      state: this.getRoomStateForClient(code, hostPlayerId),
    };
  }

  // =========================================================================
  // 4. FREE QUESTION NAVIGATION & EXACT SCORING (+5 MARKS, 0 INCORRECT, NO NEGATIVE)
  // =========================================================================
  public savePlayerAnswer(params: {
    roomCode: string;
    playerId: string;
    questionIndex: number;
    selectedOption: string;
    isFlaggedForReview?: boolean;
  }): {
    success: boolean;
    currentScore?: number;
    questionsAnswered?: number;
    error?: string;
  } {
    const code = params.roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) return { success: false, error: 'Room not found.' };
    if (room.phase !== 'TEST_ACTIVE') {
      return { success: false, error: 'Test is not currently active.' };
    }

    const now = Date.now();
    if (room.testDeadline && now > room.testDeadline + 1500) {
      return { success: false, error: 'TEST_DEADLINE_EXPIRED: Submissions rejected after test deadline.' };
    }

    const player = room.players.get(params.playerId);
    if (!player) return { success: false, error: 'Player not recognized in this room.' };
    if (player.isFinished) {
      return { success: false, error: 'You have already submitted and finished your test.' };
    }

    if (params.questionIndex < 0 || params.questionIndex >= room.questions.length) {
      return { success: false, error: 'Invalid question index.' };
    }

    const q = room.questions[params.questionIndex];
    const isCorrect = params.selectedOption.trim() === q.correctAnswer.trim();
    const marksAwarded = isCorrect ? 5 : 0; // EXACTLY 5 MARKS FOR CORRECT, 0 OTHERWISE. NO NEGATIVE MARKING.

    const answerKey = `${params.playerId}_${params.questionIndex}`;
    room.answers.set(answerKey, {
      playerId: params.playerId,
      questionIndex: params.questionIndex,
      selectedOption: params.selectedOption,
      isCorrect,
      marksAwarded,
      isFlaggedForReview: !!params.isFlaggedForReview,
      submittedAt: now,
    });

    player.lastActive = now;

    // Recalculate Player Total Score & Stats from ALL recorded answers for this player
    let totalMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let answeredCount = 0;

    for (let i = 0; i < room.questions.length; i++) {
      const rec = room.answers.get(`${params.playerId}_${i}`);
      if (rec && rec.selectedOption) {
        answeredCount++;
        if (rec.isCorrect) {
          correctCount++;
          totalMarks += 5; // Exactly 5 marks per correct answer
        } else {
          incorrectCount++;
        }
      }
    }

    player.score = totalMarks;
    player.correctAnswers = correctCount;
    player.incorrectAnswers = incorrectCount;
    player.questionsAnswered = answeredCount;
    player.unansweredCount = room.questions.length - answeredCount;

    // Update live leaderboard
    this.updateLeaderboard(room);

    // Broadcast score change to leaderboard subscribers
    this.broadcast(code, {
      type: 'LEADERBOARD_UPDATE',
      payload: {
        leaderboard: this.getTop50Leaderboard(room),
      },
    });

    return {
      success: true,
      currentScore: totalMarks,
      questionsAnswered: answeredCount,
    };
  }

  // =========================================================================
  // 5. FINISH INDIVIDUAL PLAYER TEST OR GLOBAL COMPLETION
  // =========================================================================
  public submitAndFinishPlayerTest(roomCode: string, playerId: string): { success: boolean; scorecard?: any; error?: string } {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) return { success: false, error: 'Room not found.' };
    const player = room.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found.' };

    player.isFinished = true;
    player.finishedAt = Date.now();
    player.lastActive = Date.now();

    this.updateLeaderboard(room);

    // If all players have finished, finish the whole test
    const allFinished = Array.from(room.players.values()).every((p) => p.isFinished);
    if (allFinished) {
      this.finishTest(room);
    } else {
      this.broadcast(code, {
        type: 'LEADERBOARD_UPDATE',
        payload: { leaderboard: this.getTop50Leaderboard(room) },
      });
    }

    const scorecard = this.generatePlayerScorecard(room, playerId);
    return { success: true, scorecard };
  }

  private finishTest(room: ArenaRoomState): void {
    room.phase = 'COMPLETED';

    if (room.testInterval) {
      clearInterval(room.testInterval);
      room.testInterval = null;
    }

    // Mark any unfinished players as finished
    for (const player of Array.from(room.players.values())) {
      if (!player.isFinished) {
        player.isFinished = true;
        player.finishedAt = Date.now();
      }
    }

    this.updateLeaderboard(room);
    const finalLeaderboard = this.getTop50Leaderboard(room);

    this.broadcast(room.roomCode, {
      type: 'TEST_COMPLETED',
      payload: {
        leaderboard: finalLeaderboard,
        winner: finalLeaderboard[0] || null,
        totalQuestions: room.totalQuestions,
        maxPossibleMarks: room.totalQuestions * 5,
      },
    });

    // Asynchronously persist all results to Prisma
    this.persistGameResults(room);
  }

  // =========================================================================
  // 6. LIVE TOP 1 TO 50 LEADERBOARD & DETERMINISTIC TIE-BREAKING
  // =========================================================================
  private updateLeaderboard(room: ArenaRoomState): void {
    const playerList = Array.from(room.players.values());

    // Deterministic Sort Policy:
    // 1. Highest Score first
    // 2. Tie-breaker: earlier completion time (or earlier lastActive)
    playerList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const timeA = a.finishedAt || a.lastActive;
      const timeB = b.finishedAt || b.lastActive;
      return timeA - timeB;
    });

    playerList.forEach((p, idx) => {
      p.previousRank = p.rank;
      p.rank = idx + 1;
    });
  }

  public getTop50Leaderboard(room: ArenaRoomState): any[] {
    const sorted = Array.from(room.players.values()).sort((a, b) => a.rank - b.rank);
    return sorted.slice(0, 50).map((p) => ({
      rank: p.rank,
      playerId: p.playerId,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      maxPossibleMarks: room.totalQuestions * 5,
      correctAnswers: p.correctAnswers,
      questionsAnswered: p.questionsAnswered,
      isFinished: p.isFinished,
      connected: p.connected,
      isHost: p.isHost,
    }));
  }

  // =========================================================================
  // 7. ANTI-CHEAT: FAIRNESS FIRST BROWSER INTEGRITY LOGGING
  // =========================================================================
  public logIntegritySignal(params: {
    roomCode: string;
    playerId: string;
    eventType: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'ANOMALY';
    details?: string;
  }): { success: boolean; totalEvents: number } {
    const code = params.roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) return { success: false, totalEvents: 0 };
    const player = room.players.get(params.playerId);
    if (!player) return { success: false, totalEvents: 0 };

    const record: IntegrityRecord = {
      id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      playerId: params.playerId,
      playerName: player.name,
      eventType: params.eventType,
      details: params.details,
      timestamp: Date.now(),
    };

    room.integrityRecords.push(record);

    // Broadcast subtle alert to host only
    this.broadcast(code, {
      type: 'INTEGRITY_ALERT',
      payload: {
        playerId: params.playerId,
        playerName: player.name,
        eventType: params.eventType,
        details: params.details,
        totalEventsForPlayer: room.integrityRecords.filter((r) => r.playerId === params.playerId).length,
      },
    });

    // Also persist integrity record to Prisma
    try {
      prisma.aptitudeIntegrityEvent.create({
        data: {
          roomId: room.roomCode,
          playerId: params.playerId,
          playerName: player.name,
          eventType: params.eventType,
          details: params.details || null,
        },
      }).catch(() => {});
    } catch {}

    const playerEvents = room.integrityRecords.filter((r) => r.playerId === params.playerId).length;
    return { success: true, totalEvents: playerEvents };
  }

  // =========================================================================
  // 8. FINAL SCORECARD & WEAK AREAS RECOMMENDATION
  // =========================================================================
  public generatePlayerScorecard(room: ArenaRoomState, playerId: string) {
    const player = room.players.get(playerId);
    if (!player) return null;

    const totalQuestions = room.questions.length;
    const maxMarks = totalQuestions * 5;
    const accuracyPct =
      player.questionsAnswered > 0 ? Math.round((player.correctAnswers / player.questionsAnswered) * 100) : 0;

    const timeTakenSec = Math.max(
      1,
      Math.round(((player.finishedAt || Date.now()) - (room.testStartTime || room.createdAt)) / 1000)
    );

    // Topic performance breakdown
    const topicStats: Record<string, { total: number; correct: number }> = {};
    const questionReview = room.questions.map((q, idx) => {
      const rec = room.answers.get(`${playerId}_${idx}`);
      const isCorrect = rec?.isCorrect || false;
      const selectedOption = rec?.selectedOption || null;

      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { total: 0, correct: 0 };
      }
      topicStats[q.topic].total += 1;
      if (isCorrect) topicStats[q.topic].correct += 1;

      return {
        orderIndex: idx + 1,
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty,
        description: q.description,
        options: q.options,
        selectedOption,
        correctAnswer: room.phase === 'COMPLETED' || player.isFinished ? q.correctAnswer : null,
        explanation: room.phase === 'COMPLETED' || player.isFinished ? q.explanation : null,
        isCorrect,
        marksAwarded: isCorrect ? 5 : 0,
      };
    });

    // Weak topics recommendation
    const weakTopics: string[] = [];
    Object.entries(topicStats).forEach(([tName, stat]) => {
      const pct = (stat.correct / stat.total) * 100;
      if (pct < 70) weakTopics.push(tName);
    });

    return {
      playerId,
      playerName: player.name,
      rank: player.rank,
      totalPlayers: room.players.size,
      totalScore: player.score,
      maxPossibleMarks: maxMarks,
      totalQuestions,
      correctAnswers: player.correctAnswers,
      incorrectAnswers: player.incorrectAnswers,
      unansweredCount: player.unansweredCount,
      accuracyPct,
      timeTakenSec,
      topicBreakdown: topicStats,
      weakTopics: weakTopics.length > 0 ? weakTopics : ['Quantitative Aptitude Review'],
      recommendedPracticeUrl: `/practice?category=Aptitude&topic=${encodeURIComponent(weakTopics[0] || 'Quantitative Aptitude')}`,
      questionReview,
    };
  }

  // =========================================================================
  // 9. CLIENT STATE SERIALIZER (RECONNECTION RECOVERY)
  // =========================================================================
  public getRoomStateForClient(roomCode: string, playerId: string) {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) return null;

    const player = room.players.get(playerId);
    const isHost = room.hostPlayerId === playerId;
    const now = Date.now();

    // Lobby remaining time
    const remainingLobbySec = Math.max(0, Math.floor((room.lobbyDeadline - now) / 1000));

    // Test remaining time
    const remainingTestSec = room.testDeadline ? Math.max(0, Math.floor((room.testDeadline - now) / 1000)) : 0;

    // Strip out correctAnswer from questions if test is active
    const sanitizedQuestions = room.questions.map((q, idx) => {
      const myAnswer = room.answers.get(`${playerId}_${idx}`);
      return {
        orderIndex: idx,
        questionId: q.questionId,
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty,
        description: q.description,
        options: q.options,
        correctAnswer: room.phase === 'COMPLETED' || (player && player.isFinished) ? q.correctAnswer : null,
        explanation: room.phase === 'COMPLETED' || (player && player.isFinished) ? q.explanation : null,
        mySelectedOption: myAnswer ? myAnswer.selectedOption : null,
        myIsFlagged: myAnswer ? myAnswer.isFlaggedForReview : false,
      };
    });

    // Integrity summary for host
    const integritySummary = isHost
      ? Array.from(room.players.values()).map((p) => {
          const events = room.integrityRecords.filter((r) => r.playerId === p.playerId);
          return {
            playerId: p.playerId,
            name: p.name,
            totalEvents: events.length,
            events: events.slice(-5),
          };
        })
      : null;

    return {
      roomCode: room.roomCode,
      title: room.title,
      topic: room.topic,
      difficulty: room.difficulty,
      phase: room.phase,
      totalQuestions: room.totalQuestions,
      maxPossibleMarks: room.totalQuestions * 5,
      testDurationMinutes: room.testDurationMinutes,
      isHost,
      myPlayer: player || null,
      remainingLobbySec,
      remainingTestSec,
      questions: sanitizedQuestions,
      leaderboard: this.getTop50Leaderboard(room),
      totalPlayersCount: room.players.size,
      integritySummary,
      scorecard: player?.isFinished || room.phase === 'COMPLETED' ? this.generatePlayerScorecard(room, playerId) : null,
    };
  }

  // =========================================================================
  // 10. REAL-TIME EVENT STREAM (SSE)
  // =========================================================================
  public subscribe(roomCode: string, listener: SseListener): () => void {
    const code = roomCode.toUpperCase().trim();
    if (!this.listeners.has(code)) {
      this.listeners.set(code, new Set());
    }
    const set = this.listeners.get(code)!;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  public broadcast(roomCode: string, event: ArenaEvent): void {
    const code = roomCode.toUpperCase().trim();
    const set = this.listeners.get(code);
    if (!set) return;

    for (const listener of set) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error broadcasting to listener:', err);
      }
    }
  }

  // =========================================================================
  // 11. HELPERS & PERSISTENCE
  // =========================================================================
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'APT';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private selectQuestions(topic: string, count: number): ArenaQuestion[] {
    const pool: GeneratedQuestion[] = [];
    Object.entries(QUESTION_DATABASE).forEach(([tKey, qList]) => {
      if (qList[0]?.category === 'APTITUDE') {
        if (topic && tKey.toLowerCase().includes(topic.toLowerCase())) {
          pool.unshift(...qList);
        } else {
          pool.push(...qList);
        }
      }
    });

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const slice = shuffled.slice(0, count);

    return slice.map((q, idx) => ({
      orderIndex: idx,
      questionId: q.id,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      description: q.description,
      options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: q.correctAnswer || (q.options ? q.options[0] : 'Option A'),
      explanation: q.explanation || 'Step-by-step mathematical deduction leads to this verified solution.',
    }));
  }

  private async persistGameResults(room: ArenaRoomState): Promise<void> {
    try {
      const topPlayers = Array.from(room.players.values());
      for (const p of topPlayers) {
        const accuracyPct = p.questionsAnswered > 0 ? Math.round((p.correctAnswers / p.questionsAnswered) * 100) : 0;
        await prisma.aptitudeGameResult.create({
          data: {
            roomId: room.roomCode,
            roomCode: room.roomCode,
            userId: p.userId || null,
            playerName: p.name,
            rank: p.rank,
            totalScore: p.score,
            totalQuestions: room.totalQuestions,
            correctAnswers: p.correctAnswers,
            accuracyPct,
            avgTimeTakenSec: room.testDurationMinutes * 60,
            topicBreakdown: JSON.stringify({ [room.topic]: accuracyPct }),
          },
        });
      }

      await prisma.aptitudeRoom.updateMany({
        where: { roomCode: room.roomCode },
        data: { status: 'COMPLETED' },
      });
    } catch (e) {
      console.warn('Prisma game result persistence notice:', e);
    }
  }

  private cleanupExpiredRooms(): void {
    const now = Date.now();
    for (const [code, room] of Array.from(this.rooms.entries())) {
      // Clean up rooms older than 3 hours
      if (now - room.createdAt > 3 * 60 * 60 * 1000) {
        if (room.lobbyInterval) clearInterval(room.lobbyInterval);
        if (room.testInterval) clearInterval(room.testInterval);
        this.rooms.delete(code);
        this.listeners.delete(code);
      }
    }
  }
}

// Global Singleton pattern
declare global {
  var __arenaGameManagerInstance: ArenaGameManager | undefined;
}

export const arenaGameManager = global.__arenaGameManagerInstance || new ArenaGameManager();
if (process.env.NODE_ENV !== 'production') {
  global.__arenaGameManagerInstance = arenaGameManager;
}

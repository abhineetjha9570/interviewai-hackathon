// GD Arena — Real-Time Multiplayer Coordinator & WebRTC Signaling Engine
// Server-authoritative room lifecycle, participant management, synchronized timing,
// WebRTC signaling mailbox (for peer-to-peer audio mesh), and database persistence.

import { prisma } from './prisma.ts';
import {
  GD_PERSONALITIES,
  generateModeratorOpening,
  generateModeratorAnnouncement,
  generateGDEvidenceReport,
  type GDTranscriptItem,
  type GDReportEvaluation,
} from './gd-orchestrator.ts';

export interface GDParticipantState {
  playerId: string;
  userId?: string | null;
  name: string;
  avatar: string;
  isHost: boolean;
  isAi: boolean;
  aiRole?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  micReady: boolean;
  totalSpeakingSec: number;
  lastSpeakingPing: number;
  joinedAt: number;
  lastActive: number;
  connected: boolean;
}

export type GDRoomPhase = 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface WebRTCSignal {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  timestamp: number;
}

export interface GDRoomState {
  roomCode: string;
  title: string;
  topic: string;
  category: string;
  durationMinutes: number;
  maxParticipants: number;
  language: string;
  difficulty: string;
  hasAiModerator: boolean;
  phase: GDRoomPhase;

  // Authoritative Timers
  createdAt: number;
  lobbyDeadline: number; // e.g. 10 mins from creation
  discussionStartTime: number | null;
  discussionDeadline: number | null;

  hostPlayerId: string;
  participants: Map<string, GDParticipantState>;
  transcripts: GDTranscriptItem[];
  signals: Map<string, WebRTCSignal[]>; // key: recipient playerId
  report?: GDReportEvaluation | null;
}

// In-memory active rooms cache for sub-millisecond signaling and real-time mesh
class GDArenaCoordinator {
  private rooms: Map<string, GDRoomState> = new Map();

  /**
   * Generates a collision-resistant 6-character alphanumeric room code.
   */
  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GD';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateUniqueCode();
    }
    return code;
  }

  /**
   * Creates a new multiplayer GD room.
   */
  public async createRoom(params: {
    hostUserId?: string | null;
    hostName: string;
    topic: string;
    category?: string;
    durationMinutes?: number;
    maxParticipants?: number;
    language?: string;
    difficulty?: string;
    hasAiModerator?: boolean;
  }): Promise<{ roomCode: string; hostPlayerId: string; roomState: GDRoomState }> {
    const roomCode = this.generateUniqueCode();
    const hostPlayerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const durationMins = Math.max(3, Math.min(30, params.durationMinutes || 10));
    const maxP = Math.max(2, Math.min(8, params.maxParticipants || 6));
    const lobbyDeadline = now + 10 * 60 * 1000; // 10 minutes lobby

    const hostParticipant: GDParticipantState = {
      playerId: hostPlayerId,
      userId: params.hostUserId || null,
      name: params.hostName || 'Host',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${params.hostName}`,
      isHost: true,
      isAi: false,
      isMuted: false,
      isSpeaking: false,
      micReady: true,
      totalSpeakingSec: 0,
      lastSpeakingPing: 0,
      joinedAt: now,
      lastActive: now,
      connected: true,
    };

    const roomState: GDRoomState = {
      roomCode,
      title: 'Group Discussion Arena',
      topic: params.topic,
      category: params.category || 'Technology',
      durationMinutes: durationMins,
      maxParticipants: maxP,
      language: params.language || 'English',
      difficulty: params.difficulty || 'Intermediate',
      hasAiModerator: params.hasAiModerator !== false,
      phase: 'LOBBY',
      createdAt: now,
      lobbyDeadline,
      discussionStartTime: null,
      discussionDeadline: null,
      hostPlayerId,
      participants: new Map([[hostPlayerId, hostParticipant]]),
      transcripts: [],
      signals: new Map([[hostPlayerId, []]]),
    };

    // If AI moderator is enabled, add AI moderator to participants
    if (roomState.hasAiModerator) {
      const mod = GD_PERSONALITIES.MODERATOR;
      const modParticipant: GDParticipantState = {
        playerId: 'mod_radhika',
        userId: null,
        name: `${mod.name} (AI Moderator)`,
        avatar: mod.avatar,
        isHost: false,
        isAi: true,
        aiRole: 'MODERATOR',
        isMuted: false,
        isSpeaking: false,
        micReady: true,
        totalSpeakingSec: 0,
        lastSpeakingPing: 0,
        joinedAt: now,
        lastActive: now,
        connected: true,
      };
      roomState.participants.set('mod_radhika', modParticipant);
    }

    this.rooms.set(roomCode, roomState);

    // Persist to SQLite
    try {
      await prisma.gDRoom.create({
        data: {
          roomCode,
          hostUserId: params.hostUserId || null,
          hostPlayerId,
          hostName: params.hostName || 'Host',
          title: roomState.title,
          topic: roomState.topic,
          category: roomState.category,
          durationMinutes: roomState.durationMinutes,
          maxParticipants: roomState.maxParticipants,
          language: roomState.language,
          difficulty: roomState.difficulty,
          hasAiModerator: roomState.hasAiModerator,
          status: 'WAITING',
          lobbyDeadline: new Date(lobbyDeadline),
          participants: {
            create: {
              playerId: hostPlayerId,
              userId: params.hostUserId || null,
              name: params.hostName || 'Host',
              avatar: hostParticipant.avatar,
              isHost: true,
              isAi: false,
            },
          },
        },
      });
    } catch (e) {
      console.warn('DB GDRoom persist error:', e);
    }

    return { roomCode, hostPlayerId, roomState };
  }

  /**
   * Joins an existing room.
   */
  public async joinRoom(params: {
    roomCode: string;
    userId?: string | null;
    playerName: string;
  }): Promise<{ success: boolean; error?: string; playerId?: string; roomState?: GDRoomState }> {
    const code = params.roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      // Check SQLite fallback if server restarted
      const dbRoom = await prisma.gDRoom.findUnique({
        where: { roomCode: code },
        include: { participants: true },
      });

      if (!dbRoom || dbRoom.status === 'COMPLETED' || dbRoom.status === 'EXPIRED') {
        return { success: false, error: 'Room not found or discussion has ended.' };
      }

      // Rehydrate in-memory room
      return this.rehydrateAndJoin(dbRoom, params);
    }

    if (room.phase === 'COMPLETED' || room.phase === 'EXPIRED') {
      return { success: false, error: 'This discussion session has already concluded.' };
    }

    // Check capacity (excluding AI)
    const humanCount = Array.from(room.participants.values()).filter((p) => !p.isAi).length;
    if (humanCount >= room.maxParticipants) {
      return { success: false, error: `Room is at full capacity (${room.maxParticipants} participants max).` };
    }

    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const participant: GDParticipantState = {
      playerId,
      userId: params.userId || null,
      name: params.playerName || 'Participant',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${params.playerName}`,
      isHost: false,
      isAi: false,
      isMuted: false,
      isSpeaking: false,
      micReady: true,
      totalSpeakingSec: 0,
      lastSpeakingPing: 0,
      joinedAt: now,
      lastActive: now,
      connected: true,
    };

    room.participants.set(playerId, participant);
    room.signals.set(playerId, []);

    // Persist participant in DB
    try {
      const dbRoom = await prisma.gDRoom.findUnique({ where: { roomCode: code } });
      if (dbRoom) {
        await prisma.gDParticipant.create({
          data: {
            roomId: dbRoom.id,
            playerId,
            userId: params.userId || null,
            name: params.playerName || 'Participant',
            avatar: participant.avatar,
            isHost: false,
            isAi: false,
          },
        });
      }
    } catch (e) {
      console.warn('DB Participant persist error:', e);
    }

    return { success: true, playerId, roomState: room };
  }

  private async rehydrateAndJoin(dbRoom: any, params: any) {
    const now = Date.now();
    const roomState: GDRoomState = {
      roomCode: dbRoom.roomCode,
      title: dbRoom.title,
      topic: dbRoom.topic,
      category: dbRoom.category,
      durationMinutes: dbRoom.durationMinutes,
      maxParticipants: dbRoom.maxParticipants,
      language: dbRoom.language,
      difficulty: dbRoom.difficulty,
      hasAiModerator: dbRoom.hasAiModerator,
      phase: dbRoom.status as GDRoomPhase,
      createdAt: dbRoom.createdAt.getTime(),
      lobbyDeadline: dbRoom.lobbyDeadline ? dbRoom.lobbyDeadline.getTime() : now + 600000,
      discussionStartTime: dbRoom.discussionStartTime ? dbRoom.discussionStartTime.getTime() : null,
      discussionDeadline: dbRoom.discussionDeadline ? dbRoom.discussionDeadline.getTime() : null,
      hostPlayerId: dbRoom.hostPlayerId,
      participants: new Map(),
      transcripts: [],
      signals: new Map(),
    };

    for (const p of dbRoom.participants || []) {
      roomState.participants.set(p.playerId, {
        playerId: p.playerId,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`,
        isHost: p.isHost,
        isAi: p.isAi,
        isMuted: p.isMuted,
        isSpeaking: p.isSpeaking,
        micReady: p.micReady,
        totalSpeakingSec: p.totalSpeakingSec,
        lastSpeakingPing: 0,
        joinedAt: p.joinedAt.getTime(),
        lastActive: now,
        connected: true,
      });
      roomState.signals.set(p.playerId, []);
    }

    this.rooms.set(dbRoom.roomCode, roomState);
    return this.joinRoom(params);
  }

  /**
   * Starts the discussion (Host only). Sets server-authoritative deadline.
   */
  public async startDiscussion(
    roomCode: string,
    hostPlayerId: string
  ): Promise<{ success: boolean; error?: string; roomState?: GDRoomState }> {
    const code = roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the authorized host can start the discussion.' };
    }

    if (room.phase !== 'LOBBY') {
      return { success: false, error: 'Discussion is already running or concluded.' };
    }

    const now = Date.now();
    const deadline = now + room.durationMinutes * 60 * 1000;

    room.phase = 'IN_PROGRESS';
    room.discussionStartTime = now;
    room.discussionDeadline = deadline;

    // If AI moderator is enabled, add opening announcement
    if (room.hasAiModerator) {
      const names = Array.from(room.participants.values())
        .filter((p) => !p.isAi)
        .map((p) => p.name);
      const opening = generateModeratorOpening(room.topic, room.durationMinutes, names, room.language);
      room.transcripts.push({
        speakerId: 'mod_radhika',
        speakerName: opening.speakerName,
        speakerRole: 'AI_MODERATOR',
        aiPersonality: 'MODERATOR',
        text: opening.text,
        timestampSec: 0,
        durationSec: opening.estimatedDurationSec,
      });
    }

    // Persist start time in DB
    try {
      await prisma.gDRoom.update({
        where: { roomCode: code },
        data: {
          status: 'IN_PROGRESS',
          discussionStartTime: new Date(now),
          discussionDeadline: new Date(deadline),
        },
      });
    } catch (e) {
      console.warn('DB start update error:', e);
    }

    return { success: true, roomState: room };
  }

  /**
   * Records a transcript utterance from a participant.
   */
  public addTranscriptEntry(
    roomCode: string,
    entry: {
      speakerId: string;
      speakerName: string;
      speakerRole: 'HUMAN' | 'AI_PARTICIPANT' | 'AI_MODERATOR';
      aiPersonality?: 'ARJUN' | 'MEERA' | 'KABIR' | 'SARA' | 'MODERATOR';
      text: string;
      durationSec?: number;
    }
  ): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return false;

    const now = Date.now();
    const start = room.discussionStartTime || now;
    const timestampSec = Math.max(0, Math.floor((now - start) / 1000));
    const duration = entry.durationSec || Math.max(2, Math.round(entry.text.split(' ').length / 2.5));

    const item: GDTranscriptItem = {
      speakerId: entry.speakerId,
      speakerName: entry.speakerName,
      speakerRole: entry.speakerRole,
      aiPersonality: entry.aiPersonality,
      text: entry.text,
      timestampSec,
      durationSec: duration,
    };

    room.transcripts.push(item);

    // Update participant total speaking time
    const participant = room.participants.get(entry.speakerId);
    if (participant) {
      participant.totalSpeakingSec += duration;
      participant.lastActive = now;
    }

    return true;
  }

  /**
   * WebRTC Signaling: Sends an SDP offer, answer, or ICE candidate to a specific peer.
   */
  public postSignal(
    roomCode: string,
    fromPlayerId: string,
    toPlayerId: string,
    type: 'offer' | 'answer' | 'ice-candidate',
    payload: any
  ): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return false;

    let queue = room.signals.get(toPlayerId);
    if (!queue) {
      queue = [];
      room.signals.set(toPlayerId, queue);
    }

    queue.push({
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromPlayerId,
      toPlayerId,
      type,
      payload,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * WebRTC Signaling: Pulls and drains pending signals for a specific peer.
   */
  public pullSignals(roomCode: string, playerId: string): WebRTCSignal[] {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return [];

    const queue = room.signals.get(playerId) || [];
    room.signals.set(playerId, []); // Drain queue
    return queue;
  }

  /**
   * Participant Heartbeat & Status update (mic mute, speaking status).
   */
  public updateParticipantStatus(
    roomCode: string,
    playerId: string,
    status: { isMuted?: boolean; isSpeaking?: boolean; micReady?: boolean }
  ): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return false;

    const participant = room.participants.get(playerId);
    if (!participant) return false;

    if (status.isMuted !== undefined) participant.isMuted = status.isMuted;
    if (status.isSpeaking !== undefined) participant.isSpeaking = status.isSpeaking;
    if (status.micReady !== undefined) participant.micReady = status.micReady;

    participant.lastActive = Date.now();
    return true;
  }

  /**
   * Retrieves sanitized client view of the room state.
   */
  public getRoomClientState(roomCode: string, playerId?: string): any {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return null;

    const now = Date.now();

    // Authoritative Remaining Time
    let remainingSec = 0;
    if (room.phase === 'LOBBY') {
      remainingSec = Math.max(0, Math.floor((room.lobbyDeadline - now) / 1000));
    } else if (room.phase === 'IN_PROGRESS' && room.discussionDeadline) {
      remainingSec = Math.max(0, Math.floor((room.discussionDeadline - now) / 1000));
      // Auto-complete if deadline passed
      if (remainingSec === 0 && room.phase !== 'COMPLETED') {
        this.completeRoom(room.roomCode);
      }
    }

    const participantsList = Array.from(room.participants.values()).map((p) => ({
      playerId: p.playerId,
      name: p.name,
      avatar: p.avatar,
      isHost: p.isHost,
      isAi: p.isAi,
      aiRole: p.aiRole,
      isMuted: p.isMuted,
      isSpeaking: p.isSpeaking,
      micReady: p.micReady,
      totalSpeakingSec: p.totalSpeakingSec,
      connected: p.connected,
    }));

    return {
      roomCode: room.roomCode,
      title: room.title,
      topic: room.topic,
      category: room.category,
      durationMinutes: room.durationMinutes,
      maxParticipants: room.maxParticipants,
      language: room.language,
      difficulty: room.difficulty,
      hasAiModerator: room.hasAiModerator,
      phase: room.phase,
      hostPlayerId: room.hostPlayerId,
      isHost: playerId ? room.hostPlayerId === playerId : false,
      remainingSec,
      participants: participantsList,
      totalParticipantsCount: participantsList.length,
      transcripts: room.transcripts,
      hasReport: !!room.report,
    };
  }

  /**
   * Concludes the room and compiles the evidence-linked evaluation report.
   */
  public async completeRoom(roomCode: string): Promise<GDRoomState | null> {
    const code = roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return null;

    room.phase = 'COMPLETED';

    // Generate evidence-linked report for the session
    const hostUser = Array.from(room.participants.values()).find((p) => p.isHost);
    const report = generateGDEvidenceReport(
      hostUser?.name || 'Candidate',
      room.topic,
      room.durationMinutes,
      room.transcripts
    );
    room.report = report;

    // Persist completed status and report to DB
    try {
      const dbRoom = await prisma.gDRoom.findUnique({ where: { roomCode: code } });
      if (dbRoom) {
        await prisma.gDRoom.update({
          where: { roomCode: code },
          data: { status: 'COMPLETED' },
        });

        await prisma.gDSessionReport.upsert({
          where: { sessionId: code },
          create: {
            sessionId: code,
            roomId: dbRoom.id,
            userId: dbRoom.hostUserId,
            userName: hostUser?.name || 'Candidate',
            mode: 'MULTIPLAYER',
            topic: room.topic,
            durationMinutes: room.durationMinutes,
            speakingTimeSec: report.speakingTimeSec,
            speakingRatioPct: report.speakingRatioPct,
            participationScore: report.participationScore,
            ideaQualityScore: report.ideaQualityScore,
            topicRelevanceScore: report.topicRelevanceScore,
            collaborationScore: report.collaborationScore,
            argumentScore: report.argumentScore,
            overallScore: report.overallScore,
            summary: report.summary,
            strengths: JSON.stringify(report.strengths),
            improvements: JSON.stringify(report.improvements),
            nextSteps: JSON.stringify(report.nextSteps),
            evidenceData: JSON.stringify(report.evidenceData),
            insufficientEvidence: report.insufficientEvidence,
          },
          update: {
            speakingTimeSec: report.speakingTimeSec,
            speakingRatioPct: report.speakingRatioPct,
            overallScore: report.overallScore,
            summary: report.summary,
          },
        });
      }
    } catch (e) {
      console.warn('DB complete persist error:', e);
    }

    return room;
  }

  /**
   * Leave room handler.
   */
  public leaveRoom(roomCode: string, playerId: string): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return false;

    const departing = room.participants.get(playerId);
    if (!departing) return false;

    room.participants.delete(playerId);
    room.signals.delete(playerId);

    // If host left and there are other human players, transfer host
    if (departing.isHost) {
      const remainingHumans = Array.from(room.participants.values()).filter((p) => !p.isAi);
      if (remainingHumans.length > 0) {
        remainingHumans[0].isHost = true;
        room.hostPlayerId = remainingHumans[0].playerId;
      }
    }

    return true;
  }
}

// Global singleton instance
export const gdArenaCoordinator = new GDArenaCoordinator();

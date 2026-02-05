/**
 * WebRTC Signaling Tests
 * Tests server-side signaling relay for WebRTC connections
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test the signaling logic by simulating the server's client tracking and message routing

describe('WebRTC Signaling', () => {
  let clients;

  // Recreate server helper functions for testing
  function broadcast(message) {
    const payload = JSON.stringify(message);
    for (const [ws] of clients) {
      if (ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }

  function sendToUser(targetUsername, message) {
    const payload = JSON.stringify(message);
    for (const [ws, data] of clients) {
      if (ws.readyState === 1 && data.username === targetUsername) {
        ws.send(payload);
        return true;
      }
    }
    return false;
  }

  function createMockWs(username) {
    const ws = {
      readyState: 1, // OPEN
      send: vi.fn(),
      _username: username
    };
    clients.set(ws, { username, lastHeartbeat: Date.now() });
    return ws;
  }

  beforeEach(() => {
    clients = new Map();
  });

  describe('sendToUser', () => {
    it('sends message to target user', () => {
      const alice = createMockWs('alice');
      const msg = { type: 'webrtc_signal', subtype: 'offer', payload: 'sdp-data' };
      const result = sendToUser('alice', msg);
      expect(result).toBe(true);
      expect(alice.send).toHaveBeenCalledOnce();
      expect(JSON.parse(alice.send.mock.calls[0][0])).toEqual(msg);
    });

    it('returns false if user not found', () => {
      createMockWs('alice');
      const result = sendToUser('bob', { type: 'test' });
      expect(result).toBe(false);
    });

    it('skips closed connections', () => {
      const alice = createMockWs('alice');
      alice.readyState = 3; // CLOSED
      const result = sendToUser('alice', { type: 'test' });
      expect(result).toBe(false);
      expect(alice.send).not.toHaveBeenCalled();
    });

    it('sends to first matching socket for duplicate usernames', () => {
      const alice1 = createMockWs('alice');
      const alice2 = createMockWs('alice');
      sendToUser('alice', { type: 'test' });
      expect(alice1.send).toHaveBeenCalledOnce();
      expect(alice2.send).not.toHaveBeenCalled();
    });
  });

  describe('webrtc_activate broadcast', () => {
    it('broadcasts activation to all connected clients', () => {
      const teacher = createMockWs('teacher1');
      const student1 = createMockWs('student1');
      const student2 = createMockWs('student2');

      const activateClient = clients.get(teacher);
      broadcast({ type: 'webrtc_activate', teacherUsername: activateClient.username });

      expect(teacher.send).toHaveBeenCalledOnce();
      expect(student1.send).toHaveBeenCalledOnce();
      expect(student2.send).toHaveBeenCalledOnce();

      const parsed = JSON.parse(student1.send.mock.calls[0][0]);
      expect(parsed.type).toBe('webrtc_activate');
      expect(parsed.teacherUsername).toBe('teacher1');
    });

    it('includes teacher username in broadcast', () => {
      createMockWs('teacher_abc');
      const student = createMockWs('student1');

      broadcast({ type: 'webrtc_activate', teacherUsername: 'teacher_abc' });

      const parsed = JSON.parse(student.send.mock.calls[0][0]);
      expect(parsed.teacherUsername).toBe('teacher_abc');
    });
  });

  describe('webrtc_signal relay', () => {
    it('relays offer from student to teacher', () => {
      const teacher = createMockWs('teacher1');
      createMockWs('student1');

      const signalMsg = {
        type: 'webrtc_signal',
        subtype: 'offer',
        fromUsername: 'student1',
        targetUsername: 'teacher1',
        payload: { sdp: 'mock-offer-sdp' }
      };
      sendToUser('teacher1', signalMsg);

      expect(teacher.send).toHaveBeenCalledOnce();
      const parsed = JSON.parse(teacher.send.mock.calls[0][0]);
      expect(parsed.subtype).toBe('offer');
      expect(parsed.fromUsername).toBe('student1');
      expect(parsed.payload.sdp).toBe('mock-offer-sdp');
    });

    it('relays answer from teacher to student', () => {
      createMockWs('teacher1');
      const student = createMockWs('student1');

      const signalMsg = {
        type: 'webrtc_signal',
        subtype: 'answer',
        fromUsername: 'teacher1',
        targetUsername: 'student1',
        payload: { sdp: 'mock-answer-sdp' }
      };
      sendToUser('student1', signalMsg);

      expect(student.send).toHaveBeenCalledOnce();
      const parsed = JSON.parse(student.send.mock.calls[0][0]);
      expect(parsed.subtype).toBe('answer');
      expect(parsed.fromUsername).toBe('teacher1');
    });

    it('relays ICE candidates bidirectionally', () => {
      const teacher = createMockWs('teacher1');
      const student = createMockWs('student1');

      const iceToTeacher = {
        type: 'webrtc_signal',
        subtype: 'ice_candidate',
        fromUsername: 'student1',
        targetUsername: 'teacher1',
        payload: { candidate: 'candidate-from-student' }
      };
      sendToUser('teacher1', iceToTeacher);
      expect(teacher.send).toHaveBeenCalledOnce();

      const iceToStudent = {
        type: 'webrtc_signal',
        subtype: 'ice_candidate',
        fromUsername: 'teacher1',
        targetUsername: 'student1',
        payload: { candidate: 'candidate-from-teacher' }
      };
      sendToUser('student1', iceToStudent);
      expect(student.send).toHaveBeenCalledOnce();
    });

    it('does not relay to sender', () => {
      const teacher = createMockWs('teacher1');
      const student = createMockWs('student1');

      // Relay targets teacher only -- student (the sender) should not receive
      sendToUser('teacher1', {
        type: 'webrtc_signal',
        subtype: 'offer',
        fromUsername: 'student1',
        targetUsername: 'teacher1',
        payload: {}
      });

      expect(teacher.send).toHaveBeenCalledOnce();
      expect(student.send).not.toHaveBeenCalled();
    });

    it('handles missing target gracefully', () => {
      createMockWs('student1');
      const result = sendToUser('nonexistent_teacher', {
        type: 'webrtc_signal',
        subtype: 'offer',
        fromUsername: 'student1',
        targetUsername: 'nonexistent_teacher',
        payload: {}
      });
      expect(result).toBe(false);
    });
  });

  describe('webrtc_deactivate', () => {
    it('broadcasts deactivation to all clients', () => {
      const teacher = createMockWs('teacher1');
      const student1 = createMockWs('student1');
      const student2 = createMockWs('student2');

      const deactivateClient = clients.get(teacher);
      broadcast({ type: 'webrtc_deactivate', teacherUsername: deactivateClient.username });

      expect(teacher.send).toHaveBeenCalledOnce();
      expect(student1.send).toHaveBeenCalledOnce();
      expect(student2.send).toHaveBeenCalledOnce();

      const parsed = JSON.parse(student1.send.mock.calls[0][0]);
      expect(parsed.type).toBe('webrtc_deactivate');
      expect(parsed.teacherUsername).toBe('teacher1');
    });

    it('broadcasts deactivation on teacher disconnect', () => {
      const teacher = createMockWs('teacher1');
      const student = createMockWs('student1');

      // Simulate disconnect: remove teacher from clients, then broadcast deactivation
      const teacherData = clients.get(teacher);
      clients.delete(teacher);

      broadcast({ type: 'webrtc_deactivate', teacherUsername: teacherData.username });

      // Teacher is gone, only student receives
      expect(student.send).toHaveBeenCalledOnce();
      const parsed = JSON.parse(student.send.mock.calls[0][0]);
      expect(parsed.type).toBe('webrtc_deactivate');
      expect(parsed.teacherUsername).toBe('teacher1');

      // Teacher socket was removed so it should not have received the broadcast
      expect(teacher.send).not.toHaveBeenCalled();
    });
  });
});

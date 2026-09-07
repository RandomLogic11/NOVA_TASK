const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const QUIZ_CODE = 'NOVA';
const ADMIN_PASSKEY = 'DNOVA';

// Load questions
let questions = [];
try {
  const data = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
  questions = JSON.parse(data);
  console.log(`Loaded ${questions.length} questions successfully.`);
} catch (err) {
  console.error('Error loading questions.json:', err);
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Global Quiz State
const quizState = {
  status: 'LOBBY', // 'LOBBY', 'QUESTION_ACTIVE', 'QUESTION_REVIEW', 'QUIZ_ENDED'
  currentQuestionIndex: -1,
  timeRemaining: 20,
  timerInterval: null,
  pollCounts: { 0: 0, 1: 0, 2: 0, 3: 0 },
  totalVotes: 0,
  participants: new Map(), // socketId -> { id, nickname, score, correctCount, streak, currentAnswer }
  adminSocketId: null
};

// Helper to get safe participant summary
function getParticipantsSummary() {
  const list = [];
  quizState.participants.forEach((p) => {
    list.push({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      correctCount: p.correctCount,
      hasAnswered: p.currentAnswer !== null
    });
  });
  return list;
}

// Helper to get leaderboard sorted by score
function getLeaderboard() {
  const list = getParticipantsSummary();
  list.sort((a, b) => b.score - a.score);
  return list;
}

// Helper for client-safe current question (omitting correct answer during active play)
function getSanitizedCurrentQuestion() {
  if (quizState.currentQuestionIndex < 0 || quizState.currentQuestionIndex >= questions.length) {
    return null;
  }
  const q = questions[quizState.currentQuestionIndex];
  return {
    index: quizState.currentQuestionIndex,
    totalQuestions: questions.length,
    question: q.question,
    options: q.options,
    timeLimit: q.timeLimit || 20
  };
}

// Reset question-specific tracking
function resetQuestionPoll() {
  quizState.pollCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  quizState.totalVotes = 0;
  quizState.participants.forEach((p) => {
    p.currentAnswer = null;
  });
}

// Timer function
function startQuestionTimer() {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval);
  }

  const currentQ = questions[quizState.currentQuestionIndex];
  quizState.timeRemaining = currentQ ? (currentQ.timeLimit || 20) : 20;

  // Broadcast timer tick every second
  quizState.timerInterval = setInterval(() => {
    quizState.timeRemaining -= 1;

    io.emit('timer_tick', {
      timeRemaining: quizState.timeRemaining,
      timeLimit: currentQ ? currentQ.timeLimit : 20
    });

    if (quizState.timeRemaining <= 0) {
      clearInterval(quizState.timerInterval);
      quizState.timerInterval = null;
      revealQuestionResults();
    }
  }, 1000);
}

// Transition to review and reveal answers
function revealQuestionResults() {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval);
    quizState.timerInterval = null;
  }

  quizState.status = 'QUESTION_REVIEW';
  const q = questions[quizState.currentQuestionIndex];

  const reviewData = {
    index: quizState.currentQuestionIndex,
    correctIndex: q ? q.correct : -1,
    explanation: q ? q.explanation : '',
    pollCounts: quizState.pollCounts,
    totalVotes: quizState.totalVotes,
    totalParticipants: quizState.participants.size,
    leaderboard: getLeaderboard()
  };

  io.emit('question_review', reviewData);
}

// Move to next question or end
function moveToNextQuestion() {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval);
    quizState.timerInterval = null;
  }

  quizState.currentQuestionIndex += 1;

  if (quizState.currentQuestionIndex >= questions.length) {
    // End of quiz
    quizState.status = 'QUIZ_ENDED';
    const finalLeaderboard = getLeaderboard();
    io.emit('quiz_ended', {
      leaderboard: finalLeaderboard,
      totalQuestions: questions.length
    });
  } else {
    // Active question
    quizState.status = 'QUESTION_ACTIVE';
    resetQuestionPoll();

    const questionData = getSanitizedCurrentQuestion();
    startQuestionTimer();

    io.emit('question_started', {
      question: questionData,
      pollCounts: quizState.pollCounts,
      totalParticipants: quizState.participants.size
    });
  }
}

// Socket IO Event Handling
io.on('connection', (socket) => {
  // 1. Participant Join Verification
  socket.on('join_quiz', ({ code, nickname }, callback) => {
    if (!code || code.trim().toUpperCase() !== QUIZ_CODE) {
      return callback({
        success: false,
        error: 'No such quiz exists'
      });
    }

    const cleanNick = (nickname || '').trim() || `CosmoCadet-${Math.floor(1000 + Math.random() * 9000)}`;

    // Store participant
    quizState.participants.set(socket.id, {
      id: socket.id,
      nickname: cleanNick,
      score: 0,
      correctCount: 0,
      streak: 0,
      currentAnswer: null
    });

    socket.join('quiz_room');

    // Notify caller
    callback({
      success: true,
      participant: {
        id: socket.id,
        nickname: cleanNick
      },
      gameState: {
        status: quizState.status,
        currentQuestionIndex: quizState.currentQuestionIndex,
        totalQuestions: questions.length,
        currentQuestion: quizState.status === 'QUESTION_ACTIVE' ? getSanitizedCurrentQuestion() : null,
        timeRemaining: quizState.timeRemaining,
        pollCounts: quizState.pollCounts,
        participantCount: quizState.participants.size
      }
    });

    // Broadcast updated participant list to everyone in room and admin
    io.emit('participants_updated', {
      count: quizState.participants.size,
      participants: getParticipantsSummary()
    });
  });

  // 2. Admin Authentication
  socket.on('admin_auth', ({ passkey }, callback) => {
    if (passkey !== ADMIN_PASSKEY) {
      return callback({
        success: false,
        error: 'Invalid Admin Passkey'
      });
    }

    quizState.adminSocketId = socket.id;
    socket.join('admin_room');

    callback({
      success: true,
      gameState: {
        status: quizState.status,
        currentQuestionIndex: quizState.currentQuestionIndex,
        totalQuestions: questions.length,
        currentQuestion: quizState.status === 'QUESTION_ACTIVE' ? getSanitizedCurrentQuestion() : (questions[quizState.currentQuestionIndex] || null),
        timeRemaining: quizState.timeRemaining,
        pollCounts: quizState.pollCounts,
        totalVotes: quizState.totalVotes,
        participantCount: quizState.participants.size,
        participants: getParticipantsSummary(),
        leaderboard: getLeaderboard()
      }
    });
  });

  // 3. Admin Start Quiz
  socket.on('admin_start_quiz', (callback) => {
    if (quizState.participants.size < 1) {
      return callback({
        success: false,
        error: 'At least 1 participant must be in the waiting room to start the quiz!'
      });
    }

    // Reset scores & progress
    quizState.participants.forEach((p) => {
      p.score = 0;
      p.correctCount = 0;
      p.streak = 0;
      p.currentAnswer = null;
    });

    quizState.currentQuestionIndex = -1;
    moveToNextQuestion();

    callback({ success: true });
  });

  // 4. Admin Next Question
  socket.on('admin_next_question', (callback) => {
    moveToNextQuestion();
    if (callback) callback({ success: true });
  });

  // 5. Admin Reveal Answer Early
  socket.on('admin_reveal_answer', (callback) => {
    if (quizState.status === 'QUESTION_ACTIVE') {
      revealQuestionResults();
    }
    if (callback) callback({ success: true });
  });

  // 6. Admin End Quiz
  socket.on('admin_end_quiz', (callback) => {
    if (quizState.timerInterval) {
      clearInterval(quizState.timerInterval);
      quizState.timerInterval = null;
    }
    quizState.status = 'QUIZ_ENDED';
    io.emit('quiz_ended', {
      leaderboard: getLeaderboard(),
      totalQuestions: questions.length
    });
    if (callback) callback({ success: true });
  });

  // 7. Admin Reset Quiz to Lobby
  socket.on('admin_reset_quiz', (callback) => {
    if (quizState.timerInterval) {
      clearInterval(quizState.timerInterval);
      quizState.timerInterval = null;
    }
    quizState.status = 'LOBBY';
    quizState.currentQuestionIndex = -1;
    resetQuestionPoll();
    quizState.participants.forEach((p) => {
      p.score = 0;
      p.correctCount = 0;
      p.streak = 0;
      p.currentAnswer = null;
    });

    io.emit('quiz_reset_to_lobby', {
      participants: getParticipantsSummary()
    });

    if (callback) callback({ success: true });
  });

  // 8. Participant Answer Submission
  socket.on('submit_answer', ({ questionIndex, optionIndex }, callback) => {
    const participant = quizState.participants.get(socket.id);
    if (!participant) {
      return callback && callback({ success: false, error: 'Not registered' });
    }

    if (quizState.status !== 'QUESTION_ACTIVE' || quizState.currentQuestionIndex !== questionIndex) {
      return callback && callback({ success: false, error: 'Question is not active' });
    }

    if (participant.currentAnswer !== null) {
      return callback && callback({ success: false, error: 'Already answered' });
    }

    // Record answer
    participant.currentAnswer = optionIndex;
    quizState.pollCounts[optionIndex] = (quizState.pollCounts[optionIndex] || 0) + 1;
    quizState.totalVotes += 1;

    // Score calculation
    const q = questions[quizState.currentQuestionIndex];
    const isCorrect = optionIndex === q.correct;
    let pointsAwarded = 0;

    if (isCorrect) {
      const timeLimit = q.timeLimit || 20;
      // Faster response = more bonus points (base 500 + up to 500 speed bonus + streak bonus)
      const speedRatio = Math.max(0, quizState.timeRemaining) / timeLimit;
      pointsAwarded = Math.round(500 + 500 * speedRatio) + (participant.streak * 50);
      participant.score += pointsAwarded;
      participant.correctCount += 1;
      participant.streak += 1;
    } else {
      participant.streak = 0;
    }

    if (callback) {
      callback({
        success: true,
        optionIndex,
        isCorrect,
        pointsAwarded,
        totalScore: participant.score
      });
    }

    // Broadcast LIVE poll update instantly to everyone (Admin & all participants) without page refresh!
    io.emit('live_poll_updated', {
      pollCounts: quizState.pollCounts,
      totalVotes: quizState.totalVotes,
      totalParticipants: quizState.participants.size
    });

    // Notify admin of participant submission status
    io.to('admin_room').emit('participant_answered', {
      participantId: socket.id,
      totalVotes: quizState.totalVotes,
      totalParticipants: quizState.participants.size
    });

    // If 100% of participants have voted, auto-reveal after brief 1s pause
    if (quizState.totalVotes >= quizState.participants.size && quizState.participants.size > 0) {
      setTimeout(() => {
        if (quizState.status === 'QUESTION_ACTIVE' && quizState.currentQuestionIndex === questionIndex) {
          revealQuestionResults();
        }
      }, 1000);
    }
  });

  // 9. Disconnect Handling
  socket.on('disconnect', () => {
    if (quizState.participants.has(socket.id)) {
      quizState.participants.delete(socket.id);
      io.emit('participants_updated', {
        count: quizState.participants.size,
        participants: getParticipantsSummary()
      });
    }
    if (socket.id === quizState.adminSocketId) {
      quizState.adminSocketId = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 DJS NOVA Real-Time Space Quiz Server is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔑 Quiz Code: ${QUIZ_CODE} | Admin Passkey: ${ADMIN_PASSKEY}`);
  console.log(`=======================================================`);
});

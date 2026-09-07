/**
 * DJS NOVA - Real-Time Space Quiz Competition
 * Client Controller & Socket.IO Event Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Solar System Engine
  const solarEngine = new SolarSystemEngine('solarCanvas');

  // 2. Initialize Logo Loader Sequence
  const logoLoader = new LogoLoader('loaderScreen', () => {
    console.log('DJS NOVA Telemetry Online. Ready for mission.');
  });

  // 3. Connect to Socket.IO Server
  const socket = io();

  // Local State
  let myRole = null; // 'cadet' | 'admin'
  let myParticipant = null;
  let currentQuestion = null;
  let currentQIndex = -1;
  let hasAnsweredCurrentQ = false;
  let currentScore = 0;

  // DOM Elements - Views
  const views = {
    home: document.getElementById('viewHome'),
    waiting: document.getElementById('viewWaiting'),
    gameplay: document.getElementById('viewGameplay'),
    admin: document.getElementById('viewAdmin'),
    leaderboard: document.getElementById('viewLeaderboard')
  };

  // DOM Elements - Modals
  const joinModal = document.getElementById('joinQuizModal');
  const adminModal = document.getElementById('adminAuthModal');
  const btnOpenJoin = document.getElementById('btnOpenJoinModal');
  const btnOpenAdmin = document.getElementById('btnOpenAdminModal');
  const btnCloseJoin = document.getElementById('btnCloseJoinModal');
  const btnCloseAdmin = document.getElementById('btnCloseAdminModal');
  const btnSubmitJoin = document.getElementById('btnSubmitJoin');
  const btnSubmitAdmin = document.getElementById('btnSubmitAdmin');

  const inputQuizCode = document.getElementById('inputQuizCode');
  const inputCadetName = document.getElementById('inputCadetName');
  const inputAdminPass = document.getElementById('inputAdminPass');
  const joinErrorMsg = document.getElementById('joinErrorMsg');
  const joinErrorText = document.getElementById('joinErrorText');
  const adminErrorMsg = document.getElementById('adminErrorMsg');
  const adminErrorText = document.getElementById('adminErrorText');

  // DOM Elements - Waiting Room
  const cadetCallsignDisplay = document.getElementById('cadetCallsignDisplay');
  const waitingCadetsList = document.getElementById('waitingCadetsList');

  // DOM Elements - Participant Gameplay
  const playerQCounter = document.getElementById('playerQCounter');
  const playerTimerWidget = document.getElementById('playerTimerWidget');
  const playerTimerNum = document.getElementById('playerTimerNum');
  const playerScoreBadge = document.getElementById('playerScoreBadge');
  const playerQuestionText = document.getElementById('playerQuestionText');
  const playerOptionsGrid = document.getElementById('playerOptionsGrid');
  const cosmicFactModal = document.getElementById('cosmicFactModal');
  const factCorrectEmoji = document.getElementById('factCorrectEmoji');
  const factCorrectText = document.getElementById('factCorrectText');
  const factDescriptionText = document.getElementById('factDescriptionText');

  if (cosmicFactModal) {
    cosmicFactModal.addEventListener('click', () => {
      cosmicFactModal.classList.remove('active');
    });
  }

  // DOM Elements - Admin Deck
  const adminCadetCount = document.getElementById('adminCadetCount');
  const adminQIndex = document.getElementById('adminQIndex');
  const adminVotesRecorded = document.getElementById('adminVotesRecorded');
  const adminTimerDisplay = document.getElementById('adminTimerDisplay');
  const adminCurrentQTitle = document.getElementById('adminCurrentQTitle');
  const adminRosterContainer = document.getElementById('adminRosterContainer');
  const adminRosterHeaderCount = document.getElementById('adminRosterHeaderCount');
  const adminTotalVotesPct = document.getElementById('adminTotalVotesPct');

  const btnAdminStartQuiz = document.getElementById('btnAdminStartQuiz');
  const btnAdminRevealAnswer = document.getElementById('btnAdminRevealAnswer');
  const btnAdminNextQuestion = document.getElementById('btnAdminNextQuestion');
  const btnAdminEndQuiz = document.getElementById('btnAdminEndQuiz');
  const btnAdminResetQuiz = document.getElementById('btnAdminResetQuiz');

  // DOM Elements - Leaderboard
  const podiumName1 = document.getElementById('podiumName1');
  const podiumScore1 = document.getElementById('podiumScore1');
  const podiumName2 = document.getElementById('podiumName2');
  const podiumScore2 = document.getElementById('podiumScore2');
  const podiumName3 = document.getElementById('podiumName3');
  const podiumScore3 = document.getElementById('podiumScore3');
  const leaderboardListContainer = document.getElementById('leaderboardListContainer');
  const btnLeaderboardReturn = document.getElementById('btnLeaderboardReturn');

  // =========================================================================
  // View Router
  // =========================================================================
  function switchView(viewKey) {
    Object.keys(views).forEach((k) => {
      views[k].classList.remove('active');
    });
    if (views[viewKey]) {
      views[viewKey].classList.add('active');
    }
  }

  // =========================================================================
  // Modal Interactions
  // =========================================================================
  btnOpenJoin.addEventListener('click', () => {
    joinErrorMsg.classList.remove('visible');
    inputQuizCode.value = 'NOVA'; // Pre-populate with default code
    inputCadetName.value = '';
    joinModal.classList.add('active');
    inputQuizCode.focus();
  });

  btnCloseJoin.addEventListener('click', () => {
    joinModal.classList.remove('active');
  });

  btnOpenAdmin.addEventListener('click', () => {
    adminErrorMsg.classList.remove('visible');
    inputAdminPass.value = '';
    adminModal.classList.add('active');
    inputAdminPass.focus();
  });

  btnCloseAdmin.addEventListener('click', () => {
    adminModal.classList.remove('active');
  });

  // Close modals on clicking outside or ESC
  window.addEventListener('click', (e) => {
    if (e.target === joinModal) joinModal.classList.remove('active');
    if (e.target === adminModal) adminModal.classList.remove('active');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      joinModal.classList.remove('active');
      adminModal.classList.remove('active');
    }
  });

  // =========================================================================
  // Participant Join Flow
  // =========================================================================
  function submitJoin() {
    const code = inputQuizCode.value.trim();
    const nickname = inputCadetName.value.trim();

    joinErrorMsg.classList.remove('visible');

    socket.emit('join_quiz', { code, nickname }, (response) => {
      if (!response.success) {
        joinErrorText.textContent = response.error || 'No such quiz exists';
        joinErrorMsg.classList.add('visible');
        return;
      }

      // Success
      myRole = 'cadet';
      myParticipant = response.participant;
      cadetCallsignDisplay.textContent = myParticipant.nickname;
      joinModal.classList.remove('active');

      const gs = response.gameState;
      if (gs.status === 'LOBBY') {
        switchView('waiting');
      } else if (gs.status === 'QUESTION_ACTIVE' && gs.currentQuestion) {
        renderParticipantQuestion(gs.currentQuestion);
        switchView('gameplay');
      } else if (gs.status === 'QUIZ_ENDED') {
        switchView('leaderboard');
      } else {
        switchView('waiting');
      }
    });
  }

  btnSubmitJoin.addEventListener('click', submitJoin);
  inputQuizCode.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitJoin(); });
  inputCadetName.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitJoin(); });

  // =========================================================================
  // Admin Authentication Flow
  // =========================================================================
  function submitAdmin() {
    const passkey = inputAdminPass.value.trim();
    adminErrorMsg.classList.remove('visible');

    socket.emit('admin_auth', { passkey }, (response) => {
      if (!response.success) {
        adminErrorText.textContent = response.error || 'Invalid Admin Passkey';
        adminErrorMsg.classList.add('visible');
        return;
      }

      // Success
      myRole = 'admin';
      adminModal.classList.remove('active');
      switchView('admin');

      updateAdminDeck(response.gameState);
    });
  }

  btnSubmitAdmin.addEventListener('click', submitAdmin);
  inputAdminPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAdmin(); });

  // =========================================================================
  // Participant Gameplay Rendering & Answering
  // =========================================================================
  function renderParticipantQuestion(qData) {
    currentQuestion = qData;
    currentQIndex = qData.index;
    hasAnsweredCurrentQ = false;

    playerQCounter.textContent = `QUESTION ${qData.index + 1} / ${qData.totalQuestions}`;
    playerQuestionText.textContent = qData.question;
    playerTimerNum.textContent = qData.timeLimit || 20;
    playerTimerWidget.classList.remove('urgent');
    if (cosmicFactModal) cosmicFactModal.classList.remove('active');

    // Populate the 4 option cards
    for (let i = 0; i < 4; i++) {
      const optText = document.getElementById(`optText${i}`);
      const optCard = document.getElementById(`optCard${i}`);
      const pollBar = document.getElementById(`pollBar${i}`);
      const pollVotes = document.getElementById(`pollVotes${i}`);
      const pollPct = document.getElementById(`pollPct${i}`);

      if (optText && qData.options[i]) {
        optText.textContent = qData.options[i];
      }

      if (optCard) {
        optCard.classList.remove('selected', 'correct-highlight', 'dimmed', 'locked');
      }

      if (pollBar) pollBar.style.width = '0%';
      if (pollVotes) pollVotes.textContent = '0 votes';
      if (pollPct) pollPct.textContent = '0%';
    }
  }

  // Handle participant option click
  for (let i = 0; i < 4; i++) {
    const optCard = document.getElementById(`optCard${i}`);
    if (optCard) {
      optCard.addEventListener('click', () => {
        if (hasAnsweredCurrentQ || myRole !== 'cadet' || !currentQuestion) return;

        hasAnsweredCurrentQ = true;

        // Visual lock
        for (let j = 0; j < 4; j++) {
          const card = document.getElementById(`optCard${j}`);
          if (card) card.classList.add('locked');
        }
        optCard.classList.add('selected');

        // Submit to server
        socket.emit('submit_answer', {
          questionIndex: currentQIndex,
          optionIndex: i
        }, (res) => {
          if (res && res.success) {
            currentScore = res.totalScore;
            playerScoreBadge.textContent = `SCORE: ${currentScore}`;
          }
        });
      });
    }
  }

  // Update real-time poll display on Participant cards
  function updateParticipantPoll(pollCounts, totalVotes, totalParticipants) {
    for (let i = 0; i < 4; i++) {
      const votes = pollCounts[i] || 0;
      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

      const pollBar = document.getElementById(`pollBar${i}`);
      const pollVotes = document.getElementById(`pollVotes${i}`);
      const pollPct = document.getElementById(`pollPct${i}`);

      if (pollBar) pollBar.style.width = `${pct}%`;
      if (pollVotes) pollVotes.textContent = `${votes} vote${votes === 1 ? '' : 's'}`;
      if (pollPct) pollPct.textContent = `${pct}%`;
    }
  }

  // Reveal correct answer and pop up the cosmic fact modal!
  function handleParticipantReview(reviewData) {
    const correctIdx = reviewData.correctIndex;
    const spaceEmojis = ['☀️', '🌍', '🌙', '🚀'];
    const spaceNames = ['Sun', 'Earth', 'Moon', 'Rocket'];

    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`optCard${i}`);
      if (card) {
        card.classList.add('locked');
        if (i === correctIdx) {
          card.classList.add('correct-highlight');
        } else {
          card.classList.add('dimmed');
        }
      }
    }

    // Pop up the Cosmic Fact Modal with animation
    if (cosmicFactModal) {
      if (factCorrectEmoji) factCorrectEmoji.textContent = spaceEmojis[correctIdx] || '✨';
      const optVal = (currentQuestion && currentQuestion.options[correctIdx]) || '';
      if (factCorrectText) {
        factCorrectText.textContent = `Correct: ${spaceEmojis[correctIdx]} ${spaceNames[correctIdx]} — ${optVal}`;
      }
      if (factDescriptionText) {
        factDescriptionText.textContent = reviewData.explanation || 'Scientific observations logged successfully.';
      }
      cosmicFactModal.classList.add('active');
    }
  }

  // =========================================================================
  // Admin Mission Control Deck Functions
  // =========================================================================
  function updateAdminDeck(gs) {
    if (!gs) return;

    // Headcount
    adminCadetCount.textContent = gs.participantCount || 0;
    adminRosterHeaderCount.textContent = `${gs.participantCount || 0} Cadets`;

    // Start button enabled only if >= 1 participant
    const canStart = (gs.participantCount || 0) >= 1;
    btnAdminStartQuiz.disabled = !canStart;
    btnAdminStartQuiz.title = canStart ? 'Launch Quiz' : 'Waiting for at least 1 participant to join...';

    // State management
    if (gs.status === 'LOBBY') {
      adminQIndex.textContent = 'Lobby';
      adminCurrentQTitle.textContent = 'Mission ready. Waiting for flight launch...';
      btnAdminStartQuiz.style.display = 'inline-flex';
      btnAdminRevealAnswer.style.display = 'none';
      btnAdminNextQuestion.style.display = 'none';
      btnAdminEndQuiz.style.display = 'none';
      btnAdminResetQuiz.style.display = 'none';
      adminVotesRecorded.textContent = '0 / 0';
      adminTimerDisplay.textContent = '--';
    } else if (gs.status === 'QUESTION_ACTIVE') {
      adminQIndex.textContent = `${(gs.currentQuestionIndex || 0) + 1} / ${gs.totalQuestions || 10}`;
      if (gs.currentQuestion) {
        adminCurrentQTitle.textContent = `Q${(gs.currentQuestionIndex || 0) + 1}: ${gs.currentQuestion.question}`;
        updateAdminOptionLabels(gs.currentQuestion.options);
      }
      btnAdminStartQuiz.style.display = 'none';
      btnAdminRevealAnswer.style.display = 'inline-flex';
      btnAdminNextQuestion.style.display = 'none';
      btnAdminEndQuiz.style.display = 'inline-flex';
      btnAdminResetQuiz.style.display = 'none';
      updateAdminPollChart(gs.pollCounts || {}, gs.totalVotes || 0, gs.participantCount || 0);
    } else if (gs.status === 'QUESTION_REVIEW') {
      adminQIndex.textContent = `Review Q${(gs.currentQuestionIndex || 0) + 1}`;
      btnAdminStartQuiz.style.display = 'none';
      btnAdminRevealAnswer.style.display = 'none';
      btnAdminNextQuestion.style.display = 'inline-flex';
      btnAdminEndQuiz.style.display = 'inline-flex';
      btnAdminResetQuiz.style.display = 'none';
    } else if (gs.status === 'QUIZ_ENDED') {
      adminQIndex.textContent = 'Completed';
      adminCurrentQTitle.textContent = 'Mission completed. Telemetry finalized.';
      btnAdminStartQuiz.style.display = 'none';
      btnAdminRevealAnswer.style.display = 'none';
      btnAdminNextQuestion.style.display = 'none';
      btnAdminEndQuiz.style.display = 'none';
      btnAdminResetQuiz.style.display = 'inline-flex';
    }

    renderAdminRoster(gs.participants || []);
  }

  function updateAdminOptionLabels(options) {
    if (!options) return;
    const prefixes = ['☀️ Sun', '🌍 Earth', '🌙 Moon', '🚀 Rocket'];
    for (let i = 0; i < 4; i++) {
      const lbl = document.getElementById(`adminOptLabel${i}`);
      if (lbl && options[i]) {
        lbl.textContent = `${prefixes[i]}: ${options[i]}`;
      }
    }
  }

  function updateAdminPollChart(pollCounts, totalVotes, totalParticipants) {
    adminVotesRecorded.textContent = `${totalVotes} / ${totalParticipants}`;
    const pctAnswered = totalParticipants > 0 ? Math.round((totalVotes / totalParticipants) * 100) : 0;
    adminTotalVotesPct.textContent = `${pctAnswered}% Answered`;

    for (let i = 0; i < 4; i++) {
      const votes = pollCounts[i] || 0;
      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

      const fill = document.getElementById(`adminBarFill${i}`);
      const val = document.getElementById(`adminBarVal${i}`);

      if (fill) fill.style.width = `${pct}%`;
      if (val) val.textContent = `${votes} vote${votes === 1 ? '' : 's'} (${pct}%)`;
    }
  }

  function renderAdminRoster(participants) {
    adminRosterContainer.innerHTML = '';
    if (!participants || participants.length === 0) {
      adminRosterContainer.innerHTML = '<div style="color: var(--text-dim); padding: 10px; font-size: 13px;">No cadets currently in bay.</div>';
      return;
    }

    participants.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'roster-row';

      const isAnswered = p.hasAnswered;
      const badgeClass = isAnswered ? 'answered' : 'thinking';
      const badgeText = isAnswered ? '✓ Voted' : '⏳ Thinking';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-cyan);">🧑‍🚀</span>
          <strong>${p.nickname}</strong>
          <span style="font-family: var(--font-mono); color: var(--accent-gold); font-size: 12px;">(${p.score} pts)</span>
        </div>
        <span class="roster-status-badge ${badgeClass}">${badgeText}</span>
      `;
      adminRosterContainer.appendChild(row);
    });
  }

  // Admin Button Actions
  btnAdminStartQuiz.addEventListener('click', () => {
    socket.emit('admin_start_quiz', (res) => {
      if (!res.success) {
        alert(res.error || 'Cannot start quiz');
      }
    });
  });

  btnAdminRevealAnswer.addEventListener('click', () => {
    socket.emit('admin_reveal_answer');
  });

  btnAdminNextQuestion.addEventListener('click', () => {
    socket.emit('admin_next_question');
  });

  btnAdminEndQuiz.addEventListener('click', () => {
    if (confirm('Are you sure you want to conclude the quiz mission early?')) {
      socket.emit('admin_end_quiz');
    }
  });

  btnAdminResetQuiz.addEventListener('click', () => {
    socket.emit('admin_reset_quiz');
  });

  // =========================================================================
  // Leaderboard & Podium Rendering
  // =========================================================================
  function renderLeaderboard(leaderboard) {
    switchView('leaderboard');

    // Reset podium text
    podiumName1.textContent = '--';
    podiumScore1.textContent = '-- pts';
    podiumName2.textContent = '--';
    podiumScore2.textContent = '-- pts';
    podiumName3.textContent = '--';
    podiumScore3.textContent = '-- pts';

    if (leaderboard && leaderboard.length > 0) {
      if (leaderboard[0]) {
        podiumName1.textContent = leaderboard[0].nickname;
        podiumScore1.textContent = `${leaderboard[0].score} pts`;
      }
      if (leaderboard[1]) {
        podiumName2.textContent = leaderboard[1].nickname;
        podiumScore2.textContent = `${leaderboard[1].score} pts`;
      }
      if (leaderboard[2]) {
        podiumName3.textContent = leaderboard[2].nickname;
        podiumScore3.textContent = `${leaderboard[2].score} pts`;
      }
    }

    // Full table
    leaderboardListContainer.innerHTML = '';
    if (!leaderboard || leaderboard.length === 0) {
      leaderboardListContainer.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 12px;">No participants recorded.</div>';
      return;
    }

    leaderboard.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      const isMe = myParticipant && myParticipant.id === p.id;
      if (isMe) {
        row.style.border = '1px solid var(--accent-cyan)';
        row.style.background = 'rgba(0, 229, 255, 0.15)';
      }

      row.innerHTML = `
        <div style="display: flex; align-items: center;">
          <span class="leaderboard-rank">#${idx + 1}</span>
          <span class="leaderboard-name">${p.nickname} ${isMe ? '⭐ (You)' : ''}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 12px; color: var(--text-dim);">${p.correctCount || 0} correct</span>
          <span class="leaderboard-score">${p.score} pts</span>
        </div>
      `;
      leaderboardListContainer.appendChild(row);
    });
  }

  btnLeaderboardReturn.addEventListener('click', () => {
    switchView('home');
  });

  // =========================================================================
  // Socket.IO Incoming Events
  // =========================================================================

  // 1. Participant roster update
  socket.on('participants_updated', ({ count, participants }) => {
    // Waiting room badge list
    waitingCadetsList.innerHTML = '';
    participants.forEach((p) => {
      const chip = document.createElement('div');
      chip.className = 'cadet-chip';
      chip.innerHTML = `<span class="cadet-avatar">🧑‍🚀</span><span>${p.nickname}</span>`;
      waitingCadetsList.appendChild(chip);
    });

    // Admin updates
    if (myRole === 'admin') {
      adminCadetCount.textContent = count;
      adminRosterHeaderCount.textContent = `${count} Cadets`;
      btnAdminStartQuiz.disabled = count < 1;
      btnAdminStartQuiz.title = count >= 1 ? 'Launch Quiz' : 'Waiting for at least 1 participant to join...';
      renderAdminRoster(participants);
    }
  });

  // 2. Question Started
  socket.on('question_started', ({ question, pollCounts, totalParticipants }) => {
    // Automatically close any popping cosmic fact modal when next question launches
    if (cosmicFactModal) {
      cosmicFactModal.classList.remove('active');
    }

    if (myRole === 'cadet') {
      renderParticipantQuestion(question);
      switchView('gameplay');
      updateParticipantPoll(pollCounts, 0, totalParticipants);
    } else if (myRole === 'admin') {
      adminQIndex.textContent = `${question.index + 1} / ${question.totalQuestions}`;
      adminCurrentQTitle.textContent = `Q${question.index + 1}: ${question.question}`;
      updateAdminOptionLabels(question.options);
      btnAdminRevealAnswer.style.display = 'inline-flex';
      btnAdminNextQuestion.style.display = 'none';
      btnAdminEndQuiz.style.display = 'inline-flex';
      updateAdminPollChart(pollCounts, 0, totalParticipants);
    }
  });

  // 3. Timer Tick
  socket.on('timer_tick', ({ timeRemaining, timeLimit }) => {
    if (myRole === 'cadet') {
      playerTimerNum.textContent = timeRemaining;
      if (timeRemaining <= 5) {
        playerTimerWidget.classList.add('urgent');
      } else {
        playerTimerWidget.classList.remove('urgent');
      }
    } else if (myRole === 'admin') {
      adminTimerDisplay.textContent = `${timeRemaining}s`;
    }
  });

  // 4. Live Poll Updated (Broadcasted instantly without page refresh!)
  socket.on('live_poll_updated', ({ pollCounts, totalVotes, totalParticipants }) => {
    if (myRole === 'cadet') {
      updateParticipantPoll(pollCounts, totalVotes, totalParticipants);
    } else if (myRole === 'admin') {
      updateAdminPollChart(pollCounts, totalVotes, totalParticipants);
    }
  });

  // 5. Participant Answered Notification for Admin
  socket.on('participant_answered', ({ participantId, totalVotes, totalParticipants }) => {
    if (myRole === 'admin') {
      adminVotesRecorded.textContent = `${totalVotes} / ${totalParticipants}`;
      // Refresh roster badge state
      socket.emit('admin_auth', { passkey: 'DNOVA' }, (res) => {
        if (res.success) {
          renderAdminRoster(res.gameState.participants);
        }
      });
    }
  });

  // 6. Question Review
  socket.on('question_review', (reviewData) => {
    if (myRole === 'cadet') {
      handleParticipantReview(reviewData);
    } else if (myRole === 'admin') {
      btnAdminRevealAnswer.style.display = 'none';
      btnAdminNextQuestion.style.display = 'inline-flex';
      adminCurrentQTitle.textContent += ` [CORRECT: ${String.fromCharCode(65 + reviewData.correctIndex)}]`;
    }
  });

  // 7. Quiz Ended
  socket.on('quiz_ended', ({ leaderboard, totalQuestions }) => {
    renderLeaderboard(leaderboard);
  });

  // 8. Quiz Reset to Lobby
  socket.on('quiz_reset_to_lobby', ({ participants }) => {
    currentScore = 0;
    hasAnsweredCurrentQ = false;
    currentQuestion = null;
    playerScoreBadge.textContent = 'SCORE: 0';
    if (myRole === 'cadet') {
      switchView('waiting');
    } else if (myRole === 'admin') {
      switchView('admin');
      adminQIndex.textContent = 'Lobby';
      adminCurrentQTitle.textContent = 'Mission reset to lobby. Ready to launch.';
      btnAdminStartQuiz.style.display = 'inline-flex';
      btnAdminRevealAnswer.style.display = 'none';
      btnAdminNextQuestion.style.display = 'none';
      btnAdminEndQuiz.style.display = 'none';
      btnAdminResetQuiz.style.display = 'none';
      renderAdminRoster(participants);
    }
  });
});

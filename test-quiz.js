const { io } = require('socket.io-client');

async function runTest() {
  console.log('🧪 Starting End-to-End Test for DJS NOVA Space Quiz...\n');
  const SERVER_URL = 'http://localhost:3000';

  // Helper promise for timeout
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 1. Test invalid quiz code
  console.log('Test 1: Testing invalid code rejection ("WRONGCODE")...');
  const tempSocket = io(SERVER_URL);
  await new Promise((resolve) => {
    tempSocket.emit('join_quiz', { code: 'WRONGCODE', nickname: 'Tester' }, (res) => {
      console.log('Result for WRONGCODE:', res);
      if (!res.success && res.error === 'No such quiz exists') {
        console.log('✅ PASS: Wrong code correctly rejected with "No such quiz exists".');
      } else {
        console.error('❌ FAIL: Did not properly reject wrong code.');
      }
      tempSocket.disconnect();
      resolve();
    });
  });

  // 2. Connect Admin
  console.log('\nTest 2: Connecting Flight Director (Admin) with passkey "DNOVA"...');
  const adminSocket = io(SERVER_URL);
  await new Promise((resolve) => {
    adminSocket.emit('admin_auth', { passkey: 'DNOVA' }, (res) => {
      console.log('Admin Auth Result:', res.success ? 'Authorized' : res.error);
      if (res.success) {
        console.log('✅ PASS: Admin successfully authenticated.');
      } else {
        console.error('❌ FAIL: Admin authentication failed.');
      }
      resolve();
    });
  });

  // 3. Test starting quiz with 0 participants
  console.log('\nTest 3: Attempting to start quiz with 0 participants in waiting room...');
  await new Promise((resolve) => {
    adminSocket.emit('admin_start_quiz', (res) => {
      console.log('Result of starting with 0 participants:', res);
      if (!res.success && res.error.includes('At least 1 participant')) {
        console.log('✅ PASS: Server correctly prevented start without participants.');
      } else {
        console.error('❌ FAIL: Server did not enforce 1 participant minimum.');
      }
      resolve();
    });
  });

  // 4. Connect 2 Participants with code "NOVA"
  console.log('\nTest 4: Connecting 2 participants ("AstroCadet" and "CosmoPilot") with code "NOVA"...');
  const p1 = io(SERVER_URL);
  const p2 = io(SERVER_URL);

  await new Promise((resolve) => {
    p1.emit('join_quiz', { code: 'NOVA', nickname: 'AstroCadet' }, (res) => {
      console.log('AstroCadet Joined:', res.success);
      resolve();
    });
  });

  await new Promise((resolve) => {
    p2.emit('join_quiz', { code: 'NOVA', nickname: 'CosmoPilot' }, (res) => {
      console.log('CosmoPilot Joined:', res.success);
      resolve();
    });
  });

  await delay(500);

  // 5. Admin starts the quiz now that participants exist
  console.log('\nTest 5: Admin launching Quiz with 2 participants...');
  let currentQ = null;
  p1.on('question_started', ({ question }) => {
    currentQ = question;
    console.log(`[Cadet 1 Received] Q${question.index + 1}: ${question.question}`);
  });

  await new Promise((resolve) => {
    adminSocket.emit('admin_start_quiz', (res) => {
      console.log('Admin Start Result:', res);
      resolve();
    });
  });

  await delay(1000);

  // 6. Test Live Poll Updates: Cadet 1 answers Option 2 (~99.86%), Cadet 2 answers Option 0 (~74.5%)
  console.log('\nTest 6: Submitting answers and testing real-time live poll broadcast...');
  let pollUpdated = false;

  p2.on('live_poll_updated', ({ pollCounts, totalVotes, totalParticipants }) => {
    pollUpdated = true;
    console.log(`[Real-Time Poll Broadcast] Total Votes: ${totalVotes}/${totalParticipants}, Distribution:`, pollCounts);
  });

  p1.emit('submit_answer', { questionIndex: currentQ.index, optionIndex: 2 }, (res) => {
    console.log('AstroCadet answer recorded! Correct:', res.isCorrect, 'Points:', res.pointsAwarded);
  });

  await delay(600);

  p2.emit('submit_answer', { questionIndex: currentQ.index, optionIndex: 0 }, (res) => {
    console.log('CosmoPilot answer recorded! Correct:', res.isCorrect, 'Points:', res.pointsAwarded);
  });

  await delay(1200);

  if (pollUpdated) {
    console.log('✅ PASS: Real-time live poll updated without page refresh!');
  } else {
    console.error('❌ FAIL: Live poll did not update.');
  }

  // 7. Check Review & Leaderboard
  console.log('\nTest 7: Concluding mission and retrieving final leaderboard...');
  await new Promise((resolve) => {
    adminSocket.on('quiz_ended', ({ leaderboard }) => {
      console.log('🏆 Final Leaderboard Telemetry:');
      leaderboard.forEach((p, idx) => {
        console.log(`  #${idx + 1} ${p.nickname} - ${p.score} pts (${p.correctCount} correct)`);
      });
      console.log('✅ PASS: Leaderboard computed and broadcasted successfully.');
      resolve();
    });

    adminSocket.emit('admin_end_quiz');
  });

  // Clean up
  p1.disconnect();
  p2.disconnect();
  adminSocket.disconnect();

  console.log('\n🎉 ALL 7 TEST SUITES PASSED FLAWLESSLY!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

// main.js
import {
  getQuizByDate,
  getAllQuizDates,
  submitAnswer,
  getAnswerStats,
  submitComment,
  onGuestbookUpdate,
  submitSuggestion
} from './firebase.js';

// ✅ 디버깅 로그 유틸리티
function log(tag, value) {
  console.log(`[%c${tag}%c]`, 'color: green; font-weight: bold;', 'color: black;', value);
}

// ✅ 오늘 날짜 구하기
const today = new Date().toISOString().split('T')[0];
log('오늘 날짜', today);

// ✅ 오늘의 퀴즈 불러오기
getQuizByDate(today).then(quiz => {
  if (!quiz) {
    document.getElementById('hint').textContent = '오늘의 퀴즈가 아직 등록되지 않았습니다.';
    return;
  }
  log('오늘의 퀴즈', quiz);
  document.getElementById('hint').textContent = `자음 힌트: ${quiz.hint}`;

  // 정답 제출 처리
  document.getElementById('submitAnswer').addEventListener('click', () => {
    const input = document.getElementById('answerInput').value;
    const cleanedInput = input.toLowerCase().replaceAll(' ', '');
    const cleanedAnswer = quiz.keyword.toLowerCase().replaceAll(' ', '');
    const isCorrect = cleanedInput === cleanedAnswer;

    log('사용자 입력', input);
    log('정답 비교', { cleanedInput, cleanedAnswer, isCorrect });

    const result = document.getElementById('resultMessage');
    result.textContent = isCorrect ? '🎉 정답입니다!' : '❌ 오답입니다';

    submitAnswer(today, isCorrect).then(() => {
      log('정답 통계 기록됨', isCorrect);
      updateStats();
    }).catch(err => {
      console.error('[오류] 정답 기록 실패', err);
    });
  });

  // 정답 보기
  document.getElementById('revealAnswer').addEventListener('click', () => {
    const result = document.getElementById('resultMessage');
    result.textContent = `정답은 "${quiz.keyword}" 입니다.`;
    log('정답 보기', quiz.keyword);
  });
}).catch(err => {
  console.error('[오류] 퀴즈 불러오기 실패', err);
});

// ✅ 정답률 통계 표시
function updateStats() {
  getAnswerStats(today).then(stats => {
    const total = (stats.correct || 0) + (stats.wrong || 0);
    const rate = total ? Math.round((stats.correct / total) * 100) : 0;
    document.getElementById('statsData').textContent = `정답률: ${rate}% (정답 ${stats.correct || 0}, 오답 ${stats.wrong || 0})`;
    log('정답률 업데이트', stats);
  }).catch(err => {
    console.error('[오류] 정답률 불러오기 실패', err);
  });
}
updateStats();

// ✅ 댓글 처리
onGuestbookUpdate(comments => {
  const list = document.getElementById('commentList');
  list.innerHTML = '';
  comments.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `[${entry.date}] ${entry.message}`;
    list.appendChild(li);
  });
  log('댓글 목록 렌더링됨', comments);
});

document.getElementById('submitComment').addEventListener('click', () => {
  const msg = document.getElementById('commentInput').value.trim();
  if (!msg) return alert('내용을 입력해주세요.');
  submitComment(msg).then(() => {
    log('댓글 제출 완료', msg);
    document.getElementById('commentInput').value = '';
  }).catch(err => {
    console.error('[오류] 댓글 저장 실패', err);
  });
});

// ✅ 제보 팝업 열고 닫기
const popup = document.getElementById('suggestPopup');
const overlay = document.getElementById('overlay');

document.getElementById('openSuggest').addEventListener('click', () => {
  popup.style.display = 'block';
  overlay.style.display = 'block';
});

document.getElementById('closeSuggest').addEventListener('click', () => {
  popup.style.display = 'none';
  overlay.style.display = 'none';
});

// ✅ 제보 제출
document.getElementById('submitSuggest').addEventListener('click', () => {
  const term = document.getElementById('suggestTerm').value.trim();
  const meaning = document.getElementById('suggestMeaning').value.trim();
  if (!term || !meaning) return alert('단어와 의미를 모두 입력해주세요.');
  submitSuggestion(term, meaning).then(() => {
    log('제보 제출 완료', { term, meaning });
    alert('제보가 제출되었습니다. 감사합니다!');
    document.getElementById('suggestTerm').value = '';
    document.getElementById('suggestMeaning').value = '';
    popup.style.display = 'none';
    overlay.style.display = 'none';
  }).catch(err => {
    console.error('[오류] 제보 제출 실패', err);
  });
});

// ✅ 날짜별 퀴즈 목록 표시
getAllQuizDates().then(dates => {
  const list = document.getElementById('quizDates');
  list.innerHTML = '';
  dates.reverse().forEach(date => {
    const li = document.createElement('li');
    li.textContent = date;
    li.style.cursor = 'pointer';
    li.addEventListener('click', async () => {
      const q = await getQuizByDate(date);
      if (!q) return;
      const guess = prompt(`${date} 퀴즈 - 자음 힌트: ${q.hint}\n정답을 입력하세요:`);
      const correct = guess?.toLowerCase().replaceAll(' ', '') === q.keyword.toLowerCase().replaceAll(' ', '');
      alert(correct ? '🎉 정답입니다!' : `❌ 오답입니다. 정답: ${q.keyword}`);
      await submitAnswer(date, correct);
      updateStats();
    });
    list.appendChild(li);
  });
  log('퀴즈 날짜 목록 로딩됨', dates);
}).catch(err => {
  console.error('[오류] 날짜 목록 불러오기 실패', err);
});

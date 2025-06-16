// main.js (리팩토링 버전)
import {
  getQuizByDate,
  getAllQuizDates,
  submitAnswer,
  getAnswerStats,
  submitComment,
  onGuestbookUpdate,
  submitSuggestion
} from './firebase.js';

function log(tag, value) {
  console.log(`[%c${tag}%c]`, 'color: green; font-weight: bold;', 'color: black;', value);
}

const today = new Date().toISOString().split('T')[0];
log('오늘 날짜', today);

// 🔎 DOM 요소 캐싱
const hintEl = document.getElementById('quizHint');
const meaningEl = document.getElementById('quizMeaning');
const inputEl = document.getElementById('answerInput');
const resultEl = document.getElementById('answerResult');
const statsEl = document.getElementById('stats');
const commentInput = document.getElementById('commentInput');
const commentList = document.getElementById('guestbookList');

// ✅ 오늘의 퀴즈 불러오기
getQuizByDate(today).then(quiz => {
  if (!quiz) {
    hintEl.textContent = '오늘의 퀴즈가 아직 등록되지 않았습니다.';
    meaningEl.textContent = '';
    return;
  }
  log('오늘의 퀴즈', quiz);
  hintEl.textContent = quiz.hint;
  meaningEl.textContent = quiz.meaning;

  document.getElementById('submitAnswerBtn')?.addEventListener('click', () => {
    const cleanedInput = inputEl.value.toLowerCase().replaceAll(' ', '');
    const cleanedAnswer = quiz.keyword.toLowerCase().replaceAll(' ', '');
    const isCorrect = cleanedInput === cleanedAnswer;

    resultEl.textContent = isCorrect ? '🎉 정답입니다!' : '❌ 오답입니다';
    submitAnswer(today, isCorrect).then(() => {
      log('정답 통계 기록됨', isCorrect);
      updateStats();
    }).catch(err => console.error('[오류] 정답 기록 실패', err));
  });

  document.getElementById('showAnswerBtn')?.addEventListener('click', () => {
    resultEl.textContent = `정답은 "${quiz.keyword}" 입니다.`;
    log('정답 보기', quiz.keyword);
  });

}).catch(err => console.error('[오류] 퀴즈 불러오기 실패', err));

function updateStats() {
  getAnswerStats(today).then(stats => {
    const total = (stats.correct || 0) + (stats.wrong || 0);
    const rate = total ? Math.round((stats.correct / total) * 100) : 0;
    statsEl.textContent = `정답률: ${rate}% (정답 ${stats.correct || 0}, 오답 ${stats.wrong || 0})`;
    log('정답률 업데이트', stats);
  }).catch(err => console.error('[오류] 정답률 불러오기 실패', err));
}
updateStats();

// ✅ 댓글 처리
onGuestbookUpdate(comments => {
  commentList.innerHTML = '';
  comments.forEach(entry => {
    const li = document.createElement('div');
    li.className = 'comment';
    li.textContent = `[${entry.date}] ${entry.message}`;
    commentList.appendChild(li);
  });
  log('댓글 목록 렌더링됨', comments);
});

document.getElementById('submitComment')?.addEventListener('click', () => {
  const msg = commentInput.value.trim();
  if (!msg) return alert('내용을 입력해주세요.');
  submitComment(msg).then(() => {
    log('댓글 제출 완료', msg);
    commentInput.value = '';
  }).catch(err => console.error('[오류] 댓글 저장 실패', err));
});

// ✅ 제보 팝업
const popup = document.getElementById('suggestPopup');

document.getElementById('openSuggest')?.addEventListener('click', () => {
  popup.style.display = 'block';
});

document.getElementById('closeSuggest')?.addEventListener('click', () => {
  popup.style.display = 'none';
});

// ✅ 제보 제출
const termEl = document.getElementById('suggestTerm');
const meaningEl2 = document.getElementById('suggestMeaning');

document.getElementById('submitSuggest')?.addEventListener('click', () => {
  const term = termEl.value.trim();
  const meaning = meaningEl2.value.trim();
  if (!term || !meaning) return alert('단어와 의미를 모두 입력해주세요.');
  submitSuggestion(term, meaning).then(() => {
    alert('제보가 제출되었습니다. 감사합니다!');
    termEl.value = '';
    meaningEl2.value = '';
    popup.style.display = 'none';
  }).catch(err => console.error('[오류] 제보 제출 실패', err));
});

// ✅ 날짜별 퀴즈 목록 불러오기 (미래 제외)
const list = document.getElementById('quizDates');
getAllQuizDates().then(dates => {
  const todayStr = new Date().toISOString().split('T')[0];
  const validDates = dates.filter(date => date <= todayStr);
  list.innerHTML = '';
  validDates.reverse().forEach(date => {
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
  log('날짜별 퀴즈 목록 로딩됨', validDates);
}).catch(err => console.error('[오류] 날짜 목록 불러오기 실패', err));

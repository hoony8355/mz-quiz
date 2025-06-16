// main.js (최종 리팩토링 버전)
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

// DOM 요소 캐싱
const hintEl = document.getElementById('quizHint');
const meaningEl = document.getElementById('quizMeaning');
const inputEl = document.getElementById('answerInput');
const resultEl = document.getElementById('answerResult');
const statsEl = document.getElementById('stats');
const commentInput = document.getElementById('commentInput');
const commentList = document.getElementById('guestbookList');
const popup = document.getElementById('suggestPopup');
const overlay = document.getElementById('overlay');
const termEl = document.getElementById('suggestTerm');
const meaningEl2 = document.getElementById('suggestMeaning');
const dateSelector = document.getElementById('quizDateSelector');

// 오늘의 퀴즈 불러오기
export function loadTodayQuiz() {
  getQuizByDate(today).then(quiz => {
    if (!quiz) {
      hintEl.textContent = '오늘의 퀴즈가 아직 등록되지 않았습니다.';
      meaningEl.textContent = '';
      return;
    }
    log('오늘의 퀴즈', quiz);
    hintEl.textContent = quiz.hint;
    meaningEl.textContent = quiz.meaning;

    document.getElementById('submitAnswerBtn')?.onclick = () => {
      const cleanedInput = inputEl.value.toLowerCase().replaceAll(' ', '');
      const cleanedAnswer = quiz.keyword.toLowerCase().replaceAll(' ', '');
      const isCorrect = cleanedInput === cleanedAnswer;
      resultEl.textContent = isCorrect ? '🎉 정답입니다!' : '❌ 오답입니다';
      submitAnswer(today, isCorrect).then(updateStats);
    };

    document.getElementById('showAnswerBtn')?.onclick = () => {
      resultEl.textContent = `정답은 "${quiz.keyword}" 입니다.`;
    };
  });
}

function updateStats() {
  getAnswerStats(today).then(stats => {
    const total = (stats.correct || 0) + (stats.wrong || 0);
    const rate = total ? Math.round((stats.correct / total) * 100) : 0;
    statsEl.textContent = `정답률: ${rate}% (정답 ${stats.correct || 0}, 오답 ${stats.wrong || 0})`;
  });
}

// 날짜별 퀴즈 목록 불러오기
export function showDateSelector() {
  getAllQuizDates().then(dates => {
    const todayStr = new Date().toISOString().split('T')[0];
    const validDates = dates.filter(date => date <= todayStr);
    dateSelector.innerHTML = '';
    validDates.reverse().forEach(date => {
      const option = document.createElement('option');
      option.value = date;
      option.textContent = date;
      dateSelector.appendChild(option);
    });
    document.getElementById('dateSelectorSection').style.display = 'block';
  });
}

document.getElementById('loadSelectedDateBtn')?.addEventListener('click', async () => {
  const selected = dateSelector.value;
  const q = await getQuizByDate(selected);
  if (!q) return alert('해당 날짜의 퀴즈가 없습니다.');
  const guess = prompt(`${selected} 퀴즈 - 자음 힌트: ${q.hint}\n정답을 입력하세요:`);
  const correct = guess?.toLowerCase().replaceAll(' ', '') === q.keyword.toLowerCase().replaceAll(' ', '');
  alert(correct ? '🎉 정답입니다!' : `❌ 오답입니다. 정답: ${q.keyword}`);
  await submitAnswer(selected, correct);
  updateStats();
});

// 댓글 처리
onGuestbookUpdate(comments => {
  commentList.innerHTML = '';
  comments.forEach(entry => {
    const li = document.createElement('div');
    li.className = 'comment';
    li.textContent = `[${entry.date}] ${entry.message}`;
    commentList.appendChild(li);
  });
});

document.getElementById('submitComment')?.addEventListener('click', () => {
  const msg = commentInput.value.trim();
  if (!msg) return alert('내용을 입력해주세요.');
  submitComment(msg).then(() => {
    commentInput.value = '';
  });
});

// 제보 팝업 제어
window.toggleSuggestPopup = () => {
  const visible = popup.style.display === 'block';
  popup.style.display = visible ? 'none' : 'block';
  overlay.style.display = visible ? 'none' : 'block';
};

document.getElementById('submitSuggest')?.addEventListener('click', () => {
  const term = termEl.value.trim();
  const meaning = meaningEl2.value.trim();
  if (!term || !meaning) return alert('단어와 의미를 모두 입력해주세요.');
  submitSuggestion(term, meaning).then(() => {
    alert('제보가 제출되었습니다. 감사합니다!');
    termEl.value = '';
    meaningEl2.value = '';
    toggleSuggestPopup();
  });
});

// 초기 로드
loadTodayQuiz();
updateStats();

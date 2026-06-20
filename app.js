/* =====================================================================
   귀화시험 종합평가 연습 앱  (순수 정적 PWA · 한국어/중국어 지원)
   - 동기화: questions.json 을 받아 localStorage 에 저장
   - 오프라인: 마지막으로 받은 문제(캐시)로 동작
   - 언어: 한국어(ko) / 중국어(zh). zh 모드에서는 한국어 + 중국어를 함께 표시
   ===================================================================== */

'use strict';

/* ---------- 저장소 키 ---------- */
const K = {
  bank: 'nq_bank', meta: 'nq_meta', wrong: 'nq_wrong',
  stats: 'nq_stats', history: 'nq_history', drafts: 'nq_drafts', lang: 'nq_lang',
  mockSave: 'nq_mocksave', practiceSave: 'nq_practicesave', exam: 'nq_exam',
};

/* ---------- 최소 내장 예비 문제 (네트워크/캐시 모두 없을 때만) ---------- */
const FALLBACK = {
  version: '내장본',
  questions: [
    { id: 'fb1', category: '사회', type: 'mc', q: '대한민국의 국기 이름은?', q_zh: '大韩民国国旗的名称是？', choices: ['일장기', '태극기', '성조기', '오성홍기'], choices_zh: ['日章旗', '太极旗', '星条旗', '五星红旗'], answer: 1, explanation: '대한민국의 국기는 태극기입니다.', explanation_zh: '韩国国旗是太极旗。' },
    { id: 'fb2', category: '역사', type: 'mc', q: '한글을 만든 조선의 왕은?', q_zh: '创制韩文的朝鲜国王是？', choices: ['태조', '세종대왕', '정조', '영조'], choices_zh: ['太祖', '世宗大王', '正祖', '英祖'], answer: 1, explanation: '세종대왕이 훈민정음을 창제했습니다.', explanation_zh: '世宗大王创制了训民正音。' },
  ],
};

/* ---------- 다국어 사전 ---------- */
let LANG = 'ko';
const CAT_ZH = {
  '한국어': '韩国语', '사회': '社会', '문화': '文化', '정치': '政治', '경제': '经济', '법': '法律', '역사': '历史', '지리': '地理', '작문': '写作', '구술': '口试',
  /* 사전평가 전용 영역 */
  '어휘': '词汇', '문법': '语法', '읽기·이해': '阅读理解', '대화': '对话', '한국문화': '韩国文化', '한국사회': '韩国社会',
};
const I18N = {
  ko: {
    'app.title': '귀화시험 연습', 'app.sync': '동기화',
    'home.mock.t': '모의고사 보기', 'home.mock.s': '실제 시험처럼 풀기',
    'home.practice.t': '영역별 연습', 'home.practice.s': '8개 영역별로 풀기',
    'home.writing.t': '작문·구술 연습', 'home.writing.s': '주제별 말하기·쓰기',
    'home.wrong.t': '오답 노트', 'home.stats.t': '학습 통계', 'home.stats.s': '정답률·기록 보기',
    'practice.title': '영역별 연습', 'practice.desc': '한 문제씩 풀고 바로 정답·해설을 확인합니다.', 'practice.all': '🎲 전체 무작위',
    'exam.org': '사회통합프로그램 (KIIP)', 'exam.title': '귀화용 종합평가', 'exam.subtitle': '필기시험 모의고사',
    'exam.name': '성 명', 'exam.namePh': '이름 입력', 'exam.no': '수험번호', 'exam.noticeTitle': '유의사항',
    'exam.n1': '귀화용 종합평가는 <b>객관식 36문항(65점) + 작문형(10점) + 구술(25점) = 100점</b>, <b>60점 이상이면 합격</b>입니다.',
    'exam.n2': '이 모의고사는 <b>필기(객관식+작문)를 60분 안에</b> 풀고, 이어서 <b>구술 문항</b>까지 연습합니다.',
    'exam.n3': '객관식은 ①②③④ 중 하나를 고르고, 작문은 <b>200자 이내</b>로 작성합니다.',
    'exam.n4': '객관식만 자동 채점되며, 작문·구술은 모범답안·도움말로 스스로 점검합니다.',
    'exam.n5': '실제 시험의 구술은 별도 10분 세션입니다. 사회통합프로그램 5단계 수료 + 합격 시 <b>귀화 면접심사 면제</b>가 가능합니다.',
    'common.cancel': '취소', 'common.home': '홈으로', 'exam.start': '시험 시작',
    'quiz.prev': '← 이전', 'quiz.next': '다음 →', 'quiz.result': '결과 보기', 'quiz.submit': '제출하고 채점',
    'writing.title': '작문·구술 연습', 'seg.writing': '✍️ 작문', 'seg.oral': '🗣️ 구술',
    'result.title': '채점 결과', 'result.unit': '점', 'result.reviewHead': '문제 다시보기', 'result.retryWrong': '틀린 문제만 다시 풀기',
    'wrong.title': '오답 노트', 'wrong.desc': '틀렸던 문제들이 모입니다. 맞히면 목록에서 사라집니다.', 'wrong.start': '오답 문제 풀기', 'wrong.clear': '오답노트 비우기',
    'stats.title': '학습 통계', 'stats.recentHead': '최근 모의고사 기록', 'stats.reset': '통계 초기화', 'writeCount.suffix': ' / 200자',
    'sync.ready': '준비 완료 · 총 {0}문항 (객관식 {1})', 'sync.never': '동기화를 누르면 최신 문제를 받아옵니다.',
    'sync.offline': '오프라인 — 마지막 동기화한 {0}문항으로 진행', 'sync.first': '아직 문제를 받지 못했습니다. 인터넷 연결 후 동기화를 눌러주세요.',
    'sync.synced': '최신 문제로 동기화됨 · 총 {0}문항',
    'toast.syncing': '최신 문제를 받는 중…', 'toast.syncDone': '동기화 완료! 총 {0}문항', 'toast.offline': '인터넷 연결을 확인하세요. 저장된 문제로 계속할 수 있어요.', 'toast.syncFail': '문제를 받지 못했습니다.',
    'bankInfo': '문제집 버전: {0} · 객관식 {1}문항 · 마지막 동기화: {2}', 'noSync': '없음',
    'credit.html': '<span class="cred-name">Seunghoon Choi<span class="cred-title"> · Bellunix 대표</span></span><span class="cred-mission">복제되지 않는 것을 만듭니다</span><span class="cred-links"><a href="https://seunghoonchoi.com" target="_blank" rel="noopener">seunghoonchoi.com</a><span class="cred-sep">·</span><a href="mailto:herring2141@gmail.com">herring2141@gmail.com</a></span>',
    'wrongCount': '틀린 문제 {0}개', 'cat.count': '{0}문항',
    'banner.mc': '【객관식】  {0} / {1}', 'banner.writing': '【작문형】  {0} / {1}  ·  200자 이내', 'banner.oral': '【구술】  {0} / {1}  ·  소리내어 말하기',
    'fb.correct': '정답입니다! ✅', 'fb.wrong': '오답입니다 ❌  정답: {0}',
    'write.phWrite': '여기에 답안을 작성하세요 (200자 이내)', 'write.phOral': '소리내어 답해 보세요. (핵심을 메모해 두어도 됩니다 — 선택)',
    'result.frac': '객관식 {0}문항 중 {1}문항 정답', 'result.fracMore': ' · 작문·구술은 아래에서 직접 확인',
    'result.pass': '합격선(60점) 통과 🎉', 'result.fail': '합격선(60점)까지 조금 더!', 'result.practice': '연습 모드 결과입니다.',
    'result.estLevel': '예상 배정 단계: {0}',
    'result.levelDisclaimer': '※ 이 점수는 실제 배정 점수가 아니라 <b>객관식 실력 기준 예상치</b>입니다. 실제 사전평가는 객관식(75점)+작문(2문)+구술(25점)=100점이며, 작문·구술은 사람이 채점합니다. 또한 <b>구술이 3점 미만이면 0단계</b>로 배정됩니다. 정확한 단계는 시험 당일 점수로 정해집니다.',
    'track.nat': '🇰🇷 귀화 종합평가', 'track.perm': '🏡 영주 종합평가', 'track.pre': '📊 사회통합 사전평가',
    'review.unanswered': '선택 안 함', 'review.emptyWrite': '작성한 답안이 없습니다.', 'review.emptyOral': '메모한 내용이 없습니다.',
    'stats.total': '총 푼 문제', 'stats.acc': '전체 정답률', 'stats.noHistory': '아직 모의고사 기록이 없습니다.',
    'wrong.empty': '틀린 문제가 없습니다. 잘하고 있어요! 👏', 'writing.empty': '해당 유형의 문제가 없습니다.',
    'guide.show': '💡 도움말 보기', 'guide.hide': '💡 도움말 숨기기', 'writing.draftPh': '여기에 답을 작성해 보세요 (200자 이내)',
    'model.show': '📝 모범답안 보기', 'model.hide': '📝 모범답안 숨기기', 'review.model': '모범답안',
    'resume.banner': '📌 진행 중인 모의고사 이어서 풀기 ({0}/{1})', 'exam.resume': '이어서 풀기 ({0}/{1})',
    'confirm.discardMock': '진행 중인 모의고사 기록이 사라집니다. 새로 시작할까요?', 'toast.resumed': '이어서 풉니다.',
    'resume.practice': '📌 이어서 풀기 — {0} ({1}/{2})', 'practice.allLabel': '전체',
    'confirm.submit': '제출하고 채점할까요?', 'confirm.clearWrong': '오답노트를 모두 비울까요?', 'confirm.resetStats': '학습 통계와 기록을 모두 초기화할까요?',
    'toast.clearedWrong': '오답노트를 비웠습니다.', 'toast.resetStats': '초기화했습니다.', 'toast.noQ': '풀 수 있는 문제가 없습니다. 동기화를 먼저 해주세요.', 'toast.timeUp': '시간 종료! 자동 채점합니다.',
    'count.char': '{0}자',
  },
  zh: {
    'app.title': '归化考试练习', 'app.sync': '同步',
    'home.mock.t': '模拟考试', 'home.mock.s': '像真实考试一样作答',
    'home.practice.t': '分领域练习', 'home.practice.s': '按8个领域练习',
    'home.writing.t': '写作·口试练习', 'home.writing.s': '按主题说·写',
    'home.wrong.t': '错题本', 'home.stats.t': '学习统计', 'home.stats.s': '查看正确率·记录',
    'practice.title': '分领域练习', 'practice.desc': '逐题作答，立即查看答案与解析。', 'practice.all': '🎲 全部随机',
    'exam.org': '社会统合项目 (KIIP)', 'exam.title': '归化用综合评价', 'exam.subtitle': '笔试模拟考试',
    'exam.name': '姓 名', 'exam.namePh': '输入姓名', 'exam.no': '准考证号', 'exam.noticeTitle': '注意事项',
    'exam.n1': '归化用综合评价为 <b>选择题36题(65分) + 写作(10分) + 口试(25分) = 100分</b>，<b>60分以上合格</b>。',
    'exam.n2': '本模拟考试 <b>笔试(选择题+写作)在60分钟内</b>完成，随后继续练习<b>口试题</b>。',
    'exam.n3': '选择题从①②③④中选一个，写作在<b>200字以内</b>完成。',
    'exam.n4': '仅选择题自动评分；写作·口试以参考答案·提示自我检查。',
    'exam.n5': '真实考试的口试为单独的10分钟环节。修完社会统合项目第5阶段并合格时，<b>可免除归化面试</b>。',
    'common.cancel': '取消', 'common.home': '返回主页', 'exam.start': '开始考试',
    'quiz.prev': '← 上一题', 'quiz.next': '下一题 →', 'quiz.result': '查看结果', 'quiz.submit': '提交并评分',
    'writing.title': '写作·口试练习', 'seg.writing': '✍️ 写作', 'seg.oral': '🗣️ 口试',
    'result.title': '评分结果', 'result.unit': '分', 'result.reviewHead': '重新查看题目', 'result.retryWrong': '只重做错题',
    'wrong.title': '错题本', 'wrong.desc': '答错的题会汇集在这里，答对后将从列表中消失。', 'wrong.start': '做错题', 'wrong.clear': '清空错题本',
    'stats.title': '学习统计', 'stats.recentHead': '最近的模拟考试记录', 'stats.reset': '重置统计', 'writeCount.suffix': ' / 200字',
    'sync.ready': '准备完成 · 共{0}题 (选择题{1})', 'sync.never': '点击同步即可获取最新题目。',
    'sync.offline': '离线 — 使用上次同步的{0}题继续', 'sync.first': '尚未获取题目。请联网后点击同步。',
    'sync.synced': '已同步到最新题目 · 共{0}题',
    'toast.syncing': '正在获取最新题目…', 'toast.syncDone': '同步完成！共{0}题', 'toast.offline': '请检查网络连接。可使用已保存的题目继续。', 'toast.syncFail': '未能获取题目。',
    'bankInfo': '题库版本：{0} · 选择题{1}题 · 上次同步：{2}', 'noSync': '无',
    'credit.html': '<span class="cred-name">Seunghoon Choi<span class="cred-title"> · Bellunix CEO</span></span><span class="cred-mission">打造无法被复制之物</span><span class="cred-links"><a href="https://seunghoonchoi.com" target="_blank" rel="noopener">seunghoonchoi.com</a><span class="cred-sep">·</span><a href="mailto:herring2141@gmail.com">herring2141@gmail.com</a></span>',
    'wrongCount': '错题 {0} 道', 'cat.count': '{0}题',
    'banner.mc': '【选择题】  {0} / {1}', 'banner.writing': '【写作】  {0} / {1}  ·  200字以内', 'banner.oral': '【口试】  {0} / {1}  ·  请朗读作答',
    'fb.correct': '回答正确！✅', 'fb.wrong': '回答错误 ❌  正确答案：{0}',
    'write.phWrite': '请在此作答（200字以内）', 'write.phOral': '请朗读作答。（也可记下要点 — 可选）',
    'result.frac': '选择题{0}题中答对{1}题', 'result.fracMore': ' · 写作·口试请在下方自行确认',
    'result.pass': '已达合格线（60分）🎉', 'result.fail': '距合格线（60分）还差一点！', 'result.practice': '这是练习模式的结果。',
    'result.estLevel': '预计分配阶段：{0}',
    'result.levelDisclaimer': '※ 此分数并非实际分配分数，而是 <b>按选择题水平的预估值</b>。实际事前评价为 选择题(75分)+写作(2题)+口试(25分)=100分，写作·口试由人工评分。另外 <b>口试不足3分将分配到0阶段</b>。准确阶段以考试当天分数为准。',
    'track.nat': '🇰🇷 归化综合评价', 'track.perm': '🏡 永居综合评价', 'track.pre': '📊 社会统合事前评价',
    'review.unanswered': '未作答', 'review.emptyWrite': '没有作答内容。', 'review.emptyOral': '没有记录内容。',
    'stats.total': '已做题数', 'stats.acc': '总正确率', 'stats.noHistory': '还没有模拟考试记录。',
    'wrong.empty': '没有错题，做得很好！👏', 'writing.empty': '没有该类型的题目。',
    'guide.show': '💡 查看提示', 'guide.hide': '💡 隐藏提示', 'writing.draftPh': '请在此作答（200字以内）',
    'model.show': '📝 查看范文', 'model.hide': '📝 隐藏范文', 'review.model': '范文',
    'resume.banner': '📌 继续上次的模拟考试 ({0}/{1})', 'exam.resume': '继续作答 ({0}/{1})',
    'confirm.discardMock': '正在进行的模拟考试记录将被删除。要重新开始吗？', 'toast.resumed': '继续作答。',
    'resume.practice': '📌 继续上次练习 — {0} ({1}/{2})', 'practice.allLabel': '全部',
    'confirm.submit': '要提交并评分吗？', 'confirm.clearWrong': '要清空错题本吗？', 'confirm.resetStats': '要重置所有学习统计和记录吗？',
    'toast.clearedWrong': '已清空错题本。', 'toast.resetStats': '已重置。', 'toast.noQ': '没有可作答的题目。请先同步。', 'toast.timeUp': '时间到！自动评分。',
    'count.char': '{0}字',
  },
};
function t(key) {
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.ko[key] || key;
  for (let i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]);
  return s;
}
function catName(c) { return LANG === 'zh' && CAT_ZH[c] ? CAT_ZH[c] : c; }
/* 한국어 본문 + (중국어 모드면) 중국어 보조를 함께 표시 */
function bi(ko, zh) { return (LANG === 'zh' && zh) ? `${ko}<span class="zh">${zh}</span>` : (ko || ''); }
/* 언어에 맞는 문자열 선택 ({ko, zh}) */
function tx(o) { return (LANG === 'zh' && o && o.zh) ? o.zh : (o ? o.ko : ''); }

/* =====================================================================
   시험 트랙 (종합평가 / 사전평가)
   - nat = 귀화용 종합평가(기존). pre = 사회통합 사전평가(레벨 배정).
   - 문제는 q.exam === 'pre' 이면 사전평가, 아니면 종합평가로 간주.
   ===================================================================== */
let activeExam = 'nat';
function examOf(q) { return q && q.exam === 'pre' ? 'pre' : 'nat'; }

/* 사전평가 단계 배정 기준표 (공식: kiiptest.org·법무부 안내문, 검증 완료)
   0단계는 점수 구간이 아니라 '구술 3점 미만'(필기 무관) — 객관식만으로는 판정 불가. */
const PRE_LEVELS = [
  { stage: 5, min: 81, max: 100, name: { ko: '5단계 · 한국사회이해', zh: '第5阶段 · 韩国社会理解' }, range: { ko: '81~100점', zh: '81~100分' } },
  { stage: 4, min: 61, max: 80, name: { ko: '4단계 · 중급2', zh: '第4阶段 · 中级2' }, range: { ko: '61~80점', zh: '61~80分' } },
  { stage: 3, min: 41, max: 60, name: { ko: '3단계 · 중급1', zh: '第3阶段 · 中级1' }, range: { ko: '41~60점', zh: '41~60分' } },
  { stage: 2, min: 21, max: 40, name: { ko: '2단계 · 초급2', zh: '第2阶段 · 初级2' }, range: { ko: '21~40점', zh: '21~40分' } },
  { stage: 1, min: 3, max: 20, name: { ko: '1단계 · 초급1', zh: '第1阶段 · 初级1' }, range: { ko: '3~20점', zh: '3~20分' } },
  { stage: 0, min: 0, max: 2, name: { ko: '0단계 · 한국어기초', zh: '第0阶段 · 韩语基础' }, range: { ko: '구술 3점 미만', zh: '口试不足3分' } },
];
function preLevelFor(score) { return PRE_LEVELS.find((l) => score >= l.min) || PRE_LEVELS[PRE_LEVELS.length - 1]; }

const EXAMS = {
  nat: {
    badge: { ko: '귀화 종합평가', zh: '归化综合评价' },
    coverOrg: { ko: '사회통합프로그램 (KIIP)', zh: '社会统合项目 (KIIP)' },
    coverTitle: { ko: '귀화용 종합평가', zh: '归化用综合评价' },
    coverSub: { ko: '필기시험 모의고사', zh: '笔试模拟考试' },
    mockSub: { ko: '실제 시험처럼 풀기 (객관식+작문+구술)', zh: '像真实考试一样作答（选择+写作+口试）' },
    practiceSub: { ko: '8개 영역별로 풀기', zh: '按8个领域练习' },
    noPrefix: 'KINAT',
    mock: { mc: 36, writing: 4, oral: 5, time: 60 * 60, ladder: false },
    grading: 'passfail',
    notices: {
      ko: [
        '귀화용 종합평가는 <b>객관식 36문항(65점) + 작문형(10점) + 구술(25점) = 100점</b>, <b>60점 이상이면 합격</b>입니다.',
        '이 모의고사는 <b>필기(객관식+작문)를 60분 안에</b> 풀고, 이어서 <b>구술 문항</b>까지 연습합니다.',
        '객관식은 ①②③④ 중 하나를 고르고, 작문은 <b>200자 이내</b>로 작성합니다.',
        '객관식만 자동 채점되며, 작문·구술은 모범답안·도움말로 스스로 점검합니다.',
        '실제 시험의 구술은 별도 10분 세션입니다. 사회통합프로그램 5단계 수료 + 합격 시 <b>귀화 면접심사 면제</b>가 가능합니다.',
      ],
      zh: [
        '归化用综合评价为 <b>选择题36题(65分) + 写作(10分) + 口试(25分) = 100分</b>，<b>60分以上合格</b>。',
        '本模拟考试 <b>笔试(选择题+写作)在60分钟内</b>完成，随后继续练习<b>口试题</b>。',
        '选择题从①②③④中选一个，写作在<b>200字以内</b>完成。',
        '仅选择题自动评分；写作·口试以参考答案·提示自我检查。',
        '真实考试的口试为单独的10分钟环节。修完社会统合项目第5阶段并合格时，<b>可免除归化面试</b>。',
      ],
    },
  },
  perm: {
    badge: { ko: '영주 종합평가', zh: '永居综合评价' },
    coverOrg: { ko: '사회통합프로그램 (KIIP)', zh: '社会统合项目 (KIIP)' },
    coverTitle: { ko: '영주용 종합평가', zh: '永居用综合评价' },
    coverSub: { ko: '필기시험 모의고사', zh: '笔试模拟考试' },
    mockSub: { ko: '실제 시험처럼 풀기 (객관식+작문+구술)', zh: '像真实考试一样作答（选择+写作+口试）' },
    practiceSub: { ko: '8개 영역별로 풀기', zh: '按8个领域练习' },
    noPrefix: 'KIPRAT',
    mock: { mc: 36, writing: 4, oral: 5, time: 60 * 60, ladder: false },
    grading: 'passfail',
    notices: {
      ko: [
        '영주용 종합평가는 <b>객관식 36문항(65점) + 작문형(10점) + 구술(25점) = 100점</b>, <b>60점 이상이면 합격</b>입니다.',
        '이 모의고사는 <b>필기(객관식+작문)를 60분 안에</b> 풀고, 이어서 <b>구술 문항</b>까지 연습합니다.',
        '객관식은 ①②③④ 중 하나를 고르고, 작문은 <b>200자 이내</b>로 작성합니다.',
        '객관식만 자동 채점되며, 작문·구술은 모범답안·도움말로 스스로 점검합니다.',
        '응시 자격: 사회통합프로그램 <b>5단계 기본과정 수료</b>(또는 사전평가로 5단계 배정). 영주용은 <b>지필(PBT)로만</b> 시행됩니다.',
      ],
      zh: [
        '永居用综合评价为 <b>选择题36题(65分) + 写作(10分) + 口试(25分) = 100分</b>，<b>60分以上合格</b>。',
        '本模拟考试 <b>笔试(选择题+写作)在60分钟内</b>完成，随后继续练习<b>口试题</b>。',
        '选择题从①②③④中选一个，写作在<b>200字以内</b>完成。',
        '仅选择题自动评分；写作·口试以参考答案·提示自我检查。',
        '应试资格：修完社会统合项目 <b>第5阶段基本课程</b>（或经事前评价分配到第5阶段）。永居用仅以 <b>纸笔(PBT)</b> 形式进行。',
      ],
    },
  },
  pre: {
    badge: { ko: '사회통합 사전평가', zh: '社会统合事前评价' },
    coverOrg: { ko: '사회통합프로그램 (KIIP)', zh: '社会统合项目 (KIIP)' },
    coverTitle: { ko: '사회통합프로그램 사전평가', zh: '社会统合项目 事前评价' },
    coverSub: { ko: '단계 배정 모의평가', zh: '级别分配模拟评价' },
    mockSub: { ko: '실제 시험처럼 풀기 (객관식+작문+구술)', zh: '像真实考试一样作答（选择+写作+口试）' },
    practiceSub: { ko: '어휘·문법·읽기·대화·문화·사회', zh: '词汇·语法·阅读·对话·文化·社会' },
    noPrefix: 'KIIP',
    mock: { mc: 48, writing: 2, oral: 5, time: 60 * 60, ladder: true },
    grading: 'level',
    notices: {
      ko: [
        '사회통합프로그램 <b>사전평가</b>는 합격·불합격 시험이 아니라, 점수에 따라 <b>0~5단계</b>를 배정하는 레벨 평가입니다.',
        '실제 시험은 <b>필기 50문항(60분, 75점)</b> + <b>구술 5문항(10분, 25점)</b> = 100점입니다. 이 모의평가는 필기(객관식+작문)를 풀고 이어서 구술을 연습합니다.',
        '객관식은 ①②③④ 중 하나를 고르고, 작문은 빈칸에 알맞은 표현을 짧게 씁니다.',
        '객관식만 자동 채점되어 <b>예상 배정 단계</b>를 알려줍니다. 작문·구술은 모범답안으로 스스로 점검합니다.',
        '실제로는 <b>구술 점수가 3점 미만이면 0단계</b>로 배정됩니다. 정확한 단계는 시험 당일 점수로 정해지며, 표시되는 단계는 <b>연습용 참고치</b>입니다.',
      ],
      zh: [
        '社会统合项目 <b>事前评价</b>不是合格/不合格考试，而是根据分数分配 <b>0~5阶段</b>的级别测试。',
        '真实考试为 <b>笔试50题(60分钟, 75分)</b> + <b>口试5题(10分钟, 25分)</b> = 100分。本模拟评价完成笔试(选择题+写作)后继续练习口试。',
        '选择题从①②③④中选一个，写作在空格处简短填写恰当的表达。',
        '仅选择题自动评分并给出 <b>预计分配阶段</b>；写作·口试以参考答案自我检查。',
        '实际上 <b>口试不足3分则分配到0阶段</b>。准确阶段以考试当天分数为准，显示的阶段为 <b>练习参考值</b>。',
      ],
    },
  },
};
function exam() { return EXAMS[activeExam]; }
/* 시험별로 분리 저장할 키(종합평가=기존 키 그대로, 사전평가=__pre 접미사) */
function ekey(base) { return activeExam === 'nat' ? base : base + '__' + activeExam; }

/* ---------- 상태 ---------- */
let BANK = [];
let META = { version: '-', syncedAt: null };
let quiz = null;
let writingType = 'writing';
let currentView = 'home';
let lastResult = null;
let swReg = null;

/* ---------- 유틸 ---------- */
const $ = (id) => document.getElementById(id);
const NUM = ['①', '②', '③', '④', '⑤'];
function ls(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function toast(msg, ms = 2200) { const t0 = $('toast'); t0.textContent = msg; t0.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(() => t0.classList.add('hidden'), ms); }
function fmtDate(iso) { if (!iso) return t('noSync'); const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
/* 트랙별 문제 풀: 영주용(perm)도 귀화용(nat)과 같은 종합평가 풀을 쓰되,
   심화(tier:advanced) 문항은 귀화용에만 포함(영주=기본과정, 귀화=기본+심화). */
const poolOf = (ex) => (ex === 'pre' ? 'pre' : 'nat');
function inExam(q) { return examOf(q) === poolOf(activeExam) && !(activeExam === 'perm' && q.tier === 'advanced'); }
const examBank = () => BANK.filter(inExam);
const mcOnly = () => examBank().filter((q) => q.type === 'mc');
const byType = (ty) => examBank().filter((q) => q.type === ty);

/* =====================================================================
   초기화
   ===================================================================== */
function init() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    // 새 버전 적용은 서비스워커(activate 시 창 자동 새로고침)가 담당
    navigator.serviceWorker.register('sw.js').then((reg) => { swReg = reg; }).catch(() => {});
  }
  LANG = ls(K.lang, 'ko');
  activeExam = ls(K.exam, 'nat');
  loadBankFromStorageOrFallback();
  applyStaticI18n();
  applyExamUi();
  wireEvents();
  showView('home');
  renderHome();
  sync({ silent: true });
}

function loadBankFromStorageOrFallback() {
  const cached = ls(K.bank, null);
  const meta = ls(K.meta, null);
  if (cached && Array.isArray(cached) && cached.length) { BANK = cached; META = meta || { version: '?', syncedAt: null }; }
  else { BANK = FALLBACK.questions; META = { version: FALLBACK.version, syncedAt: null }; }
}

/* ---------- 다국어 적용 ---------- */
function applyStaticI18n() {
  document.documentElement.lang = LANG === 'zh' ? 'zh' : 'ko';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $('langBtn').textContent = LANG === 'zh' ? '한국어' : '中文';
}
function setLang(lang) {
  LANG = lang; save(K.lang, lang);
  applyStaticI18n();
  applyExamUi();
  refreshView();
}

/* ---------- 시험 트랙 UI 반영 / 전환 ---------- */
function applyExamUi() {
  document.querySelectorAll('#trackSeg .seg__btn').forEach((b) => b.classList.toggle('seg__btn--active', b.dataset.exam === activeExam));
  const titleEl = document.querySelector('.appbar__title');
  if (titleEl) titleEl.textContent = tx(exam().badge);
  const mockSub = document.querySelector('[data-go="mock"] .menu-card__sub');
  if (mockSub) mockSub.textContent = tx(exam().mockSub);
  const prSub = document.querySelector('[data-go="practice"] .menu-card__sub');
  if (prSub) prSub.textContent = tx(exam().practiceSub);
}
function setExam(key) {
  if (key === activeExam || !EXAMS[key]) return;
  showView('home');        // 진행 중인 모의고사가 있으면 현재 트랙 키로 저장 후 타이머 정지
  quiz = null; lastResult = null;
  activeExam = key; save(K.exam, key);
  applyExamUi();
  renderHome();
  toast(tx(exam().badge));
}
function refreshView() {
  if (currentView === 'home') renderHome();
  else if (currentView === 'examintro') { renderExamIntro(); const s = getMockSave(); const btn = $('examResumeBtn'); if (s) btn.textContent = t('exam.resume', s.i + 1, s.list.length); }
  else if (currentView === 'practice') renderCategories();
  else if (currentView === 'quiz' && quiz) renderQuestion();
  else if (currentView === 'writing') renderWriting();
  else if (currentView === 'wrong') renderWrong();
  else if (currentView === 'stats') renderStats();
  else if (currentView === 'result' && lastResult) renderResult(lastResult.list, lastResult.answers, lastResult.correct, lastResult.opts);
}

/* =====================================================================
   동기화
   ===================================================================== */
async function sync({ silent = false } = {}) {
  const btn = $('syncBtn');
  btn.classList.add('is-syncing');
  if (swReg) { try { swReg.update(); } catch (e) {} } // 동기화 시 앱(서비스워커) 업데이트도 점검
  if (!silent) toast(t('toast.syncing'));
  try {
    const res = await fetch('questions.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.questions;
    if (!Array.isArray(list) || !list.length) throw new Error('형식 오류');
    BANK = list;
    META = { version: (data.version || '?'), syncedAt: new Date().toISOString() };
    save(K.bank, BANK); save(K.meta, META);
    setSyncStatus(t('sync.synced', BANK.length), false);
    if (!silent) toast(t('toast.syncDone', BANK.length));
    renderHome();
  } catch (e) {
    if (META.syncedAt) { setSyncStatus(t('sync.offline', BANK.length), true); if (!silent) toast(t('toast.offline')); }
    else { setSyncStatus(t('sync.first'), true); if (!silent) toast(t('toast.syncFail')); }
  } finally { btn.classList.remove('is-syncing'); }
}
function setSyncStatus(text, isError) { const el = $('syncStatus'); el.textContent = text; el.classList.toggle('is-error', !!isError); }

/* =====================================================================
   화면 전환
   ===================================================================== */
const VIEWS = ['home', 'practice', 'examintro', 'quiz', 'writing', 'result', 'wrong', 'stats'];
function showView(name) {
  currentView = name;
  VIEWS.forEach((v) => $('view-' + v).classList.toggle('hidden', v !== name));
  if (name !== 'quiz') {
    document.body.classList.remove('exam-mode');
    // 퀴즈를 벗어나면(예: 홈으로) 진행 상황 저장 후 타이머 정지(중복 방지)
    if (quiz && quiz.timer) { saveMockProgress(); clearInterval(quiz.timer); quiz.timer = null; }
  }
  window.scrollTo(0, 0);
}

/* =====================================================================
   홈
   ===================================================================== */
function renderHome() {
  const wrong = ls(ekey(K.wrong), []);
  $('wrongCount').textContent = t('wrongCount', wrong.length);
  const mc = mcOnly().length;
  $('bankInfo').textContent = t('bankInfo', META.version, mc, fmtDate(META.syncedAt));
  if (META.syncedAt) setSyncStatus(t('sync.ready', examBank().length, mc), false);
  else setSyncStatus(t('sync.never'), false);

  // 진행 중인 모의고사 이어풀기 배너
  const s = getMockSave();
  const rb = $('resumeBanner');
  if (s) { rb.textContent = t('resume.banner', s.i + 1, s.list.length); rb.classList.remove('hidden'); }
  else rb.classList.add('hidden');
}

/* =====================================================================
   영역별 연습
   ===================================================================== */
function renderCategories() {
  // 진행 중인 연습 이어풀기 배너
  const s = getPracticeSave();
  const rb = $('practiceResume');
  if (s) { const lab = s.label ? catName(s.label) : t('practice.allLabel'); rb.textContent = t('resume.practice', lab, s.i + 1, s.list.length); rb.classList.remove('hidden'); }
  else rb.classList.add('hidden');

  const cats = {};
  mcOnly().forEach((q) => { cats[q.category] = (cats[q.category] || 0) + 1; });
  const wrap = $('categoryList');
  wrap.innerHTML = '';
  wrap.appendChild(catItem(t('practice.all'), mcOnly().length, () => startQuiz(shuffle(mcOnly()), 'practice')));
  Object.keys(cats).forEach((c) => {
    wrap.appendChild(catItem(catName(c), cats[c], () => startQuiz(shuffle(mcOnly().filter((q) => q.category === c)), 'practice')));
  });
}
function catItem(name, count, onClick) {
  const el = document.createElement('button');
  el.className = 'cat-item';
  el.innerHTML = `<span>${name}</span><span class="cat-item__count">${t('cat.count', count)}</span>`;
  el.addEventListener('click', onClick);
  return el;
}

/* =====================================================================
   퀴즈 엔진
   ===================================================================== */
function startQuiz(questions, mode, resume) {
  if (!questions.length) { toast(t('toast.noQ')); return; }
  quiz = {
    mode, list: questions,
    i: resume ? resume.i : 0,
    answers: resume ? resume.answers : new Array(questions.length).fill(null),
    text: resume ? (resume.text || {}) : {},
    graded: mode === 'practice' || mode === 'wrong',
    timer: null,
    timeLeft: resume ? resume.timeLeft : exam().mock.time,
  };
  showView('quiz');
  const isMock = mode === 'mock';
  document.body.classList.toggle('exam-mode', isMock);
  $('examBanner').classList.toggle('hidden', !isMock);
  $('quizTimer').classList.toggle('hidden', !isMock);
  $('quizCat').classList.toggle('hidden', isMock);
  if (isMock) startTimer();
  renderQuestion();
}

/* ---------- 모의고사 중간 저장 / 이어풀기 ---------- */
function getMockSave() { const s = ls(ekey(K.mockSave), null); return (s && Array.isArray(s.list) && s.list.length) ? s : null; }
function clearMockSave() { try { localStorage.removeItem(ekey(K.mockSave)); } catch {} }
function saveMockProgress() {
  if (!quiz || quiz.mode !== 'mock') return;
  save(ekey(K.mockSave), { list: quiz.list, i: quiz.i, answers: quiz.answers, text: quiz.text, timeLeft: quiz.timeLeft, savedAt: new Date().toISOString() });
}

/* ---------- 영역별 연습 중간 저장 / 이어풀기 ---------- */
function getPracticeSave() { const s = ls(ekey(K.practiceSave), null); return (s && Array.isArray(s.list) && s.list.length) ? s : null; }
function clearPracticeSave() { try { localStorage.removeItem(ekey(K.practiceSave)); } catch {} }
function savePracticeProgress() {
  if (!quiz || quiz.mode !== 'practice') return;
  const cats = new Set(quiz.list.map((q) => q.category));
  save(ekey(K.practiceSave), { list: quiz.list, i: quiz.i, answers: quiz.answers, label: cats.size === 1 ? [...cats][0] : null, savedAt: new Date().toISOString() });
}
function resumePractice() {
  const s = getPracticeSave();
  if (!s) { renderCategories(); return; }
  startQuiz(s.list, 'practice', { i: s.i, answers: s.answers });
  toast(t('toast.resumed'));
}

function renderExamIntro() {
  const e = exam();
  const org = document.querySelector('.exam-cover__org');
  const title = document.querySelector('.exam-cover__title');
  const sub = document.querySelector('.exam-cover__subtitle');
  if (org) org.textContent = tx(e.coverOrg);
  if (title) title.textContent = tx(e.coverTitle);
  if (sub) sub.textContent = tx(e.coverSub);
  const ol = $('examNoticeList');
  if (ol) ol.innerHTML = e.notices[LANG === 'zh' ? 'zh' : 'ko'].map((n) => `<li>${n}</li>`).join('');
}
function showExamIntro() {
  if (!mcOnly().length) { toast(t('toast.noQ')); return; }
  renderExamIntro();
  $('examNo').value = exam().noPrefix + '-' + String(Math.floor(1000 + Math.random() * 9000));
  const s = getMockSave();
  const btn = $('examResumeBtn');
  if (s) { btn.textContent = t('exam.resume', s.i + 1, s.list.length); btn.classList.remove('hidden'); }
  else btn.classList.add('hidden');
  showView('examintro');
}
function startMockExam() {
  if (getMockSave() && !confirm(t('confirm.discardMock'))) return;
  clearMockSave();
  const cfg = exam().mock;
  let mc;
  if (cfg.ladder) {
    // 사전평가: 한국어 영역 80% + 문화·사회 20%, 번호↑=난이도↑(level 오름차순) 재현
    const korCats = ['어휘', '문법', '읽기·이해', '대화'];
    const all = mcOnly();
    const kor = all.filter((q) => korCats.includes(q.category));
    const cs = all.filter((q) => !korCats.includes(q.category));
    const nCS = Math.min(cs.length, Math.round(cfg.mc * 0.2));
    const nKor = cfg.mc - nCS;
    const korPick = shuffle(kor).slice(0, nKor).sort((a, b) => (a.level || 2) - (b.level || 2));
    const csPick = shuffle(cs).slice(0, nCS);
    mc = korPick.concat(csPick); // 문화·사회를 뒤쪽(실제 41~48번처럼)
  } else {
    mc = shuffle(mcOnly()).slice(0, cfg.mc);
  }
  const wr = shuffle(byType('writing')).slice(0, cfg.writing);
  const or = shuffle(byType('oral')).slice(0, cfg.oral);
  startQuiz(mc.concat(wr).concat(or), 'mock');
}
function resumeMock() {
  const s = getMockSave();
  if (!s) { showView('home'); renderHome(); return; }
  startQuiz(s.list, 'mock', { i: s.i, answers: s.answers, text: s.text, timeLeft: s.timeLeft });
  toast(t('toast.resumed'));
}
function onWriteInput() {
  const q = quiz.list[quiz.i];
  const val = $('writeInput').value;
  quiz.text[q.id] = val;
  $('writeCount').textContent = t('count.char', val.length);
  $('writeArea').querySelector('.write-area__meta').classList.toggle('over', val.length > 200);
  if (quiz.mode === 'mock') saveMockProgress();
}

function startTimer() {
  updateTimerLabel();
  quiz.timer = setInterval(() => {
    quiz.timeLeft--;
    updateTimerLabel();
    if (quiz.timeLeft % 15 === 0) saveMockProgress(); // 남은 시간 주기적 저장
    if (quiz.timeLeft <= 0) { clearInterval(quiz.timer); toast(t('toast.timeUp')); gradeMock(); }
  }, 1000);
}
function updateTimerLabel() { const m = Math.floor(quiz.timeLeft / 60), s = quiz.timeLeft % 60; $('quizTimer').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }

function renderQuestion() {
  const q = quiz.list[quiz.i];
  const total = quiz.list.length;
  const isWriting = q.type !== 'mc';

  $('quizProgress').textContent = `${quiz.i + 1} / ${total}`;
  $('progressFill').style.width = `${((quiz.i + 1) / total) * 100}%`;
  if (quiz.mode !== 'mock') $('quizCat').textContent = catName(q.category);

  if (quiz.mode === 'mock') {
    const countOf = (ty) => quiz.list.filter((x) => x.type === ty).length;
    const doneOf = (ty) => quiz.list.slice(0, quiz.i + 1).filter((x) => x.type === ty).length;
    if (q.type === 'mc') $('examBanner').textContent = t('banner.mc', quiz.i + 1, countOf('mc'));
    else if (q.type === 'writing') $('examBanner').textContent = t('banner.writing', doneOf('writing'), countOf('writing'));
    else $('examBanner').textContent = t('banner.oral', doneOf('oral'), countOf('oral'));
  }

  $('questionBox').innerHTML = bi(q.q, q.q_zh);

  const chosen = quiz.answers[quiz.i];
  const showAnswer = quiz.graded && !isWriting && chosen !== null;

  $('choices').classList.toggle('hidden', isWriting);
  $('writeArea').classList.toggle('hidden', !isWriting);

  if (isWriting) {
    const ta = $('writeInput');
    const isOral = q.type === 'oral';
    ta.placeholder = isOral ? t('write.phOral') : t('write.phWrite');
    ta.value = quiz.text[q.id] || '';
    const meta = $('writeArea').querySelector('.write-area__meta');
    meta.style.display = isOral ? 'none' : '';
    $('writeCount').textContent = t('count.char', ta.value.length);
    meta.classList.toggle('over', ta.value.length > 200);
    $('feedback').classList.add('hidden');
  } else {
    const cwrap = $('choices');
    cwrap.innerHTML = '';
    q.choices.forEach((c, idx) => {
      const b = document.createElement('button');
      b.className = 'choice';
      const czh = q.choices_zh && q.choices_zh[idx];
      b.innerHTML = `<span class="choice__num">${NUM[idx]}</span><span>${bi(c, czh)}</span>`;
      if (chosen === idx) b.classList.add('is-selected');
      if (showAnswer) { b.disabled = true; if (idx === q.answer) b.classList.add('is-correct'); else if (idx === chosen) b.classList.add('is-wrong'); }
      b.addEventListener('click', () => onChoose(idx));
      cwrap.appendChild(b);
    });
    const fb = $('feedback');
    if (showAnswer) {
      const ok = chosen === q.answer;
      const head = ok ? t('fb.correct') : t('fb.wrong', NUM[q.answer] + ' ' + q.choices[q.answer]);
      fb.className = 'feedback' + (ok ? '' : ' is-wrong');
      fb.innerHTML = `<strong>${head}</strong>${bi(q.explanation || '', q.explanation_zh)}`;
      fb.classList.remove('hidden');
    } else { fb.classList.add('hidden'); }
  }

  const last = quiz.i === total - 1;
  $('prevBtn').classList.toggle('hidden', quiz.mode !== 'mock' || quiz.i === 0);
  if (quiz.mode === 'mock') {
    $('nextBtn').classList.toggle('hidden', last);
    $('nextBtn').disabled = false; $('nextBtn').style.opacity = '1'; $('nextBtn').textContent = t('quiz.next');
    $('submitBtn').classList.toggle('hidden', !last);
  } else {
    $('nextBtn').classList.toggle('hidden', false);
    $('nextBtn').textContent = last ? t('quiz.result') : t('quiz.next');
    $('nextBtn').disabled = chosen === null;
    $('nextBtn').style.opacity = chosen === null ? '.5' : '1';
    $('submitBtn').classList.add('hidden');
  }

  if (quiz.mode === 'mock') saveMockProgress(); // 답 선택·이동 시마다 중간 저장
  else if (quiz.mode === 'practice') savePracticeProgress();
}

function onChoose(idx) {
  const already = quiz.answers[quiz.i];
  if (quiz.graded && already !== null) return;
  quiz.answers[quiz.i] = idx;
  if (quiz.graded) { const q = quiz.list[quiz.i]; const ok = idx === q.answer; recordAnswer(q, ok); if (!ok) addWrong(q.id); else removeWrong(q.id); }
  renderQuestion();
}
function nextQuestion() {
  if (quiz.mode !== 'mock' && quiz.answers[quiz.i] === null) return;
  if (quiz.i < quiz.list.length - 1) { quiz.i++; renderQuestion(); }
  else { if (quiz.mode === 'mock') gradeMock(); else finishPractice(); }
}
function prevQuestion() { if (quiz.i > 0) { quiz.i--; renderQuestion(); } }

function finishPractice() {
  clearPracticeSave(); // 끝까지 풀면 중간 저장 삭제
  let correct = 0;
  quiz.list.forEach((q, i) => { if (quiz.answers[i] === q.answer) correct++; });
  renderResult(quiz.list, quiz.answers, correct, { isMock: false, totalMc: quiz.list.length });
}
function gradeMock() {
  if (quiz.timer) { clearInterval(quiz.timer); quiz.timer = null; }
  clearMockSave(); // 채점 완료 → 중간 저장 삭제
  const totalMc = quiz.list.filter((q) => q.type === 'mc').length;
  let correct = 0;
  quiz.list.forEach((q, i) => {
    if (q.type !== 'mc') return;
    const ok = quiz.answers[i] === q.answer;
    if (ok) correct++;
    recordAnswer(q, ok);
    if (quiz.answers[i] === null || !ok) addWrong(q.id); else removeWrong(q.id);
  });
  const pct = totalMc ? Math.floor((correct / totalMc) * 100) : 0;
  const hist = ls(ekey(K.history), []);
  hist.unshift({ date: new Date().toISOString(), correct, total: totalMc, pct });
  save(ekey(K.history), hist.slice(0, 30));
  document.body.classList.remove('exam-mode');
  renderResult(quiz.list, quiz.answers, correct, { isMock: true, totalMc });
}

/* =====================================================================
   결과
   ===================================================================== */
function renderResult(list, answers, correct, opts) {
  lastResult = { list, answers, correct, opts };
  const { isMock, totalMc } = opts;
  showView('result');
  const denom = totalMc || list.length;
  const pct = denom ? Math.floor((correct / denom) * 100) : 0;
  const hasWriting = list.some((q) => q.type !== 'mc');
  $('scorePct').textContent = pct;
  $('scoreFrac').textContent = t('result.frac', denom, correct) + (hasWriting ? t('result.fracMore') : '');

  const passEl = $('scorePass');
  const levelBox = $('levelResult');
  if (isMock && activeExam === 'pre') {
    const lv = preLevelFor(pct);
    passEl.textContent = t('result.estLevel', tx(lv.name));
    passEl.className = 'score-card__pass level';
    levelBox.innerHTML = renderLevelTable(lv);
    levelBox.classList.remove('hidden');
  } else {
    levelBox.classList.add('hidden');
    if (isMock) { const pass = pct >= 60; passEl.textContent = pass ? t('result.pass') : t('result.fail'); passEl.className = 'score-card__pass ' + (pass ? 'pass' : 'fail'); }
    else { passEl.textContent = t('result.practice'); passEl.className = 'score-card__pass'; }
  }

  const cat = {};
  list.forEach((q, i) => { if (q.type !== 'mc') return; cat[q.category] = cat[q.category] || { c: 0, t: 0 }; cat[q.category].t++; if (answers[i] === q.answer) cat[q.category].c++; });
  const cb = $('catBreakdown'); cb.innerHTML = '';
  Object.keys(cat).forEach((c) => {
    const { c: cc, t: tt } = cat[c]; const p = Math.round((cc / tt) * 100);
    const row = document.createElement('div'); row.className = 'cat-row';
    row.innerHTML = `<span class="cat-row__name">${catName(c)}</span><span class="cat-row__bar"><span style="width:${p}%"></span></span><span class="cat-row__val">${cc}/${tt}</span>`;
    cb.appendChild(row);
  });

  const texts = (quiz && quiz.text) ? quiz.text : {};
  const rl = $('reviewList'); rl.innerHTML = '';
  list.forEach((q, i) => rl.appendChild(reviewItem(q, answers[i], texts[q.id])));

  const wrongQs = list.filter((q, i) => q.type === 'mc' && answers[i] !== q.answer);
  $('retryWrongBtn').classList.toggle('hidden', wrongQs.length === 0);
  $('retryWrongBtn').onclick = () => startQuiz(shuffle(wrongQs), 'practice');
}

function renderLevelTable(cur) {
  const rows = PRE_LEVELS.slice().reverse().map((l) => {
    const on = l.stage === cur.stage;
    return `<div class="level-row${on ? ' is-on' : ''}"><span class="level-row__stage">${tx(l.name)}${on ? ' ◀' : ''}</span><span class="level-row__range">${tx(l.range)}</span></div>`;
  }).join('');
  return `<div class="level-note">${t('result.levelDisclaimer')}</div><div class="level-table">${rows}</div>`;
}

function reviewItem(q, chosen, writeText) {
  const el = document.createElement('div');
  el.className = 'review-item';
  if (q.type !== 'mc') {
    const isOral = q.type === 'oral';
    const ans = (writeText || '').trim().replace(/</g, '&lt;');
    const empty = isOral ? t('review.emptyOral') : t('review.emptyWrite');
    el.innerHTML = `<div class="review-item__q">${isOral ? '🗣️' : '✍️'} ${bi(q.q, q.q_zh)}</div>
      <div class="review-item__write ${ans ? '' : 'empty-ans'}">${ans || empty}</div>
      ${q.guide ? `<div class="review-item__exp">💡 ${bi(q.guide, q.guide_zh)}</div>` : ''}
      ${q.model ? `<div class="review-item__model"><b>${t('review.model')}</b><br>${bi(q.model, q.model_zh)}</div>` : ''}`;
    return el;
  }
  let opts = '';
  q.choices.forEach((c, idx) => {
    let cls = ''; if (idx === q.answer) cls = 'correct'; else if (idx === chosen) cls = 'chosen-wrong';
    const czh = q.choices_zh && q.choices_zh[idx];
    opts += `<div class="review-item__opt ${cls}">${NUM[idx]} ${bi(c, czh)}${idx === q.answer ? ' ✓' : ''}</div>`;
  });
  const unanswered = chosen === null || chosen === undefined;
  el.innerHTML = `<div class="review-item__q">${bi(q.q, q.q_zh)}</div>${opts}
    ${unanswered ? `<div class="review-item__opt chosen-wrong">${t('review.unanswered')}</div>` : ''}
    ${q.explanation ? `<div class="review-item__exp">💡 ${bi(q.explanation, q.explanation_zh)}</div>` : ''}`;
  return el;
}

/* =====================================================================
   오답노트
   ===================================================================== */
function addWrong(id) { const w = ls(ekey(K.wrong), []); if (!w.includes(id)) { w.push(id); save(ekey(K.wrong), w); } }
function removeWrong(id) { let w = ls(ekey(K.wrong), []); if (w.includes(id)) { w = w.filter((x) => x !== id); save(ekey(K.wrong), w); } }
function renderWrong() {
  const ids = ls(ekey(K.wrong), []);
  const list = ids.map((id) => BANK.find((q) => q.id === id)).filter((q) => q && inExam(q));
  $('startWrongBtn').classList.toggle('hidden', list.length === 0);
  const rl = $('wrongList'); rl.innerHTML = '';
  if (!list.length) { rl.innerHTML = `<div class="empty">${t('wrong.empty')}</div>`; return; }
  list.forEach((q) => rl.appendChild(reviewItem(q, null)));
}

/* =====================================================================
   작문 / 구술
   ===================================================================== */
function renderWriting() {
  const list = byType(writingType);
  const drafts = ls(ekey(K.drafts), {});
  const wrap = $('writingList'); wrap.innerHTML = '';
  if (!list.length) { wrap.innerHTML = `<div class="empty">${t('writing.empty')}</div>`; return; }
  list.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'writing-card';
    const isWriting = q.type === 'writing';
    card.innerHTML = `
      <div class="writing-card__q">${bi(q.q, q.q_zh)}</div>
      ${isWriting ? `<textarea data-id="${q.id}" placeholder="${t('writing.draftPh')}">${drafts[q.id] || ''}</textarea>
        <div class="writing-card__meta"><span class="writing-card__count">0${LANG === 'zh' ? '字' : '자'}</span></div>` : ''}
      <button class="writing-card__guide-toggle">${t('guide.show')}</button>
      <div class="writing-card__guide hidden">${bi(q.guide || '', q.guide_zh)}</div>
      ${q.model ? `<button class="writing-card__model-toggle">${t('model.show')}</button>
      <div class="writing-card__model hidden">${bi(q.model, q.model_zh)}</div>` : ''}`;
    if (isWriting) {
      const ta = card.querySelector('textarea'); const cnt = card.querySelector('.writing-card__count');
      const upd = () => { const n = ta.value.length; cnt.textContent = t('count.char', n); cnt.classList.toggle('over', n > 200); };
      ta.addEventListener('input', () => { upd(); const d = ls(ekey(K.drafts), {}); d[q.id] = ta.value; save(ekey(K.drafts), d); });
      upd();
    }
    const tg = card.querySelector('.writing-card__guide-toggle'); const gd = card.querySelector('.writing-card__guide');
    tg.addEventListener('click', () => { gd.classList.toggle('hidden'); tg.textContent = gd.classList.contains('hidden') ? t('guide.show') : t('guide.hide'); });
    const mtg = card.querySelector('.writing-card__model-toggle');
    if (mtg) {
      const md = card.querySelector('.writing-card__model');
      mtg.addEventListener('click', () => { md.classList.toggle('hidden'); mtg.textContent = md.classList.contains('hidden') ? t('model.show') : t('model.hide'); });
    }
    wrap.appendChild(card);
  });
}

/* =====================================================================
   통계
   ===================================================================== */
function recordAnswer(q, ok) {
  const s = ls(ekey(K.stats), { total: 0, correct: 0, cat: {} });
  s.total++; if (ok) s.correct++;
  s.cat[q.category] = s.cat[q.category] || { t: 0, c: 0 };
  s.cat[q.category].t++; if (ok) s.cat[q.category].c++;
  save(ekey(K.stats), s);
}
function renderStats() {
  const s = ls(ekey(K.stats), { total: 0, correct: 0, cat: {} });
  const acc = s.total ? Math.round((s.correct / s.total) * 100) : 0;
  $('statsBox').innerHTML = `
    <div class="stat"><div class="stat__num">${s.total}</div><div class="stat__label">${t('stats.total')}</div></div>
    <div class="stat"><div class="stat__num">${acc}%</div><div class="stat__label">${t('stats.acc')}</div></div>`;
  let cat = '';
  Object.keys(s.cat).forEach((c) => { const { t: tt, c: cc } = s.cat[c]; const p = tt ? Math.round((cc / tt) * 100) : 0; cat += `<div class="cat-row"><span class="cat-row__name">${catName(c)}</span><span class="cat-row__bar"><span style="width:${p}%"></span></span><span class="cat-row__val">${p}%</span></div>`; });
  const hist = ls(ekey(K.history), []);
  const hl = $('historyList');
  hl.innerHTML = cat ? `<div class="cat-breakdown" style="margin-bottom:18px">${cat}</div>` : '';
  if (!hist.length) { hl.insertAdjacentHTML('beforeend', `<div class="empty">${t('stats.noHistory')}</div>`); return; }
  hist.forEach((h) => { hl.insertAdjacentHTML('beforeend', `<div class="history-item"><span>${fmtDate(h.date)}</span><span class="history-item__score">${h.pct}${t('result.unit')} (${h.correct}/${h.total})</span></div>`); });
}

/* =====================================================================
   이벤트
   ===================================================================== */
function wireEvents() {
  $('homeBtn').addEventListener('click', () => { showView('home'); renderHome(); });
  $('syncBtn').addEventListener('click', () => sync({ silent: false }));
  $('langBtn').addEventListener('click', () => setLang(LANG === 'zh' ? 'ko' : 'zh'));
  document.querySelectorAll('#trackSeg .seg__btn').forEach((b) => b.addEventListener('click', () => setExam(b.dataset.exam)));

  document.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => {
      const go = el.dataset.go;
      if (go === 'home') { showView('home'); renderHome(); }
      else if (go === 'mock') showExamIntro();
      else if (go === 'practice') { renderCategories(); showView('practice'); }
      else if (go === 'writing') { writingType = 'writing'; syncSeg(); renderWriting(); showView('writing'); }
      else if (go === 'wrong') { renderWrong(); showView('wrong'); }
      else if (go === 'stats') { renderStats(); showView('stats'); }
    });
  });

  $('nextBtn').addEventListener('click', nextQuestion);
  $('prevBtn').addEventListener('click', prevQuestion);
  $('submitBtn').addEventListener('click', () => { if (confirm(t('confirm.submit'))) gradeMock(); });
  $('examStartBtn').addEventListener('click', startMockExam);
  $('resumeBanner').addEventListener('click', resumeMock);
  $('examResumeBtn').addEventListener('click', resumeMock);
  $('practiceResume').addEventListener('click', resumePractice);
  $('writeInput').addEventListener('input', onWriteInput);

  $('writingSeg').querySelectorAll('.seg__btn').forEach((b) => { b.addEventListener('click', () => { writingType = b.dataset.wt; syncSeg(); renderWriting(); }); });

  $('startWrongBtn').addEventListener('click', () => { const ids = ls(ekey(K.wrong), []); const list = ids.map((id) => BANK.find((q) => q.id === id)).filter((q) => q && inExam(q)); startQuiz(shuffle(list), 'wrong'); });
  $('clearWrongBtn').addEventListener('click', () => { if (confirm(t('confirm.clearWrong'))) { save(ekey(K.wrong), []); renderWrong(); toast(t('toast.clearedWrong')); } });
  $('resetStatsBtn').addEventListener('click', () => { if (confirm(t('confirm.resetStats'))) { save(ekey(K.stats), { total: 0, correct: 0, cat: {} }); save(ekey(K.history), []); renderStats(); toast(t('toast.resetStats')); } });
}
function syncSeg() { $('writingSeg').querySelectorAll('.seg__btn').forEach((b) => { b.classList.toggle('seg__btn--active', b.dataset.wt === writingType); }); }

window.addEventListener('DOMContentLoaded', init);

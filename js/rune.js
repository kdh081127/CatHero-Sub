let runeData = [];
let currentFilter = { type: 'all', grade: 'all' };

// 1. JSON 파일 불러오기
async function loadRuneDB() {
  try {
    const res = await fetch('data/runes.json');
    runeData = await res.json();
    renderRuneList();
  } catch (err) {
    console.error("룬 데이터 로드 실패:", err);
  }
}

// 2. 필터 처리
function filterRunes(category, value) {
  currentFilter[category] = value;
  renderRuneList();
}

// 3. 카드 리스트 화면 출력
function renderRuneList() {
  const grid = document.getElementById('rune-card-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const filtered = runeData.filter(rune => {
    const typeMatch = currentFilter.type === 'all' || rune.type === currentFilter.type;
    const gradeMatch = currentFilter.grade === 'all' || rune.grade === currentFilter.grade;
    return typeMatch && gradeMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">조건에 맞는 룬이 없습니다.</div>`;
    return;
  }

  filtered.forEach(rune => {
    const typeText = rune.type === 'main' ? '메인 룬' : '서브 룬';
    const gradeNames = {
      common: '커먼', uncommon: '언커먼', rare: '레어',
      epic: '에픽', legend: '전설', mythic: '신화', transcendent: '초월'
    };

    const card = document.createElement('div');
    card.className = 'rune-card';
    card.innerHTML = `
      <div class="rune-badge-group">
        <span class="rune-type-badge">${typeText}</span>
        <span class="rune-type-badge grade-${rune.grade}">${gradeNames[rune.grade]}</span>
      </div>
      <div class="rune-card-title">${rune.name}</div>
      <div class="rune-card-desc">${rune.description}</div>
    `;
    grid.appendChild(card);
  });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadRuneDB);
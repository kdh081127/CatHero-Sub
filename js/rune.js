let runeData = [];
let currentFilter = { type: "all", grade: "all" };

// 등급/타입 표기용 매핑
const RUNE_GRADE_NAMES = {
    common: "커먼",
    uncommon: "언커먼",
    rare: "레어",
    epic: "에픽",
    legendary: "전설",
    mythic: "신화",
    ascension: "초월",
};
const RUNE_TYPE_NAMES = {
    main: "메인 룬",
    sub: "서브 룬",
};

// 1. 룬 도감 데이터 불러오기 (메인 + 서브 룬 전체)
async function loadRuneDB() {
    try {
        runeData = await fetchAllRunes();
        renderRuneList();
    } catch (err) {
        console.error("룬 데이터 로드 실패:", err);
    }
}

// 2. 필터 처리 (type: 'all' | 'main' | 'sub', grade: 'all' | 등급명)
function filterRunes(category, value) {
    currentFilter[category] = value;
    renderRuneList();
}

// 3. 카드 리스트 화면 출력 (룬 도감 - #rune-card-grid)
function renderRuneList() {
    const grid = document.getElementById("rune-card-grid");
    if (!grid) return;

    const filtered = runeData.filter((rune) => {
        const typeMatch =
            currentFilter.type === "all" || rune.type === currentFilter.type;
        const gradeMatch =
            currentFilter.grade === "all" || rune.grade === currentFilter.grade;
        return typeMatch && gradeMatch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">조건에 맞는 룬이 없습니다.</div>`;
        return;
    }

    grid.innerHTML = filtered
        .map(
            (rune) => `
        <div class="rune-card ${rune.grade}" data-id="${rune.id}">
            <div class="rune-badge-group">
                <span class="rune-type-badge">${RUNE_TYPE_NAMES[rune.type] || ""}</span>
                <span class="rune-type-badge grade-${rune.grade}">${RUNE_GRADE_NAMES[rune.grade] || rune.grade}</span>
            </div>
            <div class="rune-img-wrapper">
                <img src="${rune.image}" alt="${rune.name}" class="rune-icon" loading="lazy" />
            </div>
            <span class="rune-name">${rune.name}</span>
        </div>
    `,
        )
        .join("");
}

// 페이지 로드 시 룬 도감 데이터 로드
document.addEventListener("DOMContentLoaded", loadRuneDB);
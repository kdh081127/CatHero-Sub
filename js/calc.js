/**
 * calc.js - 덱 구성 추천 계산 로직 (준비 중)
 * ----------------------------------------------------------------------
 * 예전에는 이 파일이 PVP 명중/회피 실험(회피 타수 계산기, 방어관통 딜 계산기)
 * 로직을 담고 있었지만, 해당 기능은 전면 삭제하고 "덱 구성 추천" 기능으로
 * 방향을 바꿨습니다.
 *
 * 덱 구성 추천 로직은 companion.json / 룬 데이터가 다 채워진 뒤에 이 파일에
 * 채워 넣을 예정입니다. 설계 방향은 index.html의 #panel-deck-recommend
 * 안내 박스에 정리되어 있습니다 (공격력 100/1 고정, 12성·25성·10각 기준점).
 *
 * 아래 유틸 함수들은 이전 계산기에서도 쓰던 범용 헬퍼라 그대로 남겨뒀습니다.
 * ----------------------------------------------------------------------
 */

function getNumberInput(id) {
    const el = document.getElementById(id);
    const value = el ? parseFloat(el.value) : 0;
    return Number.isFinite(value) ? value : 0;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function renderResultBox(boxId, rows, footnote, gauge) {
    const box = document.getElementById(boxId);
    if (!box) return;

    const gaugePct = gauge ? clamp(gauge.percent, 0, 100) : 0;
    const gaugeHtml = gauge ? `
        <div class="result-gauge-row">
            <div class="result-gauge" style="--gauge-pct: ${gaugePct};">
                <span class="result-gauge-value">${gauge.percent.toFixed(1)}%</span>
            </div>
            <div class="result-gauge-caption">
                <span class="result-gauge-label">${gauge.label}</span>
                <span class="result-gauge-desc">${gauge.desc || ""}</span>
            </div>
        </div>
    ` : "";

    box.innerHTML = `
        ${gaugeHtml}
        <div class="result-rows">
            ${rows.map((r) => `
                <div class="result-row">
                    <span class="result-label">${r.label}</span>
                    <span class="result-value">${r.value}</span>
                </div>
            `).join("")}
        </div>
        ${footnote ? `<p class="result-footnote">⚠️ ${footnote}</p>` : ""}
    `;
    box.classList.remove("hidden");
}

/* ==========================================================================
   TODO: 덱 구성 추천 계산 함수는 companion.json 완성 후 여기에 구현
   ========================================================================== */
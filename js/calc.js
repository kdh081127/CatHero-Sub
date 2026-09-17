/**
 * calc.js - 덱 구성 추천 계산 로직
 * ----------------------------------------------------------------------
 * 기본 공격력(1~10,000)을 직접 조정할 수 있고, 장착한 동료·스킬의
 * "보유 효과" 문구에서 공격력 증폭(%) 값을 읽어와 최종 공격력을 구합니다.
 * 장착한 스킬마다 "효과" 문구 안의 가장 큰 퍼센트 수치를 대표 피해 계수로
 * 삼아 예상 피해량을 계산합니다. 효과 문구를 정규식으로 파싱하는 방식이라
 * 정확한 게임 내 공식이 아닌 근사치입니다.
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
   기본 공격력 슬라이더 ↔ 숫자 입력 양방향 연동 (1 ~ 10,000)
   ========================================================================== */
function initBaseAtkControl() {
    const slider = document.getElementById("base-atk-slider");
    const input = document.getElementById("base-atk-input");
    if (!slider || !input) return;

    const clampAtk = (v) => clamp(Math.round(v), 1, 10000);

    slider.addEventListener("input", () => {
        input.value = slider.value;
    });
    input.addEventListener("input", () => {
        const v = parseInt(input.value, 10);
        if (Number.isFinite(v)) slider.value = clampAtk(v);
    });
    input.addEventListener("blur", () => {
        const v = clampAtk(parseInt(input.value, 10) || 1);
        input.value = v;
        slider.value = v;
    });
}

document.addEventListener("DOMContentLoaded", initBaseAtkControl);

function getBaseAttack() {
    const input = document.getElementById("base-atk-input");
    const v = input ? parseInt(input.value, 10) : 100;
    return clamp(Number.isFinite(v) ? v : 100, 1, 10000);
}

/* ==========================================================================
   장착된 동료/스킬의 "보유 효과" 문구에서 공격력 증폭(%) 값을 읽어옴
   예: "공격력 증폭 +40%" -> 40
   ========================================================================== */
function extractBonusPercent(text) {
    if (!text) return 0;
    const m = String(text).match(/\+\s*(\d+(?:\.\d+)?)\s*%/);
    return m ? parseFloat(m[1]) : 0;
}

// 스킬 "효과" 문구 안의 모든 퍼센트(%) 수치를 뽑아, 가장 큰 값을
// 그 스킬의 대표 피해 계수로 사용 (문구가 제각각이라 근사치입니다)
function extractMaxPercent(text) {
    if (!text) return 0;
    const matches = String(text).match(/(\d+(?:\.\d+)?)\s*%/g) || [];
    if (!matches.length) return 0;
    return Math.max(...matches.map((m) => parseFloat(m)));
}

/* ==========================================================================
   덱 구성 추천: 기본 공격력 + 장착한 동료·스킬 보유효과로 최종 공격력을 구하고,
   장착한 스킬마다 효과 문구의 최대 퍼센트로 예상 피해량을 계산
   ========================================================================== */
function calcDeckDamage() {
    const baseAtk = getBaseAttack();

    let bonusPercent = 0;
    const bonusRows = [];

    (userState.equippedCompanions || []).forEach((key) => {
        if (!key || typeof companionData === "undefined") return;
        const c = companionData.find((x) => x.image === key);
        if (!c) return;
        const pct = extractBonusPercent(c.holdEffect25 || c.holdEffect12 || c.holdEffect);
        if (pct > 0) {
            bonusPercent += pct;
            bonusRows.push({ label: `🐾 ${c.name || "동료"}`, value: `+${pct}%` });
        }
    });

    (userState.equippedSkills || []).forEach((key) => {
        if (!key || typeof skillData === "undefined") return;
        const s = skillData.find((x) => x.image === key);
        if (!s) return;
        const pct = extractBonusPercent(s.holdEffect);
        if (pct > 0) {
            bonusPercent += pct;
            bonusRows.push({ label: `✨ ${s.name || "스킬"}`, value: `+${pct}%` });
        }
    });

    const finalAtk = baseAtk * (1 + bonusPercent / 100);

    let totalDamage = 0;
    const skillRows = [];
    (userState.equippedSkills || []).forEach((key) => {
        if (!key || typeof skillData === "undefined") return;
        const s = skillData.find((x) => x.image === key);
        if (!s) return;
        const coeffPercent = extractMaxPercent(s.effect);
        const dmg = finalAtk * (coeffPercent / 100);
        totalDamage += dmg;
        skillRows.push({
            label: `${s.name || "스킬"} (${coeffPercent}%)`,
            value: dmg.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        });
    });

    const box = document.getElementById("deck-damage-result");
    if (!box) return;

    if (skillRows.length === 0) {
        box.innerHTML = `
            <div class="result-rows">
                <div class="result-row">
                    <span class="result-label">기본 공격력</span>
                    <span class="result-value">${baseAtk.toLocaleString()}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">최종 공격력 (보유효과 +${bonusPercent}% 반영)</span>
                    <span class="result-value">${finalAtk.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            </div>
            <p class="result-footnote">⚠️ 장착된 스킬이 없어서 예상 딜량은 계산할 수 없습니다. 4번 탭에서 스킬을 먼저 장착해주세요.</p>
        `;
        box.classList.remove("hidden");
        return;
    }

    box.innerHTML = `
        <div class="result-rows">
            <div class="result-row">
                <span class="result-label">기본 공격력</span>
                <span class="result-value">${baseAtk.toLocaleString()}</span>
            </div>
            <div class="result-row">
                <span class="result-label">보유효과 공격력 증폭 합계</span>
                <span class="result-value">+${bonusPercent}%</span>
            </div>
            <div class="result-row">
                <span class="result-label">최종 공격력</span>
                <span class="result-value">${finalAtk.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
        </div>
        <div class="deck-damage-skill-breakdown">
            <span class="deck-damage-breakdown-label">스킬별 예상 피해량</span>
            <div class="result-rows">
                ${skillRows.map((r) => `
                    <div class="result-row">
                        <span class="result-label">${r.label}</span>
                        <span class="result-value">${r.value}</span>
                    </div>
                `).join("")}
            </div>
        </div>
        <div class="deck-damage-total">
            <span>총 예상 딜량</span>
            <b>${totalDamage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>
        </div>
        <p class="result-footnote">⚠️ 스킬 효과 문구에서 가장 큰 퍼센트 수치를 자동으로 읽어와 계산한 근사치입니다. 지속시간·타수·중첩 등은 반영되지 않았습니다.</p>
    `;
    box.classList.remove("hidden");
}

/* ==========================================================================
   TODO: 12성/25성/10각 기준점별 비교, 룬 효과까지 포함한 정밀 계산은 추후 확장
   ========================================================================== */
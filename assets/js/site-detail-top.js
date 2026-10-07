// S : A/B 테스트  
function abTestFn(){

    // URL에 &12345qwert가 포함된 경우 A/B 테스트 제외 
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has("12345qwert")) return;

    const $el     = $(".prdDetailModulChk");
    const current = $el.data("prdnum");
    // jQuery .data()는 빈 문자열/타입 변환이 애매할 수 있어,
    // "속성만 있고 값이 비어있는" 케이스를 확실히 ended 처리하기 위해 attr()로 원본을 읽는다.
    const typeBRaw = $el.attr("data-prdnum-type-b");
    const typeB    = typeBRaw && String(typeBRaw).trim() ? String(typeBRaw).trim() : null;

    if( !current ) return;

    // typeB 기준으로 키 관리 (A페이지: typeB, B페이지: current → 동일한 B 상품번호)
    const tBNum      = typeB || current;
    const storageKey = `abTest_${tBNum}`;   // 배정 결과 (A 또는 B 상품번호)
    const bPrdKey    = `bPrd_${tBNum}`;     // B 상품번호 확인용
    const aMapKey    = `aMap_${current}`;   // A페이지에서 저장하는 B번호 매핑 (종료 시 역추적용)
    const stored     = localStorage.getItem(storageKey);

    // 배정 기록이 오래된 경우(테스트 종료/운영변경 후) stale redirect가 날 수 있으니 TTL로 방지
    const ABTEST_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14일
    const tsKey = `abTestTs_${tBNum}`;
    const tsVal = localStorage.getItem(tsKey);
    const isStale = tsVal ? (Date.now() - Number(tsVal)) > ABTEST_TTL_MS : false;

    // 'ABTEST_TTL_MS' 제한 없이 진행 시
    // const isStale = false;

    function redirectTo(productNo){
        const params    = new URLSearchParams(window.location.search);
        const skinMatch = window.location.pathname.match(/\/skin-(?:skin|mobile)(\d+)/);
        params.set('product_no', productNo);
        location.replace(skinMatch
            ? `${skinMatch[0]}/product/detail.html?${params.toString()}`
            : `/product/detail.html?${params.toString()}`);
    }
    // 해당 테스트의 키만 선택적으로 제거 (동시 다발 테스트 대응)
    function clearAbTestKeys(bNum){
        localStorage.removeItem(`abTest_${bNum}`);
        localStorage.removeItem(`bPrd_${bNum}`);
        localStorage.removeItem(`aMap_${current}`);
        localStorage.removeItem(`abTestTs_${bNum}`);
    }

    if( typeB ){
        // ── A 페이지 ──────────────────────────────────────────
        if( isStale ) {
            clearAbTestKeys(tBNum);
        }

        if( !stored || isStale ){
            // 최초 접근: 랜덤 분기
            const assigned = Math.random() < 0.5 ? String(typeB) : String(current);
            localStorage.setItem(storageKey, assigned);
            localStorage.setItem(bPrdKey, String(typeB));
            localStorage.setItem(aMapKey, String(typeB));   // A → B 매핑 저장
            localStorage.setItem(tsKey, String(Date.now()));
            if( assigned !== String(current) ){
                redirectTo(assigned);
            }
        } else {
            // 재방문: 배정된 페이지와 다르면 이동 (localStorage는 string, data()는 number → !== 비교)
            if( stored !== String(current) ) redirectTo(stored);
        }
    } else {
        // ── typeB 없음: A/B 테스트 종료된 A페이지 또는 B페이지 ──
        const prevTypeB = localStorage.getItem(aMapKey);

        if( prevTypeB ){
            // A페이지에서 typeB가 제거됨 → 해당 테스트 키만 정리
            clearAbTestKeys(prevTypeB);
        } else if( stored ){
            // 진행중 테스트(B페이지인 경우 included)에는 안정적으로 남기고,
            // stale(만료)인 경우에만 정리한다.
            if( isStale ){
                clearAbTestKeys(stored);
            } else if( stored !== String(current) ){
                // 사용자가 다른 쪽으로 배정되어 있는 상태가 감지되면, 상태만 정리
                clearAbTestKeys(stored);
            }
        }
    }
}
abTestFn();
// E : A/B 테스트


// S : A/B 테스트 내부 표시 뱃지 (허용 IP에서만 노출)
(function abStaffBadge(){
    const STAFF_IP_HASHES = [
        '50c34d3e22071f44d76cf5a9604917ecd72fc7fada787a18278ecd2ccd59cd8f', // 사무실
        '364f845f555a1af3c62011a6ae085de4415febdc5ce79bc255e0c390a6a6ea10', // SK
        '8fee21d162d8ee3b1b933a86742deba4e3f05c7344642ecb642b9c2bad25b376'  // TCK
    ];
    const STAFF_CACHE_KEY = 'abStaffIP';     // sessionStorage: '1' 허용 / '0' 미허용
    const PAIR_PARAM      = 'ab_a';          // 뱃지에서 B안으로 이동 시 A안 상품번호 전달용

    // 모바일(768px 이하)에서는 표시하지 않음 (IP 조회도 생략)
    if( window.matchMedia('(max-width: 768px)').matches ) return;

    const $el     = $(".prdDetailModulChk");
    const current = String($el.data("prdnum") || "");
    if( !current ) return;

    const params   = new URLSearchParams(location.search);
    const typeBRaw = $el.attr("data-prdnum-type-b");
    const typeB    = typeBRaw && String(typeBRaw).trim() ? String(typeBRaw).trim() : null;

    // A/B 판별: A안은 data-prdnum-type-b 존재, B안은 뱃지 링크 파라미터 또는 localStorage로만 확인 가능
    let role = null, aNum = null, bNum = null;
    if( typeB ){
        role = 'A'; aNum = current; bNum = typeB;
    } else if( params.get(PAIR_PARAM) ){
        role = 'B'; aNum = params.get(PAIR_PARAM); bNum = current;
    } else {
        try {
            if( localStorage.getItem(`bPrd_${current}`) === current ){
                role = 'B'; bNum = current;
                // aMap_{A} = B 매핑에서 A안 상품번호 역추적
                for( let i = 0; i < localStorage.length; i++ ){
                    const key = localStorage.key(i);
                    if( key && key.indexOf('aMap_') === 0 && localStorage.getItem(key) === current ){
                        aNum = key.slice(5);
                        break;
                    }
                }
            }
        } catch(e) {}
    }
    if( !role ) return;

    async function sha256(text){
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function isStaffIP(){
        try {
            const cached = sessionStorage.getItem(STAFF_CACHE_KEY);
            if( cached !== null ) return cached === '1';
        } catch(e) {}
        try {
            const res    = await fetch('https://api64.ipify.org?format=json');
            const { ip } = await res.json();
            const ok     = STAFF_IP_HASHES.includes(await sha256(ip));
            try { sessionStorage.setItem(STAFF_CACHE_KEY, ok ? '1' : '0'); } catch(e) {}
            return ok;
        } catch(e) {
            return false;
        }
    }

    // A/B 배정 없이(12345qwert) 양쪽 안을 자유롭게 볼 수 있는 상세페이지 URL 생성
    function viewUrl(productNo, pairA){
        const p         = new URLSearchParams(location.search);
        const skinMatch = location.pathname.match(/\/skin-(?:skin|mobile)(\d+)/);
        p.set('product_no', productNo);
        p.set('12345qwert', '');
        if( pairA ) p.set(PAIR_PARAM, pairA); else p.delete(PAIR_PARAM);
        return (skinMatch ? `${skinMatch[0]}/product/detail.html` : '/product/detail.html') + '?' + p.toString();
    }

    function render(){
        const MIN_KEY = 'abStaffBadgeMin';
        const style = document.createElement('style');
        style.textContent = `
            .ab-staff-badge{position:fixed;left:max(12px,env(safe-area-inset-left));top:max(12px,env(safe-area-inset-top));
                z-index:9999998;display:flex;align-items:center;gap:10px;padding:6px 6px 6px 12px;
                background:rgba(17,17,20,.88);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
                border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#f4f4f5;
                font:500 12px/1 -apple-system,BlinkMacSystemFont,"Pretendard","Apple SD Gothic Neo",sans-serif;
                box-shadow:0 8px 24px rgba(0,0,0,.25);user-select:none;transition:padding .2s ease}
            .ab-staff-badge *{box-sizing:border-box}
            .ab-staff-head{display:flex;align-items:center;gap:7px;height:28px;cursor:pointer;white-space:nowrap}
            .ab-staff-head > span{display:inline-flex;align-items:center;height:14px;line-height:14px}
            .ab-staff-head > .ab-staff-dot{width:7px;height:7px;flex:none;border-radius:50%;background:#facc15;
                box-shadow:0 0 0 0 rgba(250,204,21,.6);animation:abStaffPulse 1.8s infinite}
            .ab-staff-label{font-weight:700;font-size:10px;letter-spacing:.08em;color:#facc15}
            .ab-staff-sub{color:#a1a1aa;font-size:11px}
            .ab-staff-seg{display:flex;align-items:center;padding:2px;border-radius:8px;background:rgba(255,255,255,.08)}
            .ab-staff-seg a,.ab-staff-seg span{display:inline-flex;align-items:center;justify-content:center;
                min-width:30px;height:24px;padding:0 9px;border-radius:6px;line-height:1;
                color:#d4d4d8;font-weight:700;font-size:12px;text-decoration:none;transition:background .15s,color .15s}
            .ab-staff-seg a:hover{background:rgba(255,255,255,.12);color:#fff}
            .ab-staff-seg .is-current{background:#fafafa;color:#18181b;pointer-events:none}
            .ab-staff-seg .is-disabled{color:#52525b;pointer-events:none}
            .ab-staff-badge.is-min{padding:6px 10px}
            .ab-staff-badge.is-min .ab-staff-sub,.ab-staff-badge.is-min .ab-staff-seg{display:none}
            @keyframes abStaffPulse{70%{box-shadow:0 0 0 6px rgba(250,204,21,0)}100%{box-shadow:0 0 0 0 rgba(250,204,21,0)}}
            @media (prefers-reduced-motion:reduce){.ab-staff-dot{animation:none}}
        `;
        document.head.appendChild(style);

        const segA = aNum
            ? `<a href="${viewUrl(aNum)}" class="${role === 'A' ? 'is-current' : ''}" title="A안 #${aNum}">A</a>`
            : `<span class="is-disabled" title="A안 번호 확인 불가">A</span>`;
        const segB = `<a href="${viewUrl(bNum, aNum)}" class="${role === 'B' ? 'is-current' : ''}" title="B안 #${bNum}">B</a>`;

        const badge = document.createElement('div');
        badge.className = 'ab-staff-badge';
        badge.innerHTML =
              `<div class="ab-staff-head" title="내부 IP 전용 표시 · 클릭하면 접기/펼치기">`
            +   `<span class="ab-staff-dot"></span>`
            +   `<span class="ab-staff-label">A/B TEST</span>`
            +   `<span class="ab-staff-sub">현재 ${role}안</span>`
            + `</div>`
            + `<div class="ab-staff-seg">${segA}${segB}</div>`;

        try { if( localStorage.getItem(MIN_KEY) === '1' ) badge.classList.add('is-min'); } catch(e) {}
        badge.querySelector('.ab-staff-head').addEventListener('click', () => {
            const min = badge.classList.toggle('is-min');
            try { localStorage.setItem(MIN_KEY, min ? '1' : '0'); } catch(e) {}
        });
        document.body.appendChild(badge);
    }

    isStaffIP().then(ok => {
        if( !ok ) return;
        if( document.body ) render();
        else document.addEventListener('DOMContentLoaded', render);
    });
})();
// E : A/B 테스트 내부 표시 뱃지
// S : A/B 테스트  
function abTestFn(){
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

    function redirectTo(productNo){
        const params    = new URLSearchParams(window.location.search);
        const skinMatch = window.location.pathname.match(/\/skin-(?:skin|mobile)(\d+)/);
        params.set('product_no', productNo);
        location.href = skinMatch
            ? `${skinMatch[0]}/product/detail.html?${params.toString()}`
            : `/product/detail.html?${params.toString()}`;
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
                clearAbTestKeys(current);
            }
        }
    }
}
abTestFn();
// E : A/B 테스트
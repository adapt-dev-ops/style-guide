// S : A/B 테스트  
function abTestFn(){
    const $el     = $(".prdDetailModulChk");
    const current = $el.data("prdnum");
    const typeB   = $el.data("prdnum-type-b");

    if( !current ) return;

    // typeB 기준으로 키 관리 (A페이지: typeB, B페이지: current → 동일한 B 상품번호)
    const tBNum      = typeB || current;
    const storageKey = `abTest_${tBNum}`;   // 배정 결과 (A 또는 B 상품번호)
    const bPrdKey    = `bPrd_${tBNum}`;     // B 상품번호 확인용
    const aMapKey    = `aMap_${current}`;   // A페이지에서 저장하는 B번호 매핑 (종료 시 역추적용)
    const stored     = localStorage.getItem(storageKey);

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
    }

    if( typeB ){
        // ── A 페이지 ──────────────────────────────────────────
        if( !stored ){
            // 최초 접근: 랜덤 분기
            const assigned = Math.random() < 0.5 ? String(typeB) : String(current);
            localStorage.setItem(storageKey, assigned);
            localStorage.setItem(bPrdKey, String(typeB));
            localStorage.setItem(aMapKey, String(typeB));   // A → B 매핑 저장
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
            // B페이지 재방문: stored !== current 이면 비정상 데이터 → 정리
            if( stored !== String(current) ){
                clearAbTestKeys(current);
            }
        }
    }
}
abTestFn();
// E : A/B 테스트
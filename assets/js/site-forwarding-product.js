(function () {
    // PAGE_DOWN_REDIRECTS: 페이지 단위 다운 수동 on/off (Lambda가 enabled 플래그를 자동 업데이트)
    var PAGE_DOWN_REDIRECTS = [
      // 푸드올로지
      { enabled: false, brand: '푸드', productNo: '1213', name: '다이어트 유산균',    naverUrl: 'https://brand.naver.com/foodology/products/10811153730' },
      { enabled: false, brand: '푸드', productNo: '2495', name: '헤이 그로우',        naverUrl: 'https://brand.naver.com/foodology/products/13303691744' },
      { enabled: false, brand: '푸드', productNo: '1979', name: '올리브오일',         naverUrl: 'https://brand.naver.com/foodology/products/12022418475' },
      { enabled: false, brand: '푸드', productNo: '2196', name: '오일만 클렌즈',      naverUrl: 'https://brand.naver.com/foodology/products/12717366675' },
      { enabled: false, brand: '푸드', productNo: '233',  name: '2주 SET',            naverUrl: 'https://brand.naver.com/foodology/products/10067959187' },
      { enabled: false, brand: '푸드', productNo: '1207', name: '톡스 ABC',           naverUrl: 'https://brand.naver.com/foodology/products/11706457076' },
      { enabled: false, brand: '푸드', productNo: '2050', name: '톡스 CCA',           naverUrl: 'https://brand.naver.com/foodology/products/12241760572' },
      { enabled: false, brand: '푸드', productNo: '2331', name: '올리브 레몬샷',      naverUrl: 'https://brand.naver.com/foodology/products/13027130778' },
      { enabled: false, brand: '푸드', productNo: '1993', name: '레몬그린티',         naverUrl: 'https://brand.naver.com/foodology/products/12022506788' },
      { enabled: false, brand: '푸드', productNo: '991',  name: '다이어트 1+1',       naverUrl: 'https://brand.naver.com/foodology/best?cp=1' },
      // 오브제
      { enabled: false, brand: '오브제', productNo: '818',  name: '포어 제로 선스틱',    naverUrl: 'https://brand.naver.com/obge/products/8638040002' },
      { enabled: false, brand: '오브제', productNo: '1096', name: '오일 컨트롤 피니셔',  naverUrl: 'https://brand.naver.com/obge/products/12521598451' },
      { enabled: false, brand: '오브제', productNo: '1460', name: '액티브 선스틱',       naverUrl: 'https://brand.naver.com/obge/products/13223782192' },
      { enabled: false, brand: '오브제', productNo: '474',  name: '커버 로션',           naverUrl: 'https://brand.naver.com/obge/products/10310142352' },
      { enabled: false, brand: '오브제', productNo: '1251', name: '맥스 선크림',         naverUrl: 'https://brand.naver.com/obge/products/13040704392' },
      { enabled: false, brand: '오브제', productNo: '1557', name: '톤업 선스틱',         naverUrl: 'https://brand.naver.com/obge/products/13634275558' },
      { enabled: false, brand: '오브제', productNo: '9',    name: '파운데이션',          naverUrl: 'https://brand.naver.com/obge/products/6805527445' },
      { enabled: false, brand: '오브제', productNo: '728',  name: '포어 제로 3종 세트',  naverUrl: 'https://brand.naver.com/obge/products/12144835978' },
      { enabled: false, brand: '오브제', productNo: '528',  name: '클레이팩',            naverUrl: 'https://brand.naver.com/obge/products/11146596595' },
      { enabled: false, brand: '오브제', productNo: '10',   name: '커버 쿠션',           naverUrl: 'https://brand.naver.com/obge/products/6805521311' },
      // 95PROBLEM
      { enabled: false, brand: '95', productNo: '608',  name: '슬림 벨트',        naverUrl: 'https://brand.naver.com/balancefit/products/10413773394' },
      { enabled: false, brand: '95', productNo: '517',  name: '종아리 마사지기',   naverUrl: 'https://brand.naver.com/balancefit/products/9898622480' },
      { enabled: false, brand: '95', productNo: '655',  name: '체어 마사지기',     naverUrl: 'https://brand.naver.com/balancefit/products/10824643912' },
      { enabled: false, brand: '95', productNo: '554',  name: '압박스타킹 세트',   naverUrl: 'https://brand.naver.com/balancefit/products/7077204865' },
      { enabled: false, brand: '95', productNo: '1291', name: '브이라인 밴드',     naverUrl: 'https://brand.naver.com/balancefit/products/12913541553' },
      { enabled: false, brand: '95', productNo: '1347', name: '리커버리 밴드',     naverUrl: 'https://brand.naver.com/balancefit/products/13176596599' },
      { enabled: false, brand: '95', productNo: '1452', name: '하비컷 레깅스',     naverUrl: 'https://brand.naver.com/balancefit/products/13635950633' },
      { enabled: false, brand: '95', productNo: '12',   name: 'BEST',             naverUrl: 'https://brand.naver.com/balancefit/best?cp=1' },
      // 풀리
      { enabled: false, brand: '풀리', productNo: '463', name: '멜팅 크림 투 오일',   naverUrl: 'https://brand.naver.com/full-y/products/13326717348' },
      { enabled: false, brand: '풀리', productNo: '465', name: '노세범 젤리 파우더',  naverUrl: 'https://brand.naver.com/full-y/products/13381655896' },
      { enabled: false, brand: '풀리', productNo: '28',  name: '클레이 팩 클렌저',    naverUrl: 'https://brand.naver.com/full-y/products/10482279005' },
      { enabled: false, brand: '풀리', productNo: '117', name: '쌀 선크림',           naverUrl: 'https://brand.naver.com/full-y/products/11859576037' },
      { enabled: false, brand: '풀리', productNo: '535', name: '노세범 선스틱',        naverUrl: 'https://brand.naver.com/full-y/products/13558473296' },
      { enabled: false, brand: '풀리', productNo: '291', name: '톤업 선크림',          naverUrl: 'https://brand.naver.com/full-y/products/13026521247' },
      { enabled: false, brand: '풀리', productNo: '132', name: '쌀 팩 클렌저',         naverUrl: 'https://brand.naver.com/full-y/products/12071284453' },
      { enabled: false, brand: '풀리', productNo: '85',  name: '쌀 세라마이드 3종',    naverUrl: 'https://brand.naver.com/full-y/category/e68b1036c7c242d6bdd6aeb09028aeb3?cp=1' },
      // 에이페
      { enabled: false, brand: '에이페', productNo: '83', name: '부스팅 앰플', naverUrl: 'https://brand.naver.com/epais/products/12584537361' },
      // 닥터데이알
      { enabled: false, brand: 'drdayr', productNo: '51',  name: '멜라시럽',      naverUrl: 'https://brand.naver.com/8apm/products/12106955446' },
      { enabled: false, brand: 'drdayr', productNo: '25',  name: '포커스 젤',     naverUrl: 'https://brand.naver.com/8apm/products/11471195503' },
      { enabled: false, brand: 'drdayr', productNo: '150', name: '오메가3 유산균', naverUrl: 'https://brand.naver.com/8apm/products/13497890461' },
      { enabled: false, brand: 'drdayr', productNo: '11',  name: '멜라피스',      naverUrl: 'https://brand.naver.com/8apm/products/10893086064' },
      // 8APM
      { enabled: false, brand: '8apm', productNo: '51', name: '멜라시럽', naverUrl: 'https://brand.naver.com/8apm/products/12106955446' },
      { enabled: false, brand: '8apm', productNo: '11', name: '멜라피스', naverUrl: 'https://brand.naver.com/8apm/products/10893086064' },
      // [테스트] 확인 후 enabled: false로 변경
      { enabled: false,  brand: '푸드', productNo: '2691', name: '[테스트] 톡스올로지 클렌즈 48시간 ABC', naverUrl: 'https://brand.naver.com/foodology/products/11706457076' },
    ];

    var _pdBrandMap = {
      'food-ology.co.kr': '푸드',
      'obge.co.kr':       '오브제',
      '95problems.com':   '95',
      'full-y.co.kr':     '풀리',
      '8apm.co.kr':       '8apm',
      'drdayr.co.kr':     'drdayr',
      'epais.kr':         '에이페'
    };
    var _pdHostname = window.location.hostname.replace(/^www\./i, '').replace(/^m\./i, '');
    var _pdBrand = _pdBrandMap[_pdHostname];
    if (_pdBrand) {
      var _pdProductNo = new URLSearchParams(window.location.search).get('product_no');
      if (_pdProductNo) {
        for (var _pdi = 0; _pdi < PAGE_DOWN_REDIRECTS.length; _pdi++) {
          var _pdr = PAGE_DOWN_REDIRECTS[_pdi];
          if (_pdr.enabled && _pdr.brand === _pdBrand && _pdr.productNo === _pdProductNo) {
            console.log('[Forwarding] 페이지 다운 처리 → 네이버 리다이렉트:', _pdBrand, _pdProductNo, _pdr.naverUrl);
            window.location.replace(_pdr.naverUrl);
            return;
          }
        }
      }
    }

    /**
    * ------------------------------------------------------
    * 공용 포워딩 함수
    * - 현재 URL 파라미터를 "원형 그대로" 유지
    *   (ex. ?debug / ?12345qwert → '=' 없이 유지)
    * - 타겟 URL에 이미 존재하는 파라미터는 타겟 우선
    * - 중복 파라미터 자동 제거
    * ------------------------------------------------------
    */

    /* ======================================================
    * 사용 예시
    * ------------------------------------------------------
    * forwardMergeQuery(forwarding_link);
    * ====================================================== */

    function forwardMergeQuery(targetUrl) {
        targetUrl = (targetUrl == null ? '' : String(targetUrl)).trim();

        // ✅ 잘못된 타겟 방지 (여기 걸리면 절대 이동 안 함)
        if (!targetUrl || targetUrl === 'undefined' || targetUrl === 'null') return;

        // 현재 쿼리 원문 (? 제거)
        var curQuery = (location.search || '').replace(/^\?/, '');
        if (!curQuery) {
            location.href = targetUrl;
            return;
        }

        // 타겟을 path/query로 분리 (첫 '?' 기준)
        var qIdx = targetUrl.indexOf('?');
        var tPath = (qIdx >= 0) ? targetUrl.slice(0, qIdx) : targetUrl;
        var tQuery = (qIdx >= 0) ? targetUrl.slice(qIdx + 1) : '';

        // ✅ path가 이상하면 이동 안 함
        tPath = (tPath || '').trim();
        if (!tPath || tPath === 'undefined') return;

        // 타겟에 존재하는 키들 (타겟 우선)
        var tKeys = Object.create(null);
        if (tQuery) {
            tQuery.split('&').forEach(function (seg) {
                if (!seg) return;
                var k = decodeURIComponent((seg.split('=')[0] || '').trim());
                if (k) tKeys[k] = 1;
            });
        }

        // 현재 쿼리에서 "타겟에 없는 키"만 원형 유지로 추가
        var keep = [];
        curQuery.split('&').forEach(function (seg) {
            if (!seg) return;
            var k = decodeURIComponent((seg.split('=')[0] || '').trim());
            if (k && !tKeys[k]) keep.push(seg); // ✅ seg 원형 유지 (flag면 '=' 없음)
        });

        var finalQuery = tQuery + (tQuery && keep.length ? '&' : '') + keep.join('&');
        location.href = tPath + (finalQuery ? '?' + finalQuery : '');
    }

    var forwarding_link_always = ($(".forwarding_link_always").text() || "").trim();
    var forwarding_link        = ($(".forwarding_link").text() || "").trim();
    // ✅ 모바일에서 특히 중요: HTML 엔티티 &amp; → &
    forwarding_link = forwarding_link.replace(/&amp;/g, '&');                        
    var forwarding_day         = ($(".forwarding_day").text() || "").trim();
    var forwarding_time        = ($(".forwarding_time").text() || "").trim();
    var forwarding_period      = ($(".forwarding_period").text() || "").trim();
    var forwarding_today = new Date();
    var url_search = window.location.search;
    var forwarding_except = "12345qwert";

    if( forwarding_link ){
        // S : 강제 포워딩 제외 요일
        if( forwarding_day ){
            //console.log('forwarding_day : ' + forwarding_day);

            // '강제 포워딩 시간' 항목 ex.)토
            // '강제 포워딩 시간' 항목 ex.)토,일
            console.log("포워딩 요일 o : " + forwarding_day);
            var forwarding_daySplit = forwarding_day.split(",").map(v => v.trim());
            var forwarding_week = ['일', '월', '화', '수', '목', '금', '토'];
            var forwarding_dayChk = forwarding_today.getDay();//0~6:일~토

            if( forwarding_daySplit.includes(forwarding_week[forwarding_dayChk]) ){
                // console.log("요일 포함");
    
                // S : 강제 포워딩 제외 시간
                if( forwarding_time ){
                    console.log("forwarding_time : " + forwarding_time);
    
                    // 1) forwarding_time → 항상 배열로 표준화
                    var forwarding_timeList = forwarding_time.includes("/")
                        ? forwarding_time.split("/")
                        : [forwarding_time];
    
                    forwarding_timeList.forEach(function (timeItem, idx) {
                        // 2) "요일, HH:MM:SS" 파싱
                        var forwarding_timeSplit_commaSplit = timeItem.split(",").map(function (v) { return v.trim(); });
                        // console.log(forwarding_timeSplit_commaSplit);
    
                        // 방어: 포맷 이상하면 스킵
                        if (forwarding_timeSplit_commaSplit.length < 2) {
                            console.log("포맷 오류: '요일, HH:MM:SS' 형태가 아님");
                            return;
                        }
    
                        // 3) 시간(Date) 만들기
                        var forwarding_timeParts = forwarding_timeSplit_commaSplit[1].split(":");
                        var forwarding_time_chk = new Date(
                            new Date().setHours(
                                parseInt(forwarding_timeParts[0], 10) || 0,
                                parseInt(forwarding_timeParts[1], 10) || 0,
                                parseInt(forwarding_timeParts[2], 10) || 0
                            )
                        );
                        // console.log(forwarding_time_chk);
    
                        // 4) 요일 체크
                        if (forwarding_timeSplit_commaSplit[0].includes(forwarding_week[forwarding_dayChk])) {
                            console.log("요일 : " + forwarding_week[forwarding_dayChk]);
    
                            // 5) 시간 체크
                            if (forwarding_today < forwarding_time_chk) {
                                console.log("요일 + 지정한 시간 미만 = 포워딩 GO");
                                if (!url_search.includes(forwarding_except)) {
                                    forwardMergeQuery(forwarding_link);
                                }
                            } else {
                                console.log("요일 + 지정한 시간 초과 = 포워딩X");
                            }
                        } else {
                            console.log("요일에 해당되지 않음.");
                        }
                    });
                }
            }else{
                if( !url_search.includes(forwarding_except) ){
                    forwardMergeQuery(forwarding_link);
                }   
            }
        }
        // E : 강제 포워딩 제외 요일  

        // S : 강제 포워딩 기간 (시간포함)
        if( forwarding_period ){
            //console.log('forwarding_period : ' + forwarding_period);

            //ex.)2024/04/05 16:00:00~2024/04/08 08:30:00
            var forwarding_periodSplit = forwarding_period.split('~');
            var forwarding_periodStart = new Date(forwarding_periodSplit[0]);
            var forwarding_periodEnd = new Date(forwarding_periodSplit[1]);
            var forwarding_period_open = new Date(forwarding_periodStart.getFullYear(),forwarding_periodStart.getMonth(),forwarding_periodStart.getDate(),forwarding_periodStart.getHours(),forwarding_periodStart.getMinutes(),forwarding_periodStart.getSeconds());
            var forwarding_period_close = new Date(forwarding_periodEnd.getFullYear(),forwarding_periodEnd.getMonth(),forwarding_periodEnd.getDate(),forwarding_periodEnd.getHours(),forwarding_periodEnd.getMinutes(),forwarding_periodEnd.getSeconds());

            if( forwarding_today >= forwarding_period_open && forwarding_today < forwarding_period_close ){
                //console.log('기간 이프');                            
            }else{
                if( !url_search.includes(forwarding_except) ){
                    forwardMergeQuery(forwarding_link);
                }   
            }
        }
        // E : 강제 포워딩 기간 (시간포함)

        // 상세페이지 soldout 체크
        // ※'{$soldout_display|display}' 클래스가 들어간 'sold out' 버튼에 'btn_sold 클래스 추가
        document.addEventListener("DOMContentLoaded", function(){
            if( document.querySelector(".btn_sold") && !$(".btn_sold").hasClass("displaynone") ){
                if( !url_search.includes(forwarding_except) ){
                    forwardMergeQuery(forwarding_link);
                }                            
            }        
        });    
    }
    
    // S : 강제 포워딩 항시 진행
    if( forwarding_link_always ){
        if( !url_search.includes(forwarding_except) ){
            forwardMergeQuery(forwarding_link_always);
        }   
    }

    //'forwarding_link'는 있고 조건들은 없을 때 강제 포워딩 진행
    if( forwarding_link && !forwarding_day && !forwarding_time && !forwarding_period){
        if( !url_search.includes(forwarding_except) ){
            forwardMergeQuery(forwarding_link);
        }
    }
    // E : 강제 포워딩 항시 진행
})();
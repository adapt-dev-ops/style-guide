(function () {
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
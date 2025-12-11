/* ------------------------------------------------------
 * 01. &nbsp / 공백 자동삽입 제거
 * ------------------------------------------------------ */
(function () {
    var SEL = 'img,input,br,hr,meta,link,source,track,col,area,base,wbr,embed,param';

    function isSpace(n) {
        return n && n.nodeType === 3 && /^[\s\u00A0]+$/.test(n.nodeValue || '');
    }

    function matchesSel(el) {
        if (!el || el.nodeType !== 1) return false;
        var fn = el.matches || el.webkitMatchesSelector || el.msMatchesSelector;
        return fn ? fn.call(el, SEL) : false;
    }

    function clean(root) {
        if (!root) return;
        var els = root.querySelectorAll(SEL);
        els.forEach(function (el) {
            var n = el.nextSibling;
            while (isSpace(n)) {
                var next = n.nextSibling;
                if (n.parentNode) n.parentNode.removeChild(n);
                n = next;
            }
        });
    }

    function handleMutations(mutations) {
        mutations.forEach(function (m) {

            // 추가된 노드들 처리
            if (m.addedNodes && m.addedNodes.length) {
                m.addedNodes.forEach(function (n) {
                    if (n.nodeType === 1) {
                        clean(n); // 새 엘리먼트 아래 공백 정리
                    } else if (isSpace(n)) {
                        var prev = n.previousSibling;
                        if (matchesSel(prev) && n.parentNode) {
                            n.parentNode.removeChild(n);
                        }
                    }
                });
            }

            // 텍스트 노드 내용 변경된 경우
            if (m.type === 'characterData' && isSpace(m.target)) {
                var p = m.target.previousSibling;
                if (matchesSel(p) && m.target.parentNode) {
                    m.target.parentNode.removeChild(m.target);
                }
            }
        });
    }

    function start() {
        // 최초 한 번 전체 정리
        clean(document);

        // load 시 한 번 더 (지연 로딩 요소 대비)
        window.addEventListener('load', function () {
            clean(document);
        });

        var target = document.body;
        if (!target) return;

        var observer = new MutationObserver(handleMutations);
        observer.observe(target, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();

/* ------------------------------------------------------
 * 02. IP 기반 노출 제어
 * ------------------------------------------------------ */
(function ($) {
    $(function () {
        $.getJSON('https://api.ipify.org?format=json', function (res) {

            // 현재 접속자의 외부 IP
            var myIp = res.ip;

            // 허용할 IP (본인 IP로 교체)
            var allowedIp = '125.131.80.241';

            if (myIp === allowedIp) {
                $('.js-ipRestricted').show();    // 일치하면 노출
            } else {
                $('.js-ipRestricted').remove();  // 불일치 시 DOM에서 제거
            }
        });
    });
})(jQuery);

/* ------------------------------------------------------
 * 03. Debug Date/Time Override
 * URL 파라미터로 날짜/시간을 변경하여 테스트할 수 있습니다.
 * 
 * 사용법:
 * ?debug_date=2025-12-31                       -> 2025년 12월 31일로 변경
 * ?debug_time=14:30:00                         -> 당일 날짜의 14시 30분으로 변경
 * ?debug_date=2025-12-31&debug_time=14:30:00   -> 2025년 12월 31일 14시 30분으로 변경
 * ------------------------------------------------------ */
(function() {
    'use strict';
    
    // URL 파라미터 파싱 함수
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
  
    // 오버라이드할 날짜 가져오기
    function getOverrideDate() {
        // 1. timestamp로 직접 설정 (우선순위 높음)
        const timestamp = getUrlParameter('debug_timestamp');
        if (timestamp) {
            const ts = parseInt(timestamp, 10);
            if (!isNaN(ts)) {
                return new Date(ts);
            }
        }
        
        // 2. date & time 파라미터로 설정
        const dateParam = getUrlParameter('debug_date');
        const timeParam = getUrlParameter('debug_time');
        
        if (dateParam) {
            // debug_date가 있을 경우
            const time = timeParam || '00:00:00';
            const dateTimeStr = `${dateParam}T${time}`;
            const date = new Date(dateTimeStr);
            
            if (!isNaN(date.getTime())) {
                return date;
            }
        } else if (timeParam) {
            // debug_time만 있을 경우 (당일 날짜에 해당 시간 적용)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dateTimeStr = `${dateStr}T${timeParam}`;
            const date = new Date(dateTimeStr);
            
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        return null;
    }
  
    // Date 객체 오버라이드
    const overrideDate = getOverrideDate();
    
    if (overrideDate) {
        const OriginalDate = Date;
        const baseTime = overrideDate.getTime();
        const offsetTime = OriginalDate.now(); // 페이지 로드 시점의 실제 시간
        
        // Date 생성자 오버라이드
        window.Date = function(...args) {
            // 인자가 있으면 원래 Date 사용
            if (args.length > 0) {
                return new (Function.prototype.bind.apply(OriginalDate, [null].concat(args)));
            }
            
            // 인자가 없으면 오버라이드된 날짜 반환 (시간 경과 반영)
            const elapsed = OriginalDate.now() - offsetTime;
            return new OriginalDate(baseTime + elapsed);
        };
        
        // Date의 static 메서드들 복사
        window.Date.prototype = OriginalDate.prototype;
        window.Date.parse = OriginalDate.parse;
        window.Date.UTC = OriginalDate.UTC;
        
        // Date.now() 오버라이드
        window.Date.now = function() {
            const elapsed = OriginalDate.now() - offsetTime;
            return baseTime + elapsed;
        };
        
        // 디버그 헬퍼 함수
        window.getDebugDate = function() {
            return {
                override: new Date(),
                original: new OriginalDate(),
                timestamp: Date.now(),
                formatted: new Date().toLocaleString('ko-KR')
            };
        };
    }
})();

/* ------------------------------------------------------
 * 04. 사이트 전역 레이지로드 코드
 * ------------------------------------------------------ */
(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var started = false;
        var lazyloadThrottleTimeout;

        // -----------------------------
        // 공통: 비디오 로드 완료 표시
        // -----------------------------
        function markVideoLoaded(videoEl) {
            if (!videoEl) return;

            var wrap = videoEl.closest('.fr-video');
            if (!wrap) return;

            function onLoaded() {
                videoEl.removeEventListener('loadeddata', onLoaded);
                setTimeout(function () {
                    wrap.classList.add('is-video-loaded'); // CSS에서 커버/opacity 제거
                }, 10);
            }

            if (videoEl.readyState >= 2) {
                // 이미 어느 정도 로드됨
                onLoaded();
            } else {
                videoEl.addEventListener('loadeddata', onLoaded);
            }
        }

        // -----------------------------
        // lazy-src 가진 영상용 스크롤 핸들러
        // -----------------------------
        function lazyload() {
            if (lazyloadThrottleTimeout) {
                clearTimeout(lazyloadThrottleTimeout);
            }

            lazyloadThrottleTimeout = setTimeout(function () {

                $('video[lazy-src]').each(function () {
                    var $video  = $(this);
                    var videoEl = this;

                    // 기존 스크롤 조건 그대로
                    if ($(window).scrollTop() > $video.offset().top - (window.innerHeight * 2)) {

                        var lazyVideoSrc = $video.attr('lazy-src');
                        if (!lazyVideoSrc) return;

                        // 1) lazy-src → src 교체
                        $video.attr('src', lazyVideoSrc);
                        $video.removeAttr('lazy-src');

                        // 2) 로딩 완료 후 커버 제거
                        markVideoLoaded(videoEl);
                    }
                });

                // 더 이상 lazy 대상 없으면 스크롤 감시 종료
                if ($('video[lazy-src]').length === 0) {
                    document.removeEventListener('scroll', lazyload);
                }

            }, 20);
        }

        // -----------------------------
        // lazy + 일반(src) 영상 모두 시작
        // -----------------------------
        function startAllVideos() {
            if (started) return;
            started = true;

            // 1) lazy-src 가진 영상: 스크롤 기반 로딩
            if ($('.fr-video video[lazy-src]').length) {
                document.addEventListener('scroll', lazyload);
                lazyload();            // 첫 진입 시 한 번 실행
            }

            // 2) 처음부터 src 있는 영상: 그냥 로드되면 커버 제거
            $('.fr-video video').each(function () {
                var videoEl = this;

                // lazy-src 애들은 위에서 처리하므로 패스
                if (videoEl.hasAttribute('lazy-src')) return;

                if (videoEl.getAttribute('src')) {
                    markVideoLoaded(videoEl);
                }
            });
        }

        // -----------------------------
        // 크리마 iframe 끝나면 전체 시작
        // -----------------------------
        var cremas = document.querySelectorAll('iframe[id^="crema-product-reviews"]');

        // 크리마 iframe 없으면 바로 시작
        if (!cremas.length) {
            startAllVideos();
            return;
        }

        var pending = cremas.length;

        cremas.forEach(function (frame) {
            frame.addEventListener('load', function () {
                pending--;
                if (pending <= 0) {
                    startAllVideos();
                }
            });
        });

        // 혹시 load 이벤트 못 잡는 케이스 대비: 최대 3초 후 강제 시작
        setTimeout(startAllVideos, 3000);
    });
})();

/* ------------------------------------------------------
* 05. 할인율 자동 계산 (판매가 / 소비자가 기준) 
* ------------------------------------------------------ */
(function () {
    $(function () {
        $(".u-product .item").each(function(index, element){
            // 할인가(판매가)
            var sellingPrice = $(this).find(".priceStrong").text().toString().replace('원', "");
            $(this).find(".priceStrong").text(sellingPrice)
            sellingPrice = Math.floor(sellingPrice.replace(/,/g, ''));//소수점 버림

            // 소비자가
            var consumerPrice = $(this).find(".priceLine").text().toString().replace('원', "");
            $(this).find(".priceLine").text(consumerPrice)
            consumerPrice = Math.floor(consumerPrice.replace(/,/g, ''));//소수점 버림
            
            // 할인율
            var dcPercent = (1-(sellingPrice/consumerPrice))*100;
            $(this).find(".rate").html(Math.ceil(dcPercent)+"%");//소수점 버림

            // 할인율 계산
            consumerPrice = Math.floor(consumerPrice);
            sellingPrice  = Math.floor(sellingPrice);
            var dcPercent = (1 - (sellingPrice / consumerPrice)) * 100;
            var parentProduct = $(this).closest(".u-product"); // 부모 .u-product 찾기

            if (parentProduct.hasClass("rateOn")) {
                $(this).find(".price-box").prepend("<span class='rate'>" + Math.round(dcPercent) + "%</span>");
            } 
        });
    });
})();

/* ------------------------------------------------------
* 06. 아코디언 (FAQ 펼치기/닫기)
* ------------------------------------------------------ */
(function () {
    $(function () {
        $(".u-accordion .item").click(function(){
            if($(this).find(".answer").css("display") == "block") {
                // 이미 열려있으면 닫기
                $(this).removeClass("on").find(".answer").slideUp();
            } else {
                // 다른 항목 닫고 현재 클릭한 것만 열기
                $(".u-accordion .item").removeClass("on").find(".answer").slideUp();
                $(this).addClass("on").find(".answer").slideDown();
            }
        });
    });
})();

/* ------------------------------------------------------
 * 07. 쿠폰 발급 URL 통합 처리 (단일 링크 → PC/MO 자동 분기)
 * https://도메인?coupon_no=쿠폰번호&opener_url=랜딩 페이지 경로
 * 예시) https://shrug-color.com?coupon_no=6083845071000000295&opener_url=/product/list.html?cate_no=71
 * ------------------------------------------------------ */
(function () {
    // 0) 쿼리스트링 없으면 아무 것도 안 함
    if (!location.search) return;

    var params = new URLSearchParams(location.search);
    var couponNo  = params.get('coupon_no');
    var openerUrl = params.get('opener_url');

    // 1) 필수 파라미터 없으면 종료
    if (!couponNo || !openerUrl) return;

    // 2) 이미 쿠폰 발급 페이지(카페24 기본 URL)라면 건드리지 않음
    //    → 중복 호출 / 루프 차단
    if (location.pathname.indexOf('/exec/front/newcoupon/IssueDownload') === 0) {
        return;
    }

    // 3) UA 기반 모바일 기기 체크
    var isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );

    var host   = location.hostname;                 // 예: "shrug-color.com" or "m.shrug-color.com"
    var origin = location.protocol + '//' + host;   // 예: "https://shrug-color.com"

    var baseDomain;

    // 4) m. 도메인인지 여부에 따라 동작 분기
    if (/^m\./.test(host)) {
        // 현재 m. 도메인에 있는 경우
        if (isMobileUA) {
            // 모바일 기기 → m 도메인 그대로 사용
            baseDomain = origin;
        } else {
            // PC 기기 → m. 떼고 PC 도메인으로 교체
            baseDomain = location.protocol + '//' + host.replace(/^m\./, '');
        }
    } else {
        // m.이 아닌 도메인:
        // - 반응형(단일 도메인) 사이트
        // - PC 도메인 + (카페24 모바일 자동 리다이렉트가 처리해 주는 경우)
        baseDomain = origin;
    }

    // 5) opener_url 인코딩 처리
    //    이미 인코딩된 형태(%xx)가 포함돼 있으면 중복 인코딩 피하려고 간단 체크만 함
    var openerEncoded = openerUrl;
    if (!/%[0-9A-Fa-f]{2}/.test(openerUrl)) {
        openerEncoded = encodeURIComponent(openerUrl);
    }

    // 6) 최종 카페24 쿠폰 발급 URL 생성
    var targetUrl = baseDomain
        + '/exec/front/newcoupon/IssueDownload'
        + '?coupon_no=' + encodeURIComponent(couponNo)
        + '&opener_url=' + openerEncoded;

    // 7) replace 사용 → 뒤로가기 시 브릿지 URL로 다시 안 돌아오게
    location.replace(targetUrl);
})();

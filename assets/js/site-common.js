/* ============================================================
 * 00. GEO Signal Tracker — AI 유입 감지 (UTM / Referrer)
 * 대상: Cafe24 KR / JP / TW 스토어 전체
 * ============================================================ */
(function () {
  var SUPABASE_URL = 'https://zsznmjvmbzqxtssqfrpj.supabase.co';
  var ANON_KEY     = 'sb_publishable_Dqx5699n2fgzAr3ijiiNCQ_WXavoaaD';

  var AI_DOMAINS = [
    'chatgpt.com', 'chat.openai.com',
    'perplexity.ai', 'claude.ai',
    'copilot.microsoft.com', 'gemini.google.com', 'bing.com'
  ];

  var STORE_MAP = [
    // KR
    { match: 'food-ology.co.kr',  site: 'foodology-kr',  geo: 'kr' },
    { match: 'obge.co.kr',        site: 'obge-kr',       geo: 'kr' },
    { match: '95problems.com',    site: '95problems-kr', geo: 'kr' },
    { match: 'full-y.co.kr',      site: 'fully-kr',      geo: 'kr' },
    { match: 'drdayr.co.kr',      site: 'drdayr-kr',     geo: 'kr' },
    { match: 'epais.kr',          site: 'epais-kr',      geo: 'kr' },
    { match: '8apm.co.kr',        site: 'drdayr-kr',     geo: 'kr' },
    { match: 'duorexin.com',      site: 'duorexin-kr',   geo: 'kr' },
    // JP — 실제 도메인 확인 후 수정
    { match: 'foodology.jp',      site: 'foodology-jp',  geo: 'jp' },
    { match: 'obge.jp',           site: 'obge-jp',       geo: 'jp' },
    // TW
    { match: 'foodology.tw',           site: 'foodology-tw', geo: 'tw' },
    { match: 'foodologytw.cafe24.com', site: 'foodology-tw', geo: 'tw' }
  ];

  var utmSrc   = new URLSearchParams(location.search).get('utm_source') || '';
  var referrer = document.referrer || '';

  function matchAI(str) {
    for (var i = 0; i < AI_DOMAINS.length; i++) {
      if (str.indexOf(AI_DOMAINS[i]) > -1) return AI_DOMAINS[i];
    }
    return null;
  }

  var matched = matchAI(utmSrc) || matchAI(referrer);
  if (!matched) return;

  function resolveStore() {
    var host = location.hostname.toLowerCase();
    for (var i = 0; i < STORE_MAP.length; i++) {
      if (host.indexOf(STORE_MAP[i].match) > -1) return STORE_MAP[i];
    }
    var geo = host.indexOf('.jp') > -1 ? 'jp' : host.indexOf('.tw') > -1 ? 'tw' : 'kr';
    return { site: host, geo: geo };
  }

  var store    = resolveStore();
  var aiSource = matched
    .replace('chat.openai.com', 'chatgpt')
    .replace('.com', '').replace('.ai', '');

  fetch(SUPABASE_URL + '/rest/v1/geo_signals', {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ai_source:  aiSource,
      method:     matchAI(utmSrc) ? 'utm' : 'referrer',
      utm_source: utmSrc   || null,
      referrer:   referrer || null,
      page_url:   location.href,
      site:       store.site,
      geo:        store.geo
    })
  }).catch(function () {});
})();

/* ------------------------------------------------------
 * 01. Debug Date/Time Override
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
 * 02. 쿠폰 발급 URL 통합 처리 (단일 링크 → PC/MO 자동 분기)
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

/* ============================================================
* 03. 공통 아코디언 처리
* - CSS 선택자: adt- prefix (스타일)
* - JS  선택자: adtCamelCase (adtAccordion, adtAccordionItem ...)
* ============================================================ */
(function ($) {
  $(function () {

    function getPanel($item) {
      return $item.next('.adtAccordionPanel');
    }

    function openAccordion($item) {
      var $panel = getPanel($item);

      $item.addClass('is-open');
      $panel.css({ height: $panel[0].scrollHeight, visibility: 'visible' });
      $item.find('.adtAccordionHeader').attr('aria-expanded', 'true');
      $panel.attr('aria-hidden', 'false');
    }

    function closeAccordion($item) {
      var $panel = getPanel($item);

      $item.removeClass('is-open');
      $panel.css({ height: 0, visibility: 'hidden' });
      $item.find('.adtAccordionHeader').attr('aria-expanded', 'false');
      $panel.attr('aria-hidden', 'true');
    }

    // adtFaqContainer가 있으면 #common_info 다음 형제로 이동
    var $faq = $('.adtFaqContainer');
    if ($faq.length) {
      $('#common_info').after($faq);
    }

    // src가 비어있는 img 행 자동 제거
    $('.adt-infotable-row').has('img[src=""]').remove();

    // 초기 is-open 상태 적용
    // 부모가 display:none이거나 동적 콘텐츠 삽입 이후 높이 재계산 대응
    function initOpenPanels() {
      $('.adtAccordionItem.is-open').each(function () {
        var $panel   = $(this).next('.adtAccordionPanel');

        // 인라인 style 초기화 — 카페24 스킨이 자동으로 붙이는 경우 대응
        $panel.attr('style', '');

        var $parents = $panel.parents().filter(function () {
          return $(this).css('display') === 'none';
        });

        // 숨겨진 부모를 시각적으로 안 보이게 유지하면서 레이아웃만 활성화
        $parents.css({ display: 'block', visibility: 'hidden' });

        // 이미지가 있으면 모두 로드된 후 높이 재계산
        var $imgs  = $panel.find('img');
        if ($imgs.length) {
          var loaded = 0;
          var total  = $imgs.length;

          $imgs.each(function () {
            var img = this;
            if (img.complete && img.naturalHeight !== 0) {
              loaded++;
              if (loaded === total) recalc();
            } else {
              $(img).one('load error', function () {
                loaded++;
                if (loaded === total) recalc();
              });
            }
          });
        } else {
          recalc();
        }

        function recalc() {
          $panel.css({ height: 'auto', visibility: 'visible' });
          $parents.css({ display: '', visibility: '' });
        }
      });
    }

    // 동적 콘텐츠 삽입 완료 대응
    // 인라인 스크립트가 먼저 실행된 경우(플래그) / 나중에 실행된 경우(이벤트) 모두 대응
    if (window.adtInfoReady) {
      // 인라인 스크립트가 이미 완료 → 즉시 실행
      initOpenPanels();
    } else {
      // 인라인 스크립트 완료 대기
      $(document).one('adtInfoReady', function () {
        initOpenPanels();
      });
      // fallback — adtInfoReady 이벤트가 없는 페이지 대응
      if (location.hostname.indexOf('foodology.tw') > -1 ||
          location.hostname.indexOf('foodologytw.cafe24.com') > -1) {
        setTimeout(function () { initOpenPanels(); }, 200);
      } else {
        setTimeout(function () { initOpenPanels(); }, 100);
      }
    }

    // 카페24 탭 전환 시 재계산
    // .ec-base-tab (95문제), .ui-tab (APM 등) 모두 대응
    $(document).on('click', '.ec-base-tab a, .ui-tab a', function () {
      setTimeout(function () { initOpenPanels(); }, 50);
    });

    // 클릭 이벤트
    $(document).on('click', '.adtAccordion .adtAccordionHeader', function () {
      var $item      = $(this).closest('.adtAccordionItem');
      var $accordion = $item.closest('.adtAccordion');
      var isOpen     = $item.hasClass('is-open');

      $accordion.find('.adtAccordionItem.is-open').each(function () {
        closeAccordion($(this));
      });

      if (!isOpen) {
        openAccordion($item);
      }
    });

  });
})(jQuery);

/* ============================================================
 * 04. 브랜드 전체 스마트스토어 전환 (수동)
 * 해당 도메인을 주석 해제하면 해당 브랜드 전체 유입을 스마트스토어로 전환.
 * 비활성화 시 다시 주석 처리.
 * ============================================================ */
(function () {
  var SITE_DOWN_REDIRECTS = {
    // 'food-ology.co.kr': 'https://brand.naver.com/foodology',
    // 'obge.co.kr':       'https://brand.naver.com/obge',
    // '95problems.com':   'https://smartstore.naver.com/adapt',
    // 'full-y.co.kr':     'https://brand.naver.com/full-y',
    // '8apm.co.kr':       'https://brand.naver.com/8apm',
    // 'epais.kr':         'https://brand.naver.com/epais',
  };

  var host = window.location.hostname.replace(/^www\./, '');
  var url = SITE_DOWN_REDIRECTS[host];
  if (url) {
    window.location.replace(url);
  }
})();

/* ============================================================
 * 05. 소셜 로그인 숨김 (수동)
 * 해당 도메인을 주석 해제하면 .sf-social-default 숨기고
 * .sf-social-fallback 표시.
 * ============================================================ */
(function () {
  var LOGIN_HIDE_HOSTS = [
    // 'food-ology.co.kr',
    // 'obge.co.kr',
    // '95problems.com',
    // 'full-y.co.kr',
    // '8apm.co.kr',
    // 'epais.kr',
    // 'drdayr.com',
    // 'duorexin.com',
    'obge.cafe24.com',
  ];

  var host = window.location.hostname.replace(/^www\./, '');
  if (!LOGIN_HIDE_HOSTS.includes(host)) return;

  function apply() {
    document.querySelectorAll('.js-login-default').forEach(function(el) {
      el.style.display = 'none';
    });
    document.querySelectorAll('.js-login-fallback').forEach(function(el) {
      el.style.display = '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
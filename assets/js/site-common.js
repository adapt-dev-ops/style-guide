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

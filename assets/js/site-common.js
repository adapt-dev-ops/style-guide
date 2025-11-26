/* ------------------------------------------------------
* 01. &nbsp/공백 자동삽입 제거
* ------------------------------------------------------ */
(function ($) {
    const SEL = 'img,input,br,hr,meta,link,source,track,col,area,base,wbr,embed,param';
    const isSpace = n => n && n.nodeType === 3 && /^[\s\u00A0]+$/.test(n.nodeValue || '');
    const clean = root => $(root).find(SEL).each((_, el) => {
        for (let n = el.nextSibling; isSpace(n);) {
            const r = n;
            n = n.nextSibling;
            r.remove();
        }
    });

    $(clean);
    $(window).on('load', () => clean(document));

    function startObserver() {
        const target = document.body;
        if (!target) return;  // body 없으면 포기하거나, 다시 시도하도록 만들어도 되고

        new MutationObserver(ms => {
            // ... 기존 로직 그대로 ...
        }).observe(target, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }

})(jQuery);

/* -----------------------------------------------------
* 2. IP 기반 노출 제어 
* - 지정된 IP일 경우에만 요소 표시
* - 일치하지 않으면 DOM에서 제거
* ----------------------------------------------------- */
$.getJSON('https://api.ipify.org?format=json', function(res) {

    // 현재 접속자의 외부 IP 확인
    var myIp = res.ip;

    // 허용할 IP (내부 전용 / 관리자 IP 등)
    var allowedIp = '125.131.80.241'; // ← 본인 IP 직접 입력

    // IP 일치 여부에 따라 노출 제어
    if (myIp === allowedIp) {
        $('.js-ipRestricted').show();    // 일치하면 노출
    } else {
        $('.js-ipRestricted').remove();  // 불일치 시 DOM에서 제거
    }
});
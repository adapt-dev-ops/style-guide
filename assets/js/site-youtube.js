// ==============================================
// 🎥 <site-youtube video-id="..."> 컴포넌트
// - 자동으로 .youtube-wrapper + iframe 생성
// - autoplay=1, mute=1, loop=1, controls=0, playsinline=1 고정
// - site-youtube::after 로 흰 커버 → 재생되면 제거
// ==============================================
(function () {
    var SELECTOR = 'site-youtube[video-id]';
    var STYLE_ID = 'site-youtube-autoplay-style';

    // 🔹 0) CSS를 JS에서 한 번만 주입
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var css = ''
            + 'site-youtube{display:block;position:relative;padding-bottom:56.25%;width:300%;left:-100%;box-sizing:border-box;}'
            + 'site-youtube .youtube-wrapper{position:absolute;top:0;left:0;width:100%;height:100%;}'
            + 'site-youtube .youtube-wrapper iframe{position:absolute;top:50%;left:50%;width:100%;height:100%;transform:translate(-50%,-50%);pointer-events:none;}'
            + 'site-youtube::after{content:"";position:absolute;inset:0;background:#fff;z-index:10;opacity:1;transition:opacity .4s ease;}'
            + 'site-youtube.is-played::after{opacity:0;pointer-events:none;}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // 1) YT API 로더
    function loadYT() {
        injectStyle(); // ← 스타일 먼저 보장

        if (window.YT && window.YT.Player) {
            initAll();
            return;
        }

        if (document.querySelector('script[data-yt-loader="1"]')) return;

        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.dataset.ytLoader = '1';
        document.head.appendChild(tag);
    }

    // 2) 컴포넌트 하나 초기화
    function initOne(el) {
        if (el.dataset.initDone === '1') return;

        var videoId = el.getAttribute('video-id');
        if (!videoId) return;

        // wrapper 생성
        var wrapper = document.createElement('div');
        wrapper.className = 'youtube-wrapper';

        var vid = 'yt_' + Math.random().toString(36).slice(2);
        var target = document.createElement('div');
        target.id = vid;
        wrapper.appendChild(target);

        el.appendChild(wrapper);
        el.dataset.initDone = '1';

        // 커버 제거 함수 (site-youtube에 클래스 추가)
        var played = false;
        function hideCover() {
            if (played) return;
            played = true;
            el.classList.add('is-played');
        }

        // YT 플레이어 생성
        var player = new YT.Player(vid, {
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                mute: 1,
                loop: 1,
                controls: 0,
                playsinline: 1,
                playlist: videoId,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3
            },
            events: {
                onReady: function (e) {
                    try {
                        e.target.mute();
                        e.target.playVideo();
                    } catch (err) {}

                    // onStateChange 못잡는 케이스 대비
                    setTimeout(hideCover, 3000);
                },
                onStateChange: function (e) {
                    if (e.data === YT.PlayerState.PLAYING) {
                        hideCover();
                    }
                }
            }
        });

        el._ytPlayer = player;
    }

    // 3) 전체 초기화
    function initAll() {
        document.querySelectorAll(SELECTOR).forEach(initOne);
    }

    // 4) 기존 onYouTubeIframeAPIReady 보존
    var prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
        if (typeof prevReady === 'function') prevReady();
        initAll();
    };

    // 5) DOM 준비되면 로더 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadYT);
    } else {
        loadYT();
    }
})();
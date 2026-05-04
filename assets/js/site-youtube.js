// ==============================================
// 🎥 <site-youtube video-id="..."> 자동재생 컴포넌트
// - Swiper 안: .swiper-slide-visible 일 때 재생
// - Swiper 밖: 뷰포트 2배(rootMargin: "200%") 범위에서 미리 로딩
// - 실제 화면에 보일 때만 playVideo()
// - autoplay="false": 자동재생 막고 첫 프레임만 노출
// - hoverplay="true": 마우스 오버 시 재생, 마우스 아웃 시 정지+되감기
// - playVideo / pauseVideo 중복 호출 방지
// ==============================================
(function () {
    var YT_SELECTOR = 'site-youtube[video-id]';
    var SLIDE_SELECTOR = '.swiper-slide';
    var STYLE_ID = 'site-youtube-autoplay-style';

    if (!document.querySelector(YT_SELECTOR)) return;

    // ------------------------------------------
    // 0. 부모 요소 기본 레이아웃 강제
    // ------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll(YT_SELECTOR).forEach(function (el) {
            if (!el.parentElement) return;

            var parent = el.parentElement;
            parent.style.overflow = 'hidden';
            parent.style.display = 'flex';
            parent.style.flexDirection = 'column';
            parent.style.justifyContent = 'center';
        });
    });

    // ------------------------------------------
    // 1. 공통 유틸
    // ------------------------------------------
    function isInViewport(el) {
        var r = el.getBoundingClientRect();
        var h = window.innerHeight || document.documentElement.clientHeight;
        var w = window.innerWidth || document.documentElement.clientWidth;

        return r.bottom > 0 && r.right > 0 && r.top < h && r.left < w;
    }

    // ------------------------------------------
    // 1-1. YouTube play/pause 중복 호출 방지
    // - 이미 재생/버퍼링 중이면 playVideo 재호출하지 않음
    // - 이미 정지/일시정지 상태면 pauseVideo 재호출하지 않음
    // ------------------------------------------
    function playYoutubeSafely(player) {
        if (!player || !player.playVideo) return;

        try {
            var state = player.getPlayerState ? player.getPlayerState() : null;

            // 1: 재생 중, 3: 버퍼링 중
            if (state === 1 || state === 3) return;

            player.playVideo();
        } catch (e) {}
    }

    function pauseYoutubeSafely(player) {
        if (!player || !player.pauseVideo) return;

        try {
            var state = player.getPlayerState ? player.getPlayerState() : null;

            // 0: 종료, 2: 일시정지, 5: 준비됨
            if (state === 0 || state === 2 || state === 5) return;

            player.pauseVideo();
        } catch (e) {}
    }

    // ------------------------------------------
    // 2. Hover Helper
    // ------------------------------------------
    function attachHoverIfEnabled(el, player) {
        if (el.getAttribute('hoverplay') !== 'true') return;
        if (el.dataset.syHoverReady === '1') return;

        el.dataset.syHoverReady = '1';

        el.addEventListener('mouseenter', function () {
            playYoutubeSafely(player);
        });

        el.addEventListener('mouseleave', function () {
            pauseYoutubeSafely(player);

            try {
                player.seekTo(0, true);
            } catch (e) {}
        });
    }

    // ------------------------------------------
    // 3. 공통 CSS 주입
    // ------------------------------------------
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var css = ''
            + 'site-youtube{display:block;position:relative;padding-bottom:56.25%;width:800%;left:-350%;height:100%;box-sizing:border-box;}'
            + 'site-youtube .youtube-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}'
            + 'site-youtube::after{content:"";position:absolute;inset:0;background:#fff;z-index:10;opacity:1;transition:opacity .5s ease;}'
            + 'site-youtube.is-played::after{opacity:0;background:transparent;}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ------------------------------------------
    // 4. YouTube Iframe API 로더
    // ------------------------------------------
    function loadYT() {
        injectStyle();

        if (window.YT && window.YT.Player) {
            onApiReady();
            return;
        }

        if (document.querySelector('script[data-yt-loader="1"]')) return;

        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.dataset.ytLoader = '1';
        document.head.appendChild(tag);
    }

    // ------------------------------------------
    // 5. wrapper 준비
    // ------------------------------------------
    function ensurePrepared(el) {
        if (el.dataset.syPrepared === '1') return;

        var videoId = el.getAttribute('video-id');
        if (!videoId) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'youtube-wrapper';

        var vid = 'yt_' + Math.random().toString(36).slice(2);
        var target = document.createElement('div');

        target.id = vid;
        wrapper.appendChild(target);
        el.appendChild(wrapper);

        el.dataset.syPrepared = '1';
        el.dataset.syContainerId = vid;
        el.dataset.syPlayerReady = '0';
        el.dataset.syPlayerMade = '0';
        el.dataset.syAutoplay = (el.getAttribute('autoplay') === 'false') ? '0' : '1';
    }

    // ------------------------------------------
    // 6. Player 생성
    // ------------------------------------------
    function createPlayer(el) {
        if (el._ytPlayer) return;
        if (!window.YT || !YT.Player) return;

        if (el.dataset.syPrepared !== '1') ensurePrepared(el);

        var videoId = el.getAttribute('video-id');
        var containerId = el.dataset.syContainerId;

        var needAutoPause = (el.dataset.syAutoplay === '0');
        var hasAutoPaused = false;

        el.dataset.syPlayerMade = '1';

        var played = false;
        var coverTimer = null;

        function hideCover() {
            if (played || coverTimer) return;

            coverTimer = setTimeout(function () {
                played = true;
                el.classList.add('is-played');
            }, 300);
        }

        var player = new YT.Player(containerId, {
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                mute: 1,
                loop: 1,
                controls: 0,
                playsinline: 1,
                playlist: videoId,
                rel: 0,
                modestbranding: 1,
                fs: 0,
                disablekb: 1,
                iv_load_policy: 3,
                cc_load_policy: 0
            },
            events: {
                onReady: function (e) {
                    el.dataset.syPlayerReady = '1';

                    try {
                        e.target.mute();

                        if (el.dataset.syAutoplay !== '0' && isInViewport(el)) {
                            playYoutubeSafely(e.target);
                        }
                    } catch (err) {}
                },
                onStateChange: function (e) {
                    // 1: 재생 중
                    if (e.data === 1) {
                        hideCover();

                        if (needAutoPause && !hasAutoPaused) {
                            hasAutoPaused = true;

                            setTimeout(function () {
                                pauseYoutubeSafely(e.target);
                            }, 150);
                        }
                    }
                }
            }
        });

        attachHoverIfEnabled(el, player);
        el._ytPlayer = player;
    }

    // ============================================================
    // 7-A. Swiper 내부: 보이는 슬라이드 기준으로 play/pause
    // ============================================================
    function controlBySlides() {
        var slides = document.querySelectorAll(SLIDE_SELECTOR);
        if (!slides.length) return;

        slides.forEach(function (slide) {
            var isVisible = slide.classList.contains('swiper-slide-visible');

            if (!isVisible) {
                isVisible = isInViewport(slide);
            }

            var vids = slide.querySelectorAll(YT_SELECTOR);

            vids.forEach(function (yt) {
                var isHoverOnly = (yt.getAttribute('hoverplay') === 'true');

                if (isHoverOnly) {
                    if (isVisible) {
                        if (yt.dataset.syPrepared !== '1') ensurePrepared(yt);
                        if (!yt._ytPlayer) createPlayer(yt);
                    }
                    return;
                }

                if (isVisible) {
                    if (yt.dataset.syPrepared !== '1') ensurePrepared(yt);
                    if (!yt._ytPlayer) createPlayer(yt);
                }

                var p = yt._ytPlayer;
                var autoplayOn = (yt.dataset.syAutoplay !== '0');

                if (!p) return;

                if (isVisible) {
                    if (autoplayOn) {
                        playYoutubeSafely(p);
                    } else {
                        pauseYoutubeSafely(p);
                    }
                } else {
                    pauseYoutubeSafely(p);
                }
            });
        });
    }

    function initSlideObserver() {
        controlBySlides();

        var mo = new MutationObserver(function (m) {
            for (var i = 0; i < m.length; i++) {
                if (
                    m[i].attributeName === 'class' &&
                    m[i].target.classList &&
                    m[i].target.classList.contains('swiper-slide')
                ) {
                    controlBySlides();
                    break;
                }
            }
        });

        mo.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });

        window.addEventListener('resize', controlBySlides);
        window.addEventListener('orientationchange', controlBySlides);
    }

    // ============================================================
    // 7-B. Swiper 밖: 뷰포트 기반 lazy + play/pause
    // ============================================================
    function initViewportObserver() {
        var els = document.querySelectorAll(YT_SELECTOR);

        if (!els.length) return;
        if (!('IntersectionObserver' in window)) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var el = entry.target;
                var hoverOnly = (el.getAttribute('hoverplay') === 'true');

                var rect = entry.boundingClientRect;
                var rootH = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;

                var onScreen = rect.top < rootH && rect.bottom > 0;
                var p = el._ytPlayer;
                var autoplayOn = (el.dataset.syAutoplay !== '0');

                if (hoverOnly) {
                    if (entry.isIntersecting) {
                        if (el.dataset.syPrepared !== '1') ensurePrepared(el);
                        if (!el._ytPlayer) createPlayer(el);
                    } else {
                        pauseYoutubeSafely(p);
                    }

                    return;
                }

                if (entry.isIntersecting) {
                    if (el.dataset.syPrepared !== '1') ensurePrepared(el);

                    if (!el._ytPlayer) {
                        createPlayer(el);
                        p = el._ytPlayer;
                    }

                    if (onScreen) {
                        if (autoplayOn) {
                            playYoutubeSafely(p);
                        } else {
                            pauseYoutubeSafely(p);
                        }
                    } else {
                        pauseYoutubeSafely(p);
                    }
                } else {
                    pauseYoutubeSafely(p);
                }
            });
        }, {
            rootMargin: '200% 0px',
            threshold: 0
        });

        els.forEach(function (el) {
            io.observe(el);
        });
    }

    // ------------------------------------------
    // 8. YT API 준비 완료 콜백
    // ------------------------------------------
    var apiInitialized = false;

    function onApiReady() {
        if (apiInitialized) return;

        apiInitialized = true;

        initSlideObserver();
        initViewportObserver();
    }

    var prevReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = function () {
        if (typeof prevReady === 'function') prevReady();
        onApiReady();
    };

    // ------------------------------------------
    // 9. 초기 실행
    // ------------------------------------------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadYT);
    } else {
        loadYT();
    }
})();
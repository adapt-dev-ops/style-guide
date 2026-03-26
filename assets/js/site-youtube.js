// ==============================================
// 🎥 <site-youtube video-id="..."> 자동재생 컴포넌트
// - Swiper 안: .swiper-slide-visible 일 때 즉시 재생
// - Swiper 밖: 뷰포트 2배(rootMargin: "200%") 범위에서 미리 로딩
//   실제 화면에 보일 때 playVideo()
// - autoplay="false": 자동재생은 막고, 첫 프레임만 보여줌(버튼/로딩 없음)
// - hoverplay="true": 마우스 오버 시 재생, 마우스 아웃 시 정지+되감기
// - 성능 안전 (MutationObserver + IntersectionObserver)
// ==============================================
(function () {
    var YT_SELECTOR = 'site-youtube[video-id]';
    var SLIDE_SELECTOR = '.swiper-slide';
    var STYLE_ID = 'site-youtube-autoplay-style';

    // 페이지에 site-youtube가 없으면 즉시 종료 (가장 중요한 최적화 포인트)
    if (!document.querySelector(YT_SELECTOR)) return;

    // ------------------------------------------
    // 0. 부모 요소 기본 레이아웃 강제
    //    (슬라이드/카드 중앙 정렬용)
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
    // 1. 공통 유틸: 요소가 뷰포트 안에 있는지 체크
    // ------------------------------------------
    function isInViewport(el) {
        var r = el.getBoundingClientRect();
        var h = window.innerHeight || document.documentElement.clientHeight;
        var w = window.innerWidth || document.documentElement.clientWidth;
        return r.bottom > 0 && r.right > 0 && r.top < h && r.left < w;
    }

    // ------------------------------------------
    // 2. Hover Helper
    //    - hoverplay="true" 인 경우에만 적용
    // ------------------------------------------
    function attachHoverIfEnabled(el, player) {
        if (el.getAttribute('hoverplay') !== 'true') return;
        if (el.dataset.syHoverReady === '1') return;
        el.dataset.syHoverReady = '1';

        el.addEventListener('mouseenter', function () {
            try {
                player.playVideo();
            } catch (e) {}
        });

        el.addEventListener('mouseleave', function () {
            try {
                player.pauseVideo();
                player.seekTo(0, true);
            } catch (e) {}
        });
    }

    // ------------------------------------------
    // 3. 공통 CSS 주입 (커버 + 9:16 크롭용 레이아웃)
    // ------------------------------------------
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var css = ''
            + 'site-youtube{display:block;position:relative;padding-bottom:56.25%;width:800%;left:-350%;height:100%;box-sizing:border-box;}'
            + 'site-youtube .youtube-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}'
            + 'site-youtube::after{content:"";position:absolute;inset:0;background:#fff;z-index:10;opacity:1;transition:opacity .5s ease;}'
            + 'site-youtube.is-played::after{opacity:0;pointer-events:none;}';

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
    // 5. wrapper 준비: player 들어갈 div 생성
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
    // 6. Player 생성 (+ hoverplay 지원)
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
            }, 200);
        }

        var player = new YT.Player(containerId, {
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                mute: 1,
                loop: 1,
                controls: 0,
                playsinline: 1,
                playlist: videoId,
                rel: 0,
                modestbranding: 1
            },
            events: {
                onReady: function (e) {
                    try {
                        e.target.mute();
                        e.target.playVideo();
                    } catch (err) {}
                },
                onStateChange: function (e) {
                    if (e.data === 1) {
                        hideCover();
                        if (needAutoPause && !hasAutoPaused) {
                            hasAutoPaused = true;
                            setTimeout(function () {
                                try { e.target.pauseVideo(); } catch (err) {}
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
            if (!isVisible) isVisible = isInViewport(slide);

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
                        if (p.playVideo) p.playVideo();
                    } else {
                        if (p.pauseVideo) p.pauseVideo();
                    }
                } else {
                    if (p.pauseVideo) p.pauseVideo();
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
        window.addEventListener('scroll', controlBySlides);
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
                var inSwiper = !!el.closest(SLIDE_SELECTOR);
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
                        if (p && p.pauseVideo) try { p.pauseVideo(); } catch (e) {}
                    }
                    return;
                }

                if (entry.isIntersecting) {
                    if (el.dataset.syPrepared !== '1') ensurePrepared(el);
                    if (!el._ytPlayer) {
                        createPlayer(el);
                        p = el._ytPlayer;
                    }

                    if (inSwiper) {
                        if (p && p.pauseVideo) try { p.pauseVideo(); } catch (e) {}
                    } else {
                        if (onScreen) {
                            if (autoplayOn) {
                                if (p && p.playVideo) try { p.playVideo(); } catch (e) {}
                            } else {
                                if (p && p.pauseVideo) try { p.pauseVideo(); } catch (e) {}
                            }
                        } else {
                            if (p && p.pauseVideo) try { p.pauseVideo(); } catch (e) {}
                        }
                    }
                } else {
                    if (p && p.pauseVideo) try { p.pauseVideo(); } catch (e) {}
                }
            });
        }, {
            rootMargin: '200% 0px',
            threshold: 0
        });

        els.forEach(function (el) { io.observe(el); });
    }

    // ------------------------------------------
    // 8. YT API 준비 완료 콜백
    // ------------------------------------------
    function onApiReady() {
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
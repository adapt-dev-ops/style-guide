// ==============================================
// 🎥 <site-youtube video-id="..."> 자동재생 컴포넌트
// - Swiper 안: .swiper-slide-visible 일 때 즉각 재생
// - Swiper 밖: 화면의 2배 거리(rootMargin: "200%")에 들어오면 미리 로딩
//               실제 화면에 보일 때 playVideo()
// - autoplay="false": 자동재생은 막고, 첫 프레임만 보여줌(버튼/로딩 없음)
// - 성능 안전 (MutationObserver + IntersectionObserver)
// ==============================================

(function () {

    // ---------- 부모 overflow 즉시 적용 ----------
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('site-youtube[video-id]').forEach(function (el) {
            if (el.parentElement) {
                const parent = el.parentElement;
                parent.style.overflow = "hidden";
                parent.style.display = "flex";
                parent.style.flexDirection = "column";
                parent.style.justifyContent = "center";
            }
        });
    });

    var YT_SELECTOR    = 'site-youtube[video-id]';
    var SLIDE_SELECTOR = '.swiper-slide';
    var STYLE_ID       = 'site-youtube-autoplay-style';

    // ---------- 유틸: 뷰포트 안에 있는지 ----------
    function isInViewport(el) {
        var r = el.getBoundingClientRect();
        var h = window.innerHeight || document.documentElement.clientHeight;
        var w = window.innerWidth  || document.documentElement.clientWidth;
        return r.bottom > 0 && r.right > 0 && r.top < h && r.left < w;
    }

    // ---------- 0. CSS ----------
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var css = ''
        + 'site-youtube {display:block;position:relative;padding-bottom:56.25%;width:800%;left:-350%;height:100%;box-sizing:border-box;}'
        + 'site-youtube .youtube-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}'
        + 'site-youtube::after{content:"";position:absolute;inset:0;background:#fff;z-index:10;opacity:1;transition:opacity .5s ease;}'
        + 'site-youtube.is-played::after{opacity:0;pointer-events:none;}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ---------- 1. YT API ----------
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

    // ---------- 2. wrapper 준비 ----------
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

        el.dataset.syPrepared    = '1';
        el.dataset.syContainerId = vid;
        el.dataset.syPlayerReady = '0';
        el.dataset.syPlayerMade  = '0';

        // autoplay 속성 저장 (없으면 기본 1)
        el.dataset.syAutoplay = (el.getAttribute('autoplay') === 'false') ? '0' : '1';
    }

    // ---------- 3. Player 생성 ----------
    function createPlayer(el) {
        if (el._ytPlayer) return;
        if (!window.YT || !YT.Player) return;
        if (el.dataset.syPrepared !== '1') ensurePrepared(el);

        var videoId     = el.getAttribute('video-id');
        var containerId = el.dataset.syContainerId;

        var needAutoPause  = (el.dataset.syAutoplay === '0'); // autoplay="false" 인지
        var hasAutoPaused  = false;

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
                autoplay: 1,  // 먼저 한 번 재생해서 프레임 뽑기
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
                    // 실제 일시정지는 PLAYING 이벤트에서 처리
                },
                onStateChange: function (e) {
                    if (e.data === 1) { // PLAYING
                        hideCover();

                        // autoplay="false" → 첫 PLAYING 직후 바로 일시정지
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

        el._ytPlayer = player;
    }

    // ============================================================
    // 4-A. Swiper 내부: 이미 만들어진 플레이어만 play/pause
    // ============================================================
    function controlBySlides() {
        var slides = document.querySelectorAll(SLIDE_SELECTOR);
        if (!slides.length) return;

        slides.forEach(function (slide) {

            // Swiper 옵션으로 붙는 visible 우선, 없으면 뷰포트 기준
            var isVisible = slide.classList.contains('swiper-slide-visible');
            if (!isVisible) isVisible = isInViewport(slide);

            var vids = slide.querySelectorAll(YT_SELECTOR);

            vids.forEach(function (yt) {
                var p = yt._ytPlayer;
                if (!p) return; // 아직 iframe 안 만들어졌으면 IO가 처리

                var autoplayOn = (yt.dataset.syAutoplay !== '0');

                if (isVisible) {
                    if (autoplayOn) {
                        if (p && p.playVideo) p.playVideo();
                    } else {
                        if (p && p.pauseVideo) p.pauseVideo();
                    }
                } else {
                    if (p && p.pauseVideo) p.pauseVideo();
                }
            });
        });
    }

    function initSlideObserver() {
        controlBySlides();

        var mo = new MutationObserver(function (m) {
            for (var i = 0; i < m.length; i++) {
                if (m[i].attributeName === 'class' &&
                    m[i].target.classList.contains('swiper-slide')) {
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
    // 4-B. 뷰포트 기반 lazy (Swiper 안/밖 공통)
    // ============================================================
    function initViewportObserver() {
        var els = document.querySelectorAll(YT_SELECTOR);
        if (!els.length) return;

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var el = entry.target;
                    var inSwiper = !!el.closest(SLIDE_SELECTOR);

                    var rect  = entry.boundingClientRect;
                    var rootH = entry.rootBounds
                        ? entry.rootBounds.height
                        : window.innerHeight;

                    var onScreen = rect.top < rootH && rect.bottom > 0;

                    var p = el._ytPlayer;
                    var autoplayOn = (el.dataset.syAutoplay !== '0');

                    if (entry.isIntersecting) {

                        // 뷰포트 2배 영역 안에 들어오면 iframe 생성
                        if (el.dataset.syPrepared !== '1') ensurePrepared(el);
                        if (!el._ytPlayer) {
                            createPlayer(el);
                            p = el._ytPlayer;
                        }

                        if (inSwiper) {
                            // Swiper 안: 생성만 하고 재생은 슬라이드 로직에 맡김
                            if (p && p.pauseVideo) try { p.pauseVideo(); } catch (e) {}
                        } else {
                            // Swiper 밖: 여기서 재생/일시정지 제어
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
                rootMargin: '200% 0px',   // 뷰포트 2배 범위에서 미리 로딩
                threshold: 0
            });

            els.forEach(function (el) { io.observe(el); });
        }
    }

    // ---------- 5. YT API ready ----------
    function onApiReady() {
        initSlideObserver();      // Swiper 재생 제어
        initViewportObserver();   // iframe lazy + Swiper 밖 재생 제어
    }

    var prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
        if (typeof prevReady === 'function') prevReady();
        onApiReady();
    };

    // ---------- 6. DOM 준비 ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadYT);
    } else {
        loadYT();
    }

})();

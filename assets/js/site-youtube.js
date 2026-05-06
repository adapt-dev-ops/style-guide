/* =========================================================
 * 🎥 <site-youtube video-id="..."> 자동재생 컴포넌트
 * ---------------------------------------------------------
 * - Swiper 안: 200% 근처 슬라이드에서 Player 생성, 100% 근처에서 재생 준비
 * - Swiper 밖: 200% 근처에서 Player 생성, 100% 근처에서 재생 시작
 * - autoplay="false": 자동재생 없이 iframe 첫 화면만 노출
 * - hoverplay="true": 마우스 오버 시 재생, 마우스 아웃 시 정지+처음으로
 * - playVideo / pauseVideo 중복 호출 방지
 * - YouTube Player 준비 지연 시 재생 재시도
 * - 동적 삽입되는 site-youtube / swiper-slide 대응
 * - scroll 이벤트 제거 → IntersectionObserver 중심으로 제어
 * ========================================================= */
(function () {
    'use strict';

    var YT_SELECTOR = 'site-youtube[video-id]';
    var SLIDE_SELECTOR = '.swiper-slide';
    var STYLE_ID = 'site-youtube-autoplay-style';
    var STATE_KEY = '__SITE_YOUTUBE_AUTOPLAY_STATE_OPTIMIZED__';

    var state = window[STATE_KEY] = window[STATE_KEY] || {
        apiReady: false,
        apiHooked: false,
        domObserved: false,
        scanFrame: null,
        slideFrame: null,
        ytReadyTimer: null,
        ytReadyCount: 0,
        slideClassObserver: null,
        swiperPreloadObserver: null,
        swiperPlayObserver: null,
        outsidePreloadObserver: null,
        outsidePlayObserver: null
    };

    // ------------------------------------------
    // 1. 공통 유틸
    // ------------------------------------------
    function getYoutubeElements() {
        return Array.prototype.slice.call(document.querySelectorAll(YT_SELECTOR));
    }

    function hasYoutubeElement() {
        return !!document.querySelector(YT_SELECTOR);
    }

    function isInsideSwiper(el) {
        return !!(el && el.closest(SLIDE_SELECTOR));
    }

    function getYoutubeSlides() {
        var slides = [];

        getYoutubeElements().forEach(function (el) {
            var slide = el.closest(SLIDE_SELECTOR);

            if (slide && slides.indexOf(slide) === -1) {
                slides.push(slide);
            }
        });

        return slides;
    }

    function isInViewport(el) {
        if (!el) return false;

        var rect = el.getBoundingClientRect();
        var winH = window.innerHeight || document.documentElement.clientHeight;
        var winW = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < winH &&
            rect.left < winW
        );
    }

    // 화면 도착 전 100% 근처부터 재생 준비 허용
    function isInPlayReadyArea(el) {
        if (!el) return false;

        var rect = el.getBoundingClientRect();
        var winH = window.innerHeight || document.documentElement.clientHeight;
        var winW = window.innerWidth || document.documentElement.clientWidth;
        var marginY = winH * 1;

        return (
            rect.bottom > -marginY &&
            rect.right > 0 &&
            rect.top < winH + marginY &&
            rect.left < winW
        );
    }

    function isSlideActiveOrVisible(slide) {
        if (!slide) return false;

        return (
            slide.classList.contains('swiper-slide-visible') ||
            slide.classList.contains('swiper-slide-active') ||
            isInViewport(slide)
        );
    }

    // ------------------------------------------
    // 2. 기본 레이아웃 / CSS
    // ------------------------------------------
    function setParentLayout() {
        getYoutubeElements().forEach(function (el) {
            if (!el.parentElement) return;
            if (el.dataset.syParentStyled === '1') return;

            var parent = el.parentElement;

            parent.style.overflow = 'hidden';
            parent.style.display = 'flex';
            parent.style.flexDirection = 'column';
            parent.style.justifyContent = 'center';

            el.dataset.syParentStyled = '1';
        });
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var css = ''
            + 'site-youtube{display:block;position:relative;padding-bottom:56.25%;width:800%;left:-350%;height:100%;box-sizing:border-box;}'
            + 'site-youtube .youtube-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}'
            + 'site-youtube::after{content:"";position:absolute;inset:0;background:#fff;z-index:10;opacity:1;visibility:visible;transition:opacity .5s ease,visibility 0s linear .5s;}'
            + 'site-youtube.is-played::after{opacity:0;visibility:hidden;pointer-events:none;}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ------------------------------------------
    // 3. play / pause 안전 처리
    // ------------------------------------------
    function clearPlayRetry(el) {
        if (!el || !el._syPlayRetryTimer) return;

        clearTimeout(el._syPlayRetryTimer);
        el._syPlayRetryTimer = null;
    }

    function playYoutubeSafely(player) {
        if (!player || !player.playVideo) return;

        try {
            var playerState = player.getPlayerState ? player.getPlayerState() : null;

            // 1: 재생 중, 3: 버퍼링 중
            if (playerState === 1 || playerState === 3) return;

            player.playVideo();
        } catch (e) {}
    }

    function pauseYoutubeSafely(player, el) {
        if (el) clearPlayRetry(el);
        if (!player || !player.pauseVideo) return;

        try {
            var playerState = player.getPlayerState ? player.getPlayerState() : null;

            // -1: 미시작, 0: 종료, 2: 일시정지, 5: 준비됨
            if (playerState === -1 || playerState === 0 || playerState === 2 || playerState === 5) return;

            player.pauseVideo();
        } catch (e) {}
    }

    function requestPlay(el) {
        if (!el) return;
        if (el.getAttribute('hoverplay') === 'true') return;
        if (el.dataset.syAutoplay === '0') return;

        el.dataset.syShouldPlay = '1';

        if (!window.YT || !YT.Player) {
            loadYT();
            return;
        }

        if (el.dataset.syPrepared !== '1') {
            ensurePrepared(el);
        }

        if (!el._ytPlayer) {
            createPlayer(el);
            return;
        }

        playYoutubeWithRetry(el, el._ytPlayer, 0);
    }

    function requestPause(el) {
        if (!el) return;

        el.dataset.syShouldPlay = '0';
        pauseYoutubeSafely(el._ytPlayer, el);
    }

    function playYoutubeWithRetry(el, player, retryCount) {
        if (!el || !player) return;

        retryCount = retryCount || 0;

        if (el.dataset.syShouldPlay !== '1') {
            clearPlayRetry(el);
            return;
        }

        if (!isInPlayReadyArea(el)) {
            clearPlayRetry(el);
            return;
        }

        try {
            var playerState = player.getPlayerState ? player.getPlayerState() : null;

            if (playerState === 1 || playerState === 3) {
                clearPlayRetry(el);
                return;
            }
        } catch (e) {}

        playYoutubeSafely(player);

        if (retryCount >= 6) {
            clearPlayRetry(el);
            return;
        }

        if (el._syPlayRetryTimer) return;

        el._syPlayRetryTimer = setTimeout(function () {
            el._syPlayRetryTimer = null;

            if (!el._ytPlayer) return;

            playYoutubeWithRetry(el, el._ytPlayer, retryCount + 1);
        }, 250);
    }

    // ------------------------------------------
    // 4. Hover Helper
    // ------------------------------------------
    function attachHoverIfEnabled(el, player) {
        if (el.getAttribute('hoverplay') !== 'true') return;
        if (el.dataset.syHoverReady === '1') return;

        el.dataset.syHoverReady = '1';

        el.addEventListener('mouseenter', function () {
            el.dataset.syShouldPlay = '1';
            playYoutubeWithRetry(el, player, 0);
        });

        el.addEventListener('mouseleave', function () {
            requestPause(el);

            try {
                player.seekTo(0, true);
            } catch (e) {}
        });
    }

    // ------------------------------------------
    // 5. YouTube API 로더
    // ------------------------------------------
    function waitForYTReady() {
        if (state.ytReadyTimer) return;

        state.ytReadyTimer = setTimeout(function () {
            state.ytReadyTimer = null;
            state.ytReadyCount += 1;

            if (window.YT && window.YT.Player) {
                onApiReady();
                return;
            }

            if (state.ytReadyCount < 50) {
                waitForYTReady();
            }
        }, 100);
    }

    function loadYT() {
        injectStyle();

        if (!hasYoutubeElement()) return;

        if (window.YT && window.YT.Player) {
            onApiReady();
            return;
        }

        if (
            document.querySelector('script[data-yt-loader="1"]') ||
            document.querySelector('script[src*="youtube.com/iframe_api"]') ||
            document.querySelector('script[src*="youtube.com/player_api"]')
        ) {
            waitForYTReady();
            return;
        }

        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.dataset.ytLoader = '1';
        document.head.appendChild(tag);

        waitForYTReady();
    }

    function hookYoutubeApiCallback() {
        if (state.apiHooked) return;

        state.apiHooked = true;

        var prevReady = window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = function () {
            if (typeof prevReady === 'function') prevReady();
            onApiReady();
        };
    }

    // ------------------------------------------
    // 6. wrapper / player 생성
    // ------------------------------------------
    function ensurePrepared(el) {
        if (!el) return;
        if (el.dataset.syPrepared === '1') return;

        var videoId = el.getAttribute('video-id');
        if (!videoId) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'youtube-wrapper';

        var containerId = 'yt_' + Math.random().toString(36).slice(2);
        var target = document.createElement('div');

        target.id = containerId;
        wrapper.appendChild(target);
        el.appendChild(wrapper);

        el.dataset.syPrepared = '1';
        el.dataset.syContainerId = containerId;
        el.dataset.syPlayerReady = '0';
        el.dataset.syPlayerMade = '0';
        el.dataset.syAutoplay = (el.getAttribute('autoplay') === 'false') ? '0' : '1';
        el.dataset.syShouldPlay = '0';
    }

    function createPlayer(el) {
        if (!el) return;
        if (el._ytPlayer) return;
        if (!window.YT || !YT.Player) return;

        if (el.dataset.syPrepared !== '1') {
            ensurePrepared(el);
        }

        var videoId = el.getAttribute('video-id');
        var containerId = el.dataset.syContainerId;

        if (!videoId || !containerId) return;

        var shouldPlayNow =
            el.dataset.syAutoplay !== '0' &&
            el.dataset.syShouldPlay === '1' &&
            isInPlayReadyArea(el);

        el.dataset.syPlayerMade = '1';

        var played = false;
        var coverTimer = null;

        function hideCover() {
            if (played || coverTimer) return;

            coverTimer = setTimeout(function () {
                played = true;
                el.classList.add('is-played');
            }, 250);
        }

        var player = new YT.Player(containerId, {
            videoId: videoId,
            playerVars: {
                autoplay: shouldPlayNow ? 1 : 0,
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

                        if (el.dataset.syAutoplay === '0') {
                            el.classList.add('is-played');
                            return;
                        }

                        if (el.dataset.syShouldPlay === '1' && isInPlayReadyArea(el)) {
                            playYoutubeWithRetry(el, e.target, 0);
                        }
                    } catch (err) {}
                },
                onStateChange: function (e) {
                    // 1: 재생 중
                    if (e.data === 1) {
                        hideCover();
                    }
                }
            }
        });

        attachHoverIfEnabled(el, player);
        el._ytPlayer = player;
    }

    // ============================================================
    // 7-A. Swiper 내부 영상 제어
    // ============================================================
    function createPlayersInSlide(slide) {
        if (!slide) return;

        slide.querySelectorAll(YT_SELECTOR).forEach(function (yt) {
            ensurePrepared(yt);
            createPlayer(yt);
        });
    }

    function controlBySlides() {
        var slides = getYoutubeSlides();
        if (!slides.length) return;

        slides.forEach(function (slide) {
            var slidePlayable = isSlideActiveOrVisible(slide) && isInPlayReadyArea(slide);

            slide.querySelectorAll(YT_SELECTOR).forEach(function (yt) {
                var hoverOnly = yt.getAttribute('hoverplay') === 'true';
                var autoplayOn = yt.dataset.syAutoplay !== '0';

                if (slidePlayable) {
                    ensurePrepared(yt);

                    if (!yt._ytPlayer && window.YT && YT.Player) {
                        createPlayer(yt);
                    }
                }

                if (hoverOnly) {
                    if (!slidePlayable) requestPause(yt);
                    return;
                }

                if (slidePlayable && autoplayOn) {
                    requestPlay(yt);
                } else {
                    requestPause(yt);
                }
            });
        });
    }

    function scheduleSlideControl() {
        if (state.slideFrame) return;

        state.slideFrame = requestAnimationFrame(function () {
            state.slideFrame = null;
            controlBySlides();
        });
    }

    function initSlideClassObserver() {
        var slides = getYoutubeSlides();

        if (!slides.length) return;

        if (!state.slideClassObserver) {
            state.slideClassObserver = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    if (mutations[i].attributeName === 'class') {
                        scheduleSlideControl();
                        break;
                    }
                }
            });
        }

        slides.forEach(function (slide) {
            if (slide.dataset.sySlideClassObserved === '1') return;

            slide.dataset.sySlideClassObserved = '1';

            state.slideClassObserver.observe(slide, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }

    function initSwiperPreloadObserver() {
        if (!('IntersectionObserver' in window)) return;

        if (!state.swiperPreloadObserver) {
            state.swiperPreloadObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var slide = entry.target;

                    if (entry.isIntersecting) {
                        createPlayersInSlide(slide);
                    }
                });
            }, {
                // 화면 기준 200% 근처 슬라이드만 Player 생성
                rootMargin: '200% 50%',
                threshold: 0
            });
        }

        getYoutubeSlides().forEach(function (slide) {
            if (slide.dataset.sySwiperPreloadObserved === '1') return;

            slide.dataset.sySwiperPreloadObserved = '1';
            state.swiperPreloadObserver.observe(slide);
        });
    }

    function initSwiperPlayObserver() {
        if (!('IntersectionObserver' in window)) return;

        if (!state.swiperPlayObserver) {
            state.swiperPlayObserver = new IntersectionObserver(function () {
                scheduleSlideControl();
            }, {
                // 화면 기준 100% 근처에서 재생/정지 판단
                rootMargin: '100% 50%',
                threshold: 0
            });
        }

        getYoutubeSlides().forEach(function (slide) {
            if (slide.dataset.sySwiperPlayObserved === '1') return;

            slide.dataset.sySwiperPlayObserved = '1';
            state.swiperPlayObserver.observe(slide);
        });
    }

    // ============================================================
    // 7-B. Swiper 밖 영상 제어
    // ============================================================
    function initOutsidePreloadObserver() {
        if (!('IntersectionObserver' in window)) return;

        if (!state.outsidePreloadObserver) {
            state.outsidePreloadObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var el = entry.target;

                    if (entry.isIntersecting) {
                        ensurePrepared(el);
                        createPlayer(el);
                    } else {
                        requestPause(el);
                    }
                });
            }, {
                // 화면 기준 200% 근처에서 Player 생성
                rootMargin: '200% 0px',
                threshold: 0
            });
        }

        getYoutubeElements().forEach(function (el) {
            if (isInsideSwiper(el)) return;
            if (el.dataset.syOutsidePreloadObserved === '1') return;

            el.dataset.syOutsidePreloadObserved = '1';
            state.outsidePreloadObserver.observe(el);
        });
    }

    function initOutsidePlayObserver() {
        if (!('IntersectionObserver' in window)) return;

        if (!state.outsidePlayObserver) {
            state.outsidePlayObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var el = entry.target;
                    var hoverOnly = el.getAttribute('hoverplay') === 'true';
                    var autoplayOn = el.dataset.syAutoplay !== '0';

                    if (entry.isIntersecting) {
                        ensurePrepared(el);

                        if (!el._ytPlayer) {
                            createPlayer(el);
                        }

                        if (hoverOnly) return;

                        if (autoplayOn) {
                            requestPlay(el);
                        } else {
                            requestPause(el);
                        }
                    } else {
                        requestPause(el);
                    }
                });
            }, {
                // 화면 기준 100% 근처부터 muted 재생 시작
                rootMargin: '100% 0px',
                threshold: 0
            });
        }

        getYoutubeElements().forEach(function (el) {
            if (isInsideSwiper(el)) return;
            if (el.dataset.syOutsidePlayObserved === '1') return;

            el.dataset.syOutsidePlayObserved = '1';
            state.outsidePlayObserver.observe(el);
        });
    }

    // ------------------------------------------
    // 8. 전체 스캔 / 동적 삽입 대응
    // ------------------------------------------
    function initAllObservers() {
        initSlideClassObserver();
        initSwiperPreloadObserver();
        initSwiperPlayObserver();
        initOutsidePreloadObserver();
        initOutsidePlayObserver();

        scheduleSlideControl();
    }

    function scanYoutubeElements() {
        injectStyle();
        setParentLayout();

        if (!hasYoutubeElement()) return;

        if (!state.apiReady) {
            loadYT();
            return;
        }

        initAllObservers();
    }

    function scheduleScan() {
        if (state.scanFrame) return;

        state.scanFrame = requestAnimationFrame(function () {
            state.scanFrame = null;
            scanYoutubeElements();
        });
    }

    function initDynamicObserver() {
        if (state.domObserved) return;

        state.domObserved = true;

        var domObserver = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var nodes = mutations[i].addedNodes;

                for (var j = 0; j < nodes.length; j++) {
                    var node = nodes[j];

                    if (!node || node.nodeType !== 1) continue;

                    if (
                        node.matches && (
                            node.matches(YT_SELECTOR) ||
                            node.querySelector(YT_SELECTOR) ||
                            node.matches(SLIDE_SELECTOR) ||
                            node.querySelector(SLIDE_SELECTOR)
                        )
                    ) {
                        scheduleScan();
                        return;
                    }
                }
            }
        });

        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ------------------------------------------
    // 9. API Ready
    // ------------------------------------------
    function onApiReady() {
        // API ready가 여러 번 호출돼도 observer를 반복 생성하지 않도록 방어
        if (state.apiReady) {
            scheduleScan();
            return;
        }

        state.apiReady = true;
        scheduleScan();
    }

    // ------------------------------------------
    // 10. 초기 실행
    // ------------------------------------------
    function boot() {
        hookYoutubeApiCallback();
        initDynamicObserver();
        scanYoutubeElements();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
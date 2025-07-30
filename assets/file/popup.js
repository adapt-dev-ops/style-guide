// 복사 유틸
function copyToClipboard(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// 페이지 상태 확인 함수
async function checkPageState() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return {
          modulesShown: document.querySelectorAll('.cafe24-module-badge').length > 0,
          imagesShown: document.querySelectorAll('.img-wrapper-with-badge').length > 0,
          productCodesShown: document.querySelectorAll('.product-code-badge').length > 0,
          styleInspectorActive: window.styleInspectorActive === true
        };
      }
    }, (results) => {
      if (results && results[0] && results[0].result) {
        resolve(results[0].result);
      } else {
        resolve({ modulesShown: false, imagesShown: false, productCodesShown: false, styleInspectorActive: false });
      }
    });
  });
}

// DOMContentLoaded 이후 이벤트 바인딩
window.addEventListener('DOMContentLoaded', async () => {
  const btnModules = document.getElementById("showModules");
  const btnImages = document.getElementById("showImages");
  const btnCodes = document.getElementById("showProductCodes");
  const btnStyleInspector = document.getElementById("styleInspector");

  // 실제 페이지 상태 확인 (페이지에 뱃지가 실제로 있는지 확인)
  const pageState = await checkPageState();
  
  // 버튼 상태 설정 - 실제 페이지 상태에 따라 설정
  if (pageState.modulesShown) btnModules.classList.add('active');
  if (pageState.imagesShown) btnImages.classList.add('active');
  if (pageState.productCodesShown) btnCodes.classList.add('active');
  if (pageState.styleInspectorActive) btnStyleInspector.classList.add('active');

  // storage 상태를 실제 페이지 상태로 업데이트
  chrome.storage.local.set(pageState);

  // 모듈 표시
  btnModules.addEventListener("click", async () => {
    const isActive = btnModules.classList.contains("active");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (remove) => {


        const modules = document.querySelectorAll('[class*="xans-product-listmain"]');
        modules.forEach((el) => {
          const badge = el.querySelector('.cafe24-module-badge');
          if (remove) {
            if (badge) badge.remove();
            el.style.border = '';
          } else {
            if (badge) return;
            const className = Array.from(el.classList).find(c => c.startsWith("xans-product-listmain"));
            if (!className) return;
            const label = className.replace(/^xans-/, '').replace(/-/g, '_');
            
            const displayText = `🧩 ${label}`;
            
            el.style.position = 'relative';
            el.style.border = '5px solid #ff2d95';

            const badgeEl = document.createElement('div');
            badgeEl.className = 'cafe24-module-badge';
            badgeEl.textContent = displayText;
            Object.assign(badgeEl.style, {
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#ff2d95',
              color: '#fff',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: '1.3',
              borderBottomLeftRadius: '8px',
              zIndex: '1',
              cursor: 'pointer',
              whiteSpace: 'pre-line',
              textAlign: 'center',
              minWidth: '120px'
            });

            badgeEl.addEventListener('click', (e) => {
              e.stopPropagation();
              // 웹페이지 컨텍스트에서 복사 함수 실행
              const ta = document.createElement('textarea');
              ta.value = label;
              ta.style.position = 'fixed';
              ta.style.top = '-1000px';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              badgeEl.textContent = `✅ 복사됨: ${label}`;
              setTimeout(() => { badgeEl.textContent = displayText; }, 1500);
            });

            el.appendChild(badgeEl);
          }
        });
      },
      args: [isActive]
    }, () => {
      const newState = !isActive;
      btnModules.classList.toggle('active', newState);
      chrome.storage.local.set({ modulesShown: newState });
      
      // 상태 변경 후 약간의 지연을 두고 popup 닫기
      setTimeout(() => {
        // 다른 버튼들의 상태도 확인하여 동기화
        checkPageState().then(pageState => {
          chrome.storage.local.set(pageState);
        });
        window.close();
      }, 200);
    });
  });

  // 이미지 뱃지
  btnImages.addEventListener("click", async () => {
    const isActive = btnImages.classList.contains("active");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (remove) => {
        if (remove) {
          document.querySelectorAll('.img-wrapper-with-badge').forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (img && wrapper.parentNode) {
              wrapper.parentNode.insertBefore(img, wrapper);
              wrapper.remove();
            }
          });
          const styleEl = document.querySelector('style[data-img-wrapper-style]');
          if (styleEl) styleEl.remove();
        } else {
          const style = document.createElement('style');
          style.setAttribute('data-img-wrapper-style', 'true');
          style.textContent = `
            .img-wrapper-with-badge {
              position: relative;
              display: inline-block;
            }
            .img-wrapper-with-badge::before {
              content: '';
              position: absolute;
              top: 0; left: 0;
              width: 100%;
              height: 100%;
              border: 5px solid #00bcd4;
              box-sizing: border-box;
              z-index: 1;
              pointer-events: none;
            }
          `;
          document.head.appendChild(style);

          const selectors = [
            '.product-detail', '.product_detail', '.product-detail-imgview', '.imgview', '.detail_wrap',
            '.product-content', '.item-detail', '#product-detail', '.goods-detail',
            '.detail-area', '.product-info', '.front-detail', '.event_wrap', '.product_detail_wrap'
          ];
          const containers = document.querySelectorAll(selectors.join(','));

          containers.forEach(container => {
            const imgs = container.querySelectorAll('img');
            imgs.forEach(img => {
              // null 체크 추가
              if (!img || !img.parentElement) return;
              if (img.parentElement?.classList.contains('img-wrapper-with-badge')) return;

              // lazy 해제
              if (img.dataset && img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
              if (img.dataset && img.dataset.original) { img.src = img.dataset.original; img.removeAttribute('data-original'); }
              if (img.getAttribute('ec-data-src')) { img.src = img.getAttribute('ec-data-src'); img.removeAttribute('ec-data-src'); }
              if (img.getAttribute('lazy-src')) { img.src = img.getAttribute('lazy-src'); img.removeAttribute('lazy-src'); }

              const fullSrc = img.src || '';
              const idx = fullSrc.indexOf('img/');
              const filename = idx !== -1 ? fullSrc.substring(idx) : fullSrc.split('/').pop().split('?')[0];

              // gif 예외처리
              if (filename.toLowerCase().endsWith('.gif')) return;

              const wrapper = document.createElement('div');
              wrapper.className = 'img-wrapper-with-badge';

              const badge = document.createElement('div');
              badge.textContent = filename;
              Object.assign(badge.style, {
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#00bcd4',
                color: '#fff',
                padding: '4px 10px',
                fontSize: '14px',
                fontWeight: 'bold',
                lineHeight: '1.2',
                borderBottomLeftRadius: '8px',
                zIndex: '1',
                cursor: 'pointer'
              });

              badge.addEventListener('click', () => {
                // 웹페이지 컨텍스트에서 복사 함수 실행
                const ta = document.createElement('textarea');
                ta.value = filename;
                ta.style.position = 'fixed';
                ta.style.top = '-1000px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                badge.textContent = `✅ 복사됨: ${filename}`;
                setTimeout(() => { badge.textContent = filename; }, 1500);
              });

              // 추가 null 체크
              if (img.parentNode) {
                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
                wrapper.appendChild(badge);
              }
            });
          });
        }
      },
      args: [isActive]
    }, () => {
      const newState = !isActive;
      btnImages.classList.toggle('active', newState);
      chrome.storage.local.set({ imagesShown: newState });
      
      // 상태 변경 후 약간의 지연을 두고 popup 닫기
      setTimeout(() => {
        // 다른 버튼들의 상태도 확인하여 동기화
        checkPageState().then(pageState => {
          chrome.storage.local.set(pageState);
        });
        window.close();
      }, 200);
    });
  });

  // 상품 번호 뱃지
  btnCodes.addEventListener("click", async () => {
    const isActive = btnCodes.classList.contains("active");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (remove) => {
        // id 속성에서 anchorBoxId_ 찾기
        const idElements = document.querySelectorAll('[id^="anchorBoxId_"]');
        // class 속성에서 anchorBoxId_ 찾기
        const classElements = document.querySelectorAll('[class*="anchorBoxId_"]');
        
        // 모든 요소를 Set으로 중복 제거
        const allElements = new Set([...idElements, ...classElements]);

        allElements.forEach(el => {
          // null 체크 추가
          if (!el) return;
          
          let code = '';
          
          // id에서 찾기
          if (el.id && el.id.startsWith("anchorBoxId_")) {
            code = el.id.replace("anchorBoxId_", "");
          }
          // class에서 찾기
          else if (el.className && el.className.includes("anchorBoxId_")) {
            const classMatch = el.className.match(/anchorBoxId_(\d+)/);
            if (classMatch) {
              code = classMatch[1];
            }
          }
          
          if (!code) return; // 코드를 찾지 못한 경우 스킵
          
          const badge = el.querySelector('.product-code-badge');

          if (remove) {
            if (badge) badge.remove();
            el.style.outline = '';
          } else {
            if (badge) return;

            // a 태그가 아닌 경우에만 position: relative 설정
            if (el.tagName !== 'A') {
              el.style.position = 'relative';
            }
            el.style.outline = '4px dashed #673ab7';

            const badgeEl = document.createElement('div');
            badgeEl.className = 'product-code-badge';
            badgeEl.innerText = `상품번호: ${code}`;
            Object.assign(badgeEl.style, {
              position: 'absolute',
              top: '0',
              left: '0',
              background: '#673ab7',
              color: '#fff',
              padding: '4px 10px',
              fontSize: '14px',
              fontWeight: 'bold',
              lineHeight: '1.2',
              textIndent: '0',
              borderBottomRightRadius: '8px',
              zIndex: '1',
              cursor: 'pointer'
            });

            badgeEl.addEventListener('click', (e) => {
              e.stopPropagation();
              // 웹페이지 컨텍스트에서 복사 함수 실행
              const ta = document.createElement('textarea');
              ta.value = code;
              ta.style.position = 'fixed';
              ta.style.top = '-1000px';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              badgeEl.innerText = `✅ 복사됨: ${code}`;
              setTimeout(() => { badgeEl.innerText = `상품번호: ${code}`; }, 1500);
            });

            el.appendChild(badgeEl);
          }
        });
      },
      args: [isActive]
    }, () => {
      const newState = !isActive;
      btnCodes.classList.toggle('active', newState);
      chrome.storage.local.set({ productCodesShown: newState });
      
      // 상태 변경 후 약간의 지연을 두고 popup 닫기
      setTimeout(() => {
        // 다른 버튼들의 상태도 확인하여 동기화
        checkPageState().then(pageState => {
          chrome.storage.local.set(pageState);
        });
        window.close();
      }, 200);
    });
  });



  // 스타일 인스펙터 (폰트 조절) 기능
  btnStyleInspector.addEventListener("click", async () => {
    const isActive = btnStyleInspector.classList.contains("active");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (remove) => {
        if (remove) {
          window.styleInspectorActive = false;
          const tooltip = document.getElementById('style-inspector-tooltip');
          if (tooltip) tooltip.remove();
          // 하이라이트된 요소의 outline 및 클래스 제거
          document.querySelectorAll('.style-inspector-highlight').forEach(el => {
            el.style.outline = '';
            el.classList.remove('style-inspector-highlight');
          });
          if (window.styleInspectorMouseMoveHandler) {
            document.removeEventListener('mousemove', window.styleInspectorMouseMoveHandler);
            window.styleInspectorMouseMoveHandler = null;
          }
          if (window.styleInspectorKeydownHandler) {
            document.removeEventListener('keydown', window.styleInspectorKeydownHandler);
            window.styleInspectorKeydownHandler = null;
          }
          if (window.styleInspectorTouchHandler) {
            document.removeEventListener('touchstart', window.styleInspectorTouchHandler);
            document.removeEventListener('touchmove', window.styleInspectorTouchHandler);
            window.styleInspectorTouchHandler = null;
          }
          if (window.styleInspectorDoubleClickHandler) {
            document.removeEventListener('dblclick', window.styleInspectorDoubleClickHandler);
            window.styleInspectorDoubleClickHandler = null;
          }
          window.styleInspectorLastTarget = null;
          window.styleInspectorLastFontSize = null;
        } else {
          window.styleInspectorActive = true;
          // 툴팁 생성
          let tooltip = document.getElementById('style-inspector-tooltip');
          if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'style-inspector-tooltip';
            Object.assign(tooltip.style, {
              position: 'fixed',
              top: '10px',
              left: '10px',
              background: 'rgba(255, 255, 255, 0.85)',
              color: '#222',
              border: '2px solid #673ab7',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              padding: '12px',
              fontSize: '13px',
              fontFamily: 'monospace',
              zIndex: '10000',
              minWidth: '220px',
              maxWidth: '320px',
              pointerEvents: 'auto',
              transition: 'opacity 0.2s',
              opacity: 0,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            });
            document.body.appendChild(tooltip);
          }

          let lastTarget = null;
          let lastFontSize = null;
          // 전역에 저장하여 키보드 핸들러에서 접근 가능하게
          window.styleInspectorLastTarget = null;
          window.styleInspectorLastFontSize = null;

          function px(val) {
            return val ? `${parseFloat(val)}px` : '-';
          }

          // 폰트 크기 조절 함수
          function setFontSize(target, size) {
            if (!target) return;
            // 강제 적용
            target.style.setProperty('font-size', size + 'px', 'important');
            // 자식 노드에도 재귀 적용
            Array.from(target.children).forEach(child => setFontSize(child, size));
          }

          // 툴팁 폰트 크기 하이라이트 효과 적용 함수
          function highlightFontSize() {
            const fontSizeSpan = document.getElementById('style-inspector-fontsize');
            if (fontSizeSpan) {
              fontSizeSpan.style.background = '#ffe082';
              fontSizeSpan.style.borderRadius = '4px';
              fontSizeSpan.style.transition = 'background 0.3s';
              setTimeout(() => {
                fontSizeSpan.style.background = '';
              }, 400);
            }
          }
          // 툴팁 패딩 하이라이트 효과
          function highlightPadding() {
            const paddingSpan = document.getElementById('style-inspector-padding');
            if (paddingSpan) {
              paddingSpan.style.background = '#ffe082';
              paddingSpan.style.borderRadius = '4px';
              paddingSpan.style.transition = 'background 0.3s';
              setTimeout(() => {
                paddingSpan.style.background = '';
              }, 400);
            }
          }
          // 툴팁 마진 하이라이트 효과
          function highlightMargin() {
            const marginSpan = document.getElementById('style-inspector-margin');
            if (marginSpan) {
              marginSpan.style.background = '#ffe082';
              marginSpan.style.borderRadius = '4px';
              marginSpan.style.transition = 'background 0.3s';
              setTimeout(() => {
                marginSpan.style.background = '';
              }, 400);
            }
          }

          // rgb/rgba -> hex 변환 함수
          function rgbToHex(rgb) {
            if (!rgb) return '';
            const result = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!result) return rgb;
            const r = parseInt(result[1]).toString(16).padStart(2, '0');
            const g = parseInt(result[2]).toString(16).padStart(2, '0');
            const b = parseInt(result[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
          }

          // 툴팁 내용 갱신 함수 (폰트 크기 등 실시간 반영)
          function updateTooltipContent(el, fontSize, isMobile) {
            const computed = window.getComputedStyle(el);
            const tag = el.tagName.toLowerCase();
            const className = el.className ? (typeof el.className === 'string' ? el.className : Array.from(el.classList).join(' ')) : '';
            const id = el.id ? `#${el.id}` : '';
            const fontFamily = computed.fontFamily;
            const color = computed.color;
            const colorHex = rgbToHex(color);
            const bgColor = computed.backgroundColor;
            const bgColorHex = rgbToHex(bgColor);
            const padding = `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`;
            const margin = `${computed.marginTop} ${computed.marginRight} ${computed.marginBottom} ${computed.marginLeft}`;
            const rect = el.getBoundingClientRect();
            
            // 클래스명과 아이디 처리: 하나씩만 표시
            let selectorDisplay = tag;
            let selectorTitle = tag;
            
            if (id) {
              selectorDisplay += id;
              selectorTitle += id;
            } else if (className) {
              // 클래스명이 있는 경우 마지막 클래스만 표시하고 .으로 구분
              // style-inspector-highlight 클래스는 제외
              const classes = className.split(' ').filter(c => c.trim() && c !== 'style-inspector-highlight');
              if (classes.length > 0) {
                const lastClass = classes[classes.length - 1];
                selectorDisplay += '.' + lastClass;
                selectorTitle += '.' + className; // title에는 전체 클래스명 표시
              }
            }
            
            tooltip.innerHTML = `
              <div style="font-weight:bold; color:#6a1b9a; margin-bottom:8px; line-height:1.4; overflow-wrap:break-word; word-break:break-all; max-width:260px;"
                title="${selectorTitle}">
                ${selectorDisplay}
              </div>
              <div style="margin-bottom:2px; line-height:1.2;">Size: <b>${Math.round(rect.width)} × ${Math.round(rect.height)}</b></div>
              <div style="margin-bottom:2px; line-height:1.2;">Font: <span id='style-inspector-fontsize' style='font-weight:bold;'>${fontSize}</span> <span style='color:#888;'>${fontFamily}</span></div>
              <div style="margin-bottom:2px; line-height:1.2;">Color: ${colorHex}</div>
              <div style="margin-bottom:2px; line-height:1.2;">BG: ${bgColorHex}</div>
              <div style="margin-bottom:2px; line-height:1.2;">Padding: <span id='style-inspector-padding'><b>${padding}</b></span></div>
              <div style="margin-bottom:2px; line-height:1.2;">Margin: <span id='style-inspector-margin'><b>${margin}</b></span></div>
              <div style="margin-top:16px; padding:10px 12px; background:#ede7f6; color:#4527a0; border-radius:7px; font-size:13.5px; font-weight:500; text-align:left; line-height:1.9; box-shadow:0 1px 4px rgba(106,27,154,0.07); letter-spacing:0.01em;">
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">+ / -</span> <span style='color:#333;'>폰트 크기 조절</span></div>
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">{ / }</span> <span style='color:#333;'>마진(top/bottom) 조절</span></div>
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">[ / ]</span> <span style='color:#333;'>패딩(top/bottom) 조절</span></div>
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">0</span> <span style='color:#333;'>원본 스타일 복원</span></div>
                <div style='margin:8px 0; border-top:1px solid rgba(106,27,154,0.2);'></div>
                <div style='margin-bottom:2px;'><span style="background:#ff5722; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">더블클릭</span> <span style='color:#333;'>텍스트 편집</span></div>
                <div style='margin-bottom:2px;'><span style="background:#ff9800; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">F2</span> <span style='color:#333;'>현재 화면 캡처</span></div>
                <div style=''><span style="background:#7e57c2; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">ESC</span> <span style='color:#333;'>종료/재시작</span></div>
              </div>
            `;
          }

          // 모바일/디바이스 모드 지원: 터치 이벤트 핸들러
          function isMobileDevice() {
            return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
          }

          let lastTouch = { x: 0, y: 0 };
          const touchHandler = (e) => {
            if (!window.styleInspectorActive) return;
            let touch = e.touches && e.touches[0] ? e.touches[0] : e;
            lastTouch.x = touch.clientX;
            lastTouch.y = touch.clientY;
            const el = document.elementFromPoint(lastTouch.x, lastTouch.y);
            if (!el || el === tooltip || el.id === 'style-inspector-tooltip') {
              tooltip.style.opacity = 0;
              window.styleInspectorLastTarget = null;
              window.styleInspectorLastFontSize = null;
              return;
            }
            lastTarget = el;
            lastFontSize = parseFloat(window.getComputedStyle(el).fontSize);
            window.styleInspectorLastTarget = lastTarget;
            window.styleInspectorLastFontSize = lastFontSize;
            updateTooltipContent(el, lastFontSize, true);
            
            // 툴팁 위치 조정 (터치 이벤트용)
            adjustTooltipPosition(tooltip, lastTouch.x, lastTouch.y);
            tooltip.style.opacity = 1;

            // 모바일용 버튼 이벤트 바인딩
            setTimeout(() => {
              const minusBtn = document.getElementById('fontMinusBtn');
              const plusBtn = document.getElementById('fontPlusBtn');
              const paddingMinusBtn = document.getElementById('paddingMinusBtn');
              const paddingPlusBtn = document.getElementById('paddingPlusBtn');
              const marginMinusBtn = document.getElementById('marginMinusBtn');
              const marginPlusBtn = document.getElementById('marginPlusBtn');
              const escBtn = document.getElementById('escBtn');
              if (minusBtn) minusBtn.onclick = () => { if (lastTarget && lastFontSize > 6) { setFontSize(lastTarget, lastFontSize - 1); lastFontSize -= 1; window.styleInspectorLastFontSize = lastFontSize; updateTooltipContent(lastTarget, lastFontSize, true); highlightFontSize(); } };
              if (plusBtn) plusBtn.onclick = () => { if (lastTarget && lastFontSize < 200) { setFontSize(lastTarget, lastFontSize + 1); lastFontSize += 1; window.styleInspectorLastFontSize = lastFontSize; updateTooltipContent(lastTarget, lastFontSize, true); highlightFontSize(); } };
              if (paddingMinusBtn) paddingMinusBtn.onclick = () => { if (lastTarget) { const cur = parseFloat(window.getComputedStyle(lastTarget).paddingTop) || 0; lastTarget.style.paddingTop = Math.max(0, cur - 2) + 'px'; lastTarget.style.paddingBottom = Math.max(0, cur - 2) + 'px'; updateTooltipContent(lastTarget, lastFontSize, true); highlightPadding(); } };
              if (paddingPlusBtn) paddingPlusBtn.onclick = () => { if (lastTarget) { const cur = parseFloat(window.getComputedStyle(lastTarget).paddingTop) || 0; lastTarget.style.paddingTop = (cur + 2) + 'px'; lastTarget.style.paddingBottom = (cur + 2) + 'px'; updateTooltipContent(lastTarget, lastFontSize, true); highlightPadding(); } };
              if (marginMinusBtn) marginMinusBtn.onclick = () => { if (lastTarget) { const cur = parseFloat(window.getComputedStyle(lastTarget).marginTop) || 0; lastTarget.style.marginTop = Math.max(0, cur - 2) + 'px'; lastTarget.style.marginBottom = Math.max(0, cur - 2) + 'px'; updateTooltipContent(lastTarget, lastFontSize, true); highlightMargin(); } };
              if (marginPlusBtn) marginPlusBtn.onclick = () => { if (lastTarget) { const cur = parseFloat(window.getComputedStyle(lastTarget).marginTop) || 0; lastTarget.style.marginTop = (cur + 2) + 'px'; lastTarget.style.marginBottom = (cur + 2) + 'px'; updateTooltipContent(lastTarget, lastFontSize, true); highlightMargin(); } };
              if (escBtn) escBtn.onclick = () => { window.styleInspectorActive = false; if (tooltip) tooltip.remove(); if (window.styleInspectorMouseMoveHandler) { document.removeEventListener('mousemove', window.styleInspectorMouseMoveHandler); window.styleInspectorMouseMoveHandler = null; } if (window.styleInspectorKeydownHandler) { document.removeEventListener('keydown', window.styleInspectorKeydownHandler); window.styleInspectorKeydownHandler = null; } if (window.styleInspectorTouchHandler) { document.removeEventListener('touchstart', window.styleInspectorTouchHandler); document.removeEventListener('touchmove', window.styleInspectorTouchHandler); window.styleInspectorTouchHandler = null; } window.styleInspectorLastTarget = null; window.styleInspectorLastFontSize = null; };
            }, 10);
          };

          // 툴팁 위치 조정 함수
          function adjustTooltipPosition(tooltip, mouseX, mouseY) {
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let left = mouseX + 16;
            let top = mouseY + 16;
            
            // 오른쪽 경계 체크
            if (left + tooltipRect.width > viewportWidth) {
              left = mouseX - tooltipRect.width - 16;
            }
            
            // 하단 경계 체크
            if (top + tooltipRect.height > viewportHeight) {
              top = mouseY - tooltipRect.height - 16;
            }
            
            // 상단 경계 체크 (위로 이동했을 때)
            if (top < 0) {
              top = 10; // 최소 10px 여백
            }
            
            // 왼쪽 경계 체크 (왼쪽으로 이동했을 때)
            if (left < 0) {
              left = 10; // 최소 10px 여백
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
          }

          // 마우스 무브 핸들러
          const mouseMoveHandler = (e) => {
            if (!window.styleInspectorActive) return;
            
            // 편집 중인지 확인
            const isEditing = document.querySelector('.text-editor-active');
            if (isEditing) {
              if (tooltip) tooltip.style.opacity = 0;
              return;
            }
            
            // 툴팁이 없으면 생성
            let tooltip = document.getElementById('style-inspector-tooltip');
            if (!tooltip) {
              tooltip = document.createElement('div');
              tooltip.id = 'style-inspector-tooltip';
              Object.assign(tooltip.style, {
                position: 'fixed',
                top: '10px',
                left: '10px',
                background: 'rgba(255, 255, 255, 0.85)',
                color: '#222',
                border: '2px solid #673ab7',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                padding: '12px',
                fontSize: '13px',
                fontFamily: 'monospace',
                zIndex: '10000',
                minWidth: '220px',
                maxWidth: '320px',
                pointerEvents: 'auto',
                transition: 'opacity 0.2s',
                opacity: 0,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              });
              document.body.appendChild(tooltip);
              console.log('새 툴팁 생성됨:', tooltip);
            }
            
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (!el || el === tooltip || el.id === 'style-inspector-tooltip') {
              tooltip.style.opacity = 0;
              window.styleInspectorLastTarget = null;
              window.styleInspectorLastFontSize = null;
              // 요소 정보 배지도 숨기기
              const existingBadge = document.getElementById('style-inspector-element-badge');
              if (existingBadge) existingBadge.remove();
              document.querySelectorAll('.style-inspector-highlight').forEach(el => {
                el.style.outline = '';
                el.classList.remove('style-inspector-highlight');
              });
              return;
            }
            
            // 툴팁 내용 업데이트
            const fontSize = window.getComputedStyle(el).fontSize;
            console.log('요소 발견:', el.tagName, '폰트크기:', fontSize);
            
            // 툴팁 내용 직접 설정 (updateTooltipContent 함수 대신)
            const computed = window.getComputedStyle(el);
            const tag = el.tagName.toLowerCase();
            const className = el.className ? (typeof el.className === 'string' ? el.className : Array.from(el.classList).join(' ')) : '';
            const id = el.id ? `#${el.id}` : '';
            const fontFamily = computed.fontFamily;
            const color = computed.color;
            const colorHex = rgbToHex(color);
            const bgColor = computed.backgroundColor;
            const bgColorHex = rgbToHex(bgColor);
            const padding = `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`;
            const margin = `${computed.marginTop} ${computed.marginRight} ${computed.marginBottom} ${computed.marginLeft}`;
            const rect = el.getBoundingClientRect();
            
            // 클래스명과 아이디 처리
            let selectorDisplay = tag;
            let selectorTitle = tag;
            
            if (id) {
              selectorDisplay += id;
              selectorTitle += id;
            } else if (className) {
              const classes = className.split(' ').filter(c => c.trim() && c !== 'style-inspector-highlight');
              if (classes.length > 0) {
                const lastClass = classes[classes.length - 1];
                selectorDisplay += '.' + lastClass;
                selectorTitle += '.' + className;
              }
            }
            
            tooltip.innerHTML = `
              <div style="font-weight:bold; color:#6a1b9a; margin-bottom:8px; line-height:1.4; overflow-wrap:break-word; word-break:break-all; max-width:260px;"
                title="${selectorTitle}">
                ${selectorDisplay}
              </div>
              <div style="margin-bottom:2px; line-height:1.2;">Size: <b>${Math.round(rect.width)} × ${Math.round(rect.height)}</b></div>
              <div style="margin-bottom:2px; line-height:1.2;">Font: <span id='style-inspector-fontsize' style='font-weight:bold;'>${fontSize}</span> <span style='color:#888;'>${fontFamily}</span></div>
              <div style="margin-bottom:2px; line-height:1.2;">Color: ${colorHex}</div>
              <div style="margin-bottom:2px; line-height:1.2;">BG: ${bgColorHex}</div>
              <div style="margin-bottom:2px; line-height:1.2;">Padding: <span id='style-inspector-padding'><b>${padding}</b></span></div>
              <div style="margin-bottom:2px; line-height:1.2;">Margin: <span id='style-inspector-margin'><b>${margin}</b></span></div>
              <div style="margin-top:16px; padding:10px 12px; background:#ede7f6; color:#4527a0; border-radius:7px; font-size:13.5px; font-weight:500; text-align:left; line-height:1.9; box-shadow:0 1px 4px rgba(106,27,154,0.07); letter-spacing:0.01em;">
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">+ / -</span> <span style='color:#333;'>폰트 크기 조절</span></div>
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">{ / }</span> <span style='color:#333;'>마진(top/bottom) 조절</span></div>
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">[ / ]</span> <span style='color:#333;'>패딩(top/bottom) 조절</span></div>
                <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">0</span> <span style='color:#333;'>원본 스타일 복원</span></div>
                <div style='margin:8px 0; border-top:1px solid rgba(106,27,154,0.2);'></div>
                <div style='margin-bottom:2px;'><span style="background:#ff5722; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">더블클릭</span> <span style='color:#333;'>텍스트 편집</span></div>
                <div style='margin-bottom:2px;'><span style="background:#ff9800; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">F2</span> <span style='color:#333;'>현재 화면 캡처</span></div>
                <div style=''><span style="background:#7e57c2; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">ESC</span> <span style='color:#333;'>종료/재시작</span></div>
              </div>
            `;
            
            // 툴팁 위치 조정
            adjustTooltipPosition(tooltip, e.clientX, e.clientY);
            
            // 요소 하이라이트
            showElementInfo(el, fontSize);
            
            // 툴팁 표시
            tooltip.style.opacity = 1;
            lastTarget = el;
            lastFontSize = parseFloat(window.getComputedStyle(el).fontSize);
            window.styleInspectorLastTarget = lastTarget;
            window.styleInspectorLastFontSize = lastFontSize;
          };

          // 더블클릭 이벤트 핸들러 추가
          const doubleClickHandler = (e) => {
            if (!window.styleInspectorActive) return;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (!el || el === tooltip || el.id === 'style-inspector-tooltip') return;
            
            e.preventDefault();
            e.stopPropagation();
            console.log('더블클릭 감지:', el);
            
            // 툴팁 숨기기
            if (tooltip) {
              tooltip.style.opacity = 0;
            }
            
            startTextEdit(el);
          };

          document.addEventListener('dblclick', doubleClickHandler);
          window.styleInspectorDoubleClickHandler = doubleClickHandler;

          function showElementInfo(el, fontSize) {
            // 예시: 요소에 보라색 점선 테두리 추가
            document.querySelectorAll('.style-inspector-highlight').forEach(el => {
              el.style.outline = '';
              el.classList.remove('style-inspector-highlight');
            });
            if (!el) return;
            el.style.outline = '3px dotted #673ab7';
            el.classList.add('style-inspector-highlight');
          }

          document.addEventListener('mousemove', mouseMoveHandler);
          window.styleInspectorMouseMoveHandler = mouseMoveHandler;

          // 모바일/디바이스 모드 지원: 터치 이벤트 등록
          if (isMobileDevice()) {
            document.addEventListener('touchstart', touchHandler);
            document.addEventListener('touchmove', touchHandler);
            window.styleInspectorTouchHandler = touchHandler;
          }

          // 키보드 핸들러: +, - 키로 폰트 크기 조절, {, }로 마진, [, ]로 패딩
          const keydownHandler = (e) => {
            console.log('🔍 키보드 이벤트 감지:', e.key, '활성 상태:', window.styleInspectorActive);
            
            // 항상 전역 변수에서 가져옴 (중복 핸들러 방지)
            const el = window.styleInspectorLastTarget;
            let fontSize = window.styleInspectorLastFontSize;
            if (!window.styleInspectorActive) return;
            
            // F2 키로 캡처 기능 실행
            if (e.key === 'F2') {
              console.log('📸 F2 키 감지! 캡처 시작...');
              e.preventDefault(); // 기본 동작 방지
              captureInspector();
              return;
            }
            
            // ESC 키로 스타일 인스펙터 비활성화/재활성화
            if (e.key === 'Escape') {
              console.log('ESC 키 감지! 현재 상태:', window.styleInspectorActive);
              e.preventDefault();
              e.stopPropagation();
              
              if (window.styleInspectorActive) {
                console.log('인스펙터 종료...');
                window.styleInspectorActive = false;
                const tooltip = document.getElementById('style-inspector-tooltip');
                if (tooltip) tooltip.remove();
                // 하이라이트된 요소의 outline 및 클래스 제거
                document.querySelectorAll('.style-inspector-highlight').forEach(el => {
                  el.style.outline = '';
                  el.classList.remove('style-inspector-highlight');
                });
                if (window.styleInspectorMouseMoveHandler) {
                  document.removeEventListener('mousemove', window.styleInspectorMouseMoveHandler);
                  window.styleInspectorMouseMoveHandler = null;
                }
                if (window.styleInspectorKeydownHandler) {
                  document.removeEventListener('keydown', window.styleInspectorKeydownHandler);
                  window.styleInspectorKeydownHandler = null;
                }
                if (window.styleInspectorTouchHandler) {
                  document.removeEventListener('touchstart', window.styleInspectorTouchHandler);
                  document.removeEventListener('touchmove', window.styleInspectorTouchHandler);
                  window.styleInspectorTouchHandler = null;
                }
                if (window.styleInspectorDoubleClickHandler) {
                  document.removeEventListener('dblclick', window.styleInspectorDoubleClickHandler);
                  window.styleInspectorDoubleClickHandler = null;
                }
                if (window.styleInspectorGlobalEscHandler) {
                  document.removeEventListener('keydown', window.styleInspectorGlobalEscHandler);
                  window.styleInspectorGlobalEscHandler = null;
                }
                window.styleInspectorLastTarget = null;
                window.styleInspectorLastFontSize = null;
                showNotification('스타일 인스펙터가 비활성화되었습니다. ESC를 한 번 더 누르면 다시 활성화됩니다.', 'info');
                return;
              } else {
                console.log('인스펙터 재활성화...');
                // 스타일 인스펙터 재활성화
                window.styleInspectorActive = true;
                
                // 툴팁 생성
                let tooltip = document.getElementById('style-inspector-tooltip');
                if (!tooltip) {
                  tooltip = document.createElement('div');
                  tooltip.id = 'style-inspector-tooltip';
                  Object.assign(tooltip.style, {
                    position: 'fixed',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    color: '#222',
                    border: '2px solid #673ab7',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    padding: '12px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    zIndex: '10000',
                    minWidth: '220px',
                    maxWidth: '320px',
                    pointerEvents: 'auto',
                    transition: 'opacity 0.2s',
                    opacity: 0,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  });
                  document.body.appendChild(tooltip);
                }

                // 전역 변수들 재설정
                lastTarget = null;
                lastFontSize = null;
                window.styleInspectorLastTarget = null;
                window.styleInspectorLastFontSize = null;

                // 이벤트 핸들러들 강제 재등록 (기존 핸들러 제거 후 다시 등록)
                if (window.styleInspectorMouseMoveHandler) {
                  document.removeEventListener('mousemove', window.styleInspectorMouseMoveHandler);
                }
                document.addEventListener('mousemove', mouseMoveHandler);
                window.styleInspectorMouseMoveHandler = mouseMoveHandler;

                if (window.styleInspectorKeydownHandler) {
                  document.removeEventListener('keydown', window.styleInspectorKeydownHandler);
                }
                document.addEventListener('keydown', keydownHandler);
                window.styleInspectorKeydownHandler = keydownHandler;

                if (window.styleInspectorDoubleClickHandler) {
                  document.removeEventListener('dblclick', window.styleInspectorDoubleClickHandler);
                }
                document.addEventListener('dblclick', doubleClickHandler);
                window.styleInspectorDoubleClickHandler = doubleClickHandler;

                // 모바일/디바이스 모드 지원: 터치 이벤트 등록
                if (window.styleInspectorTouchHandler) {
                  document.removeEventListener('touchstart', window.styleInspectorTouchHandler);
                  document.removeEventListener('touchmove', window.styleInspectorTouchHandler);
                }
                if (isMobileDevice()) {
                  document.addEventListener('touchstart', touchHandler);
                  document.addEventListener('touchmove', touchHandler);
                  window.styleInspectorTouchHandler = touchHandler;
                }

                              showNotification('스타일 인스펙터가 재활성화되었습니다.', 'success');
              
              // 툴팁을 즉시 보이게 하고 마우스 움직임 감지 시작
              setTimeout(() => {
                if (tooltip) {
                  tooltip.style.opacity = '1';
                  // 초기 툴팁 내용 설정
                  tooltip.innerHTML = `
                    <div style="font-weight:bold; color:#6a1b9a; margin-bottom:8px; line-height:1.4;">
                      스타일 인스펙터 재활성화됨
                    </div>
                    <div style="margin-bottom:2px; line-height:1.2;">마우스를 움직여 요소를 선택하세요</div>
                    <div style="margin-top:16px; padding:10px 12px; background:#ede7f6; color:#4527a0; border-radius:7px; font-size:13.5px; font-weight:500; text-align:left; line-height:1.9; box-shadow:0 1px 4px rgba(106,27,154,0.07); letter-spacing:0.01em;">
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">+ / -</span> <span style='color:#333;'>폰트 크기 조절</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">{ / }</span> <span style='color:#333;'>마진(top/bottom) 조절</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">[ / ]</span> <span style='color:#333;'>패딩(top/bottom) 조절</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">0</span> <span style='color:#333;'>원본 스타일 복원</span></div>
                      <div style='margin:8px 0; border-top:1px solid rgba(106,27,154,0.2);'></div>
                      <div style='margin-bottom:2px;'><span style="background:#ff5722; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">더블클릭</span> <span style='color:#333;'>텍스트 편집</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#ff9800; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">F2</span> <span style='color:#333;'>현재 화면 캡처</span></div>
                      <div style=''><span style="background:#7e57c2; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">ESC</span> <span style='color:#333;'>종료/재시작</span></div>
                    </div>
                  `;
                }
              }, 100);
              return;
              }
            }
            
            if (!el) return;
            let changed = false;
            // 폰트 크기
            if ((e.key === '+' || e.key === '=') && fontSize < 200) {
              setFontSize(el, fontSize + 1);
              fontSize += 1;
              changed = true;
            } else if ((e.key === '-' || e.key === '_') && fontSize > 6) {
              setFontSize(el, fontSize - 1);
              fontSize -= 1;
              changed = true;
            } else if (e.key === '0') {
              // 0 키로 모든 스타일 제거하여 원본으로 복원
              el.style.removeProperty('font-size');
              el.style.removeProperty('margin-top');
              el.style.removeProperty('margin-bottom');
              el.style.removeProperty('padding-top');
              el.style.removeProperty('padding-bottom');
              
              // 자식 요소들도 font-size 제거
              Array.from(el.children).forEach(child => {
                child.style.removeProperty('font-size');
              });
              
              // 텍스트도 원상복구
              if (el.dataset.originalText) {
                el.textContent = el.dataset.originalText;
                delete el.dataset.originalText;
                showNotification('텍스트가 원상복구되었습니다.', 'success');
              }
              
              fontSize = parseFloat(window.getComputedStyle(el).fontSize);
              changed = true;
            }
            // 마진 조절 ({, })
            const marginStep = 2;
            if (e.key === '{') {
              const cur = parseFloat(window.getComputedStyle(el).marginTop) || 0;
              el.style.marginTop = Math.max(0, cur - marginStep) + 'px';
              el.style.marginBottom = Math.max(0, cur - marginStep) + 'px';
              changed = true;
            } else if (e.key === '}') {
              const cur = parseFloat(window.getComputedStyle(el).marginTop) || 0;
              el.style.marginTop = (cur + marginStep) + 'px';
              el.style.marginBottom = (cur + marginStep) + 'px';
              changed = true;
            }
            // 패딩 조절 ([, ])
            const paddingStep = 2;
            if (e.key === '[') {
              const cur = parseFloat(window.getComputedStyle(el).paddingTop) || 0;
              el.style.paddingTop = Math.max(0, cur - paddingStep) + 'px';
              el.style.paddingBottom = Math.max(0, cur - paddingStep) + 'px';
              changed = true;
            } else if (e.key === ']') {
              const cur = parseFloat(window.getComputedStyle(el).paddingTop) || 0;
              el.style.paddingTop = (cur + paddingStep) + 'px';
              el.style.paddingBottom = (cur + paddingStep) + 'px';
              changed = true;
            }
            if (changed) {
              window.styleInspectorLastFontSize = fontSize;
              // 항상 직접 툴팁 내용 업데이트 (함수 의존성 제거)
              const tooltip = document.getElementById('style-inspector-tooltip');
              if (tooltip && el) {
                const computed = window.getComputedStyle(el);
                const tag = el.tagName.toLowerCase();
                const className = el.className ? (typeof el.className === 'string' ? el.className : Array.from(el.classList).join(' ')) : '';
                const id = el.id ? `#${el.id}` : '';
                const fontFamily = computed.fontFamily;
                const color = computed.color;
                const colorHex = rgbToHex(color);
                const bgColor = computed.backgroundColor;
                const bgColorHex = rgbToHex(bgColor);
                const padding = `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`;
                const margin = `${computed.marginTop} ${computed.marginRight} ${computed.marginBottom} ${computed.marginLeft}`;
                const rect = el.getBoundingClientRect();
                
                // 클래스명과 아이디 처리
                let selectorDisplay = tag;
                let selectorTitle = tag;
                
                if (id) {
                  selectorDisplay += id;
                  selectorTitle += id;
                } else if (className) {
                  const classes = className.split(' ').filter(c => c.trim() && c !== 'style-inspector-highlight');
                  if (classes.length > 0) {
                    const lastClass = classes[classes.length - 1];
                    selectorDisplay += '.' + lastClass;
                    selectorTitle += '.' + className;
                  }
                }
                
                tooltip.innerHTML = `
                  <div style="font-weight:bold; color:#6a1b9a; margin-bottom:8px; line-height:1.4; overflow-wrap:break-word; word-break:break-all; max-width:260px;"
                    title="${selectorTitle}">
                    ${selectorDisplay}
                  </div>
                  <div style="margin-bottom:2px; line-height:1.2;">Size: <b>${Math.round(rect.width)} × ${Math.round(rect.height)}</b></div>
                  <div style="margin-bottom:2px; line-height:1.2;">Font: <span id='style-inspector-fontsize' style='font-weight:bold;'>${fontSize}px</span> <span style='color:#888;'>${fontFamily}</span></div>
                  <div style="margin-bottom:2px; line-height:1.2;">Color: ${colorHex}</div>
                  <div style="margin-bottom:2px; line-height:1.2;">BG: ${bgColorHex}</div>
                  <div style="margin-bottom:2px; line-height:1.2;">Padding: <span id='style-inspector-padding'><b>${padding}</b></span></div>
                  <div style="margin-bottom:2px; line-height:1.2;">Margin: <span id='style-inspector-margin'><b>${margin}</b></span></div>
                  <div style="margin-top:16px; padding:10px 12px; background:#ede7f6; color:#4527a0; border-radius:7px; font-size:13.5px; font-weight:500; text-align:left; line-height:1.9; box-shadow:0 1px 4px rgba(106,27,154,0.07); letter-spacing:0.01em;">
                    <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">+ / -</span> <span style='color:#333;'>폰트 크기 조절</span></div>
                    <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">{ / }</span> <span style='color:#333;'>마진(top/bottom) 조절</span></div>
                    <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">[ / ]</span> <span style='color:#333;'>패딩(top/bottom) 조절</span></div>
                    <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">0</span> <span style='color:#333;'>원본 스타일 복원</span></div>
                    <div style='margin:8px 0; border-top:1px solid rgba(106,27,154,0.2);'></div>
                    <div style='margin-bottom:2px;'><span style="background:#ff5722; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">더블클릭</span> <span style='color:#333;'>텍스트 편집</span></div>
                    <div style='margin-bottom:2px;'><span style="background:#ff9800; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">F2</span> <span style='color:#333;'>현재 화면 캡처</span></div>
                    <div style=''><span style="background:#7e57c2; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">ESC</span> <span style='color:#333;'>종료/재시작</span></div>
                  </div>
                `;
              }
              highlightFontSize();
              if (e.key === '[' || e.key === ']') highlightPadding();
              if (e.key === '{' || e.key === '}') highlightMargin();
            }
          };

          // 텍스트 편집 기능
          function startTextEdit(element) {
            console.log('텍스트 편집 시작:', element);
            
            // 이미 편집 중인 요소가 있다면 제거
            const existingEditor = document.querySelector('.text-editor-active');
            if (existingEditor) {
              existingEditor.remove();
            }

            // 편집 가능한 요소인지 확인 (더 유연하게)
            if (!element || !element.textContent) {
              showNotification('편집할 텍스트가 없습니다.', 'warning');
              return;
            }

            // 원본 텍스트 저장 (이미 저장되어 있지 않은 경우에만)
            if (!element.dataset.originalText) {
              element.dataset.originalText = element.textContent.trim();
            }
            const originalText = element.dataset.originalText;
            console.log('원본 텍스트:', originalText);
            
            // 편집기 생성
            const editor = document.createElement('textarea');
            editor.className = 'text-editor-active';
            editor.value = originalText;
            
            // 편집기 스타일 설정
            const computedStyle = window.getComputedStyle(element);
            Object.assign(editor.style, {
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              border: '2px solid #ff5722',
              borderRadius: '4px',
              padding: '4px',
              fontSize: computedStyle.fontSize || '14px',
              fontFamily: computedStyle.fontFamily || 'Arial',
              color: computedStyle.color || '#000',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              zIndex: '10000',
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              lineHeight: computedStyle.lineHeight || '1.2'
            });

            // 요소에 편집기 추가
            if (element.style.position !== 'relative' && element.style.position !== 'absolute') {
              element.style.position = 'relative';
            }
            element.appendChild(editor);
            
            // 포커스 및 선택
            setTimeout(() => {
              editor.focus();
              editor.select();
            }, 10);

            // 편집 완료 함수
            function finishEdit() {
              console.log('편집 완료');
              const newText = editor.value.trim();
              console.log('새 텍스트:', newText);
              
              if (newText !== originalText && newText !== '') {
                element.textContent = newText;
                showNotification('텍스트가 수정되었습니다.', 'success');
                console.log('텍스트 수정 완료');
              } else {
                console.log('텍스트 변경 없음');
              }
              editor.remove();
            }

            // 편집 취소 함수
            function cancelEdit() {
              console.log('편집 취소');
              editor.remove();
            }

            // 이벤트 리스너 등록
            editor.addEventListener('blur', finishEdit);
            editor.addEventListener('keydown', (e) => {
              console.log('키보드 이벤트:', e.key);
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                finishEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cancelEdit();
              }
            });

            // 더블클릭 이벤트 리스너 등록 (기존 요소에)
            element.addEventListener('dblclick', (e) => {
              e.preventDefault();
              e.stopPropagation();
              startTextEdit(element);
            });

            showNotification('텍스트 편집 모드: Enter로 저장, ESC로 취소', 'info');
          }

          // 캡처 기능 함수
          function captureInspector() {
            const highlight = document.querySelector('.style-inspector-highlight');
            const tooltip = document.getElementById('style-inspector-tooltip');
            
            if (!highlight && !tooltip) {
              console.log('캡처할 요소가 없습니다.');
              showNotification('캡처할 요소가 없습니다. 요소에 마우스를 올려주세요.', 'error');
              return;
            }

            // 캡처 시작 알림
            showNotification('화면 캡처 중... 잠시만 기다려주세요.', 'info');

            // html2canvas 로드 및 캡처 실행
            loadHtml2CanvasAndCapture();

            function loadHtml2CanvasAndCapture() {
              // html2canvas가 이미 로드되어 있는지 확인
              if (typeof html2canvas !== 'undefined') {
                performCapture();
                return;
              }

              // CSP 문제로 외부 스크립트 로드 불가 - Chrome API 시도
              console.log('외부 라이브러리 로드 불가, Chrome API 시도');
              tryChromeCapture();
            }

            function tryChromeCapture() {
              // Chrome Extension API를 통한 화면 캡처 시도
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                console.log('Chrome API 캡처 시도...');
                
                // 연결 상태 확인
                try {
                  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                    if (chrome.runtime.lastError) {
                      console.error('Chrome API 연결 실패:', chrome.runtime.lastError);
                      console.log('내장 캡처로 전환');
                      performSimpleCapture();
                    } else {
                      console.log('Chrome API 연결 성공, 캡처 요청');
                      requestChromeCapture();
                    }
                  });
                } catch (error) {
                  console.error('Chrome API 초기화 실패:', error);
                  performSimpleCapture();
                }
              } else {
                console.log('Chrome API 사용 불가, 내장 캡처 사용');
                performSimpleCapture();
              }
            }

            function requestChromeCapture() {
              chrome.runtime.sendMessage({ action: 'captureScreen' }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Chrome API 캡처 실패:', chrome.runtime.lastError);
                  console.log('내장 캡처로 전환');
                  performSimpleCapture();
                } else if (response && response.success) {
                  console.log('Chrome API 캡처 성공!');
                  processChromeCapture(response.dataUrl);
                } else {
                  console.log('Chrome API 응답 없음, 내장 캡처 사용');
                  performSimpleCapture();
                }
              });
            }

            function processChromeCapture(dataUrl) {
              try {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext('2d');
                  
                  // 스크린샷 그리기
                  ctx.drawImage(img, 0, 0);
                  
                  // 선택된 요소 영역 하이라이트 추가
                  if (highlight) {
                    const rect = highlight.getBoundingClientRect();
                    
                    // 보라색 점선 테두리 그리기
                    ctx.strokeStyle = '#673ab7';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([10, 5]);
                    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                    
                    // 반투명 배경
                    ctx.fillStyle = 'rgba(103, 58, 183, 0.1)';
                    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                  }
                  
                    // 툴팁 위치에 정보 박스 추가
                   if (tooltip) {
                     const rect = tooltip.getBoundingClientRect();
                     
                     // 툴팁 배경 (더 불투명하게)
                     ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                     ctx.fillRect(rect.left - 5, rect.top - 5, rect.width + 10, rect.height + 10);
                     
                     // 툴팁 테두리
                     ctx.strokeStyle = '#673ab7';
                     ctx.lineWidth = 2;
                     ctx.setLineDash([]);
                     ctx.strokeRect(rect.left - 5, rect.top - 5, rect.width + 10, rect.height + 10);
                     
                     // 툴팁 내용 텍스트 렌더링
                     const tooltipText = tooltip.innerText || tooltip.textContent;
                     if (tooltipText) {
                       // 텍스트를 줄별로 분리하고 빈 줄 제거
                       const lines = tooltipText.split('\n').filter(line => line.trim());
                       let yOffset = rect.top + 10;
                       
                                            // 최대 6줄까지만 렌더링
                     lines.slice(0, 6).forEach((line, index) => {
                       const trimmedLine = line.trim();
                       
                       // 기본 스타일 설정 (크기 증가)
                       ctx.fillStyle = '#333333';
                       ctx.font = '13px Arial';
                       
                       // 중요 정보 하이라이트 (Size, Font, Color)
                       if (trimmedLine.includes('Size:') || trimmedLine.includes('Font:') || trimmedLine.includes('Color:')) {
                         ctx.fillStyle = '#673ab7';
                         ctx.font = 'bold 13px Arial';
                       }
                       
                       // 텍스트 그리기
                       ctx.fillText(trimmedLine, rect.left, yOffset);
                       yOffset += 16; // 줄 간격도 증가
                     });
                     }
                   }
                  
                  // 다운로드
                  const filename = `inspector-chrome-capture-${new Date().getTime()}.png`;
                  downloadImage(canvas.toDataURL('image/png'), filename);
                  showNotification('Chrome API 캡처 완료!', 'success');
                };
                img.src = dataUrl;
              } catch (error) {
                console.error('Chrome 캡처 처리 실패:', error);
                performSimpleCapture();
              }
            }

            function performSimpleCapture() {
              try {
                console.log('내장 캡처 시작...');
                
                // 현재 뷰포트 크기
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                console.log('📐 뷰포트 크기:', viewportWidth, 'x', viewportHeight);
                
                // 캔버스 생성
                const canvas = document.createElement('canvas');
                canvas.width = viewportWidth;
                canvas.height = viewportHeight;
                const ctx = canvas.getContext('2d');
                
                // 배경색 설정 (실제 페이지와 유사하게)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, viewportWidth, viewportHeight);
                
                // 선택된 요소 영역 표시
                if (highlight) {
                  const rect = highlight.getBoundingClientRect();
                  
                  // 요소 영역 하이라이트 (보라색 점선)
                  ctx.strokeStyle = '#673ab7';
                  ctx.lineWidth = 3;
                  ctx.setLineDash([10, 5]);
                  ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                  
                  // 반투명 배경
                  ctx.fillStyle = 'rgba(103, 58, 183, 0.1)';
                  ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                  
                  // 요소 정보 텍스트
                  ctx.fillStyle = '#333333';
                  ctx.font = '14px Arial';
                  ctx.fillText(`선택된 요소: ${highlight.tagName}`, rect.left, rect.top - 10);
                }
                
                  // 툴팁 영역 표시
                 if (tooltip) {
                   const rect = tooltip.getBoundingClientRect();
                   
                   // 툴팁 배경 (더 불투명하게)
                   ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
                   ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                   
                   // 툴팁 테두리
                   ctx.strokeStyle = '#673ab7';
                   ctx.lineWidth = 2;
                   ctx.setLineDash([]);
                   ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                   
                   // 툴팁 내용 텍스트 렌더링
                   ctx.fillStyle = '#333333';
                   ctx.font = 'bold 12px Arial';
                   
                   // 실제 툴팁 내용을 가져와서 표시
                   const tooltipText = tooltip.innerText || tooltip.textContent;
                   if (tooltipText) {
                     // 텍스트를 줄별로 분리하고 빈 줄 제거
                     const lines = tooltipText.split('\n').filter(line => line.trim());
                     let yOffset = rect.top + 15;
                     
                     // 최대 8줄까지만 렌더링
                     lines.slice(0, 8).forEach((line, index) => {
                       const trimmedLine = line.trim();
                       
                       // 기본 스타일 설정 (크기 증가)
                       ctx.fillStyle = '#333333';
                       ctx.font = '14px Arial';
                       
                       // 중요 정보 하이라이트 (Size, Font, Color)
                       if (trimmedLine.includes('Size:') || trimmedLine.includes('Font:') || trimmedLine.includes('Color:')) {
                         ctx.fillStyle = '#673ab7';
                         ctx.font = 'bold 14px Arial';
                       }
                       
                       // 텍스트 그리기
                       ctx.fillText(trimmedLine, rect.left + 8, yOffset);
                       yOffset += 18; // 줄 간격도 증가
                     });
                   } else {
                     // 기본 텍스트 (툴팁 내용이 없는 경우)
                     ctx.fillStyle = '#333333';
                     ctx.font = '12px Arial';
                     ctx.fillText('스타일 정보', rect.left + 5, rect.top + 15);
                     ctx.fillText('F2: 캡처, ESC: 종료', rect.left + 5, rect.top + 30);
                   }
                 }
                
                // 메타데이터 추가
                ctx.fillStyle = '#666666';
                ctx.font = '12px Arial';
                ctx.fillText(`캡처 시간: ${new Date().toLocaleString()}`, 10, viewportHeight - 30);
                ctx.fillText(`URL: ${window.location.href}`, 10, viewportHeight - 15);
                
                const filename = `inspector-capture-${new Date().getTime()}.png`;
                downloadImage(canvas.toDataURL('image/png'), filename);
                showNotification('내장 캡처 완료!', 'success');
                
              } catch (error) {
                console.error('내장 캡처 실패:', error);
                showNotification('캡처 실패. 다시 시도해주세요.', 'error');
              }
            }

            function performCapture() {
              try {
                console.log('html2canvas 캡처 시작...');
                
                // 현재 뷰포트 전체를 캡처
                html2canvas(document.body, {
                  backgroundColor: null, // 투명 배경으로 실제 페이지 그대로
                  scale: 2, // 고해상도
                  useCORS: true,
                  allowTaint: true,
                  logging: false,
                  width: window.innerWidth,
                  height: window.innerHeight,
                  scrollX: window.pageXOffset,
                  scrollY: window.pageYOffset
                }).then(canvas => {
                  console.log('캡처 완료!');
                  
                  // 캡처된 이미지 다운로드
                  const filename = `inspector-capture-${new Date().getTime()}.png`;
                  downloadImage(canvas.toDataURL('image/png'), filename);
                  showNotification('화면 캡처 완료!', 'success');
                  
                }).catch(error => {
                  console.error('캡처 실패:', error);
                  showNotification('캡처 실패. 다시 시도해주세요.', 'error');
                });
                
              } catch (error) {
                console.error('캡처 초기화 실패:', error);
                showNotification('캡처 초기화 실패', 'error');
              }
            }

            // 이미지 다운로드 함수
            function downloadImage(dataUrl, filename) {
              try {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('이미지 다운로드 완료:', filename);
              } catch (error) {
                console.error('다운로드 실패:', error);
                showNotification('다운로드 실패. 브라우저 설정을 확인해주세요.', 'error');
              }
            }
          }

          // 알림 표시 함수 (전역에서 접근 가능하도록)
          function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.textContent = message;
            
            const colors = {
              success: '#4caf50',
              error: '#f44336',
              warning: '#ff9800',
              info: '#2196f3'
            };
            
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: ${colors[type] || colors.info};
              color: white;
              padding: 12px 20px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: bold;
              z-index: 10001;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              animation: slideIn 0.3s ease-out;
              max-width: 300px;
              word-wrap: break-word;
            `;
            
            // 애니메이션 스타일 추가
            if (!document.querySelector('#notification-style')) {
              const style = document.createElement('style');
              style.id = 'notification-style';
              style.textContent = `
                @keyframes slideIn {
                  from { transform: translateX(100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `;
              document.head.appendChild(style);
            }
            
            document.body.appendChild(notification);
            
            // 3초 후 알림 제거
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 3000);
          }

          // 키보드 이벤트 리스너 등록
          document.addEventListener('keydown', keydownHandler);
          window.styleInspectorKeydownHandler = keydownHandler;
          console.log('키보드 이벤트 리스너 등록 완료');

          // 전역 ESC 키 리스너 추가 (인스펙터가 비활성화되어 있어도 작동)
          const globalEscHandler = (e) => {
            if (e.key === 'Escape' && !window.styleInspectorActive) {
              console.log('전역 ESC 키 감지! 인스펙터 재활성화...');
              e.preventDefault();
              e.stopPropagation();
              
              // 스타일 인스펙터 재활성화
              window.styleInspectorActive = true;
              
              // 툴팁 생성
              let tooltip = document.getElementById('style-inspector-tooltip');
              if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'style-inspector-tooltip';
                Object.assign(tooltip.style, {
                  position: 'fixed',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  color: '#222',
                  border: '2px solid #673ab7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  padding: '12px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  zIndex: '10000',
                  minWidth: '220px',
                  maxWidth: '320px',
                  pointerEvents: 'auto',
                  transition: 'opacity 0.2s',
                  opacity: 0,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                });
                document.body.appendChild(tooltip);
              }

              // 전역 변수들 재설정
              lastTarget = null;
              lastFontSize = null;
              window.styleInspectorLastTarget = null;
              window.styleInspectorLastFontSize = null;

              // 이벤트 핸들러들 강제 재등록
              if (window.styleInspectorMouseMoveHandler) {
                document.removeEventListener('mousemove', window.styleInspectorMouseMoveHandler);
              }
              document.addEventListener('mousemove', mouseMoveHandler);
              window.styleInspectorMouseMoveHandler = mouseMoveHandler;

              if (window.styleInspectorKeydownHandler) {
                document.removeEventListener('keydown', window.styleInspectorKeydownHandler);
              }
              document.addEventListener('keydown', keydownHandler);
              window.styleInspectorKeydownHandler = keydownHandler;

              if (window.styleInspectorDoubleClickHandler) {
                document.removeEventListener('dblclick', window.styleInspectorDoubleClickHandler);
              }
              document.addEventListener('dblclick', doubleClickHandler);
              window.styleInspectorDoubleClickHandler = doubleClickHandler;

              // 모바일/디바이스 모드 지원: 터치 이벤트 등록
              if (window.styleInspectorTouchHandler) {
                document.removeEventListener('touchstart', window.styleInspectorTouchHandler);
                document.removeEventListener('touchmove', window.styleInspectorTouchHandler);
              }
              if (isMobileDevice()) {
                document.addEventListener('touchstart', touchHandler);
                document.addEventListener('touchmove', touchHandler);
                window.styleInspectorTouchHandler = touchHandler;
              }

              showNotification('스타일 인스펙터가 재활성화되었습니다.', 'success');
              
              // 툴팁을 즉시 보이게 하고 마우스 움직임 감지 시작
              setTimeout(() => {
                if (tooltip) {
                  // 툴팁 위치와 스타일 강제 설정
                  tooltip.style.position = 'fixed';
                  tooltip.style.top = '20px';
                  tooltip.style.left = '20px';
                  tooltip.style.opacity = '1';
                  tooltip.style.zIndex = '10000';
                  tooltip.style.display = 'block';
                  tooltip.style.visibility = 'visible';
                  
                  // 초기 툴팁 내용 설정
                  tooltip.innerHTML = `
                    <div style="font-weight:bold; color:#6a1b9a; margin-bottom:8px; line-height:1.4;">
                      스타일 인스펙터 재활성화됨
                    </div>
                    <div style="margin-bottom:2px; line-height:1.2;">마우스를 움직여 요소를 선택하세요</div>
                    <div style="margin-top:16px; padding:10px 12px; background:#ede7f6; color:#4527a0; border-radius:7px; font-size:13.5px; font-weight:500; text-align:left; line-height:1.9; box-shadow:0 1px 4px rgba(106,27,154,0.07); letter-spacing:0.01em;">
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">+ / -</span> <span style='color:#333;'>폰트 크기 조절</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">{ / }</span> <span style='color:#333;'>마진(top/bottom) 조절</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">[ / ]</span> <span style='color:#333;'>패딩(top/bottom) 조절</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#fff; color:#6a1b9a; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">0</span> <span style='color:#333;'>원본 스타일 복원</span></div>
                      <div style='margin:8px 0; border-top:1px solid rgba(106,27,154,0.2);'></div>
                      <div style='margin-bottom:2px;'><span style="background:#ff5722; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">더블클릭</span> <span style='color:#333;'>텍스트 편집</span></div>
                      <div style='margin-bottom:2px;'><span style="background:#ff9800; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">F2</span> <span style='color:#333;'>현재 화면 캡처</span></div>
                      <div style=''><span style="background:#7e57c2; color:#fff; border-radius:4px; padding:2px 7px; font-weight:bold; margin-right:6px;">ESC</span> <span style='color:#333;'>종료/재시작</span></div>
                    </div>
                  `;
                  
                  console.log('툴팁 재활성화 완료:', tooltip);
                } else {
                  console.log('툴팁을 찾을 수 없습니다!');
                }
              }, 100);
            }
          };

          document.addEventListener('keydown', globalEscHandler);
          window.styleInspectorGlobalEscHandler = globalEscHandler;
          
          // 전역 키보드 이벤트를 window에 직접 등록 (더 확실하게)
          window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !window.styleInspectorActive) {
              console.log('Window ESC 키 감지! 인스펙터 재활성화...');
              e.preventDefault();
              e.stopPropagation();
              
              // 스타일 인스펙터 재활성화
              window.styleInspectorActive = true;
              
              // 간단한 알림으로 대체
              showNotification('스타일 인스펙터가 재활성화되었습니다. 마우스를 움직여보세요!', 'success');
              
              // 전역 변수들 재설정
              lastTarget = null;
              lastFontSize = null;
              window.styleInspectorLastTarget = null;
              window.styleInspectorLastFontSize = null;

              // 이벤트 핸들러들 강제 재등록
              if (window.styleInspectorMouseMoveHandler) {
                document.removeEventListener('mousemove', window.styleInspectorMouseMoveHandler);
              }
              document.addEventListener('mousemove', mouseMoveHandler);
              window.styleInspectorMouseMoveHandler = mouseMoveHandler;

              if (window.styleInspectorKeydownHandler) {
                document.removeEventListener('keydown', window.styleInspectorKeydownHandler);
              }
              document.addEventListener('keydown', keydownHandler);
              window.styleInspectorKeydownHandler = keydownHandler;

              if (window.styleInspectorDoubleClickHandler) {
                document.removeEventListener('dblclick', window.styleInspectorDoubleClickHandler);
              }
              document.addEventListener('dblclick', doubleClickHandler);
              window.styleInspectorDoubleClickHandler = doubleClickHandler;

              // 모바일/디바이스 모드 지원: 터치 이벤트 등록
              if (window.styleInspectorTouchHandler) {
                document.removeEventListener('touchstart', window.styleInspectorTouchHandler);
                document.removeEventListener('touchmove', window.styleInspectorTouchHandler);
              }
              if (isMobileDevice()) {
                document.addEventListener('touchstart', touchHandler);
                document.addEventListener('touchmove', touchHandler);
                window.styleInspectorTouchHandler = touchHandler;
              }
            }
          });
        }
      },
      args: [isActive]
    }, () => {
      const newState = !isActive;
      btnStyleInspector.classList.toggle('active', newState);
      chrome.storage.local.set({ styleInspectorActive: newState });
      setTimeout(() => {
        checkPageState().then(pageState => {
          chrome.storage.local.set(pageState);
        });
        window.close();
      }, 200);
    });
  });
});

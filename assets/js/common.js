document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const targetId = btn.getAttribute('data-target');
      const code = document.getElementById(targetId).innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = '복사됨!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '복사';
          btn.classList.remove('copied');
        }, 1200);
      });
    });
  });

  document.querySelectorAll('.side-menu nav a').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      // 외부 링크나 다른 페이지 링크는 건드리지 않음
      if (href.startsWith('http') || href.includes('.html') || !href.startsWith('#')) {
        return; // 기본 동작 허용
      }
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerHeight = document.querySelector('header')?.offsetHeight + 20 || 80;
        const targetPosition = target.offsetTop - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });



  // 코드 복사 버튼 (intro-usage-box, usage-guide-modal 포함)
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
      const code = e.target.getAttribute('data-copy');
      if (code) {
        navigator.clipboard.writeText(code);
        e.target.textContent = '복사됨!';
        e.target.classList.add('copied');
        setTimeout(() => { 
          e.target.textContent = '복사'; 
          e.target.classList.remove('copied');
        }, 1200);
      }
    }
    
    // example-card 클릭 시 코드 복사
    const exampleCard = e.target.closest('.example-card');
    if (exampleCard && exampleCard.dataset.copy) {
      navigator.clipboard.writeText(exampleCard.dataset.copy).then(() => {
        const tooltip = exampleCard.querySelector('.copy-tooltip');
        const originalText = tooltip.textContent;
        tooltip.textContent = '복사됨!';
        tooltip.classList.add('success');
        
        setTimeout(() => {
          tooltip.textContent = originalText;
          tooltip.classList.remove('success');
        }, 1500);
      });
    }
  });
});

// 비메오 코드 생성기 함수들
function generateVimeoCode() {
  const url = document.getElementById('vimeoUrl').value.trim();
  
  if (!url) {
    showToast('비메오 링크를 입력해주세요.', { type: 'error' });
    return;
  }
  
  // 비메오 URL 유효성 검사
  if (!url.includes('player.vimeo.com')) {
    showToast('올바른 비메오 링크를 입력해주세요.', { type: 'error' });
    return;
  }
  
  // 옵션들 가져오기
  const muted = document.getElementById('vimeoMuted').checked;
  const autoplay = document.getElementById('vimeoAutoplay').checked;
  const loop = document.getElementById('vimeoLoop').checked;
  const playsinline = document.getElementById('vimeoPlaysinline').checked;
  
  // 비디오 속성들 구성
  let attributes = 'style="width: 100%; margin: 0 auto; display:block;" src="' + url + '"';
  
  if (muted) attributes += ' muted';
  if (autoplay) attributes += ' autoplay';
  if (loop) attributes += ' loop';
  if (playsinline) attributes += ' playsinline';
  
  // poster 속성은 항상 추가 (빈 값으로)
  attributes += ' poster';
  
  // 최종 HTML 코드 생성
  const generatedCode = `<span class="fr-video fr-deletable" contenteditable="false"><video ${attributes}></video></span>`;
  
  // 생성된 코드 표시
  document.getElementById('generatedCode').value = generatedCode;
  document.querySelector('.generated-code').style.display = 'block';
  
  showToast('HTML 코드가 생성되었습니다!', { type: 'success' });
}

function copyGeneratedCode() {
  const codeTextarea = document.getElementById('generatedCode');
  
  if (!codeTextarea.value) {
    showToast('먼저 코드를 생성해주세요.', { type: 'error' });
    return;
  }
  
  // 복사 버튼 참조 (event 객체가 없을 수 있으므로 안전하게 가져오기)
  const copyBtn = document.querySelector('.generated-code button');
  const originalText = copyBtn.textContent;
  
  // 코드 복사
  navigator.clipboard.writeText(codeTextarea.value).then(() => {
    showToast('코드가 클립보드에 복사되었습니다!', { type: 'success' });
    
    // 복사 버튼 텍스트 임시 변경
    copyBtn.textContent = '✅ 복사완료!';
    copyBtn.classList.add('copied');
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('copied');
    }, 2000);
  }).catch((error) => {
    console.error('복사 실패:', error);
    showToast('복사에 실패했습니다.', { type: 'error' });
  });
}

// 비메오 가이드 토글 함수
function toggleVimeoGuide() {
  const guide = document.querySelector('.vimeo-guide');
  const steps = guide.querySelector('.guide-steps');
  const toggleBtn = guide.querySelector('button');
  
  if (steps.style.display === 'none') {
    // 가이드 펼치기
    steps.style.display = 'block';
    toggleBtn.textContent = '가이드 접기';
    guide.style.marginBottom = '20px';
  } else {
    // 가이드 접기
    steps.style.display = 'none';
    toggleBtn.textContent = '가이드 펼치기';
    guide.style.marginBottom = '10px';
  }
}
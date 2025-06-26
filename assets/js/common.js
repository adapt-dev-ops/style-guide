document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const targetId = btn.getAttribute('data-target');
      const code = document.getElementById(targetId).innerText;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = '복사됨!';
        setTimeout(() => btn.textContent = '복사', 1200);
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

  // 플로팅 도입 안내 모달 열기/닫기
  const openUsageGuide = document.getElementById('openUsageGuide');
  const usageGuideModal = document.getElementById('usageGuideModal');
  const closeUsageGuide = document.getElementById('closeUsageGuide');

  if (openUsageGuide && usageGuideModal && closeUsageGuide) {
    openUsageGuide.addEventListener('click', () => {
      usageGuideModal.style.display = 'flex';
      usageGuideModal.focus();
    });
    closeUsageGuide.addEventListener('click', () => {
      usageGuideModal.style.display = 'none';
    });
    usageGuideModal.addEventListener('click', (e) => {
      if (e.target === usageGuideModal) {
        usageGuideModal.style.display = 'none';
      }
    });
    document.addEventListener('keydown', (e) => {
      if (usageGuideModal.style.display === 'flex' && (e.key === 'Escape' || e.key === 'Esc')) {
        usageGuideModal.style.display = 'none';
      }
    });
  }

  // 코드 복사 버튼 (intro-usage-box, usage-guide-modal 포함)
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
      const code = e.target.getAttribute('data-copy');
      if (code) {
        navigator.clipboard.writeText(code);
        e.target.textContent = '복사됨!';
        setTimeout(() => { e.target.textContent = '복사'; }, 1200);
      }
    }
  });
});
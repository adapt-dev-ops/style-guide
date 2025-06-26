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
    
    // example-card 클릭 시 코드 복사
    const exampleCard = e.target.closest('.example-card');
    if (exampleCard && exampleCard.dataset.copy) {
      navigator.clipboard.writeText(exampleCard.dataset.copy).then(() => {
        const tooltip = exampleCard.querySelector('.copy-tooltip');
        const originalText = tooltip.textContent;
        tooltip.textContent = '복사됨!';
        tooltip.style.background = '#28a745';
        tooltip.style.setProperty('--arrow-color', '#28a745');
        
        setTimeout(() => {
          tooltip.textContent = originalText;
          tooltip.style.background = '#333';
          tooltip.style.setProperty('--arrow-color', '#333');
        }, 1500);
      });
    }
  });
});
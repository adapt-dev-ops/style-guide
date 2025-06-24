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
}); 
const viewport = document.getElementById('viewport');
const canvas = document.getElementById('canvas');

let isDragging = false;
let startX;
let scrollLeft;

const onStart = (e) => {
    isDragging = true;
    viewport.style.cursor = 'grabbing';
    // Фиксируем координату клика МИНУС текущий отступ канваса
    const x = e.pageX || e.touches[0].pageX;
    startX = x - canvas.offsetLeft;
};

const onEnd = () => {
    isDragging = false;
    viewport.style.cursor = 'grab';
};

const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const x = e.pageX || e.touches[0].pageX;
    let newLeft = x - startX;

    // Ограничители, чтобы фото не улетало в бездну
    const maxScroll = viewport.offsetWidth - canvas.offsetWidth;

    if (newLeft > 0) newLeft = 0; // Не даем уйти вправо дальше края
    if (newLeft < maxScroll) newLeft = maxScroll; // Не даем уйти влево дальше края

    canvas.style.left = newLeft + 'px';
};

// Привязываем события
viewport.addEventListener('mousedown', onStart);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onEnd);

// Для сенсоров
viewport.addEventListener('touchstart', onStart);
window.addEventListener('touchmove', onMove);
window.addEventListener('touchend', onEnd);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // --- Логика модального окна (оставляем как была) ---
    const modal = document.getElementById('fixedModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');

    if (openBtn) {
        openBtn.onclick = () => {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };
    }

    const closeModal = () => {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    window.onclick = (e) => { if (e.target === modal) closeModal(); };

    // --- УНИВЕРСАЛЬНАЯ ОТПРАВКА ДЛЯ ВСЕХ ФОРМ ---
    const forms = document.querySelectorAll('.js-form-submit');

    forms.forEach(form => {
        form.onsubmit = async function(e) {
            e.preventDefault();

            // Автоматически собираем все поля формы
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('send.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert('Успішно відправлено!');
                    form.reset();
                    closeModal(); // Закроет модалку, если отправка была из неё
                } else {
                    alert('Помилка при відправці.');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('Зв’язок з сервером розірвано.');
            }
        };
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.5 // Анимация начнется, когда 50% секции будет в поле зрения
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetValue = parseFloat(target.getAttribute('data-target'));
                const duration = 3000; // Длительность анимации в мс (2 секунды)
                const startTime = performance.now();
                
                // Определяем формат (есть ли $, млн, +, месяцев и т.д.)
                const originalText = target.innerText;
                const hasDollar = originalText.includes('$');
                const suffix = originalText.replace(/[0-9.]/g, '').replace('$', '').trim();

                const animate = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Функция плавности (easeOutQuart)
                    const easeProgress = 1 - Math.pow(1 - progress, 4);
                    
                    let currentValue = easeProgress * targetValue;
                    
                    // Форматирование: если число дробное (как 6.5), оставляем 1 знак после запятой
                    let displayValue = Number.isInteger(targetValue) 
                        ? Math.floor(currentValue) 
                        : currentValue.toFixed(1);

                    target.innerText = (hasDollar ? '$' : '') + displayValue + (suffix ? ' ' + suffix : '');

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };

                requestAnimationFrame(animate);
                observer.unobserve(target); // Чтобы анимация не срабатывала повторно
            }
        });
    }, observerOptions);

    document.querySelectorAll('.stat-value').forEach(stat => {
        counterObserver.observe(stat);
    });
});
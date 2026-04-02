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

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('casesTrack');
    const viewport = document.getElementById('casesSliderViewport');
    const btnNext = document.getElementById('caseNext');
    const btnPrev = document.getElementById('casePrev');
    
    // Получаем начальные слайды
    let initialSlides = Array.from(track.querySelectorAll('.case-card'));
    const slideWidth = 909; 
    const gap = 40; 
    const totalStep = slideWidth + gap;

    // 1. КЛОНИРОВАНИЕ для бесконечного эффекта
    const firstClone = initialSlides[0].cloneNode(true);
    const lastClone = initialSlides[initialSlides.length - 1].cloneNode(true);

    track.appendChild(firstClone); // Клон первого в конец
    track.insertBefore(lastClone, track.firstChild); // Клон последнего в начало

    const allSlides = track.querySelectorAll('.case-card');
    let currentIndex = 1; // Начинаем с 1 (настоящий первый слайд)
    
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isTransitioning = false;
    let autoPlayTimer = null;

    // Инициализация позиции без анимации
    function updatePositionInstantly() {
        isTransitioning = false;
        track.style.transition = 'none';
        currentTranslate = currentIndex * -totalStep;
        track.style.transform = `translateX(${currentTranslate}px)`;
        prevTranslate = currentTranslate;
    }

    updatePositionInstantly();

    // --- ФУНКЦИИ АВТОПЛЕЯ ---
    function startAutoPlay() {
        stopAutoPlay(); // Очищаем старый таймер перед созданием нового
        autoPlayTimer = setInterval(() => {
            if (!isDragging && !isTransitioning) {
                currentIndex++;
                updatePosition();
            }
        }, 5000); 
    }

    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }

    // Запускаем сразу при загрузке
    startAutoPlay();

    function updatePosition() {
        isTransitioning = true;
        track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        currentTranslate = currentIndex * -totalStep;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    // Следим за завершением анимации для бесшовного перехода
    track.addEventListener('transitionend', () => {
        isTransitioning = false;
        
        if (currentIndex === allSlides.length - 1) {
            currentIndex = 1;
            updatePositionInstantly();
        }
        if (currentIndex === 0) {
            currentIndex = allSlides.length - 2;
            updatePositionInstantly();
        }
        prevTranslate = currentTranslate;
    });

    // КНОПКИ
    btnNext.addEventListener('click', () => {
        if (isTransitioning) return;
        stopAutoPlay(); // Останавливаем текущий цикл
        currentIndex++;
        updatePosition();
        startAutoPlay(); // Запускаем заново, чтобы отсчет пошел с нуля
    });

    btnPrev.addEventListener('click', () => {
        if (isTransitioning) return;
        stopAutoPlay();
        currentIndex--;
        updatePosition();
        startAutoPlay();
    });

    // DRAG-AND-DROP
    viewport.addEventListener('mousedown', dragStart);
    viewport.addEventListener('touchstart', dragStart, {passive: true});
    window.addEventListener('mousemove', dragAction);
    window.addEventListener('touchmove', dragAction, {passive: false});
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (isTransitioning) return;
        stopAutoPlay(); // Выключаем автоплей, когда пользователь трогает слайдер
        
        if (window.getSelection) { window.getSelection().removeAllRanges(); }
        
        isDragging = true;
        startPos = getPositionX(e);
        track.style.transition = 'none';
        viewport.classList.add('grabbing');
    }

    function dragAction(e) {
        if (!isDragging) return;
        const currentPosition = getPositionX(e);
        const diff = currentPosition - startPos;
        currentTranslate = prevTranslate + diff;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        viewport.classList.remove('grabbing');

        const movedBy = currentTranslate - prevTranslate;

        if (movedBy < -150) {
            currentIndex++;
        } else if (movedBy > 150) {
            currentIndex--;
        }

        updatePosition();
        startAutoPlay(); // Возвращаем автоплей после того, как пользователь закончил
    }

    function getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    // Пауза при наведении мышки
    viewport.addEventListener('mouseenter', stopAutoPlay);
    viewport.addEventListener('mouseleave', startAutoPlay);
});

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
    // Логика модального окна
    const modal = document.getElementById('fixedModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');

    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    if (openBtn) {
        openBtn.onclick = () => {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };
    }
    if (closeBtn) closeBtn.onclick = closeModal;
    
    // Закрытие по клику вне модалки
    window.onclick = (e) => { if (e.target === modal) closeModal(); };

    // --- ГЛАВНЫЙ ОБРАБОТЧИК ДЛЯ ВСЕХ ФОРМ ---
    const allForms = document.querySelectorAll('.js-form');

    allForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); // ОСТАНАВЛИВАЕМ ПЕРЕЗАГРУЗКУ (убираем "?")

            // Собираем данные из текущей формы
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            // Визуальная индикация (опционально)
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Відправка...';
            submitBtn.disabled = true;

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
                    alert('Помилка сервера. Спробуйте пізніше.');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Сталася помилка при відправці.');
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
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
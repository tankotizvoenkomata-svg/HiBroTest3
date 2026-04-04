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
    
    let slides = Array.from(document.querySelectorAll('.case-card'));
    const slideWidth = 1109; 
    const gap = 40; 
    const totalStep = slideWidth + gap;

    // 1. КЛОНИРОВАНИЕ
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    track.appendChild(firstClone);
    track.insertBefore(lastClone, slides[0]);

    const allSlides = document.querySelectorAll('.case-card');
    let currentIndex = 1; 
    
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isTransitioning = false;

    // Переменная для таймера автоплея
    let autoPlayTimer;

    updatePositionMinstantly();
    startAutoPlay(); // Запускаем автопрокрутку при загрузке

    function updatePosition() {
        isTransitioning = true;
        track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        currentTranslate = currentIndex * -totalStep;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function updatePositionMinstantly() {
        isTransitioning = false;
        track.style.transition = 'none';
        currentTranslate = currentIndex * -totalStep;
        track.style.transform = `translateX(${currentTranslate}px)`;
        prevTranslate = currentTranslate;
    }

    // --- ЛОГИКА АВТОПЛЕЯ ---
    function startAutoPlay() {
        stopAutoPlay(); // На всякий случай чистим старый таймер
        autoPlayTimer = setInterval(() => {
            if (!isDragging) {
                currentIndex++;
                updatePosition();
            }
        }, 5000); // 7 секунд между слайдами
    }

    function stopAutoPlay() {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
    }

    track.addEventListener('transitionend', () => {
        isTransitioning = false;
        if (currentIndex === allSlides.length - 1) {
            currentIndex = 1;
            updatePositionMinstantly();
        }
        if (currentIndex === 0) {
            currentIndex = allSlides.length - 2;
            updatePositionMinstantly();
        }
        prevTranslate = currentTranslate;
    });

    // КНОПКИ (с перезапуском таймера)
    btnNext.addEventListener('click', () => {
        if (isTransitioning) return;
        currentIndex++;
        updatePosition();
        startAutoPlay(); // Сбрасываем таймер при ручном клике
    });

    btnPrev.addEventListener('click', () => {
        if (isTransitioning) return;
        currentIndex--;
        updatePosition();
        startAutoPlay(); // Сбрасываем таймер при ручном клике
    });

    // DRAG-AND-DROP (с остановкой таймера)
    viewport.addEventListener('mousedown', dragStart);
    viewport.addEventListener('touchstart', dragStart);
    window.addEventListener('mousemove', dragAction);
    window.addEventListener('touchmove', dragAction);
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        // Если это мышка, отменяем стандартное поведение (перетаскивание картинки браузером)
        if (e.type === 'mousedown') {
            e.preventDefault();
        }
        
        if (isTransitioning) return;
        stopAutoPlay();
        
        // Очистка выделения текста на всякий случай
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
        startAutoPlay(); // Снова запускаем после того, как пользователь отпустил
    }

    function getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    // Останавливаем автоплей, если мышка просто зависла над слайдером
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
    const modal = document.getElementById('fixedModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const form = document.getElementById('modalForm');

    // Відкриття
    openBtn.onclick = function() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    // Закриття
    closeBtn.onclick = closeModal;
    window.onclick = function(e) { if (e.target === modal) closeModal(); };

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // ВІДПРАВКА НА SEND.PHP
    form.onsubmit = async function(e) {
        e.preventDefault();

        // Формуємо об'єкт для JSON
        const payload = {
            name: form.elements['name'].value,
            phone: form.elements['phone'].value,
            link: form.elements['link'].value
        };

        try {
            const response = await fetch('send.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Успішно відправлено!');
                form.reset();
                closeModal();
            } else {
                alert('Помилка при відправці.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('Зв’язок з сервером розірвано.');
        }
    };
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

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('partnersTrack');
    const viewport = document.getElementById('partnersViewport');
    const dotsContainer = document.getElementById('partnersDots');
    const items = Array.from(track.children);
    const originalCount = items.length;

    // 1. Правильное клонирование
    const leftClones = document.createDocumentFragment();
    const rightClones = document.createDocumentFragment();
    
    items.forEach(item => {
        leftClones.appendChild(item.cloneNode(true));
        rightClones.appendChild(item.cloneNode(true));
    });
    
    track.insertBefore(leftClones, track.firstChild);
    track.appendChild(rightClones);

    // 2. Создание точек
    dotsContainer.innerHTML = '';
    items.forEach((_, i) => {
        const dot = document.createElement('span');
        if (i === 0) dot.classList.add('active');
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('span');

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let currentIndex = originalCount; // Начинаем с оригиналов

    // Точный расчет ширины шага
    const getStepWidth = () => viewport.getBoundingClientRect().width / 4;

    const setPosition = (smooth = true) => {
        const step = getStepWidth();
        currentTranslate = -currentIndex * step;
        track.style.transition = smooth ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        track.style.transform = `translateX(${currentTranslate}px)`;
    };

    const updateDots = () => {
        const index = ((currentIndex % originalCount) + originalCount) % originalCount;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    };

    // Старт
    setPosition(false);
    updateDots();

    // 3. Обработка Drag & Swipe
    const dragStart = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        track.style.transition = 'none'; // Мгновенная остановка
    };

    const dragMove = (e) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault(); 
        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diff = currentX - startX;
        // Двигаем слайдер за курсором в реальном времени
        track.style.transform = `translateX(${currentTranslate + diff}px)`;
    };

    const dragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const endX = e.type.includes('mouse') ? e.pageX : (e.changedTouches ? e.changedTouches[0].pageX : startX);
        const diff = endX - startX; // Разница между стартом и концом
        const step = getStepWidth();

        // Считаем, на сколько логотипов мы смахнули
        const movedSteps = Math.round(diff / step);

        // Логика переключения
        if (movedSteps === 0) {
            // Если смахнули чуть-чуть, но больше 30px - листаем 1 логотип
            if (diff < -30) currentIndex++;
            else if (diff > 30) currentIndex--;
        } else {
            // Если смахнули сильно - листаем на пропорциональное количество
            currentIndex -= movedSteps;
        }

        // Анимируем к ровному индексу
        setPosition(true);
        updateDots();

        // Бесшовный перенос для бесконечности
        setTimeout(() => {
            if (currentIndex >= originalCount * 2) {
                currentIndex -= originalCount;
                setPosition(false);
            } else if (currentIndex < originalCount) {
                currentIndex += originalCount;
                setPosition(false);
            }
        }, 500); // 500ms равно времени CSS transition
    };

    viewport.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);
    viewport.addEventListener('mouseleave', dragEnd);
    
    viewport.addEventListener('touchstart', dragStart, { passive: false });
    viewport.addEventListener('touchmove', dragMove, { passive: false });
    viewport.addEventListener('touchend', dragEnd);

    window.addEventListener('resize', () => {
        setPosition(false);
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // 1. Выбираем все заголовки секций на твоем сайте
    const titles = document.querySelectorAll('.about-title, .main-title-top, .main-title-bottom, .staggered-title-wrapper, .steps-main-title, .benefits-title, .achievements-title, .contact-title, .title-line.top, .title-line.bottom, .cases-main-title, .contact-info h2');

    // 2. Настраиваем наблюдатель (Observer)
    const observerOptions = {
        threshold: 0.1, // Анимация сработает, когда заголовок покажется на 10%
        rootMargin: "0px 0px -50px 0px" // Срабатывает чуть позже, чтобы не было "ранних" анимаций вне экрана
    };

    const titleObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            // Если элемент пересек границу экрана
            if (entry.isIntersecting) {
                // Добавляем класс, который включает CSS-анимацию
                entry.target.classList.add('fade-in-visible');
                
                // Отключаем наблюдение за этим элементом (чтобы анимация была только 1 раз при первой прокрутке)
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 3. Вешаем наблюдатель на каждый найденный заголовок
    titles.forEach(title => {
        titleObserver.observe(title);
    });
});
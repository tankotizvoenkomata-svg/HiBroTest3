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
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mainNav = document.getElementById('mainNav');
    const btnContact = document.getElementById('openModalBtn');

    if (hamburgerBtn && mainNav) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('nav-open');
            hamburgerBtn.classList.toggle('is-open', isOpen);
            if (btnContact) btnContact.classList.toggle('nav-open', isOpen);
        });

        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('nav-open');
                hamburgerBtn.classList.remove('is-open');
                if (btnContact) btnContact.classList.remove('nav-open');
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('casesTrack');
    const viewport = document.getElementById('casesSliderViewport');
    const btnNext = document.getElementById('caseNext');
    const btnPrev = document.getElementById('casePrev');
    
    let slides = Array.from(document.querySelectorAll('.case-card'));
    const getSlideWidth = () => {
        const vp = viewport ? viewport.offsetWidth : 1009;
        return window.innerWidth <= 768 ? window.innerWidth - 32 : vp;
    };
    const getGap = () => window.innerWidth <= 768 ? 16 : 40;
    let gap = getGap();
    let slideWidth = getSlideWidth();
    let totalStep = slideWidth + gap;

    // 1. КЛОНИРОВАНИЕ для зацикливания
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
    let autoPlayTimer;

    updatePositionMinstantly();
    startAutoPlay();

    function updatePosition() {
        isTransitioning = true;
        slideWidth = getSlideWidth();
        gap = getGap();
        totalStep = slideWidth + gap;
        track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        currentTranslate = currentIndex * -totalStep;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function updatePositionMinstantly() {
        isTransitioning = false;
        slideWidth = getSlideWidth();
        gap = getGap();
        totalStep = slideWidth + gap;
        track.style.transition = 'none';
        currentTranslate = currentIndex * -totalStep;
        track.style.transform = `translateX(${currentTranslate}px)`;
        prevTranslate = currentTranslate;
    }

    // --- ЛОГИКА АВТОПЛЕЯ ---
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(() => {
            if (!isDragging && !isTransitioning) {
                currentIndex++;
                updatePosition();
            }
        }, 5000); 
    }

    function stopAutoPlay() {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
    }

    // --- ИСПРАВЛЕННЫЙ ОБРАБОТЧИК АНИМАЦИИ ---
    track.addEventListener('transitionend', () => {
        isTransitioning = false;
        
        // Используем >= вместо ===
        if (currentIndex >= allSlides.length - 1) {
            currentIndex = 1;
            updatePositionMinstantly();
        }
        // Используем <= вместо ===
        if (currentIndex <= 0) {
            currentIndex = allSlides.length - 2;
            updatePositionMinstantly();
        }
    });

    // --- ОБРАБОТЧИКИ КНОПОК ---
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (isTransitioning) return; // Защита от быстрых двойных кликов
            currentIndex++;
            updatePosition();
            startAutoPlay(); // Перезапускаем автоплей, чтобы слайдер не перескочил сразу после клика
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (isTransitioning) return;
            currentIndex--;
            updatePosition();
            startAutoPlay();
        });
    }

    // Опционально: останавливать автоплей при наведении мыши на слайдер
    if (viewport) {
        viewport.addEventListener('mouseenter', stopAutoPlay);
        viewport.addEventListener('mouseleave', startAutoPlay);
    }
    track.addEventListener('dragstart', (e) => e.preventDefault());

    window.addEventListener('resize', () => {
        updatePositionMinstantly();
    });

    // Додаємо слухачі подій
    track.addEventListener('pointerdown', pointerDown);
    track.addEventListener('pointermove', pointerMove);
    track.addEventListener('pointerup', pointerUp);
    track.addEventListener('pointerleave', pointerLeave);

    function getPositionX(event) {
        return event.clientX;
    }

    function pointerDown(event) {
        // Якщо зараз іде анімація переходу, ігноруємо клік
        if (isTransitioning) return; 
        
        isDragging = true;
        startPos = getPositionX(event);
        stopAutoPlay(); // Зупиняємо автоплей, поки користувач тримає слайд
        
        // Прибираємо плавність, щоб слайдер миттєво "прилипав" до курсору
        track.style.transition = 'none';
        
        // Захоплюємо вказівник, щоб не втрачати фокус при швидкому свайпі за межі екрана
        track.setPointerCapture(event.pointerId);
    }

    function pointerMove(event) {
        if (!isDragging) return;
        
        const currentPosition = getPositionX(event);
        const diff = currentPosition - startPos;
        
        // Рухаємо трек за курсором
        track.style.transform = `translateX(${currentTranslate + diff}px)`;
    }

    function pointerUp(event) {
        if (!isDragging) return;
        isDragging = false;
        
        const currentPosition = getPositionX(event);
        const diff = currentPosition - startPos;
        
        // Встановлюємо поріг у 100px. Якщо протягнули менше - слайд повернеться на місце
        if (diff < -100) {
            currentIndex++; // Свайп вліво (наступний)
        } else if (diff > 100) {
            currentIndex--; // Свайп вправо (попередній)
        }
        
        // Повертаємо плавність і докручуємо до потрібного слайда
        updatePosition();
        startAutoPlay(); // Відновлюємо автоплей
    }

    function pointerLeave(event) {
        // Якщо користувач затиснув мишу і вивів курсор за межі слайдера
        if (isDragging) {
            pointerUp(event); 
        }
    }
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
                    
                    let easeProgress;
                    if (progress < 0.5) {
                        easeProgress = Math.pow(2, 20 * progress - 10) / 2;
                    } else {
                        easeProgress = (2 - Math.pow(2, -20 * progress + 10)) / 2;
                    }

                    let currentValue = progress === 1 ? targetValue : easeProgress * targetValue;
                    
                    let displayValue = Number.isInteger(targetValue) 
                        ? Math.round(currentValue) 
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
    const getStepWidth = () => viewport.getBoundingClientRect().width / 2;

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
    const titles = document.querySelectorAll('.about-title, .main-title-top, .main-title-bottom, .staggered-title-wrapper, .steps-main-title, .benefits-title, .achievements-title, .contact-title, .title-line.top, .title-line.bottom, .cases-main-title, .contact-info h2, .form-title');

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

document.getElementById('modalForm').addEventListener('submit', function(event) {
    // Останавливаем стандартную перезагрузку страницы
    event.preventDefault();

    // Здесь обычно идет код отправки данных на почту/в базу (fetch или XMLHttpRequest)
    // Например:
    // const formData = new FormData(this);
    // fetch('send.php', { method: 'POST', body: formData });

    // Перенаправляем пользователя на страницу благодарности
    // Замените 'thanks.html' на реальный путь к вашей новой странице
    window.location.href = 'thanks.html'; 
});
document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('goodsTrigger');
    const dropdown = document.getElementById('goodsDropdown');
    const orderForm = document.getElementById('orderFormSq');
    const phoneInput = document.querySelector('input[name="phone"]');
    
    // --- 0. МАГІЧНИЙ БАР'ЄР (КАПЧА) ---
    let captchaResult;
    function generateCaptchaSq() {
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 9) + 1;
        captchaResult = n1 + n2;
        const qElement = document.getElementById('captchaQuestionSq');
        if (qElement) qElement.innerText = `${n1} + ${n2} =`;
        const iElement = document.getElementById('captchaInputSq');
        if (iElement) iElement.value = ''; // Очищуємо поле вводу капчі
    }
    
    generateCaptchaSq(); // Створюємо першу задачу при завантаженні

    // --- 1. ЗАХИСТ ПРЕФІКСА +380 ---
    if (phoneInput) {
        if (phoneInput.value.length < 4) phoneInput.value = '+380';
        phoneInput.addEventListener('input', function() {
            const prefix = '+380';
            if (!this.value.startsWith(prefix)) this.value = prefix;
            const val = this.value.substring(prefix.length);
            this.value = prefix + val.replace(/\D/g, '').substring(0, 9);
        });
        phoneInput.addEventListener('click', function() {
            if (this.selectionStart < 4) this.setSelectionRange(this.value.length, this.value.length);
        });
    }

    // --- 2. ПЕРШОЧЕРГОВИЙ ЗАПУСК ТЕКСТУ ТОВАРІВ ---
    updateSelectedSq();

    // --- 3. ФУНКЦІЇ ПІДКАЗОК ---
    function showErrorSq(inputElement, message) {
        clearErrorSq(inputElement);
        inputElement.classList.add('input-error-sq');
        const tip = document.createElement('div');
        tip.className = 'error-tip-sq';
        tip.innerText = message;
        inputElement.parentNode.appendChild(tip);
        inputElement.addEventListener('input', () => clearErrorSq(inputElement), { once: true });
    }

    function clearErrorSq(inputElement) {
        inputElement.classList.remove('input-error-sq');
        const parent = inputElement.parentNode;
        const oldTip = parent.querySelector('.error-tip-sq');
        if (oldTip) parent.removeChild(oldTip);
    }

    // --- 4. ЛОГІКА ВИПАДАЮЧОГО СПИСКУ ---
    trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target) && e.target !== trigger) {
            dropdown.classList.remove('show');
        }
    });

    // --- 5. ВІДПРАВКА ТА ВАЛІДАЦІЯ ---
    if (orderForm) {
        orderForm.onsubmit = function(e) {
            e.preventDefault();
            document.querySelectorAll('.input-error-sq').forEach(el => clearErrorSq(el));

            const selectedGoods = Array.from(document.querySelectorAll('#goodsDropdown input:checked')).map(cb => cb.value);
            const nameInput = this.querySelector('input[name="name"]');
            const contactType = this.querySelector('input[name="contact_type"]:checked')?.value;
            const contactDataInput = document.getElementById('dynamicInputSq');
            const captchaInput = document.getElementById('captchaInputSq');

            let isValid = true;

            // Перевірка капчі
            if (parseInt(captchaInput.value) !== captchaResult) {
                alert('ПОМИЛКА: Невірне розв’язання задачі!');
                generateCaptchaSq();
                isValid = false;
                return;
            }

            // Валідація товарів
            if (selectedGoods.length === 0) {
                alert('Будь ласка, оберіть хоча б один товар!');
                dropdown?.classList.add('show');
                isValid = false;
            }

            // Валідація телефону
            const phoneRegex = /^\+380\d{9}$/;
            if (!phoneRegex.test(phoneInput.value)) {
                showErrorSq(phoneInput, "ВВЕДІТЬ ПОВНИЙ НОМЕР");
                isValid = false;
            }

            // Валідація контактів
            if (contactType === 'gmail') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(contactDataInput.value.trim())) {
                    showErrorSq(contactDataInput, "НЕВІРНИЙ ФОРМАТ EMAIL");
                    isValid = false;
                }
            } else if (contactType === 'telegram') {
                const tgVal = contactDataInput.value.trim();
                if (!tgVal.startsWith('@') || tgVal.length < 2) {
                    showErrorSq(contactDataInput, "НІК МАЄ ПОЧИНАТИСЯ З @");
                    isValid = false;
                }
            } else if (!contactDataInput.value.trim() || contactDataInput.value.trim().length < 2) {
                showErrorSq(contactDataInput, "ЗАПОВНІТЬ ЦЕ ПОЛЕ");
                isValid = false;
            }

            if (!isValid) return;

            const payload = {
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                contact_type: contactType,
                contact_data: contactDataInput.value.trim(),
                goods: selectedGoods
            };

            fetch('send2.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Дякуємо! Замовлення прийнято.');
                    
                    // Очищаем форму перед уходом
                    this.reset();
                    if (phoneInput) phoneInput.value = '+380';
                    
                    // ПЕРЕНАПРАВЛЕНИЕ:
                    window.location.href = 'index2.html';
                } else {
                    alert('Помилка: ' + (data.message || 'Сервер відхилив запит'));
                    // Если была ошибка, обновляем капчу, чтобы пользователь мог попробовать снова
                    if (typeof generateCaptchaSq === 'function') generateCaptchaSq();
                }
            })
            .catch(err => {
                console.error('Fetch Error:', err);
                alert('Сталася помилка при відправці.');
            });

function updateSelectedSq() {
    const checkboxes = document.querySelectorAll('#goodsDropdown input:checked');
    const label = document.getElementById("selectedLabelSq");
    if (!label) return;

    if (checkboxes.length > 0) {
        const selectedNames = Array.from(checkboxes).map(cb => {
            const container = cb.closest('.check-item-sq');
            const textElement = container.querySelector('.check-text-sq');
            return textElement ? textElement.innerText : cb.value;
        });
        label.innerText = `ОБРАНО: ${selectedNames.join(', ')}`;
        label.style.color = "#fff";
    } else {
        label.innerText = "ОБЕРІТЬ ТОВАР";
        label.style.color = "#888";
    }
}

function handleRadioSq(radio) {
    const container = document.getElementById('dynamicInputContainerSq');
    const input = document.getElementById('dynamicInputSq');
    if (container && input) {
        container.classList.remove('hidden');
        input.required = true;
        input.type = (radio.value === 'gmail') ? "email" : "text";
        if (radio.value === 'telegram' && (input.value === '' || !input.value.startsWith('@'))) {
            input.value = '@';
        } else if (radio.value !== 'telegram' && input.value === '@') {
            input.value = '';
        }
        input.placeholder = (radio.value === 'gmail') ? "ВВЕДІТЬ ВАШ EMAIL" : `ВВЕДІТЬ ВАШ НІК/НОМЕР (${radio.value.toUpperCase()})`;
        input.focus();
    }
}
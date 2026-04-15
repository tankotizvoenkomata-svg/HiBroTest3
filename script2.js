document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('goodsTrigger');
    const dropdown = document.getElementById('goodsDropdown');
    const orderForm = document.getElementById('orderFormSq');

    // --- ФУНКЦІЇ ПІДКАЗОК ---
    function showErrorSq(inputElement, message) {
        clearErrorSq(inputElement); // Прибираємо стару, якщо є
        inputElement.classList.add('input-error-sq');
        
        const tip = document.createElement('div');
        tip.className = 'error-tip-sq';
        tip.innerText = message;
        inputElement.parentNode.appendChild(tip);

        // Прибираємо помилку, коли користувач починає вводити текст знову
        inputElement.addEventListener('input', () => clearErrorSq(inputElement), { once: true });
    }

    function clearErrorSq(inputElement) {
        inputElement.classList.remove('input-error-sq');
        const parent = inputElement.parentNode;
        const oldTip = parent.querySelector('.error-tip-sq');
        if (oldTip) parent.removeChild(oldTip);
    }

    // --- ЛОГІКА ВИПАДАЮЧОГО СПИСКУ ---
    trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target) && e.target !== trigger) {
            dropdown.classList.remove('show');
        }
    });

    // --- ВІДПРАВКА ТА ВАЛІДАЦІЯ ---
    if (orderForm) {
        orderForm.onsubmit = function(e) {
            e.preventDefault();
            
            // Скидаємо всі активні помилки перед перевіркою
            document.querySelectorAll('.input-error-sq').forEach(el => clearErrorSq(el));

            const selectedGoods = Array.from(document.querySelectorAll('#goodsDropdown input:checked')).map(cb => cb.value);
            const nameInput = this.querySelector('input[name="name"]');
            const phoneInput = this.querySelector('input[name="phone"]');
            const contactType = this.querySelector('input[name="contact_type"]:checked')?.value;
            const contactDataInput = document.getElementById('dynamicInputSq');

            let isValid = true;

            // 1. Перевірка товарів (залишаємо алерт, бо це не текстове поле)
            if (selectedGoods.length === 0) {
                alert('Будь ласка, оберіть хоча б один товар!');
                dropdown?.classList.add('show');
                isValid = false;
            }

            // 2. Валідація телефону
            const phoneRegex = /^[\d\s\+\-\(\)]{10,18}$/;
            if (!phoneRegex.test(phoneInput.value.trim())) {
                showErrorSq(phoneInput, "НЕКОРЕКТНИЙ НОМЕР");
                isValid = false;
            }

            // 3. Валідація контактних даних
            if (contactType === 'gmail') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(contactDataInput.value.trim())) {
                    showErrorSq(contactDataInput, "НЕВІРНИЙ ФОРМАТ EMAIL");
                    isValid = false;
                }
            } else if (!contactDataInput.value.trim() || contactDataInput.value.trim().length < 2) {
                showErrorSq(contactDataInput, "ЗАПОВНІТЬ ЦЕ ПОЛЕ");
                isValid = false;
            }

            if (!isValid) return;

            // Формуємо пакет даних
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
            .then(res => {
                if (!res.ok) throw new Error('Помилка мережі');
                return res.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    alert('Дякуємо! Замовлення прийнято.');
                    this.reset();
                    document.getElementById('dynamicInputContainerSq')?.classList.add('hidden');
                    updateSelectedSq();
                    dropdown?.classList.remove('show');
                } else {
                    alert('Помилка: ' + (data.message || 'Сервер відхилив запит'));
                }
            })
            .catch(err => {
                console.error('Fetch Error:', err);
                alert('Сталася помилка при відправці. Спробуйте пізніше.');
            });
        };
    }
});

function updateSelectedSq() {
    const checkboxes = document.querySelectorAll('#goodsDropdown input:checked');
    const label = document.getElementById("selectedLabelSq");
    if (label) {
        label.innerText = checkboxes.length > 0 ? `ОБРАНО: ${checkboxes.length}` : "ОБЕРІТЬ ТОВАР";
        label.style.color = checkboxes.length > 0 ? "#fff" : "#888";
    }
}

function handleRadioSq(radio) {
    const container = document.getElementById('dynamicInputContainerSq');
    const input = document.getElementById('dynamicInputSq');
    
    if (container && input) {
        container.classList.remove('hidden');
        input.required = true;
        const val = radio.value.toUpperCase();
        input.type = (radio.value === 'gmail') ? "email" : "text";
        input.placeholder = (radio.value === 'gmail') ? "ВВЕДІТЬ ВАШ EMAIL" : `ВВЕДІТЬ ВАШ НІК/НОМЕР (${val})`;
        input.focus();
    }
}
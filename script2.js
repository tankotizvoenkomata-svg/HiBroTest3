document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('goodsTrigger');
    const dropdown = document.getElementById('goodsDropdown');
    const orderForm = document.getElementById('orderFormSq');

    // --- ЛОГІКА ВИПАДАЮЧОГО ВБІК СПИСКУ ---
    trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle('show');
    });

    // Закриття при кліку поза списком
    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target) && e.target !== trigger) {
            dropdown.classList.remove('show');
        }
    });

    // --- ВІДПРАВКА НА СЕРВЕР ---
    if (orderForm) {
        orderForm.onsubmit = function(e) {
            e.preventDefault();
            
            const selectedGoods = Array.from(document.querySelectorAll('#goodsDropdown input:checked'))
                                     .map(cb => cb.value);
            
            if (selectedGoods.length === 0) {
                alert('Будь ласка, оберіть товари!');
                dropdown?.classList.add('show');
                return;
            }

            const formData = new FormData(this);
            const payload = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                contact_type: formData.get('contact_type'),
                contact_data: formData.get('contact_data'),
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
                    updateSelectedSq(); // Скидаємо лічильник
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

// --- ОНОВЛЕННЯ ТЕКСТУ (ОБРАНО: X) ---
function updateSelectedSq() {
    const checkboxes = document.querySelectorAll('#goodsDropdown input:checked');
    const label = document.getElementById("selectedLabelSq");
    if (label) {
        label.innerText = checkboxes.length > 0 ? `ОБРАНО: ${checkboxes.length}` : "ОБЕРІТЬ ТОВАР";
        label.style.color = checkboxes.length > 0 ? "#fff" : "#888";
    }
}

// --- ЛОГІКА РАДІОКНОПОК ---
function handleRadioSq(radio) {
    const container = document.getElementById('dynamicInputContainerSq');
    const input = document.getElementById('dynamicInputSq');
    
    if (container && input) {
        container.classList.remove('hidden');
        input.required = true;
        const val = radio.value.toUpperCase();
        input.placeholder = (radio.value === 'gmail') ? "ВВЕДІТЬ ВАШ EMAIL" : `ВВЕДІТЬ ВАШ НІК/НОМЕР (${val})`;
        input.focus(); // Для зручності фокусуємося на полі
    }
}
// --- ЛОГІКА ПАНЕЛІ ТОВАРІВ ---
const trigger = document.getElementById('goodsTrigger');
const panel = document.getElementById('goodsPanel');
const overlay = document.getElementById('panelOverlay');
const closeBtn = document.getElementById('closePanelBtn');
const applyBtn = document.getElementById('applyGoodsBtn');

const openPanel = () => {
    panel.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

const closePanel = () => {
    panel.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
};

trigger?.addEventListener('click', openPanel);
closeBtn?.addEventListener('click', closePanel);
overlay?.addEventListener('click', closePanel);
applyBtn?.addEventListener('click', closePanel);

// --- ОНОВЛЕННЯ ТЕКСТУ ВИБОРУ ---
function updateSelectedSq() {
    const checkboxes = document.querySelectorAll('#checkboxesSq input:checked');
    const label = document.getElementById("selectedLabelSq");
    label.innerText = checkboxes.length > 0 ? `ОБРАНО: ${checkboxes.length}` : "ВИБІР ТОВАРІВ";
}

// --- ЛОГІКА МЕСЕНДЖЕРІВ ---
function handleRadioSq(radio) {
    const container = document.getElementById('dynamicInputContainerSq');
    const input = document.getElementById('dynamicInputSq');
    container.classList.remove('hidden');
    input.required = true;
    
    const val = radio.value;
    const label = val.toUpperCase();
    
    if (val === 'gmail') {
        input.placeholder = "ВВЕДІТЬ ВАШ GMAIL (EMAIL)";
    } else if (val === 'viber' || val === 'whatsapp') {
        input.placeholder = `ВВЕДІТЬ НОМЕР ДЛЯ ${label}`;
    } else {
        input.placeholder = `ВВЕДІТЬ ВАШ НІК (${label})`;
    }
}

// --- ВІДПРАВКА НА СЕРВЕР ---
document.getElementById('orderFormSq').onsubmit = function(e) {
    e.preventDefault();
    
    const selectedGoods = Array.from(document.querySelectorAll('#checkboxesSq input:checked')).map(cb => cb.value);
    
    if(selectedGoods.length === 0) {
        alert('Будь ласка, оберіть товари!');
        openPanel();
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
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            alert('Дякуємо! Замовлення прийнято.');
            this.reset();
            document.getElementById('dynamicInputContainerSq').classList.add('hidden');
            updateSelectedSq();
        }
    })
    .catch(() => alert('Помилка сервера.'));
};
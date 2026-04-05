<?php
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name    = !empty($data['name'])  ? strip_tags($data['name'])  : 'Не вказано';
    $phone   = !empty($data['phone']) ? strip_tags($data['phone']) : 'Не вказано';
    $link    = !empty($data['link'])  ? strip_tags($data['link'])  : 'Не вказано';
    $comment = !empty($data['comment']) ? strip_tags($data['comment']) : 'Без коментаря';

    // Формируем текст сообщения для Telegram
    $tg_msg = "🔔 <b>Нова заявка!</b>\n";
    $tg_msg .= "👤 Ім'я: $name\n";
    $tg_msg .= "📞 Телефон: $phone\n";
    $tg_msg .= "🔗 Посилання: $link\n";
    
    if ($comment !== 'Без коментаря') {
        $tg_msg .= "📝 Запит: $comment";
    }

    // Отправка в TG (используем parse_mode=HTML для жирного шрифта)
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        $url = "https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=HTML&text=" . urlencode($tg_msg);
        file_get_contents($url);
    }

    // ... блок с Resend оставляем без изменений, он написан верно ...

    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No data"]);
}
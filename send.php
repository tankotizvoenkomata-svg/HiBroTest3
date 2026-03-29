<?php
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name = strip_tags($data['name']);
    $phone = strip_tags($data['phone']);
    $link = strip_tags($data['link']);

    // --- 1. ОТПРАВКА В TELEGRAM ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        $tg_message = "🔔 <b>Нова заявка!</b>\n";
        $tg_message .= "👤 Ім'я: $name\n";
        $tg_message .= "📞 Телефон: $phone\n";
        $tg_message .= "🔗 Посилання: $link";

        $url = "https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=html&text=" . urlencode($tg_message);
        @file_get_contents($url); // Собачка подавляет ошибки, если ТГ временно недоступен
    }

    // --- 2. ОТПРАВКА НА ПОЧТУ ---
    $to = getenv('CONTACT_EMAIL'); // Ваш адрес
    if ($to) {
        $subject = "Нова заявка з сайту: $name";
        $email_content = "Ім'я: $name\nТелефон: $phone\nПосилання: $link";
        $headers = "From: no-reply@" . $_SERVER['HTTP_HOST'] . "\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8";
        
        mail($to, $subject, $email_content, $headers);
    }

    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No data"]);
}
?>
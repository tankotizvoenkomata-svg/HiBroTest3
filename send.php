<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// 1. Подключаем автозагрузку библиотек (обязательно для Railway)
require 'vendor/autoload.php';

// 2. Получаем данные из запроса (JSON)
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name    = !empty($data['name'])    ? strip_tags($data['name'])    : 'Не вказано';
    $phone   = !empty($data['phone'])   ? strip_tags($data['phone'])   : 'Не вказано';
    $link    = !empty($data['link'])    ? strip_tags($data['link'])    : 'Не вказано';
    $comment = !empty($data['comment']) ? strip_tags($data['comment']) : 'Без коментаря';

    // --- А) ОТПРАВКА В TELEGRAM ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        $tg_msg = "🔔 <b>Нова заявка!</b>\n";
        $tg_msg .= "👤 Ім'я: $name\n";
        $tg_msg .= "📞 Телефон: $phone\n";
        $tg_msg .= "🔗 Посилання: $link\n";
        if ($comment !== 'Без коментаря') { $tg_msg .= "📝 Запит: $comment"; }

        $url = "https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=HTML&text=" . urlencode($tg_msg);
        $options = ['http' => ['method' => "GET", 'header' => "User-Agent: PHP\r\n"]];
        @file_get_contents($url, false, stream_context_create($options));
    }

    // --- Б) ОТПРАВКА ЧЕРЕЗ RESEND (API) ---
    $resend_api_key = getenv('RESEND_API_KEY');
    $contact_email = getenv('CONTACT_EMAIL');

    if ($resend_api_key && $contact_email) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        
        // Пока домен не верифицирован, Resend позволяет слать только с этого адреса:
        $email_payload = [
            'from' => 'LUDI.DIGITAL <onboarding@resend.dev>', 
            'to' => [$contact_email],
            'subject' => 'Нова заявка: ' . $name,
            'html' => "
                <h3>Нова заявка з сайту</h3>
                <p><b>Ім'я:</b> {$name}</p>
                <p><b>Телефон:</b> {$phone}</p>
                <p><b>Посилання:</b> {$link}</p>
                <p><b>Запит:</b> {$comment}</p>
            "
        ];

        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $resend_api_key,
            'Content-Type: application/json'
        ]);

        curl_exec($ch);
        curl_close($ch);
    }

    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No data"]);
}
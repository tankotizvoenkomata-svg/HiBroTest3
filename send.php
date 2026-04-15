<?php
// 1. Настройка доступа
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// 2. Получение данных (убираем всё лишнее)
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name    = !empty($data['name'])    ? strip_tags($data['name'])    : 'Не вказано';
    $phone   = !empty($data['phone'])   ? strip_tags($data['phone'])   : 'Не вказано';
    $link    = !empty($data['link'])    ? strip_tags($data['link'])    : 'Не вказано';
    $comment = !empty($data['comment']) ? strip_tags($data['comment']) : 'Без коментаря';

    // --- А) ТЕЛЕГРАМ (Чистый PHP) ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        $tg_msg = "🔔 Нова заявка!\n👤 Ім'я: $name\n📞 Телефон: $phone\n🔗 Посилання: $link\n📝 Запит: $comment";
        $tg_url = "https://api.telegram.org/bot{$token}/sendMessage";
        
        $post_fields = [
            'chat_id' => $chat_id,
            'text' => $tg_msg,
            'parse_mode' => 'HTML'
        ];

        $ch_tg = curl_init($tg_url);
        curl_setopt($ch_tg, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch_tg, CURLOPT_POSTFIELDS, $post_fields);
        curl_exec($ch_tg);
        curl_close($ch_tg);
    }

    // --- Б) RESEND (Чистый PHP через cURL) ---
    $resend_key = getenv('RESEND_API_KEY');
    $to_email = getenv('CONTACT_EMAIL');

    if ($resend_key && $to_email) {
        $resend_url = 'https://api.resend.com/emails';
        
        $email_data = [
            'from' => 'LUDI.DIGITAL <onboarding@resend.dev>', 
            'to' => [$to_email],
            'subject' => 'Нова заявка: ' . $name,
            'html' => "<h3>Нова заявка</h3><p><b>Ім'я:</b> $name</p><p><b>Телефон:</b> $phone</p><p><b>Запит:</b> $comment</p>"
        ];

        $ch_res = curl_init($resend_url);
        curl_setopt($ch_res, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $resend_key",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch_res, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch_res, CURLOPT_POST, true);
        curl_setopt($ch_res, CURLOPT_POSTFIELDS, json_encode($email_data));
        
        curl_exec($ch_res);
        curl_close($ch_res);
    }

    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No data"]);
}
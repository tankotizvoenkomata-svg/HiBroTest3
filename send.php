<?php
// Позволяем скрипту работать с JSON
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    // Безопасно извлекаем данные. Если поля нет, будет "—"
    $name    = isset($data['name'])  ? strip_tags($data['name'])  : 'Не вказано';
    $phone   = isset($data['phone']) ? strip_tags($data['phone']) : 'Не вказано';
    $link    = isset($data['link'])  ? strip_tags($data['link'])  : 'Не вказано';
    $comment = isset($data['comment']) ? strip_tags($data['comment']) : 'Без коментаря';

    // Формируем текст сообщения
    $tg_msg = "🔔 Нова заявка!\n";
    $tg_msg .= "👤 Ім'я: $name\n";
    $tg_msg .= "📞 Телефон: $phone\n";
    $tg_msg .= "🔗 Посилання: $link\n";
    if ($comment !== 'Без коментаря') {
        $tg_msg .= "📝 Запит: $comment";
    }

    // --- 1. TELEGRAM ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        file_get_contents("https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=HTML&text=" . urlencode($tg_msg));
    }

    // --- 2. RESEND (Email) ---
    $resend_key = getenv('RESEND_API_KEY');
    $to_email = getenv('CONTACT_EMAIL');

    if ($resend_key && $to_email) {
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $resend_key",
            "Content-Type: application/json"
        ]);

        $email_body = "<h3>Нова заявка з сайту</h3>";
        $email_body .= "<b>Ім'я:</b> $name<br>";
        $email_body .= "<b>Телефон:</b> $phone<br>";
        $email_body .= "<b>Посилання:</b> $link<br>";
        $email_body .= "<b>Коментар:</b> $comment";

        $email_data = [
            "from" => "onboarding@resend.dev",
            "to" => $to_email,
            "subject" => "Заявка від: $name",
            "html" => $email_body
        ];

        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
        curl_exec($ch);
        curl_close($ch);
    }

    // Всегда возвращаем JSON успех, чтобы JS не ругался
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "No data"]);
}
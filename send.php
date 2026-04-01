<?php
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name = strip_tags($data['name']);
    $phone = strip_tags($data['phone']);
    $link = strip_tags($data['link']);

    // --- 1. TELEGRAM (Оставляем, раз работает) ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    $tg_msg = "🔔 Нова заявка!\n👤 Ім'я: $name\n📞 Телефон: $phone\n🔗 Посилання: $link";
    @file_get_contents("https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&text=" . urlencode($tg_msg));

    // --- 2. ПОЧТА ЧЕРЕЗ API (Resend) ---
    $resend_key = getenv('RESEND_API_KEY');
    
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $resend_key",
        "Content-Type: application/json"
    ]);
    
    $email_data = [
        "from" => "onboarding@resend.dev", // Пока не подтвердите свой домен, используйте этот адрес
        "to" => getenv('CONTACT_EMAIL'),
        "subject" => "Нова заявка: $name",
        "html" => "<strong>Ім'я:</strong> $name<br><strong>Телефон:</strong> $phone<br><strong>Посилання:</strong> $link"
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
    curl_exec($ch);
    curl_close($ch);

    echo json_encode(["status" => "success"]);
}


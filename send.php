<?php
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name = strip_tags($data['name'] ?? 'Не вказано');
    $phone = strip_tags($data['phone'] ?? 'Не вказано');
    $link = strip_tags($data['link'] ?? 'Не вказано');
    $comment = strip_tags($data['comment'] ?? '-'); // Добавляем комментарий

    // --- 1. TELEGRAM ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    $tg_msg = "🔔 Нова заявка!\n👤 Ім'я: $name\n📞 Телефон: $phone\n🔗 Посилання: $link\n📝 Коментар: $comment";
    
    @file_get_contents("https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&text=" . urlencode($tg_msg));

    // --- 2. ПОЧТА (Resend) ---
    $resend_key = getenv('RESEND_API_KEY');
    $target_email = getenv('CONTACT_EMAIL');
    
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $resend_key",
        "Content-Type: application/json"
    ]);
    
    $email_data = [
        "from" => "onboarding@resend.dev",
        "to" => $target_email,
        "subject" => "Нова заявка: $name",
        "html" => "<strong>Ім'я:</strong> $name<br>
                   <strong>Телефон:</strong> $phone<br>
                   <strong>Посилання:</strong> $link<br>
                   <strong>Коментар:</strong> $comment"
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_data));
    curl_exec($ch);
    curl_close($ch);

    echo json_encode(["status" => "success"]);
}

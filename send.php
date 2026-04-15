<?php
// Позволяем запросы с любого источника (или замените * на ваш домен)
header("Access-Control-Allow-Origin: *");
// Разрешаем определенные методы (POST важен для форм)
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
// Разрешаем заголовки, которые браузер может отправить (особенно Content-Type)
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Если это preflight-запрос (OPTIONS), просто выходим, не выполняя основной код
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name    = !empty($data['name'])  ? strip_tags($data['name'])  : 'Не вказано';
    $phone   = !empty($data['phone']) ? strip_tags($data['phone']) : 'Не вказано';
    $link    = !empty($data['link'])  ? strip_tags($data['link'])  : 'Не вказано';
    $comment = !empty($data['comment']) ? strip_tags($data['comment']) : 'Без коментаря';

    // Текст сповіщення в Telegram
    $tg_msg = "🔔 <b>Нова заявка!</b>\n";
    $tg_msg .= "👤 Ім'я: $name\n";
    $tg_msg .= "📞 Телефон: $phone\n";
    $tg_msg .= "🔗 Посилання: $link\n";
    
    if ($comment !== 'Без коментаря') {
        $tg_msg .= "📝 Запит: $comment";
    }

    // Відправка в TG
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        $url = "https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=HTML&text=" . urlencode($tg_msg);
        file_get_contents($url);
    }

// --- ОТПРАВКА НА ПОЧТУ ЧЕРЕЗ СКРЫТУЮ ПЕРЕМЕННУЮ ---
$to = getenv('CONTACT_EMAIL'); // Достаємо вашу пошту з налаштувань хостингу

if ($to) {
    $subject = "Нова заявка від " . $name;
    
    $email_content = "Ви отримали нову заявку через форму:\n\n";
    $email_content .= "👤 Ім'я: $name\n";
    $email_content .= "📞 Телефон: $phone\n";
    $email_content .= "🔗 Посилання: $link\n";
    $email_content .= "📝 Запит: $comment\n";

    // Формуємо заголовки
    $headers = "From: no-reply@" . $_SERVER['HTTP_HOST'] . "\r\n";
    $headers .= "Reply-To: no-reply@" . $_SERVER['HTTP_HOST'] . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Намагаємось відправити
    @mail($to, $subject, $email_content, $headers);
}

    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No data"]);
}
<?php
// Получаем данные из JSON-запроса (так как мы шлем через fetch в JS)
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name = strip_tags($data['name']);
    $phone = strip_tags($data['phone']);
    $link = strip_tags($data['link']);

    // Настройки Telegram (берем из переменных окружения Railway)
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');

    $message = "🔔 Нова заявка!\n";
    $message .= "👤 Ім'я: $name\n";
    $message .= "📞 Телефон: $phone\n";
    $message .= "🔗 Посилання: $link";

    $url = "https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=html&text=" . urlencode($message);

    $response = file_get_contents($url);
    
    if ($response) {
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error"]);
    }
}
?>
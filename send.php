<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit; }

// ПРАВИЛЬНОЕ ПОДКЛЮЧЕНИЕ ДЛЯ RAILWAY
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents('php://input'), true);
// ... дальше ваш код

if ($data) {
    $name    = !empty($data['name'])    ? strip_tags($data['name'])    : 'Не вказано';
    $phone   = !empty($data['phone'])   ? strip_tags($data['phone'])   : 'Не вказано';
    $link    = !empty($data['link'])    ? strip_tags($data['link'])    : 'Не вказано';
    $comment = !empty($data['comment']) ? strip_tags($data['comment']) : 'Без коментаря';

    // --- ОТПРАВКА В TELEGRAM ---
    $tg_msg = "🔔 <b>Нова заявка!</b>\n";
    $tg_msg .= "👤 Ім'я: $name\n";
    $tg_msg .= "📞 Телефон: $phone\n";
    $tg_msg .= "🔗 Посилання: $link\n";
    
    if ($comment !== 'Без коментаря') {
        $tg_msg .= "📝 Запит: $comment";
    }

    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        $url = "https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=HTML&text=" . urlencode($tg_msg);
        
        // Используем контекст, чтобы Railway не блокировал запрос
        $options = ['http' => ['method' => "GET", 'header' => "User-Agent: PHP\r\n"]];
        $context = stream_context_create($options);
        @file_get_contents($url, false, $context);
    }

    // --- ОТПРАВКА НА ПОЧТУ ЧЕРЕЗ SMTP (PHPMailer) ---
    $mail = new PHPMailer(true);

    try {
        // Настройки сервера из переменных окружения
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com'; // Или ваш SMTP хост
        $mail->SMTPAuth   = true;
        $mail->Username   = getenv('SMTP_USER'); // Ваша почта для отправки
        $mail->Password   = getenv('SMTP_PASS'); // Пароль приложения
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Получатели
        $mail->setFrom(getenv('SMTP_USER'), 'LUDI.DIGITAL');
        $mail->addAddress(getenv('CONTACT_EMAIL')); // Ваша почта из переменных

        // Контент письма
        $mail->CharSet = 'UTF-8';
        $mail->isHTML(true);
        $mail->Subject = "Нова заявка: " . $name;
        $mail->Body    = "
            <h3>Нова заявка з вашого сайту</h3>
            <p><b>Ім'я:</b> {$name}</p>
            <p><b>Телефон:</b> {$phone}</p>
            <p><b>Посилання:</b> {$link}</p>
            <p><b>Запит:</b> {$comment}</p>
        ";

        $mail->send();
    } catch (Exception $e) {
        // Ошибка записывается в логи сервера, если почта не ушла
        error_log("Помилка PHPMailer: " . $mail->ErrorInfo);
    }

    // Возвращаем успех фронтенду
    echo json_encode(["status" => "success"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No data"]);
}
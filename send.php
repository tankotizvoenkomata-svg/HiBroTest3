<?php
// Подключаем автозагрузку библиотек (если используем composer)
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $name = strip_tags($data['name']);
    $phone = strip_tags($data['phone']);
    $link = strip_tags($data['link']);

    // --- 1. TELEGRAM (уже работает) ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    $tg_message = "🔔 Нова заявка!\n👤 Ім'я: $name\n📞 Телефон: $phone\n🔗 Посилання: $link";
    $url = "https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&text=" . urlencode($tg_message);
    @file_get_contents($url);

    // --- 2. ПОЧТА ЧЕРЕЗ SMTP ---
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = getenv('SMTP_HOST'); // Например, smtp.gmail.com
        $mail->SMTPAuth   = true;
        $mail->Username   = getenv('SMTP_USER'); // Ваша почта
        $mail->Password   = getenv('SMTP_PASS'); // Пароль приложения (не обычный пароль!)
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(getenv('SMTP_USER'), 'Сайт-Візитка');
        $mail->addAddress(getenv('CONTACT_EMAIL')); // Куда прислать письмо

        $mail->isHTML(false);
        $mail->Subject = "Нова заявка: $name";
        $mail->Body    = "Ім'я: $name\nТелефон: $phone\nПосилання: $link";

        $mail->send();
    } catch (Exception $e) {
        // Ошибка отправки почты не должна прерывать ответ пользователю
    }

    echo json_encode(["status" => "success"]);
}
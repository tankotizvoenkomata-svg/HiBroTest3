<?php
// Подключаем файлы PHPMailer вручную
require 'phpmailer/Exception.php';
require 'phpmailer/PHPMailer.php';
require 'phpmailer/SMTP.php';

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
        $mail->Host       = getenv('SMTP_HOST'); 
        $mail->SMTPAuth   = true;
        $mail->Username   = getenv('SMTP_USER'); 
        $mail->Password   = getenv('SMTP_PASS'); 
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(getenv('SMTP_USER'), 'Ваш Сайт');
        $mail->addAddress(getenv('CONTACT_EMAIL')); 

        $mail->isHTML(false);
        $mail->Subject = "Нова заявка: $name";
        $mail->Body    = "Ім'я: $name\nТелефон: $phone\nПосилання: $link";

        $mail->send();
    } catch (Exception $e) {
        // Ошибка почты не должна ломать успех для пользователя, 
        // но мы можем записать её для логов, если нужно
    }

    echo json_encode(["status" => "success"]);
}
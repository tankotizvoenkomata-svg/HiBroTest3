<?php
// 1. Настройка доступа
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// 2. Получение данных
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    // Извлекаем основные поля
    $name    = !empty($data['name'])    ? strip_tags($data['name'])    : 'Не вказано';
    $phone   = !empty($data['phone'])   ? strip_tags($data['phone'])   : 'Не вказано';
    $method  = !empty($data['contact_type']) ? strtoupper(strip_tags($data['contact_type'])) : 'Не вказано';
    $contact = !empty($data['contact_data']) ? strip_tags($data['contact_data']) : 'Не вказано';
    
    // Обработка товаров (массив преобразуем в строку)
    $goods = !empty($data['goods']) && is_array($data['goods']) ? $data['goods'] : [];
    $goods_count = count($goods);
    $goods_list  = $goods_count > 0 ? implode(", ", $goods) : 'Товари не обрані';

    // --- А) ТЕЛЕГРАМ ---
    $token = getenv('TG_TOKEN');
    $chat_id = getenv('TG_CHAT_ID');
    
    if ($token && $chat_id) {
        $tg_msg = "<b>🔔 НОВА ЗАЯВКА</b>\n\n";
        $tg_msg .= "👤 <b>Ім'я:</b> $name\n";
        $tg_msg .= "📞 <b>Телефон:</b> $phone\n";
        $tg_msg .= "💬 <b>Зв'язок:</b> $method ($contact)\n\n";
        $tg_msg .= "📦 <b>Товари ($goods_count):</b>\n<i>$goods_list</i>";

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

    // --- Б) RESEND (Почта) ---
    $resend_key = getenv('RESEND_API_KEY');
    $to_email = getenv('CONTACT_EMAIL');

    if ($resend_key && $to_email) {
        $resend_url = 'https://api.resend.com/emails';
        
        $email_html = "
            <div style='font-family: sans-serif; background: #f9f9f9; padding: 20px;'>
                <h2 style='color: #000;'>Нове замовлення від $name</h2>
                <p><b>Телефон:</b> $phone</p>
                <p><b>Спосіб зв'язку:</b> $method — $contact</p>
                <hr>
                <p><b>Обрано товарів ($goods_count):</b></p>
                <ul style='color: #333;'>";
        foreach ($goods as $item) {
            $email_html .= "<li>$item</li>";
        }
        $email_html .= "</ul></div>";

        $email_data = [
            'from' => 'LUDI.DIGITAL <onboarding@resend.dev>', 
            'to' => [$to_email],
            'subject' => "Замовлення ($goods_count шт): $name",
            'html' => $email_html
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
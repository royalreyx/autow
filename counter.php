<?php
/*
 * Ziyarətçi sayğacı — server tərəfli (avtoprays.ru, ea-php54).
 * js/script.js bunu fetch ilə çağırır, JSON qaytarır:
 *   {"total":123,"today":4,"online":2}
 * Məlumat qonşu counter.dat faylında saxlanılır (JSON, flock ilə kilidlənir).
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$DATA_FILE  = dirname(__FILE__) . '/counter.dat';
$BASE       = 0;      // köhnə saytdan gələn başlanğıc rəqəm (istəsən dəyiş)
$UNIQUE_TTL = 86400;  // eyni ziyarətçi 24 saat ərzində bir dəfə sayılır
$ONLINE_TTL = 300;    // son 5 dəqiqədə aktiv olanlar "saytdadır" sayılır

// Sayt Cloudflare arxasındadır — REMOTE_ADDR Cloudflare-in IP-sidir,
// ona görə əsl ziyarətçi IP-si CF-Connecting-IP başlığından götürülür.
function visitor_ip() {
    $keys = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR');
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $parts = explode(',', $_SERVER[$k]);
            return trim($parts[0]);
        }
    }
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
}

// IP saxlanmır — yalnız IP + brauzerin hash-i (şəxsi məlumat yazılmır).
$ua    = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
$id    = md5(visitor_ip() . '|' . $ua);
$now   = time();
$today = date('Y-m-d');

$fh = @fopen($DATA_FILE, 'c+');
if (!$fh) {
    http_response_code(500);
    echo json_encode(array('error' => 'storage'));
    exit;
}
flock($fh, LOCK_EX);

$raw = stream_get_contents($fh);
$d   = json_decode($raw, true);
if (!is_array($d)) {
    $d = array();
}
if (!isset($d['total'])) { $d['total'] = 0; }
if (!isset($d['today'])) { $d['today'] = 0; }
if (!isset($d['day']))   { $d['day']   = $today; }
if (!isset($d['seen']) || !is_array($d['seen'])) { $d['seen'] = array(); }

// Gün dəyişibsə, günlük sayğac sıfırlanır.
if ($d['day'] !== $today) {
    $d['day']   = $today;
    $d['today'] = 0;
}

// Köhnə izləri təmizlə (fayl şişməsin). seen[id] = array(ilk_görüş, son_görüş)
foreach ($d['seen'] as $k => $v) {
    $last = is_array($v) ? $v[1] : $v;
    if ($last < $now - $UNIQUE_TTL) {
        unset($d['seen'][$k]);
    }
}

$first = isset($d['seen'][$id]) && is_array($d['seen'][$id]) ? $d['seen'][$id][0] : 0;
if (!$first || $now - $first > $UNIQUE_TTL) {
    $d['total']++;
    $d['today']++;
    $first = $now;
}
$d['seen'][$id] = array($first, $now);

$online = 0;
foreach ($d['seen'] as $v) {
    $last = is_array($v) ? $v[1] : $v;
    if ($last >= $now - $ONLINE_TTL) { $online++; }
}

ftruncate($fh, 0);
rewind($fh);
fwrite($fh, json_encode($d));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

echo json_encode(array(
    'total'  => $BASE + $d['total'],
    'today'  => $d['today'],
    'online' => $online
));

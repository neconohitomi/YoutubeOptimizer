// ==UserScript==
// @name         YouTube Optimizer
// @namespace    http://tampermonkey.net
// @version      1.4.1
// @match        https://*.youtube.com/watch*
// @updateURL    https://raw.githubusercontent.com/neconohitomi/YoutubeOptimizer/refs/heads/main/YoutubeOptimize.js
// @downloadURL  https://raw.githubusercontent.com/neconohitomi/YoutubeOptimizer/refs/heads/main/YoutubeOptimize.js
// @description 字幕オフ、360p固定、音量70%制限、自動再生オフ
// ==/UserScript==

window.addEventListener('yt-page-data-updated', function() {
    console.log("Tampermonkey: YouTube Fixer Loaded");

    // 1度だけ実行するためのフラグ
    let isInitialSettingsDone = false;

    const p = document.getElementById('movie_player');
    if (p) {
        // 音量チェック (70%制限)
        if (p.getVolume() > 70) {
            console.log("Tampermonkey: Set Volume 70");
            p.setVolume(70);
        }
        // 画質チェック (medium = 360p)
        if (p.getPlaybackQuality() !== 'medium') {
            console.log("Tampermonkey: Set Quality medium");
            p.setPlaybackQualityRange('medium', 'medium');
        }
    }

    // 字幕ボタンをチェックしてオフにする関数
    function disableCaptions() {
        const ccButton = document.querySelector('.ytp-subtitles-button');
        if (ccButton) {
            const isEnabled = ccButton.getAttribute('aria-pressed') === 'true';
            if (isEnabled) {
                ccButton.click();
                console.log('[Auto Disable Captions] 字幕をオフにしました。');
            }
        }
    }

    // 左右カーソルキーが押されたときに再生ボタンにフォーカスするイベントリスナー
    const handleKeyDown = function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const playButton = document.querySelector('.ytp-play-button');
            if (playButton) {
                playButton.focus();
                console.log('Tampermonkey: 左右キーが押されたため再生ボタンにフォーカスしました');
            }
        }
    };

    // 古いリスナーがあれば一度削除して重複登録を防ぐ
    window.removeEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    const observer = new MutationObserver(() => {
        // 既に初期設定が完了している場合は何もしない
        if (isInitialSettingsDone) return;

        const ccButton = document.querySelector('.ytp-subtitles-button');
        const autoPlayButton = document.querySelector('button.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]');

        // 字幕ボタンと自動再生ボタンが両方見つかった（＝プレイヤーの読み込みが完了した）タイミング
        if (ccButton && autoPlayButton) {
            // 1. 字幕オフ
            disableCaptions();

            // 2. 自動再生オフ
            const label = autoPlayButton.getAttribute('aria-label');
            if (label && (label.includes("オン") || label.includes("on"))) {
                autoPlayButton.click();
                console.log("Tampermonkey: Autoplay disabled");
            }

            // フラグをtrueにして、以降の監視処理をスキップ
            isInitialSettingsDone = true;
            console.log("Tampermonkey: 初期設定（字幕・自動再生オフ）が完了しました");
            
            // 設定が終わったらObserverを停止してブラウザの負荷を減らす
            observer.disconnect();
        }
    });

    // 監視を開始
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

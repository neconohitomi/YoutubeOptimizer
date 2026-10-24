// ==UserScript==
// @name         YouTube Optimizer
// @namespace    http://tampermonkey.net
// @version      1.4.4
// @match        https://*.youtube.com/watch*
// @updateURL    https://raw.githubusercontent.com/neconohitomi/YoutubeOptimizer/refs/heads/main/YoutubeOptimize.js
// @downloadURL  https://raw.githubusercontent.com/neconohitomi/YoutubeOptimizer/refs/heads/main/YoutubeOptimize.js
// @description 字幕オフ、360p固定、音量70%制限、自動再生オフ
// ==/UserScript==

/*
2026/10/24　14：37
*/

window.addEventListener('yt-page-data-updated', function() {
    console.log("Tampermonkey: YouTube Fixer Loaded");

    const p = document.getElementById('movie_player');
    if (p) {
        // 音量チェック (70%制限)
        if (p.getVolume() > 70) {
            console.log("Tampermonkey: Set Volume 70");
            p.setVolume(50);
        }
        // 画質チェック (medium = 360p)
        if (p.getPlaybackQuality() !== 'medium') {
            console.log("Tampermonkey: Set Quality medium");
            p.setPlaybackQualityRange('medium', 'medium');
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

    // 古いリスナーを削除して重複登録を防止
    window.removeEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    // 状態を追跡するフラグ（確実にオフが適用されたら true にする）
    let isCaptionsSuccessfullyDisabled = false;
    let isAutoplaySuccessfullyDisabled = false;

    // 画面監視 (MutationObserver)
    const observer = new MutationObserver(() => {
        // 両方のオフ設定が成功していれば、監視を終了してブラウザの負荷を下げる
        if (isCaptionsSuccessfullyDisabled && isAutoplaySuccessfullyDisabled) {
            console.log("Tampermonkey: すべての初期設定が適用されました。監視を終了します。");
            observer.disconnect();
            return;
        }

        // 1. 字幕オフの処理
        if (!isCaptionsSuccessfullyDisabled) {
            const ccButton = document.querySelector('.ytp-subtitles-button');
            if (ccButton) {
                const isEnabled = ccButton.getAttribute('aria-pressed') === 'true';
                if (isEnabled) {
                    ccButton.click();
                    console.log('[Auto Disable Captions] 字幕をオフにするクリックを実行しました。');
                } else if (ccButton.getAttribute('aria-pressed') === 'false') {
                    // 確実にオフ（false）になっていることを確認できたら、この処理は完了
                    isCaptionsSuccessfullyDisabled = true;
                    console.log('[Auto Disable Captions] 字幕がオフであることを確認しました。');
                }
            }
        }

        // 2. 自動再生オフの処理
        if (!isAutoplaySuccessfullyDisabled) {
            const autoPlayButton = document.querySelector('.ytp-autonav-toggle-button, [data-tooltip-target-id="ytp-autonav-toggle-button"]');
            if (autoPlayButton) {
                const label = autoPlayButton.getAttribute('aria-label') || '';
                const checked = autoPlayButton.getAttribute('aria-checked');

                // オン状態（true、またはラベルにオンが含まれる）ならクリック
                if (checked === "true" || label.includes("オン") || label.includes("on")) {
                    autoPlayButton.click();
                    console.log("Tampermonkey: 自動再生をオフにするクリックを実行しました。");
                } else if (checked === "false" || label.includes("オフ") || label.includes("off")) {
                    // 確実にオフ（false）になっていることを確認できたら、この処理は完了
                    isAutoplaySuccessfullyDisabled = true;
                    console.log("Tampermonkey: 自動再生がオフであることを確認しました。");
                }
            }
        }
    });

    // 監視を開始
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

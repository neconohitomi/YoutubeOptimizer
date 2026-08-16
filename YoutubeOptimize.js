// ==UserScript==
// @name         YouTube Optimizer
// @namespace    http://tampermonkey.net
// @version      1.4
// @match        https://*.youtube.com/watch*
// @grant        none
// @description 字幕オフ、360p固定、音量70%制限、自動再生オフ
// ==/UserScript==

window.addEventListener('yt-page-data-updated', function() {
    console.log("Tampermonkey: YouTube Fixer Loaded");

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
        // YouTubeの字幕ボタン（CCボタン）を取得
        const ccButton = document.querySelector('.ytp-subtitles-button');

        if (ccButton) {
            // ytp-subtitles-button が 'true'（オン状態）のときだけクリックしてオフにする
            const isEnabled = ccButton.getAttribute('aria-pressed') === 'true';
            if (isEnabled) {
                ccButton.click();
                console.log('[Auto Disable Captions] 字幕をオフにしました。');
            }
        }
    }

    const observer = new MutationObserver(() => {
        // プレイヤーが存在し、動画が読み込まれたタイミングで実行
        //字幕オフ
        if (document.querySelector('.ytp-subtitles-button')) {
            disableCaptions();
        }
        // 自動再生オフの強制
        // 自動再生ボタンの aria-label が "自動再生はオンです" の場合にクリック
        const autoPlayButton = document.querySelector('button.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]');
        const playButton = document.querySelector('.ytp-play-button');
        if (autoPlayButton) {
            const label = autoPlayButton.getAttribute('aria-label');
            if (label && (label.includes("オン") || label.includes("on"))) {
                autoPlayButton.click();
                console.log("Tampermonkey: Autoplay disabled");
            }
        }
        if (playButton) {
            // フォーカスを当てる
            playButton.focus();
            console.log('再生ボタンにフォーカスしました');
        } else {
            console.log('再生ボタンが見つかりませんでした');
        }
    });

    // 監視を開始
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

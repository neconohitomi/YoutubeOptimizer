// ==UserScript==
// @name         YouTube Optimizer
// @namespace    http://tampermonkey.net
// @updateURL    https://raw.githubusercontent.com/neconohitomi/YoutubeOptimizer/refs/heads/main/YoutubeOptimize.user.js
// @downloadURL  https://raw.githubusercontent.com/neconohitomi/YoutubeOptimizer/refs/heads/main/YoutubeOptimize.user.js
// @version      2.0.1
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// @description 字幕オフ、360p固定、音量50%制限、自動再生オフ、左右キーで再生ボタンにフォーカス
// ==/UserScript==

(() => {
    'use strict';

    const TARGET_VOLUME = 50;
    const TARGET_QUALITY = 'medium';
    const RETRY_INTERVAL_MS = 500;
    const MAX_RETRIES = 20;

    let retryTimer = null;
    let retryCount = 0;
    let captionsClickPending = false;
    let autoplayClickPending = false;

    function getPlayer() {
        return document.getElementById('movie_player');
    }

    function applyVolume(player) {
        try {
            const volume = player?.getVolume?.();
            if (typeof volume !== 'number') return;

            // 音量の上限を50%にする
            if (volume > TARGET_VOLUME) {
                player.setVolume(TARGET_VOLUME);
                console.log(`[YouTube Optimizer] 音量を${TARGET_VOLUME}%に制限しました。`);
            }

            // 常に50%に設定したい場合は、上の if ブロックを次に置き換えてください:
            // if (volume !== TARGET_VOLUME) player.setVolume(TARGET_VOLUME);
        } catch (error) {
            console.debug('[YouTube Optimizer] 音量を設定できませんでした。', error);
        }
    }

    function applyQuality(player) {
        try {
            // YouTube内部の非公開メソッドです。存在する場合だけ要求します。
            if (typeof player?.setPlaybackQualityRange === 'function') {
                player.setPlaybackQualityRange(TARGET_QUALITY, TARGET_QUALITY);
            }
        } catch (error) {
            console.debug('[YouTube Optimizer] 画質を設定できませんでした。', error);
        }
    }

    function disableCaptions() {
        const button = document.querySelector('.ytp-subtitles-button');
        if (!button) return false;

        const state = button.getAttribute('aria-pressed');

        if (state === 'false') {
            captionsClickPending = false;
            return true;
        }

        if (state === 'true' && !captionsClickPending) {
            captionsClickPending = true;
            button.click();
            console.log('[YouTube Optimizer] 字幕オフを要求しました。');

            // 状態更新が反映されない場合は、次の試行で再確認できるようにする
            setTimeout(() => {
                captionsClickPending = false;
            }, 1500);
        }

        return false;
    }

    function disableAutoplay() {
        const button = document.querySelector(
            '.ytp-autonav-toggle-button, ' +
            'button[data-tooltip-target-id="ytp-autonav-toggle-button"]'
        );

        if (!button) return false;

        // aria-checked はスイッチ本体側にある場合と、親要素側にある場合があります
        const stateElement = button.matches('[aria-checked]')
            ? button
            : button.querySelector('[aria-checked]') ||
              button.closest('[aria-checked]');

        const state = stateElement?.getAttribute('aria-checked');

        if (state === 'false') {
            autoplayClickPending = false;
            return true;
        }

        if (state === 'true' && !autoplayClickPending) {
            autoplayClickPending = true;
            button.click();
            console.log('[YouTube Optimizer] 自動再生オフを要求しました。');

            setTimeout(() => {
                autoplayClickPending = false;
            }, 1500);
        }

        return false;
    }

    function applySettings() {
        const player = getPlayer();

        if (player) {
            applyVolume(player);
            applyQuality(player);
        }

        const captionsOff = disableCaptions();
        const autoplayOff = disableAutoplay();

        retryCount++;

        if ((captionsOff && autoplayOff) || retryCount >= MAX_RETRIES) {
            clearInterval(retryTimer);
            retryTimer = null;

            if (retryCount >= MAX_RETRIES && !(captionsOff && autoplayOff)) {
                console.warn('[YouTube Optimizer] 一部の設定を確認できませんでした。');
            }
        }
    }

    function startForCurrentVideo() {
        clearInterval(retryTimer);

        retryCount = 0;
        captionsClickPending = false;
        autoplayClickPending = false;

        // すぐに一度実行し、その後はボタンが現れるまで短時間再試行
        applySettings();
        retryTimer = setInterval(applySettings, RETRY_INTERVAL_MS);
    }

    // 初回表示とYouTube内の動画遷移に対応
    startForCurrentVideo();
    document.addEventListener('yt-navigate-finish', startForCurrentVideo);
    document.addEventListener('yt-page-data-updated', startForCurrentVideo);

    // 左右キーで再生ボタンにフォーカス
    window.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

        const playButton = document.querySelector('.ytp-play-button');
        if (playButton) {
            playButton.focus();
            console.log('[YouTube Optimizer] 再生ボタンにフォーカスしました。');
        }
    }, true);
})();

// ==UserScript==
// @name        KoebutaSlayer
// @namespace   albno273
// @description 声優へのクソリプを消します。
// @include     https://twitter.com/*
// @version     1.0.0
// @grant       none
// @require https://code.jquery.com/jquery-3.1.0.min.js
// ==/UserScript==

$(function () {

  // このリストにあるアカウントへのリプライのうち、
  // このリスト「外」のアカウントからのものが非表示になります。
  // 初期状態のリストは適当に女性声優のアカウントを50人弱突っ込んであります。
  // この他対象にしたいアカウントがいる場合はこの部分に追加してください。
  const whiteList = [
    'suzaki_aya', 'ibuking_1114', 'maaya_taso', '0812asumikana',
    'numakura_manami', '38kMarie', 'Yaskiyo_manager', 'kurapimk',
    'kanekosanndesu', 'AyakaOhashi', 'Lynn_0601_', 'takamori_723',
    'OnoSaki1126', 'nojomiy', 'akekodao', 'yuumin_uchiyama',
    'marika_0222', 'Miho_Aaaa', 'osorasan703', 'fuchigami_mai',
    'han_meg_han', 'Erietty_55', 'RiccaTachibana', 'tanezakiatsumi',
    'yuuka_aisaka', '0309akari', 'mikakokomatsu', 'shiori_izawa',
    'TomoyoKurosawa', 'eerie_eery', 'mikami_shiori', 'reimatsuzaki',
    'shimoda_asami', 'Uesakasumire', 'coloruri', 'yuichupunch',
    'ErikoMatsui', 'ousakichiyo', 'nanjolno', 'Emiryun',
    'HiRoMi_ig', 'makomorino', 'yukari_tamura'
  ];
  
  // element
  const remove = $("<button>")
    .text("【クソリプを非表示にする！】")
    .css({"color": "Maroon"})
    .on("click", () => {
      removeKsrp();
    });
  
  // delete function
  function removeKsrp() {
    let tweet = $('.js-stream-tweet:has(\'.tweet-text\')');
    if (tweet.length > 0) {
      tweet.each(function (index, element) {
        let text = $(element).find('.tweet-text').text();
        // alert('text: ' + text);
        let from = $(element).attr('data-screen-name');
        // alert('from: ' + from);
        let to   = $(element).attr('data-mentions').split(/ /);
        // alert('to: ' + to);
        to.forEach(function (value, index, array) {
          if (whiteList.indexOf(from) == - 1 && whiteList.indexOf(value) >= 0) {
            // 最終行を消してコメントアウトされた部分をアクティブにすると
            // 面白い感じになります。
            /*
            $(element).find('.tweet-text').text('アバーッ！');
            $(element).find('.fullname').text('Koebuta Slayer');
            $(element).find('.username').html('<s> @</s><b>koebutaslayer</b>');
            $(element).find('.js-action-profile-avatar')
              .attr('src', 'https://pbs.twimg.com/profile_images/716042850903830528/PLNG3AVA.jpg');
            $(element).find('.AdaptiveMediaOuterContainer').remove();
            return true;
            */
            $(element).css("display", "none");
          }
        });
      });
    }
  }
  
  // add element
  $(".client-and-actions > .metadata").after(remove);
});
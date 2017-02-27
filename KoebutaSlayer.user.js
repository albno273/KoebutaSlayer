// ==UserScript==
// @name        KoebutaSlayer
// @namespace   albno273
// @description 声優へのクソリプを抹殺します。
// @include     https://twitter.com/*
// @version     1.2.0
// @grant       none
// @require     https://code.jquery.com/jquery-3.1.0.min.js
// ==/UserScript==

$(() => {

  // このリストにあるアカウントへのリプライのうち、
  // このリスト「外」のアカウントからのものが非表示になります。
  // 初期状態のリストは適当に女性声優のアカウントを50人弱突っ込んであります。
  // この他に対象にしたいアカウントがいる場合はこの部分に追加してください。
  const whiteList = [
    'suzaki_aya',      'ibuking_1114', 'maaya_taso',      '0812asumikana',
    'numakura_manami', '38kMarie',     'Yaskiyo_manager', 'kurapimk',
    'kanekosanndesu',  'AyakaOhashi',  'Lynn_0601_',      'takamori_723',
    'OnoSaki1126',     'nojomiy',      'akekodao',        'yuumin_uchiyama',
    'marika_0222',     'Miho_Aaaa',    'osorasan703',     'fuchigami_mai',
    'han_meg_han',     'Erietty_55',   'RiccaTachibana',  'tanezakiatsumi',
    'yuuka_aisaka',    '0309akari',    'mikakokomatsu',   'shiori_izawa',
    'TomoyoKurosawa',  'eerie_eery',   'mikami_shiori',   'reimatsuzaki',
    'shimoda_asami',   'Uesakasumire', 'coloruri',        'yuichupunch',
    'ErikoMatsui',     'ousakichiyo',  'nanjolno',        'Emiryun',
    'HiRoMi_ig',       'makomorino',   'yukari_tamura'
  ];
  
  let slayCountBeforeExec = 0; // ツイート抹殺数(起動前)
  let slayCountAfterExec  = 0; // ツイート抹殺数(起動後)

  // slayer element
  const slayer = $('<button class=\'koebuta-slayer\'>')
    .text('【クソリプを抹殺する】')
    .css({'color': '#8899a6', 'font-size': '12px'})
    .hover(
      (ev) => {
        $(ev.currentTarget).css({'color': 'darkred'});
      },
      (ev) => {
        $(ev.currentTarget).css({'color': '#8899a6'});
      }
    )
    .on('click',
      () => {
        slayTweet();
        recordCount();
      }
    );
  
  // add element
  $('.client-and-actions > .metadata').after(slayer);
  
  // slay tweet
  function slayTweet() {
    let tweet = $('.js-stream-tweet:has(\'.tweet-text\')');
    if (tweet.length > 0) {
      tweet.each(function (index, element) {
        let from = $(element).attr('data-screen-name');
        let to   = $(element).attr('data-mentions').split(/ /);
        to.forEach(function (value, index, array) {
          if (whiteList.indexOf(from) == - 1 && whiteList.indexOf(value) >= 0) {
            // コメントアウトされた部分をアクティブにすると
            // 面白い感じになります。

            // $(element).find('.tweet-text').text('アバーッ！');
            // $(element).find('.fullname').text('Koebuta Slayer');
            // $(element).find('.username').html(' <s>@</s><b>koebutaslayer</b>');
            // $(element).find('.js-action-profile-avatar')
            //   .attr('src', 'https://pbs.twimg.com/profile_images/716042850903830528/PLNG3AVA.jpg');
            // $(element).find('.AdaptiveMediaOuterContainer').remove();
            $(element).css('display', 'none');
            slayCountAfterExec++;
          }
        });
      });
    }
  }
  
  // count slayed tweet
  function recordCount() {
    $('.koebuta-slayer-counter').remove();
    const counter = $('<span class=\'koebuta-slayer-counter\'>')
      .text(slayCountAfterExec + '件抹殺しました')
      .css({'color': 'darkred', 'font-size': '12px'});
    $('.koebuta-slayer').after(counter);
    if(slayCountAfterExec - slayCountBeforeExec != 0) {
      blinkCounter();
      slayCountBeforeExec = slayCountAfterExec;
    }
    slayCountAfterExec = 0;
  }
  
  // blink counter
  function blinkCounter() {
    let blinkCount = 0;
    const blink = setInterval(() => {
      $('.koebuta-slayer-counter').fadeOut(150).fadeIn(150);
      blinkCount++;
      if (blinkCount >= 5)
        clearInterval(blink);
    }, 0);
  }

});
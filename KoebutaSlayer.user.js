// ==UserScript==
// @name           KoebutaSlayer
// @namespace      albno273
// @description    Adds a button that eliminates evil replys to tweet details.
// @description:ja ツイート詳細に声豚のリプライを抹殺するボタンを追加します。
// @include        https://twitter.com/*
// @version        1.2.1
// @require        https://code.jquery.com/jquery-3.1.0.min.js
// @require        https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_log
// @license        MIT License
// ==/UserScript==

// 仕様スクリプト: GM config
// https://openuserjs.org/src/libs/sizzle/GM_config.js
// 参考: Extract images for Twitter
// https://greasyfork.org/ja/scripts/15271-extract-images-for-twitter

// 除外リスト(初期設定)
const defaultWhitelistArray = [
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

// 初期設定
GM_config.init(
  {
    'id':    'KoebutaSlayerConfig',
    'title': 'KoebutaSlayer 抹殺設定',
    'fields':
    {
      'slayBehavior':
      {
        'label':   '抹殺時の挙動',
        'type':    'radio',
        'options': ['非表示にする', 'ニンジャスレイヤー風'],
        'default': '非表示にする'
      },
      'whitelist':
      {
        'label':   'ホワイトリスト(ID を改行で区切って入力してください)',
        'type':    'textarea',
        'default': `${defaultWhitelistArray.join('\n')}`
      }
    },
    'events':
    {
      'save': () => {
        // 単語構成文字と改行以外の文字があったら注意
        if(/[^0-9_a-zA-Z\n]/g.test(GM_config.fields['whitelist'].toValue()))
          alert('Caution!\nホワイトリストに半角英数字とアンダーバー、' +
                '改行以外の文字が入っていませんか？');
        alert('変更を保存しました。');
      },
      'reset': () => {
        alert('設定を初期化しました。');
      }
    }
  }
);

$(() => {

  const processedLists       = new WeakMap();
  const processedConfigLists = new WeakMap();

  let slayCountBeforeExec = 0; // ツイート抹殺数(起動前)
  let slayCountAfterExec  = 0; // ツイート抹殺数(起動後)

  // 抹殺ボタンを作る
  const createSlayer = (tweetLists) => {
    const slayer = $('<div>')
      .attr('class', 'ProfileTweet-action js-toggleState ProfileTweet-action--Slay')
      .html('<button class="ProfileTweet-actionButton js-actionButton js-actionSlay" type="button">' +
              '<div class="IconContainer js-tooltip" title="抹殺">' +
                '<span class="Icon Icon--close"></span>' +
                '<span class="u-hiddenVisually">抹殺</span>' +
              '</div>' +
              '<div class="IconTextContainer">' +
                '<span class="ProfileTweet-actionCount ">' +
                  '<span class="ProfileTweet-actionCountForPresentation Slay-counter" aria-hidden="true">0</span>' +
                '</span>' +
               '</div>' +
            '</button>')
      .hover(
        (ev) => {
          $(ev.currentTarget).find('.Icon')[0].style.color         = 'darkred';
          $(ev.currentTarget).find('.Slay-counter')[0].style.color = 'darkred';
        },
        (ev) => {
          $(ev.currentTarget).find('.Icon')[0].style.color         = '';
          $(ev.currentTarget).find('.Slay-counter')[0].style.color = '';
        }
      )
      .on('click',
        () => {
          slayTweet(tweetLists);
          // 抹殺数が増えた時だけ
          if(slayCountAfterExec != 0)
            recordCount();
        }
      );
    return slayer;
  }

  // 抹殺ボタンを追加
  const addSlayer = () => {
    const lists = $('.ProfileTweet-actionList');
    for (let i = 0; i < lists.length; i++) {
      const list = lists.eq(i);
      if(processedLists.has(list[0]))
        continue;
      else {
        // 画面遷移前のボタンが残った時に削除
        const oldSlayer = list.find('.ProfileTweet-action--Slay');
        if(oldSlayer.length > 0)
          oldSlayer.eq(0).remove();
        // TODO: parent() 連打をやめたい
        // ツイート詳細欄にのみボタンを登録
        if(list.parent().parent().parent().hasClass('permalink-tweet-container')) {
          processedLists.set(list[0], 1);
          const slayer = createSlayer(lists);
          list.append(slayer);
        }
      }
    }
  };

  // 設定ボタンを作る
  const createSlayerConfig = () => {
    const config = $('<li>')
      .attr('class', 'moments js-moments-tab')
      .html('<a role="button" href="#" class="js-nav js-tooltip js-dynamic-tooltip" ' +
            'data-component-context="moments_nav" data-nav="moments" data-placement="bottom">' +
              '<span class="Icon Icon--close Icon--large"></span>' +
              '<span class="text">抹殺設定</span>'+
            '</a>')
      .on('click', () => { GM_config.open(); });
    return config;
  }

  // 設定ボタンを追加
  const addSlayerConfig = () => {
    const lists = $('.js-global-actions');
    for (let i = 0; i < lists.length; i++) {
      const list = lists.eq(i);
      if(processedConfigLists.has(list[0]))
        continue;
      else {
        // 画面遷移前のボタンが残った時に削除
        const oldSlayerConfig = list.find('.ProfileTweet-action--Slay--config');
        if(oldSlayerConfig.length > 0)
          oldSlayerConfig.eq(0).remove();
        // 登録
        processedConfigLists.set(list[0], 1);
        const slayerConfig = createSlayerConfig();
        list.append(slayerConfig);
      }
    }
  };

  // ツイートを抹殺
  const slayTweet = (tweetLists) => {
    // 画面遷移前のツイートも含まれるのでリプライのみ抽出
    const tweet = tweetLists.parents().find('.permalink-descendant-tweet');
    if (tweet.length > 0) {
      const wl = GM_config.get('whitelist').split('\n');
      tweet.each((index, element) => {
        const from     = $(element).attr('data-screen-name');
        const to       = $(element).attr('data-mentions').split(/ /);
        const behavior = GM_config.get('slayBehavior');
        to.forEach((value, index, array) => {
          if (wl.indexOf(from) == -1 && wl.indexOf(value) >= 0) {
            if(behavior == '非表示にする') {
              $(element).css('display', 'none');
            } else if(behavior == 'ニンジャスレイヤー風') {
              $(element).find('.tweet-text').text('アバーッ！');
              $(element).find('.fullname').text('Koebuta Slayer');
              $(element).find('.username').html(' <s>@</s><b>koebutaslayer</b>');
              $(element).find('.js-action-profile-avatar')
                .attr('src', 'https://pbs.twimg.com/profile_images/716042850903830528/PLNG3AVA.jpg');
              $(element).find('.AdaptiveMediaOuterContainer').remove();
            }
            slayCountAfterExec++;
          }
        });
      });
    }
  }

  // 抹殺したツイート数をお知らせ
  const recordCount = () => {
    $('.Slay-counter').text(slayCountAfterExec);
    if(slayCountAfterExec - slayCountBeforeExec != 0) {
      blinkCounter();
      slayCountBeforeExec = slayCountAfterExec;
    }
    slayCountAfterExec = 0;
  }

  // 抹殺数更新の時に点滅させる
  const blinkCounter = () => {
    let blinkCount = 0;
    const blink = setInterval(() => {
      $('.Slay-counter').fadeOut(150).fadeIn(150);
      blinkCount++;
      if (blinkCount >= 5)
        clearInterval(blink);
    }, 50);
  }

  // DOMの更新が入るたびにボタンを追加
  (() => {
    let DOMObserverTimer = false;
    const DOMObserverConfig = {
      attributes: true,
      childList: true,
      subtree: true
    };
    const DOMObserver = new MutationObserver(function () {
      if (DOMObserverTimer !== 'false') {
        clearTimeout(DOMObserverTimer);
      }
      DOMObserverTimer = setTimeout(function () {
        DOMObserver.disconnect();
        addSlayer();
        DOMObserver.observe(document.body, DOMObserverConfig);
      }, 100);
    });
    DOMObserver.observe(document.body, DOMObserverConfig);
  })();

  // 初回起動
  addSlayer();
  addSlayerConfig();

});
// ==UserScript==
// @name           KoebutaSlayer
// @namespace      albno273
// @description    Adds a button that eliminates evil replys to tweet details.
// @description:ja ツイート詳細に声豚のリプライを抹殺するボタンを追加します。
// @include        https://twitter.com/*
// @version        2.0.1
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

(() => {

  const processedLists       = new WeakMap();
  const processedConfigLists = new WeakMap();

  let slayCountBeforeExec = 0; // ツイート抹殺数(起動前)
  let slayCountAfterExec  = 0; // ツイート抹殺数(起動後)

  // 抹殺ボタンを作る
  const createSlayer = (tweetLists) => {
    const slayer = document.createElement('div');
    slayer.setAttribute('class', 'ProfileTweet-action js-toggleState ProfileTweet-action--Slay');
    slayer.innerHTML =
    '<button class="ProfileTweet-actionButton js-actionButton js-actionSlay" type="button">' +
      '<div class="IconContainer js-tooltip" title="抹殺">' +
        '<span class="Icon Icon--close"></span>' +
        '<span class="u-hiddenVisually">抹殺</span>' +
      '</div>' +
      '<div class="IconTextContainer">' +
        '<span class="ProfileTweet-actionCount ">' +
          '<span class="ProfileTweet-actionCountForPresentation Slay-counter" aria-hidden="true"></span>' +
        '</span>' +
      '</div>' +
    '</button>';
    slayer.addEventListener('mouseenter', (ev) => {
      const icon = slayer.getElementsByClassName('Icon')[0];
      const counter = slayer.getElementsByClassName('Slay-counter')[0];
      icon.style.color    = 'darkred';
      counter.style.color = 'darkred';
    });
    slayer.addEventListener('mouseleave', (ev) => {
      const icon = slayer.getElementsByClassName('Icon')[0];
      const counter = slayer.getElementsByClassName('Slay-counter')[0];
      if(counter.textContent == '') {
        icon.style.color    = '';
        counter.style.color = '';
      }
    });
    slayer.addEventListener('click', () => {
      slayTweet(tweetLists);
      // 抹殺数が増えた時だけ
      if(slayCountAfterExec != 0)
        recordCount();
    });
    return slayer;
  };

  // 抹殺ボタンを追加
  const addSlayer = () => {
    const lists = document.getElementsByClassName('ProfileTweet-actionList');
    for (let i = 0; i < lists.length; i++) {
      const list = lists[i];
      if(processedLists.has(list))
        continue;
      else {
        // 画面遷移前のボタンが残った時に削除
        const oldSlayer = list.getElementsByClassName('ProfileTweet-action--Slay')[0];
        if(oldSlayer)
          oldSlayer.parentNode.removeChild(oldSlayer);
        // TODO: parentNode 連打をやめたい
        // ツイート詳細欄にのみボタンを登録
        if(list.parentNode.parentNode.parentNode.classList.contains('permalink-tweet-container')) {
          processedLists.set(list, 1);
          const slayer = createSlayer(lists);
          list.appendChild(slayer);
        }
      }
    }
  };

  // 設定ボタンを作る
  const createConfig = () => {
    const config = document.createElement('li');
    config.setAttribute('class', 'moments js-moments-tab');
    config.innerHTML =
    '<a role="button" href="#" class="js-nav js-tooltip js-dynamic-tooltip" ' +
    'data-component-context="moments_nav" data-nav="moments" data-placement="bottom">' +
      '<span class="Icon Icon--close Icon--large"></span>' +
      '<span class="text">抹殺設定</span>'+
    '</a>';
    config.addEventListener('click', () => { GM_config.open(); });
    return config;
  };

  // 設定ボタンを追加
  const addConfig = () => {
    const lists = document.getElementsByClassName('js-global-actions');
    for (let i = 0; i < lists.length; i++) {
      const list = lists[i];
      if(processedConfigLists.has(list))
        continue;
      else {
        // 画面遷移前のボタンが残った時に削除
        const oldConfig = list.getElementsByClassName('ProfileTweet-action--Slay--config')[0];
        if(oldConfig)
          oldConfig.parentNode.removeChild(oldConfig);
        // 登録
        processedLists.set(list, 1);
        const config = createConfig();
        list.appendChild(config);
      }
    }
  };

  // ツイートを抹殺
  const slayTweet = (tweetLists) => {
    const behavior = GM_config.get('slayBehavior');
    const wl       = GM_config.get('whitelist').split('\n');
    for (let i = 0; i < tweetLists.length; i++) {
      const list = tweetLists[i];
      // 画面遷移前のツイートも含まれるのでリプライのみ抽出
      // TODO: parentsNode 連打やめたい
      const tweets = list.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('permalink-descendant-tweet');
      if(tweets) {
        for (let j = 0; j < tweets.length; j++) {
          const tweet    = tweets[j];
          const from     = tweet.getAttribute('data-screen-name');
          const toChk    = tweet.getAttribute('data-mentions');
          if(toChk == null)
            slay();
          else {
            to = toChk.split(' ');
            to.forEach((value, index, array) => {
              if (wl.indexOf(from) == -1 && wl.indexOf(value) >= 0) {
                slay();
              }
            });
          }
          function slay() {
            if(behavior == '非表示にする') {
              tweet.style.display = 'none';
            } else if(behavior == 'ニンジャスレイヤー風') {
              tweet.getElementsByClassName('tweet-text')[0].textContent = 'アバーッ！';
              tweet.getElementsByClassName('fullname')[0].textContent   = 'Koebuta Slayer';
              tweet.getElementsByClassName('username')[0].innerHTML     = '<s>@</s><b>koebutaslayer</b>';
              tweet.getElementsByClassName('js-action-profile-avatar')[0]
                .setAttribute('src', 'https://pbs.twimg.com/profile_images/716042850903830528/PLNG3AVA.jpg');
              if(tweet.getElementsByClassName('AdaptiveMediaOuterContainer')[0])
                tweet.getElementsByClassName('AdaptiveMediaOuterContainer')[0].remove();
            }
            slayCountAfterExec++;
          }
        }
      }
    }
  }

  // 抹殺したツイート数をお知らせ
  const recordCount = () => {
    const counter = document.getElementsByClassName('Slay-counter')[0];
    counter.textContent = slayCountAfterExec;
    if(slayCountAfterExec - slayCountBeforeExec != 0)
      slayCountBeforeExec = slayCountAfterExec;
    slayCountAfterExec = 0;
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
  addConfig();

}) ();
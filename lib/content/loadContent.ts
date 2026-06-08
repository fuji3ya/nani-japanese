import { Category, Phrase } from './types';
import categories from './categories.json';
import gyaru from './phrases.gyaru.json';
import kansai from './phrases.kansai.json';
import edo from './phrases.edo.json';
import net from './phrases.net.json';
import otaku from './phrases.otaku.json';
import reiwa from './phrases.reiwa.json';
import heian from './phrases.heian.json';
import okinawa from './phrases.okinawa.json';

export function loadCategories(): Category[] {
  return categories as Category[];
}

export function findCategory(id: string): Category | undefined {
  return loadCategories().find((c) => c.id === id);
}

export function validatePhrase(p: Phrase): Phrase {
  const required: (keyof Phrase)[] = [
    'id',
    'categoryId',
    'term',
    'meaningEn',
    'meaningJa',
    'exampleJa',
    'exampleEn',
  ];
  for (const k of required) {
    if (!p[k]) throw new Error(`phrase ${p.id ?? '?'} missing ${k}`);
  }
  if (!p.tag || !['wakeru', 'itai', 'tsuujiru'].includes(p.tag.gachi)) {
    throw new Error(`phrase ${p.id} has invalid tag.gachi`);
  }
  return p;
}

// Code-switched English examples (the word dropped into English), keyed by term.
const MIX: Record<string, string> = {
  'あげぽよ': "Tonight's concert? I'm so agepoyo!",
  'MK5': "Late again?! I'm totally MK5 right now.",
  'チョベリバ': 'Got my test back… choberiba.',
  'パリピ': 'Out with the paripi till dawn.',
  'エモい': 'This song is so emoi at dusk.',
  '卍': 'Getting hyped — manji!',
  'おおきに': 'Thanks a million — ookini!',
  'なんでやねん': 'You forgot your wallet? Nandeyanen!',
  'ほんま': 'This is honma delicious.',
  'あかん': "Hey, you can't sleep here — akan de!",
  'めっちゃ': "It's meccha hot today.",
  'ちゃう': 'No no, chau chau — it’s this one.',
  'べらぼうめ': "Beraboume! Don't mess with me.",
  'てやんでい': "Teyandei! I'm a true Edo kid.",
  'おととい来やがれ': 'A deal like that? Ototoi kiyagare!',
  '野暮': 'Asking that is so yabo.',
  '粋': 'Their style is so iki.',
  'すっとこどっこい': 'You suttokodokkoi!',
  '草': 'That reply? Kusa.',
  '乙': 'Nice stream — otsu!',
  'ググる': "Don't know it? Just guguru it.",
  '炎上': 'That tweet totally got enjou’d.',
  'ワロタ': 'Caught me off guard — warota.',
  'ROM専': "I'll just go romsen on this thread.",
  '推し': 'My oshi is precious today.',
  '尊い': 'These two together… toutoi.',
  '神回': "This week's episode was a kamikai.",
  '沼': 'That genre is a total numa.',
  '萌え': 'That gesture is pure moe.',
  'ガチ恋': "I'm in gachikoi with that streamer.",
  'それな': '"Mondays suck." "Sorena."',
  'とりま': "Torima, let's just meet up.",
  'わかりみ': 'That struggle? Big wakarimi.',
  '映え': 'This cafe is so bae.',
  'ぴえん': 'It was sold out… pien.',
  'ガチ': "That's gachi delicious.",
  'マブ': 'She’s my mabu — total bestie.',
  'チョリース': 'Choriisu! See ya tomorrow.',
  'ありよりのあり': 'That place? Ari-yori-no-ari for sure.',
  'ガングロ': 'Ganguro was everywhere back then.',
  'あざとい': 'She’s so azatoi… but it works.',
  '盛れる': 'This app totally moreru’s my selfies.',
  'ええやん': "That's ee-yan, let's do it.",
  'しんどい': 'Ugh, today is so shindoi.',
  'ほな': 'Hona, see you tomorrow.',
  'おもろい': "That story's so omoroi.",
  'かまへん': "You're late? Kamahen, no worries.",
  'せやな': '"It’s hot." "Seya na."',
  'いなせ': "He's so inase — proper old-Tokyo cool.",
  'ちゃきちゃき': "She's a chaki-chaki Tokyoite.",
  '御の字': "If we break even, it's on-no-ji.",
  'こちとら': "Kochitora's been at this for years.",
  'すっからかん': "I'm totally sukkarakan till payday.",
  'べらんめえ': "He talks full beranmee — pure Edo.",
  'バズる': "My post totally bazuru'd overnight.",
  '神': "This is a kami feature, honestly.",
  'リア充': "Look at this ria-juu and their plans.",
  '黒歴史': "That old photo is pure kuro-rekishi.",
  'ステマ': "That glowing review smells like sutema.",
  'ポチる': "I just pochiru'd it without thinking.",
  '推し活': "My whole budget goes to oshi-katsu.",
  '二次元': "I only fall for nijigen characters.",
  '厨二病': "He's having a serious chuunibyou phase.",
  '供給': "We're starving — no kyoukyuu this week.",
  '布教': "Let me fukyou my oshi to you real quick.",
  '同担拒否': "She's strictly doutan-kyohi.",
  'なるはや': "Send it naru-haya, please.",
  'ちな': "China, the show starts at 8.",
  '飯テロ': "Your post is straight-up meshi-tero.",
  'きまず': "That silence was so kimazu.",
  'りょ': "\"Bring snacks.\" \"Ryo.\"",
  'バブみ': "She gives off major babu-mi.",
  'いとをかし': "That sunset is ito-wokashi, truly.",
  'もののあはれ': "This whole scene has real mono-no-aware.",
  'かたじけない': "Katajikenai, truly — you saved me.",
  'うつくし': "That kitten is utsukushi in the old sense.",
  'げに': "Geni — you're absolutely right.",
  'まろ': "Maro shall decide this matter.",
  'めんそーれ': "Mensoore — welcome to the islands!",
  'なんくるないさ': "Relax, nankurunaisa.",
  'はいさい': "Haisai! Good to see you.",
  'ちむどんどん': "I'm so chimudondon for this trip.",
  'でーじ': "It's deeji hot out here.",
  'にふぇーでーびる': "Nifee-deebiru for everything!",
};

// JP → EN labels for temperature tags (English-first chrome).
const ERA_EN: Record<string, string> = {
  '平成ギャル (2000s)': 'Heisei gal (2000s)',
  '平成ギャル (90s-2000s)': 'Heisei gal (90s–2000s)',
  'コギャル (90s)': 'Kogal (90s)',
  '平成後期〜令和': 'Late Heisei–Reiwa',
  '令和': 'Reiwa (now)',
  '令和 JK': 'Reiwa schoolgirls',
  '現役': 'Still current',
  '江戸': 'Edo era',
  '江戸発・現役': 'Edo-origin, still used',
  '令和ネット': 'Reiwa internet',
  'ネット老人(2000s-)': 'Old-net (2000s–)',
  'ネット(掲示板)': 'Forum-era net',
  '令和オタク': 'Reiwa otaku',
  '平成オタク(2000s)': 'Heisei otaku (2000s)',
  '令和(2020ピーク)': 'Reiwa (2020 peak)',
  '令和(平成後期〜)': 'Reiwa (late-Heisei on)',
  '平安': 'Heian era',
  '沖縄(現役)': 'Okinawa, current',
};
const WHO_EN: Record<string, string> = {
  'ギャル / JK': 'Gals / schoolgirls',
  'コギャル': 'Kogals',
  '若者': 'Young people',
  '若者全般': 'Young people',
  'JK / 若者': 'Schoolgirls / youth',
  '関西の人 / 商売人': 'Kansai folks / shopkeepers',
  '関西の人': 'Kansai folks',
  '関西発・全国区': 'Kansai-born, nationwide',
  '江戸っ子 / 時代劇': 'Edo locals / samurai dramas',
  '江戸っ子 / 職人': 'Edo locals / artisans',
  '江戸っ子': 'Edo locals',
  '現代でも通じる': 'Still understood today',
  '江戸っ子 / 落語': 'Edo locals / rakugo',
  'ネット民全般': 'Netizens',
  'ネット民 / 配信': 'Netizens / streamers',
  'ほぼ全員': 'Almost everyone',
  'メディア含む全般': 'Everyone, incl. media',
  '古参ネット民': 'Veteran netizens',
  '掲示板/コミュ勢': 'Forum / community users',
  'ファン全般': 'Fans',
  'オタク / 推し活': 'Otaku / oshi fans',
  '視聴者全般': 'Viewers',
  'オタク / 趣味勢': 'Otaku / hobbyists',
  '古参オタク': 'Veteran otaku',
  '推し活 / 配信勢': 'Oshi fans / streamer fans',
  '若者中心・全般': 'Mainly youth',
  '若者 / SNS': 'Youth / social media',
  '若者 / JK': 'Youth / schoolgirls',
  '平安貴族': 'Heian court nobles',
  '古典・時代劇': 'Classical / samurai dramas',
  '沖縄の人': 'Okinawans',
};

export function loadPhrases(): Phrase[] {
  const all = [...gyaru, ...kansai, ...edo, ...net, ...otaku, ...reiwa, ...heian, ...okinawa] as Phrase[];
  return all.map(validatePhrase).map((p) => ({
    ...p,
    exampleMix: MIX[p.term] ?? p.exampleMix,
    tag: {
      ...p.tag,
      eraEn: ERA_EN[p.tag.era] ?? p.tag.eraEn,
      whoUsesEn: WHO_EN[p.tag.whoUses] ?? p.tag.whoUsesEn,
    },
  }));
}

export function loadPhrasesByCategory(categoryId: string): Phrase[] {
  return loadPhrases().filter((p) => p.categoryId === categoryId);
}

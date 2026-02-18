import type { BlockCategory } from '../types';

export const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    id: 'social',
    name: 'Social Media',
    icon: '💬',
    domains: [
      'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
      'snapchat.com', 'pinterest.com', 'linkedin.com', 'tumblr.com', 'reddit.com',
      'discord.com', 'telegram.org', 'whatsapp.com', 'threads.net', 'mastodon.social',
    ],
  },
  {
    id: 'video',
    name: 'Video & Streaming',
    icon: '🎬',
    domains: [
      'youtube.com', 'netflix.com', 'twitch.tv', 'hulu.com', 'disneyplus.com',
      'primevideo.com', 'hbomax.com', 'peacocktv.com', 'dailymotion.com', 'vimeo.com',
      'crunchyroll.com', 'funimation.com', 'pluto.tv', 'tubi.tv', 'paramount.com',
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    domains: [
      'store.steampowered.com', 'epicgames.com', 'roblox.com', 'miniclip.com',
      'poki.com', 'armor games', 'kongregate.com', 'itch.io', 'gog.com',
      'origin.com', 'battlenet.com', 'ubisoft.com', 'ea.com', 'gamespot.com', 'ign.com',
    ],
  },
  {
    id: 'news',
    name: 'News & Media',
    icon: '📰',
    domains: [
      'cnn.com', 'foxnews.com', 'bbc.com', 'nytimes.com', 'theguardian.com',
      'washingtonpost.com', 'huffpost.com', 'buzzfeed.com', 'dailymail.co.uk',
      'nbcnews.com', 'abcnews.go.com', 'cbsnews.com', 'usatoday.com', 'reuters.com', 'apnews.com',
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    domains: [
      'amazon.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com',
      'aliexpress.com', 'shein.com', 'wish.com', 'bestbuy.com', 'newegg.com',
      'wayfair.com', 'overstock.com', 'zappos.com', 'asos.com', 'zara.com',
    ],
  },
  {
    id: 'adult',
    name: 'Adult Content',
    icon: '🔞',
    domains: [
      'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'youporn.com',
      'xhamster.com', 'tube8.com', 'spankbang.com', 'eporner.com', 'txxx.com',
      'drtuber.com', 'slutload.com', 'keezmovies.com', 'beeg.com', 'tnaflix.com',
    ],
  },
  {
    id: 'gambling',
    name: 'Gambling',
    icon: '🎰',
    domains: [
      'draftkings.com', 'fanduel.com', 'betmgm.com', 'caesars.com', 'pokerstars.com',
      'bet365.com', '888casino.com', 'williamhill.com', 'ladbrokes.com', 'coral.co.uk',
    ],
  },
];

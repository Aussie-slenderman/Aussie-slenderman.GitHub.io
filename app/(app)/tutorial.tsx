import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, LightColors, FontSize, FontWeight, Spacing, Radius, Shadow } from '../../src/constants/theme';
import AppHeader from '../../src/components/AppHeader';
import Sidebar from '../../src/components/Sidebar';
import { useAppStore } from '../../src/store/useAppStore';
import { useT } from '../../src/constants/translations';

// ─── Tutorial Data ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'pro_advice',
    icon: '📜',
    title: 'Rules of Thumb & Pro Advice',
    color: '#F59E0B',
    // 10 blank lesson templates — fill these in over time.
    // Each lesson needs:  title (string), icon (emoji), content (string).
    lessons: [
      {
        title: 'Lesson 1',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 2',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 3',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 4',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 5',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 6',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 7',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 8',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 9',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
      {
        title: 'Lesson 10',
        icon: '📝',
        content: 'Add your lesson content here.',
      },
    ],
  },
  {
    id: 'what_is',
    icon: '📈',
    title: 'What Is Stock Trading?',
    color: Colors.brand.primary,
    lessons: [
      {
        title: 'Stocks Explained',
        icon: '🏢',
        content:
          'A stock (also called a share or equity) is a tiny slice of ownership in a real company. If a company is cut into 1,000,000,000 (one billion) shares and you own 100 of them, you own one ten-millionth of that business.\n\nWhy companies sell shares:\n• To raise money without taking on debt\n• To fund growth — new factories, hiring, research, expansion\n• To let early employees and founders cash out part of their stake\n\nWhat owning a share gives you:\n• A claim on a slice of future profits\n• A vote on big decisions (one vote per share, usually)\n• The right to sell the share to anyone else, any time the market is open\n\nA company first sells shares in an event called an IPO (Initial Public Offering). After the IPO, those shares trade between investors — the company itself usually isn\'t involved in the day-to-day buying and selling.\n\nQuick example: Apple has about 15 billion shares. If Apple stock is at $200, the whole company is "worth" about $3 trillion in the market\'s eyes. Own one share, and you literally own 1 / 15,000,000,000 of Apple.',
      },
      {
        title: 'How Stock Trading Works',
        icon: '🔄',
        content:
          'Trading is buying and selling shares through an exchange. Every trade has two sides: someone selling and someone buying. The exchange just matches them up.\n\nWhere the price comes from — the order book:\n• Buyers post the highest price they\'re willing to pay (the BID)\n• Sellers post the lowest price they\'ll accept (the ASK)\n• When a bid meets an ask, a trade happens and that becomes the new "last price"\n• The gap between bid and ask is called the SPREAD. Tight spreads (a penny or two) mean lots of activity; wide spreads mean illiquid stock\n\nWhy prices move every second:\n• More buyers than sellers → price ticks up\n• More sellers than buyers → price ticks down\n• News, earnings, rumors, big-fund rebalances all shift demand\n\nHow you actually make (or lose) money:\n1. Capital gains — selling for more than you paid. Buy at $50, sell at $80 = $30 profit per share.\n2. Capital losses — selling for less than you paid. Buy at $50, sell at $30 = $20 loss per share.\n3. Dividends — some companies share their profits with shareholders, paid as cash (usually every 3 months).\n\nOrder types you\'ll see:\n• Market order — buy/sell right now at whatever price is available. Fast, but you take whatever price you get.\n• Limit order — only fill if the price hits the number you set. Safer; may not fill if the price doesn\'t reach it.',
      },
      {
        title: 'Stock Exchanges',
        icon: '🏦',
        content:
          'Exchanges are the physical and electronic marketplaces where shares change hands. The biggest ones:\n\n• NYSE (New York Stock Exchange) — founded 1792. Uses a hybrid system: most orders are matched electronically, but human "designated market makers" still oversee opens, closes, and big trades. Home to mature blue-chips like JPMorgan, Coca-Cola, Walmart, Disney.\n\n• NASDAQ — 100% electronic since day one (1971). No trading floor, just servers in New Jersey. Dominated by tech: Apple, Microsoft, NVIDIA, Amazon, Meta, Tesla.\n\n• LSE (London Stock Exchange) — UK\'s primary venue. Lists Shell, AstraZeneca, HSBC.\n\n• TSE (Tokyo Stock Exchange) — Japan\'s main exchange, where the Nikkei 225 index lives.\n\n• Euronext, SSE (Shanghai), HKEX (Hong Kong), TSX (Toronto) — other major global venues.\n\nUS market hours (Eastern Time):\n• Pre-market: 4:00 AM – 9:30 AM (low volume, big spreads)\n• Regular session: 9:30 AM – 4:00 PM\n• After-hours: 4:00 PM – 8:00 PM\n\nMarkets close on weekends and ~9 holidays a year. Earnings reports, big economic releases (jobs, inflation), and major news after the closing bell are why a stock can "gap" up or down overnight before you can react.',
      },
    ],
  },
  {
    id: 'reading_market',
    icon: '🔍',
    title: 'Reading the Market',
    color: Colors.brand.accent,
    lessons: [
      {
        title: 'Stock Price & Change',
        icon: '💵',
        content:
          'Every quote screen shows a handful of numbers. Understanding each one keeps you from getting tricked.\n\n• Last (or Current) — the price of the most recent trade. NOT a guaranteed price for your next trade.\n• Bid — the highest price a buyer is currently willing to pay\n• Ask (or Offer) — the lowest price a seller is currently willing to accept\n• Spread — Ask minus Bid. Apple\'s spread is usually $0.01; a tiny stock\'s spread might be $0.50+\n• Change ($) — Last minus yesterday\'s closing price\n• Change (%) — Change ÷ Yesterday\'s Close × 100\n• Volume — total shares traded today\n• Open / High / Low — today\'s first trade, highest trade, lowest trade\n• Previous Close — yesterday\'s final price (the reference for "today\'s change")\n\nColor code: green ▲ = up vs yesterday\'s close, red ▼ = down.\n\nWalk-through: AAPL  $250.12  +3.45 (+1.40%)\nThis means Apple is trading at $250.12 right now, which is $3.45 higher than it closed yesterday at $246.67 ($250.12 − $246.67 = $3.45). That $3.45 move is 1.40% of yesterday\'s close ($3.45 ÷ $246.67).\n\nWatch for "gaps": when a stock opens at a very different price than it closed at (because of overnight news). A gap up usually shows green even if the price has been drifting down all day from the open.',
      },
      {
        title: 'Market Indices',
        icon: '📊',
        content:
          'An index is a basket of stocks blended into a single number. It\'s a thermometer for "how the market is doing," because watching 500 prices at once is impossible.\n\nThe big four to know:\n• S&P 500 — 500 largest US companies, market-cap weighted (Apple has way more influence than a tiny company). The default benchmark for "the US stock market."\n• Dow Jones Industrial Average (DJIA) — only 30 companies, price weighted (a higher-priced stock matters more, even if its market cap is smaller). Older, narrower, but still widely quoted.\n• NASDAQ Composite — every stock listed on NASDAQ (~3,000), heavily tech. Moves faster than the S&P during tech rallies and sell-offs.\n• Russell 2000 — 2,000 small-cap US companies. Used to gauge how smaller, riskier businesses are doing.\n\nOther useful ones:\n• FTSE 100 (UK), DAX (Germany), Nikkei 225 (Japan), Hang Seng (Hong Kong), CAC 40 (France) — regional benchmarks.\n• Sector indices (e.g. XLK for tech, XLE for energy) — track one slice of the economy.\n\nWhy traders care:\n• Most active funds try to beat the S&P 500. If they can\'t, you might as well buy a low-cost index fund.\n• Indices set the mood. If the S&P drops 2%, almost every stock starts the day in the red — even the ones with great news.\n• Sector indices tell you whether a stock\'s move is unique to that company or just the whole sector moving together.',
      },
      {
        title: 'Bull vs Bear Markets',
        icon: '🐂',
        content:
          'These terms describe long stretches of broad price direction — not what happened today.\n\n🐂 Bull Market — prices have risen 20%+ from a recent low and the trend is up. Confidence is high, jobs reports are positive, companies are growing earnings.\nFamous example: March 2009 → February 2020. The S&P 500 went from 666 to 3,393 — over 400% in 11 years.\n\n🐻 Bear Market — prices have dropped 20%+ from a recent high and the trend is down. Headlines are grim, layoffs rise, fear spreads.\nFamous examples:\n• 2007–2009 Financial Crisis: S&P 500 fell ~57% over 17 months\n• Early 2020 COVID crash: S&P 500 fell ~34% in just 5 weeks (the fastest bear market ever)\n• 2022 inflation/rate-hike bear: S&P 500 fell ~25%\n\n📉 Correction — a drop of 10–20% inside an otherwise healthy bull market. Happens roughly every 1–2 years. Painful but normal — usually over in 3–4 months.\n\n📈 Rally — a sharp, sustained move up. Can happen inside a bear market ("bear-market rally") and trick people into thinking the bottom is in.\n\nHistorical pattern: bull markets have lasted ~5 years on average, bears just under 1 year. Stocks have spent most of history going up — but the down years sting more, so most beginners panic-sell at exactly the wrong time.',
      },
      {
        title: 'Volume & Liquidity',
        icon: '🌊',
        content:
          'Volume = how many shares changed hands during a session (day, hour, minute — depending on the chart). Liquidity = how easily you can buy or sell without moving the price.\n\nWhy they matter:\n• On a thick (high-volume) stock like AAPL, you can buy 1,000 shares without nudging the price.\n• On a thinly traded micro-cap, even a 100-share order can spike the price 5% — and then drop it right back when you sell. That\'s called slippage.\n\nKey numbers:\n• Average Daily Volume (ADV) — the typical day\'s volume over the past 30/90 days. A "good" tradable stock usually has ADV in the millions of shares.\n• Volume vs ADV — when today\'s volume is 3× ADV by lunchtime, something\'s happening. News, earnings, an analyst upgrade, or a big buyer/seller.\n\nWhat volume tells you:\n• Big up move on big volume = bullish. Real buyers stepped in.\n• Big up move on tiny volume = suspicious. The next session often gives it all back.\n• Big down move on huge volume = capitulation. The point where everyone who wanted out has sold. Sometimes marks a bottom.\n• Drying up volume over weeks = losing interest. Often precedes a slow bleed lower.\n\nLiquidity rule of thumb: never trade more than 1% of a stock\'s ADV in a single order, or you\'ll move the price against yourself.',
      },
    ],
  },
  {
    id: 'key_terms',
    icon: '📖',
    title: 'Key Terms & Metrics',
    color: Colors.brand.gold,
    lessons: [
      {
        title: 'Market Cap',
        icon: '💎',
        content:
          'Market Capitalisation = Share Price × Total Shares Outstanding.\n\nIt\'s the price tag the market currently puts on the whole company. NOT the same as what the company owns or earns — it\'s simply price × shares.\n\nExample: a stock at $40 with 250 million shares has a market cap of $10 billion.\n\nWhy it matters more than share price:\nA $5 stock can be a giant company (5B shares = $25B market cap) and a $500 stock can be tiny (5M shares = $2.5B). Share price alone tells you nothing about size.\n\nSize buckets (US conventions):\n• Mega-cap: $200B+ — Apple, Microsoft, NVIDIA, Saudi Aramco. Move slower; major index components.\n• Large-cap: $10B–$200B — established blue-chips like Disney, Pepsi.\n• Mid-cap: $2B–$10B — proven, growing, less analyst coverage. The "sweet spot" for some investors.\n• Small-cap: $300M–$2B — younger, higher volatility, harder to research, bigger potential upside.\n• Micro-cap: $50M–$300M — very thin liquidity, often manipulated, professionals usually avoid.\n• Nano-cap: under $50M — extremely speculative, often penny stocks.\n\nGeneral rule: the smaller the cap, the bigger the daily price swings — both ways. Beginners should anchor most of their portfolio in mid-and-up before touching the small-cap end.',
      },
      {
        title: 'P/E Ratio',
        icon: '⚖️',
        content:
          'Price-to-Earnings Ratio = Share Price ÷ Earnings Per Share (EPS).\n\nIt answers: "How many dollars am I paying for every $1 of yearly profit this company makes?"\n\nExample: Stock at $60, EPS of $3 → P/E = 20. You\'re paying $20 for every $1 of annual earnings — meaning at current earnings, it would take 20 years for the company to "earn back" its share price.\n\nTwo flavours:\n• Trailing P/E — uses the LAST 12 months of earnings (real, reported). Most common.\n• Forward P/E — uses ANALYST ESTIMATES for the NEXT 12 months. Useful but only as accurate as the estimates.\n\nRough guide (varies wildly by sector):\n• 5–10: very cheap. Either a bargain or a value trap (the market thinks earnings will collapse).\n• 10–20: typical for mature, profitable companies.\n• 20–30: market expects above-average growth.\n• 30–50+: high-growth premium (NVIDIA, Tesla in their hot years).\n• Negative: company is losing money. P/E is meaningless here — use Price-to-Sales instead.\n\nKey rule: P/E only makes sense WITHIN A SECTOR. Banks normally trade at 8–12. Software companies at 25–40. Comparing a bank to a software P/E is meaningless.\n\nPEG ratio = P/E ÷ earnings growth rate %. Roughly: PEG below 1 is "cheap relative to growth", above 2 is "expensive even after accounting for growth."',
      },
      {
        title: 'EPS — Earnings Per Share',
        icon: '💰',
        content:
          'EPS = Net Profit ÷ Total Shares Outstanding.\n\nIt\'s the profit attributable to each share you own. Higher is better. Rising EPS over years is the single strongest fundamental driver of long-term stock prices.\n\nTwo versions you\'ll see:\n• Basic EPS — using shares currently outstanding.\n• Diluted EPS — including shares that COULD exist (employee stock options, convertibles). Diluted is more conservative and usually the one to use.\n\nAlso GAAP vs Non-GAAP:\n• GAAP — official accounting standard. Includes everything: stock-based compensation, one-time charges, etc.\n• Non-GAAP ("adjusted") — strips out items management considers "unusual." Always higher. Be skeptical of giant gaps between the two.\n\nEarnings season:\nCompanies report results 4× per year, usually a few weeks after each calendar quarter ends. Investors compare:\n• Actual EPS vs analyst consensus estimate\n• Actual revenue vs estimate\n• Guidance — management\'s forecast for next quarter\n\nResults break into:\n• Beat & Raise ✅✅ — better than expected AND raising next-quarter guidance. Usually a 5–15% pop.\n• Beat in-line — slight beat, guidance unchanged. Mild positive.\n• Beat & Lower ⚠️ — beat this quarter but lowered guidance. Often DROPS, because investors look forward.\n• Miss ❌ — earnings below estimate. Often a 5–10%+ drop, even more if guidance is also lowered.\n\nReal example: NVIDIA in Feb 2024 reported EPS of $5.16 vs $4.64 expected and guided revenue +50%. Stock jumped 16% the next day, adding ~$280B in market cap.',
      },
      {
        title: '52-Week High / Low',
        icon: '📏',
        content:
          'The highest and lowest prices a stock has traded at during the past 52 weeks of regular sessions.\n\nThese two numbers frame how the stock has been doing relative to its own recent history. They\'re also psychological levels that lots of traders watch — so they tend to act as support (a floor) or resistance (a ceiling).\n\nReading the position in the range:\n• 0–25% of range: deep in the bottom quarter — heavy selling, fear, possible value setup or possible "falling knife."\n• 25–75%: middle range — direction unclear, look at trend.\n• 75–100%: near the top — strong momentum, but also at risk if buyers are exhausted.\n\nKey signals:\n• Breakout — closing above the 52-week high, especially on big volume. Often the start of a stronger up-leg, because there\'s no one above holding losses they want to exit on.\n• Breakdown — closing below the 52-week low. The opposite: anyone who bought in the past year is now underwater. Often leads to more selling.\n\nContext check: a stock making new 52-week highs WHILE the S&P 500 is also at highs is normal. Making new highs while the broader market is falling = real strength. Making new lows while the market is rising = real weakness.\n\nAvoid the trap: "It\'s 50% off its 52-week high, it must be cheap!" → Not necessarily. The fundamentals may have collapsed and the new "fair value" is lower still. Look at WHY it sold off before assuming it\'s a bargain.',
      },
      {
        title: 'Dividends & Yield',
        icon: '🎁',
        content:
          'A dividend is cash a company pays out of its profits directly to shareholders. Most US dividend-payers send a check (or credit your brokerage account) once every 3 months.\n\nFormulas:\n• Annual Dividend per Share = sum of all dividends paid in a year\n• Dividend Yield % = Annual Dividend ÷ Share Price × 100\n\nExample: A $100 stock paying $1 per share each quarter = $4 per year = 4% yield. If you owned 50 shares, you\'d collect $200 in dividends over the year just for holding.\n\nKey dates every dividend has:\n• Declaration date — board announces the dividend.\n• Ex-dividend date — own the stock BEFORE this date to get the payment. If you buy on or after, the seller keeps the dividend.\n• Record date — the company finalizes who is on the books.\n• Payment date — cash actually hits your account, usually a few weeks later.\n\nWhich companies pay dividends:\n• Mature businesses with steady cash flow: utilities, banks, oil majors, consumer staples (Coca-Cola, Procter & Gamble, AT&T, JPMorgan).\n• "Dividend Aristocrats" — S&P 500 companies that have raised their dividend every year for 25+ years.\n\nWho doesn\'t:\n• High-growth tech (NVIDIA historically, Tesla, Amazon for most of its life). They reinvest every dollar into expansion instead.\n\nWatch out for yield traps:\nIf a yield looks too good (say, 12%+), the market is usually pricing in a cut. Why? Yield rises when the stock price falls. Check the payout ratio = Dividends ÷ Earnings. A payout ratio above 100% means the company is paying out more than it earns — usually unsustainable.',
      },
    ],
  },
  {
    id: 'judging_stocks',
    icon: '🎯',
    title: 'How to Judge Stocks',
    color: '#8B5CF6',
    lessons: [
      {
        title: 'Fundamental Analysis',
        icon: '🔬',
        content:
          'Fundamental analysis is the art (and partly science) of figuring out what a business is actually worth, then comparing that to its share price. If the business is worth more than the price says, you buy and wait for the market to catch up.\n\nThe three financial statements every company publishes (all available free on the SEC\'s EDGAR site, or any brokerage research page):\n\n1) Income Statement — covers a period (a quarter or year):\n• Revenue (sales) — total money in\n• Cost of Goods Sold — direct costs of making the product\n• Gross Profit = Revenue − COGS\n• Operating Expenses — salaries, rent, R&D, marketing\n• Operating Income = Gross Profit − OpEx\n• Net Income = Operating Income − taxes & interest\n\n2) Balance Sheet — snapshot on one day:\n• Assets — what the company owns (cash, inventory, buildings)\n• Liabilities — what it owes (debt, payables)\n• Equity = Assets − Liabilities (the "book value" of the company)\n\n3) Cash Flow Statement — actual cash in and out:\n• Operating cash flow — from running the business\n• Investing — buying/selling assets\n• Financing — borrowing, paying dividends, buybacks\n• Free Cash Flow (FCF) = Operating CF − Capital Expenditures. The most honest measure of profitability.\n\nMetrics serious investors track:\n• Revenue growth (YoY) — ideally >10% for growth companies\n• Gross margin — higher = stronger pricing power\n• Operating margin — efficiency at running the business\n• Return on Equity (ROE) — how much profit per dollar of shareholder money. >15% is good.\n• Debt-to-Equity — high debt = fragile in downturns\n• FCF growth — the rocket fuel for buybacks and dividends\n\nThe "moat" question: what stops competitors from copying this business? Patents, network effects (Facebook, Visa), brand (Apple, Coke), switching costs (Microsoft Office, ERP systems), or scale (Amazon, Walmart). Companies with wide moats stay profitable for decades.',
      },
      {
        title: 'Technical Analysis',
        icon: '📉',
        content:
          'Technical analysis uses price charts to spot patterns and trends, on the theory that history rhymes. Doesn\'t care about the business — only about what the chart is doing.\n\nChart basics:\n• Candlestick — each candle shows the open, high, low, close for the period. Green = closed higher than open. Red = closed lower.\n• Timeframes — 1-minute, 5-minute, daily, weekly. Longer timeframes filter out noise.\n\nCore concepts:\n\nTrend\nUptrend = higher highs AND higher lows. Downtrend = lower highs AND lower lows. Sideways = neither. "The trend is your friend" — most beginners lose by fighting it.\n\nSupport & Resistance\nSupport = a price level the stock keeps bouncing off when falling. Resistance = a ceiling it keeps stalling at. Once broken, support often becomes new resistance and vice versa.\n\nMoving Averages (MA)\n• 50-day MA — medium-term trend gauge. Stock above its 50-day = bullish bias.\n• 200-day MA — long-term trend. Above = bull market for that stock. Below = bear.\n• "Golden Cross" = 50-day crosses ABOVE 200-day. Bullish signal.\n• "Death Cross" = 50-day crosses BELOW 200-day. Bearish signal.\n\nMomentum indicators:\n• RSI (Relative Strength Index, 0–100) — >70 = overbought (often pauses or pulls back), <30 = oversold (often bounces).\n• MACD — measures the gap between two moving averages. Crossing zero up = bullish shift; crossing zero down = bearish.\n\nVolume confirmation:\nA breakout above resistance on 3× normal volume is far more reliable than the same breakout on light volume.\n\nClassic patterns:\n• Double bottom (W shape) — bullish reversal\n• Double top (M shape) — bearish reversal\n• Head & shoulders — bearish reversal\n• Cup & handle — bullish continuation\n\nReality check: technical analysis works best as a TIMING tool layered on top of fundamental conviction. Charts alone won\'t tell you what to buy — just when.',
      },
      {
        title: 'Growth vs Value Stocks',
        icon: '🌱',
        content:
          'Two big "schools" of investing. Knowing the difference helps you pick stocks that match the kind of return — and risk — you want.\n\n🌱 Growth investing\nBet on companies expanding revenue and earnings fast. You pay a premium today (high P/E) because you expect tomorrow\'s earnings to justify it. If growth stalls, the price can fall hard.\nCharacteristics:\n• Revenue growth often 20%+ per year\n• Reinvest profits, rarely pay dividends\n• High P/E (20–60+) and high Price-to-Sales ratios\n• Volatile: 30% drops are normal\nExamples (recent): NVIDIA, Tesla, Shopify, Snowflake.\nFamous investor: Cathie Wood, Peter Lynch.\n\n💎 Value investing\nBet on solid businesses trading below their intrinsic value (often because they\'re boring, out of favour, or in a temporarily struggling sector). The return comes from the price catching up to fair value, plus dividends along the way.\nCharacteristics:\n• Lower P/E (5–15), often below the market average\n• Stable revenue, mature industry\n• Often pay meaningful dividends (2–6% yields)\n• Quieter, smaller drawdowns\nExamples: JPMorgan, ExxonMobil, Walmart, Berkshire Hathaway.\nFamous investor: Warren Buffett, Benjamin Graham (his teacher).\n\n⚖️ Blend / GARP (Growth At a Reasonable Price)\nA middle path — companies growing 10–20% per year at a P/E that\'s not crazy. Aims to avoid both value traps and growth meltdowns. Microsoft and Visa often sit in this bucket.\n\nWhich wins long-term?\nValue beat growth for most of the 20th century. Growth crushed value in 2010–2021 (tech era). Since then it\'s been mixed. The answer is "it depends on the decade" — which is why most professional portfolios hold both.\n\nFor beginners: a simple split is 70% in index funds, 15% in 2–3 large-cap growth, 15% in 2–3 stable value/dividend names. You learn both styles without betting everything on one.',
      },
      {
        title: 'Reading Earnings Reports',
        icon: '📋',
        content:
          'Earnings season — the few weeks each quarter when most companies report — is when the biggest single-day moves happen. A stock can swing 20%+ in one session.\n\nThe report comes in two parts:\n1) The press release (8-K filing) — headline numbers. Drops ~5 minutes before the call.\n2) The conference call — management presentation + Q&A with analysts. Tone, hesitation, and what they avoid saying often matter as much as the numbers.\n\nWhat to read first (in this order):\n\n1) Revenue\nActual vs consensus estimate. Year-over-year growth %. Is growth accelerating, flat, or decelerating? Decelerating growth on a high-P/E stock is the most common reason for a post-earnings crash.\n\n2) EPS\nActual vs consensus. Match against the revenue beat — sometimes EPS beats by cost-cutting while revenue misses, which the market often punishes.\n\n3) Guidance\nThis usually drives the post-earnings move more than the actual numbers. "We expect next quarter revenue of $X" — if X is below what analysts had modelled, the stock often drops even on a beat.\n\n4) Margins\n• Gross margin — pricing power and cost control\n• Operating margin — operational efficiency\nMargin expansion = great. Compression = warning.\n\n5) Cash flow\nOperating cash flow and free cash flow. A company can manipulate accounting earnings; cash is harder to fake.\n\n6) Segment breakdown\nFor mixed businesses (Amazon = AWS + retail + ads), each segment\'s growth matters. AWS growth deceleration has tanked AMZN even when overall results "looked" fine.\n\n7) The conference call\nListen for: customer concentration ("our top 5 customers are X% of revenue"), one-time items (revenue pulled forward), capex plans (heavy spend = lower FCF), CFO turnover hints.\n\nQuick scorecard:\n• Beat revenue + beat EPS + raise guidance = bullish 🟢🟢🟢\n• Beat both + maintain guidance = mild positive 🟢\n• Beat EPS + miss revenue = mixed; usually slightly down 🟡\n• Miss EPS + lower guidance = avoid, often drops 10%+ 🔴',
      },
      {
        title: 'Red Flags to Watch',
        icon: '🚩',
        content:
          'No stock check is complete without scanning for warning signs. Any single flag isn\'t fatal — but two or more clustering together is reason to dig deeper or step away.\n\nFinancial red flags:\n• Revenue declining 2+ quarters in a row (and not because of a one-time event)\n• Margins shrinking while revenue grows — they\'re buying growth at a loss\n• Operating cash flow growing slower than reported earnings, or going negative\n• Free cash flow consistently negative — burning cash, will need to dilute or borrow\n• Debt rising faster than revenue\n• Inventory growing much faster than sales — product isn\'t moving\n• Accounts receivable growing faster than sales — customers aren\'t paying\n• Goodwill / intangibles as a huge % of assets — usually means overpaid acquisitions waiting to be written down\n\nGovernance red flags:\n• Sudden CFO resignation (especially right before earnings)\n• Auditor change\n• Restated financials\n• Heavy insider selling — especially the CEO unloading large stakes\n• Excessive stock-based compensation diluting shareholders (SBC > 10% of revenue is a big yellow flag for software stocks)\n• Repeated changes to accounting metrics, or new "non-GAAP" metrics that obscure losses\n\nMarket signals:\n• Short interest above 20% of float — many sophisticated investors are betting against it\n• Borrow rate (cost to short) very high — extreme bearish positioning\n• Multiple analyst downgrades in a row\n• Consistently missing earnings estimates (3+ quarters)\n\nBusiness signals:\n• Loss of a major customer (especially if they were >10% of revenue)\n• Pending regulatory or legal action (FTC, FDA, antitrust)\n• Patent expiry / loss of competitive moat\n• Industry-wide structural decline (newspapers, cable TV)\n\nThe biggest mistake beginners make: ignoring red flags because they\'ve already fallen in love with the stock, or because they\'re sitting on a loss and "hoping" for a bounce. Hope is not a strategy. If your reason for buying no longer holds, sell.',
      },
    ],
  },
  {
    id: 'risk',
    icon: '🛡️',
    title: 'Risk & Strategy',
    color: Colors.market.gain,
    lessons: [
      {
        title: 'Diversification',
        icon: '🧩',
        content:
          '"Don\'t put all your eggs in one basket." Diversification means spreading your money across many investments so a disaster in any one of them only dents the portfolio — it doesn\'t blow it up.\n\nWhy it works mathematically:\nIf you own 10 stocks each weighted 10%, and one goes to zero, you lose 10% of the portfolio — recoverable. If you owned 1 stock and it went to zero, you lose 100%. Same probability of failure, very different outcomes.\n\nThe key concept: CORRELATION. Two stocks that go up and down together (correlation near +1) don\'t diversify each other. Two that move independently (correlation near 0) reduce overall risk dramatically. Owning Apple, Microsoft, Google, and NVIDIA isn\'t real diversification — they all move with mega-cap tech.\n\nDimensions to diversify across:\n• Companies — 15–30 individual stocks is usually enough; beyond that, returns of additional stocks roughly track the index anyway.\n• Sectors — Tech, Healthcare, Financials, Energy, Industrials, Consumer Staples, Consumer Discretionary, Utilities, Materials, Real Estate, Telecom. A "balanced" portfolio touches multiple.\n• Geography — US, Europe, emerging markets. The US market makes up ~60% of global stocks, so most US investors are already US-overweighted.\n• Market cap — mix of large-cap (stable) and mid/small-cap (growth potential).\n• Asset class — stocks, bonds, cash, real estate (REITs), commodities. Bonds often rise when stocks fall, smoothing the ride.\n• Time — adding money over years (DCA) instead of all at once.\n\nThe shortcut: ETFs.\nA single S&P 500 ETF (VOO, SPY) gives you 500 companies instantly. Total-market ETFs (VTI) give you 4,000+. International ETFs (VXUS) cover the rest of the world. For most beginners, a 70/20/10 mix of US-total / International / Bonds is more diversified than 95% of stock pickers manage.\n\nDanger: over-diversification. Holding 100+ individual stocks means you can\'t track any of them well. At that point just buy the index — it\'s cheaper and easier.',
      },
      {
        title: 'Position Sizing',
        icon: '⚖️',
        content:
          'Position size = how much of your TOTAL portfolio sits in one trade. Maybe the single most under-appreciated skill in investing. Pros say: "you don\'t make money by being right — you make money by being right and big, and wrong and small."\n\nThe core problem:\nIf you put 50% of your $10,000 portfolio in one stock and it drops 50%, you\'ve lost 25% of your entire net worth. To get back to break-even, you now need a 33% gain on what\'s left. Big concentrated bets compound losses asymmetrically.\n\nRules of thumb:\n• High-conviction core holdings (great business, you\'ve done deep research): 5–10% each.\n• Medium-conviction positions: 2–5%.\n• Speculative or new ideas you\'re testing: 1–2%.\n• Never let any single position exceed 15–20% of your portfolio — even if it\'s gone up. Trim back if it grows past that.\n\nThe 1% rule (for active traders):\nNever risk more than 1% of your portfolio on a single trade. "Risk" = the gap between your entry and your stop-loss. On a $10,000 account, max risk per trade is $100. If your stop is 10% below entry, your position size = $1,000 (because 10% of $1,000 is $100).\n\nScaling in:\nInstead of buying your full target size on day one, build the position in 3 tranches: e.g. 1/3 now, 1/3 if it dips 8%, 1/3 if the thesis is confirmed by good earnings. Reduces "I got the timing wrong" pain.\n\nScaling out:\nLikewise on the way up. Sell some at +25%, more at +50%, let the rest run. You lock in profits while still riding winners — emotionally much easier than "all or nothing."\n\nAdvanced — the Kelly Criterion:\nKelly% = win% − (loss% ÷ win/loss ratio). It tells you the mathematically optimal bet size to grow capital fastest. For most amateurs, betting "half-Kelly" is wise because Kelly assumes you know your real win rate, which most people overestimate.\n\nBig takeaway: position sizing matters MORE than stock selection. A good investor sizing positions badly underperforms an average investor sizing them well.',
      },
      {
        title: 'Dollar-Cost Averaging',
        icon: '📅',
        content:
          'Dollar-cost averaging (DCA) = investing a fixed amount on a fixed schedule, regardless of what the market is doing.\n\nExample: every month, you put $200 into VOO (an S&P 500 ETF). Some months VOO is at $400 → you buy 0.50 shares. Some months it\'s at $500 → you buy 0.40 shares. Some months $350 → you buy 0.57 shares. You automatically buy MORE when prices are lower and LESS when they\'re higher.\n\nWhy it works:\n• Removes the emotional question "is now a good time to buy?" The answer is "yes, it\'s the 1st of the month."\n• Smooths your average cost basis over time. You\'ll never be the person who bought everything at the top.\n• Beats most market-timing attempts. Multiple studies show 70%+ of attempts to time the market underperform a steady DCA approach.\n• Lets you keep investing through scary headlines and crashes — those are exactly the months you\'re buying cheapest.\n\nMath example:\nYou DCA $1,200 over 12 months at $100/mo into a stock that opens at $50, drops to $25, then recovers to $50.\n• Buying it all at once at $50: 24 shares\n• DCA monthly: ~32 shares (because some months you bought at $25 or $30)\n• Same end price, ~33% more shares = ~33% better result\n\nWhen DCA is WORSE than lump sum:\nIn a steadily rising market, lump-sum investing beats DCA roughly 2/3 of the time, because more of your money is "in" earlier. So if you have $10,000 to invest right now and the market drifts up over the next year, you\'d have done better dumping it in on day one.\n\nThe honest takeaway: DCA isn\'t about getting the best mathematical outcome — it\'s about getting an outcome that the average human will actually stick with. The best investment plan is the one you don\'t abandon during a 30% drawdown.\n\nAutomatic setup: most brokers let you schedule recurring purchases for free. Set it once and forget it.',
      },
      {
        title: 'Common Beginner Mistakes',
        icon: '⚠️',
        content:
          'Nearly every new investor makes the same handful of mistakes. Reading this list won\'t fully save you — but it might shorten the learning curve.\n\n1) FOMO buying\nYou see a stock has jumped 60% in three weeks. Headlines call it "the next big thing." You buy at the top. It then drops 30% and you panic-sell. The fix: never buy a stock the same day you first hear of it. Make yourself wait at least 48 hours.\n\n2) Panic selling\nA normal 10% correction feels like the world is ending if it\'s your first one. You sell, lock in the loss, and the market recovers two weeks later without you. The fix: write down WHY you bought each position. If the reasons still hold, the price drop is noise, not a sell signal.\n\n3) Overtrading\nClicking buy/sell 10× a week. Each round trip costs you spread + fees + taxes (in real accounts) and adds emotional noise. Studies show retail traders who trade most underperform those who trade least by ~6% per year. The fix: track a "trades per month" count and try to lower it.\n\n4) Anchoring on your purchase price\n"I bought at $100, I won\'t sell until it\'s back to $100." The market doesn\'t know or care what you paid. Every day, ask: "If I had cash right now, would I buy this stock at today\'s price?" If no, sell. Your cost basis is irrelevant.\n\n5) Confirmation bias\nOnly reading bullish takes about stocks you own. Following the bull cheerleaders on social media. The fix: deliberately read the BEAR case for every stock you own. If you can\'t articulate why someone smart would short it, you don\'t understand it.\n\n6) Position sizing too big\nPutting 40% of your savings in one stock because "this one is different." See the Position Sizing lesson. Even great companies (Cisco in 2000, Facebook in 2022) can drop 50–70%.\n\n7) Ignoring fees & taxes\nFrequent trading in a taxable account hands the government 20–37% of your gains. Long-term capital gains (>1 year) are taxed lower. Patience saves real money.\n\n8) Margin / leverage\nBorrowing to amplify gains. Also amplifies losses, and a margin call can force-sell you at the worst possible moment. Beginners should not touch margin.\n\n9) Options without education\nOptions can lose 100% of your premium in days. Don\'t trade them seriously until you can confidently explain a covered call, a cash-secured put, and a long call vs long stock side-by-side.\n\n10) Investing money you actually need\nRent, tuition, emergency fund — none of that should be in stocks. The market can stay down for 2+ years. If you need the cash inside that window, you\'ll be forced to sell at the worst moment.\n\nBig idea: investing rewards patience and emotional control more than IQ. The single best skill is doing less.',
      },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function TutorialScreen() {
  const [expandedSection, setExpandedSection] = useState<string | null>('what_is');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const { isSidebarOpen, setSidebarOpen, appColorMode } = useAppStore();
  const isLight = appColorMode === 'light';
  const t = useT();
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState('');

  // Map lesson titles to translation keys
  const lessonTitleKey: Record<string, string> = {
    'Stocks Explained': 'lesson_stocks_explained',
    'How Stock Trading Works': 'lesson_how_trading_works',
    'Stock Exchanges': 'lesson_stock_exchanges',
    'Stock Price & Change': 'lesson_stock_price_change',
    'Market Indices': 'lesson_market_indices',
    'Bull vs Bear Markets': 'lesson_bull_vs_bear',
    'Volume & Liquidity': 'lesson_volume_liquidity',
    'Market Cap': 'lesson_market_cap',
    'P/E Ratio': 'lesson_pe_ratio',
    'EPS — Earnings Per Share': 'lesson_eps',
    '52-Week High / Low': 'lesson_52w',
    'Dividends & Yield': 'lesson_dividends',
    'Fundamental Analysis': 'lesson_fundamental',
    'Technical Analysis': 'lesson_technical',
    'Growth vs Value Stocks': 'lesson_growth_value',
    'Reading Earnings Reports': 'lesson_earnings',
    'Red Flags to Watch': 'lesson_red_flags',
    'Diversification': 'lesson_diversification',
    'Position Sizing': 'lesson_position_sizing',
    'Dollar-Cost Averaging': 'lesson_dca',
    'Common Beginner Mistakes': 'lesson_mistakes',
  };
  const lessonContentKey: Record<string, string> = {
    'Stocks Explained': 'content_stocks_explained',
    'How Stock Trading Works': 'content_how_trading',
    'Stock Exchanges': 'content_exchanges',
    'Stock Price & Change': 'content_price_change',
    'Market Indices': 'content_indices',
    'Bull vs Bear Markets': 'content_bull_bear',
    'Volume & Liquidity': 'content_volume',
    'Market Cap': 'content_market_cap',
    'P/E Ratio': 'content_pe_ratio',
    'EPS — Earnings Per Share': 'content_eps',
    '52-Week High / Low': 'content_52w',
    'Dividends & Yield': 'content_dividends',
    'Fundamental Analysis': 'content_fundamental',
    'Technical Analysis': 'content_technical',
    'Growth vs Value Stocks': 'content_growth_value',
    'Reading Earnings Reports': 'content_earnings',
    'Red Flags to Watch': 'content_red_flags',
    'Diversification': 'content_diversification',
    'Position Sizing': 'content_position_sizing',
    'Dollar-Cost Averaging': 'content_dca',
    'Common Beginner Mistakes': 'content_mistakes',
  };
  const tLesson = (title: string) => lessonTitleKey[title] ? t(lessonTitleKey[title]) : title;
  // For lesson bodies we prefer the inline (deeper) English content over the
  // older, shorter `content_*` translations. Non-English languages still fall
  // back to their translated strings until those are refreshed.
  const currentLang = useAppStore((s) => s.appLanguage) ?? 'en';
  const tContent = (title: string, fallback: string) => {
    if (currentLang === 'en') return fallback;
    return lessonContentKey[title] ? t(lessonContentKey[title]) : fallback;
  };

  const toggleSection = (id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
    setExpandedLesson(null);
  };

  const toggleLesson = (key: string) => {
    setExpandedLesson(prev => (prev === key ? null : key));
  };

  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      g => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q)
    );
  }, [glossarySearch]);

  return (
    <View style={{ flex: 1 }}>
    <SafeAreaView style={[styles.safe, { backgroundColor: isLight ? LightColors.bg.primary : Colors.bg.primary }]}>
      <AppHeader title={t('learn')} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header — gradient adapts to theme so the band blends rather
            than appearing as a hardcoded dark stripe on light mode. */}
        <LinearGradient
          colors={isLight
            ? [LightColors.bg.secondary, LightColors.bg.primary]
            : ['#0A1628', Colors.bg.primary]}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>🎓</Text>
          <Text style={[styles.headerTitle, { color: isLight ? LightColors.text.primary : Colors.text.primary }]}>
            {t('stock_trading_101')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: isLight ? LightColors.text.secondary : Colors.text.secondary }]}>
            {t('tutorial_subtitle')}
          </Text>

          {/* Progress pills */}
          <View style={styles.pillRow}>
            <Pill label={`${SECTIONS.length} ${t('topics')}`} color={Colors.brand.primary} />
            <Pill label={`${SECTIONS.reduce((n, s) => n + s.lessons.length, 0)} ${t('lessons')}`} color={Colors.brand.accent} />
            <Pill label={`${GLOSSARY.length} ${t('terms')}`} color={Colors.brand.gold} />
          </View>
        </LinearGradient>

        {/* Sections */}
        <View style={styles.content}>
          {SECTIONS.map((section) => {
            const isOpen = expandedSection === section.id;
            return (
              <View key={section.id} style={styles.sectionCard}>
                {/* Section Header */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(section.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.sectionIconBg, { backgroundColor: section.color + '22' }]}>
                    <Text style={styles.sectionIcon}>{section.icon}</Text>
                  </View>
                  <View style={styles.sectionTitleCol}>
                    <Text style={styles.sectionTitle}>{
                      section.id === 'what_is' ? t('what_is_trading')
                      : section.id === 'reading_market' ? t('reading_market')
                      : section.id === 'key_terms' ? t('key_terms_metrics')
                      : section.id === 'judging_stocks' ? t('how_to_judge')
                      : section.id === 'risk' ? t('risk_strategy')
                      : section.title /* untranslated sections (e.g. pro_advice) use raw title */
                    }</Text>
                    <Text style={styles.sectionMeta}>{section.lessons.length} {t('lessons')}</Text>
                  </View>
                  <View style={[styles.chevron, isOpen && styles.chevronOpen]}>
                    <Text style={[styles.chevronText, { color: section.color }]}>
                      {isOpen ? '▲' : '▼'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Color bar */}
                <View style={[styles.sectionBar, { backgroundColor: section.color }]} />

                {/* Lessons */}
                {isOpen && (
                  <View style={styles.lessonsContainer}>
                    {section.lessons.map((lesson, idx) => {
                      const lessonKey = `${section.id}_${idx}`;
                      const lessonOpen = expandedLesson === lessonKey;
                      return (
                        <View key={lessonKey} style={styles.lessonWrapper}>
                          <TouchableOpacity
                            style={[styles.lessonRow, lessonOpen && styles.lessonRowActive]}
                            onPress={() => toggleLesson(lessonKey)}
                            activeOpacity={0.75}
                          >
                            <View style={styles.lessonIconWrap}>
                              <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                            </View>
                            <Text style={[styles.lessonTitle, lessonOpen && { color: section.color }]}>
                              {tLesson(lesson.title)}
                            </Text>
                            <Text style={[styles.lessonChevron, { color: section.color }]}>
                              {lessonOpen ? '−' : '+'}
                            </Text>
                          </TouchableOpacity>

                          {lessonOpen && (
                            <View style={styles.lessonContent}>
                              <View style={[styles.lessonContentBar, { backgroundColor: section.color }]} />
                              <Text style={styles.lessonText}>{tContent(lesson.title, lesson.content)}</Text>
                            </View>
                          )}

                          {idx < section.lessons.length - 1 && (
                            <View style={styles.lessonDivider} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Glossary */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setGlossaryOpen(o => !o)}
              activeOpacity={0.75}
            >
              <View style={[styles.sectionIconBg, { backgroundColor: '#A855F722' }]}>
                <Text style={styles.sectionIcon}>📚</Text>
              </View>
              <View style={styles.sectionTitleCol}>
                <Text style={styles.sectionTitle}>Glossary</Text>
                <Text style={styles.sectionMeta}>{GLOSSARY.length} terms, A–Z</Text>
              </View>
              <View style={styles.chevron}>
                <Text style={[styles.chevronText, { color: '#A855F7' }]}>
                  {glossaryOpen ? '▲' : '▼'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.sectionBar, { backgroundColor: '#A855F7' }]} />

            {glossaryOpen && (
              <View style={styles.glossaryContainer}>
                <TextInput
                  style={styles.glossarySearch}
                  placeholder="Search terms…"
                  placeholderTextColor={Colors.text.tertiary}
                  value={glossarySearch}
                  onChangeText={setGlossarySearch}
                  clearButtonMode="while-editing"
                />
                {filteredGlossary.length === 0 ? (
                  <Text style={styles.glossaryEmpty}>No terms match "{glossarySearch}"</Text>
                ) : (
                  filteredGlossary.map((item, idx) => (
                    <View key={item.term}>
                      <View style={styles.glossaryRow}>
                        <Text style={styles.glossaryTerm}>{item.term}</Text>
                        <Text style={styles.glossaryDef}>{item.definition}</Text>
                      </View>
                      {idx < filteredGlossary.length - 1 && (
                        <View style={styles.lessonDivider} />
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Quick Reference Card */}
          <View style={styles.quickRef}>
            <LinearGradient
              colors={[Colors.bg.tertiary, '#1E2940']}
              style={styles.quickRefGradient}
            >
              <Text style={styles.quickRefTitle}>⚡ Quick Reference</Text>
              <View style={styles.quickRefGrid}>
                {QUICK_REF.map((item) => (
                  <View key={item.term} style={styles.quickRefItem}>
                    <Text style={styles.quickRefTerm}>{item.term}</Text>
                    <Text style={styles.quickRefDef}>{item.def}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Rookie Markets uses virtual money so you can practice risk-free. Apply what you learn here in your trades!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const GLOSSARY: { term: string; definition: string }[] = [
  { term: 'Ask Price',         definition: 'The lowest price a seller will accept for a stock at a given moment.' },
  { term: 'ATH',               definition: 'All-Time High — the highest price a stock or index has ever reached.' },
  { term: 'Bear Market',       definition: 'A market that has fallen 20%+ from its recent high, with widespread pessimism.' },
  { term: 'Beta',              definition: 'A measure of a stock\'s volatility relative to the overall market. Beta > 1 means more volatile.' },
  { term: 'Bid Price',         definition: 'The highest price a buyer is willing to pay for a stock at a given moment.' },
  { term: 'Blue Chip',         definition: 'Large, well-established companies with a long history of stable performance (e.g. Apple, JPMorgan).' },
  { term: 'Bond',              definition: 'A fixed-income debt security. Investors lend money to a company or government and receive interest.' },
  { term: 'Broker',            definition: 'A person or platform that executes buy and sell orders on behalf of investors.' },
  { term: 'Bull Market',       definition: 'A market that has risen 20%+ from a recent low, with sustained investor confidence.' },
  { term: 'Capital Gains',     definition: 'The profit made from selling an asset for more than you originally paid.' },
  { term: 'Circuit Breaker',   definition: 'A temporary halt in trading triggered when prices fall too fast, to prevent panic selling.' },
  { term: 'Correction',        definition: 'A 10–20% decline in a stock or market index from its recent peak. Normal and healthy.' },
  { term: 'Day Trading',       definition: 'Buying and selling securities within the same trading day to profit from short-term moves.' },
  { term: 'DCA',               definition: 'Dollar-Cost Averaging — investing a fixed amount at regular intervals regardless of price.' },
  { term: 'Diversification',   definition: 'Spreading investments across different assets, sectors, and regions to reduce risk.' },
  { term: 'Dividend',          definition: 'A portion of company profits paid out to shareholders, usually quarterly.' },
  { term: 'EPS',               definition: 'Earnings Per Share — a company\'s net profit divided by its total outstanding shares.' },
  { term: 'Equity',            definition: 'Ownership in a company in the form of shares. Also called stocks or shares.' },
  { term: 'ETF',               definition: 'Exchange-Traded Fund — a basket of securities (stocks, bonds, etc.) that trades like a single stock on an exchange.' },
  { term: 'Float',             definition: 'The number of shares of a company available for public trading (excludes insider-held shares).' },
  { term: 'Fundamental Analysis', definition: 'Evaluating a company\'s financials, management, and business model to determine its intrinsic value.' },
  { term: 'Going Long',        definition: 'Buying a security with the expectation that its price will rise over time.' },
  { term: 'Guidance',          definition: 'Management\'s forward-looking forecast for future earnings or revenue. Heavily watched by investors.' },
  { term: 'Hedge',             definition: 'An investment strategy used to offset potential losses in another position.' },
  { term: 'Index',             definition: 'A benchmark tracking a group of stocks to represent a market segment (e.g. S&P 500, NASDAQ).' },
  { term: 'Index Fund',        definition: 'A fund that passively tracks a market index by holding the same stocks in the same proportions.' },
  { term: 'IPO',               definition: 'Initial Public Offering — the first time a private company sells shares to the public on a stock exchange.' },
  { term: 'Limit Order',       definition: 'An order to buy or sell a stock only at a specified price or better.' },
  { term: 'Liquidity',         definition: 'How easily an asset can be bought or sold at a fair price without significantly affecting its price.' },
  { term: 'Margin',            definition: 'Borrowing money from a broker to buy securities. Amplifies both gains and losses.' },
  { term: 'Market Cap',        definition: 'Market Capitalisation — total market value of a company (share price × total shares outstanding).' },
  { term: 'Market Order',      definition: 'An order to buy or sell a stock immediately at the best available current price.' },
  { term: 'Moving Average',    definition: 'The average closing price of a stock over a set period (e.g. 50-day, 200-day) to smooth out noise.' },
  { term: 'Options',           definition: 'Contracts giving the right (but not obligation) to buy or sell a stock at a set price before a deadline.' },
  { term: 'P/E Ratio',         definition: 'Price-to-Earnings Ratio — share price divided by earnings per share. Measures how much investors pay per $1 of profit.' },
  { term: 'Portfolio',         definition: 'The collection of all investments (stocks, ETFs, cash, etc.) owned by an investor.' },
  { term: 'Position',          definition: 'The amount of a particular security currently held by an investor (long or short).' },
  { term: 'Resistance',        definition: 'A price level where selling pressure has historically prevented a stock from rising further.' },
  { term: 'ROI',               definition: 'Return on Investment — the profit or loss from an investment expressed as a percentage of its cost.' },
  { term: 'S&P 500',           definition: 'An index tracking the 500 largest publicly traded US companies. The most widely followed market benchmark.' },
  { term: 'Sector',            definition: 'A group of companies that operate in the same area of the economy (e.g. Technology, Healthcare, Energy).' },
  { term: 'Short Selling',     definition: 'Borrowing shares and selling them, betting the price will fall so you can buy them back cheaper.' },
  { term: 'Spread',            definition: 'The difference between the bid price and the ask price of a stock.' },
  { term: 'Stock',             definition: 'A share of ownership in a company. Buying stock makes you a partial owner (shareholder).' },
  { term: 'Stop-Loss Order',   definition: 'An order that automatically sells a stock if it falls to a specified price, limiting your losses.' },
  { term: 'Support',           definition: 'A price level where buying interest has historically prevented a stock from falling further.' },
  { term: 'Swing Trading',     definition: 'Holding positions for days to weeks to capture short- to medium-term price swings.' },
  { term: 'Technical Analysis',definition: 'Using price charts, patterns, and indicators to predict future price movements.' },
  { term: 'Ticker Symbol',     definition: 'A unique abbreviation used to identify a publicly traded company (e.g. AAPL = Apple, TSLA = Tesla).' },
  { term: 'Volatility',        definition: 'The degree to which a security\'s price fluctuates over time. High volatility = bigger swings.' },
  { term: 'Volume',            definition: 'The total number of shares of a stock traded during a given time period.' },
  { term: 'Watchlist',         definition: 'A list of securities an investor monitors for potential buying or selling opportunities.' },
  { term: 'Yield',             definition: 'The income generated by an investment (e.g. dividends) expressed as a percentage of its current price.' },
];

const QUICK_REF = [
  { term: 'Bull 🐂', def: 'Market going up' },
  { term: 'Bear 🐻', def: 'Market going down' },
  { term: 'P/E', def: 'Price ÷ Earnings' },
  { term: 'EPS', def: 'Profit per share' },
  { term: 'Mkt Cap', def: 'Price × Shares' },
  { term: 'Volume', def: 'Shares traded/day' },
  { term: 'DCA', def: 'Regular fixed investing' },
  { term: 'Yield', def: 'Dividend ÷ Price' },
  { term: 'ATH', def: 'All-time high price' },
  { term: 'Short', def: 'Betting price falls' },
  { term: 'ETF', def: 'Basket of stocks' },
  { term: 'IPO', def: 'Company goes public' },
];

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  scroll: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Content
  content: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 40,
    gap: 12,
  },

  // Section card
  sectionCard: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadow.sm,
  },
  sectionBar: {
    height: 2,
    marginHorizontal: 16,
    borderRadius: 1,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionTitleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  sectionMeta: {
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  chevron: {},
  chevronOpen: {},
  chevronText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },

  // Lessons
  lessonsContainer: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  lessonWrapper: {},
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  lessonRowActive: {
    backgroundColor: Colors.bg.tertiary,
  },
  lessonIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonIcon: {
    fontSize: 16,
  },
  lessonTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  lessonChevron: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
  },
  lessonContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 12,
  },
  lessonContentBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 40,
  },
  lessonText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  lessonDivider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginHorizontal: 16,
  },

  // Glossary
  glossaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  glossarySearch: {
    backgroundColor: Colors.bg.input,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  glossaryEmpty: {
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  glossaryRow: {
    paddingVertical: 10,
    gap: 3,
  },
  glossaryTerm: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#A855F7',
  },
  glossaryDef: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 19,
  },

  // Quick Reference
  quickRef: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginTop: 4,
  },
  quickRefGradient: {
    padding: 16,
  },
  quickRefTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  quickRefGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickRefItem: {
    width: '47%',
    backgroundColor: Colors.bg.input,
    borderRadius: Radius.md,
    padding: 10,
    gap: 3,
  },
  quickRefTerm: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.brand.primary,
  },
  quickRefDef: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },

  // Footer
  footer: {
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});

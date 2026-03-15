// Popular stocks seed list for suggestions and search
export const POPULAR_STOCKS = [
  // US Tech
  { symbol: 'AAPL',  name: 'Apple Inc.',           exchange: 'NASDAQ', country: 'US', sector: 'Technology' },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',       exchange: 'NASDAQ', country: 'US', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',         exchange: 'NASDAQ', country: 'US', sector: 'Technology' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',       exchange: 'NASDAQ', country: 'US', sector: 'Consumer' },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',          exchange: 'NASDAQ', country: 'US', sector: 'Technology' },
  { symbol: 'META',  name: 'Meta Platforms Inc.',   exchange: 'NASDAQ', country: 'US', sector: 'Technology' },
  { symbol: 'TSLA',  name: 'Tesla Inc.',            exchange: 'NASDAQ', country: 'US', sector: 'Automotive' },
  { symbol: 'NFLX',  name: 'Netflix Inc.',          exchange: 'NASDAQ', country: 'US', sector: 'Entertainment' },
  { symbol: 'SPOT',  name: 'Spotify Technology',    exchange: 'NYSE',   country: 'SE', sector: 'Entertainment' },
  { symbol: 'AMD',   name: 'Advanced Micro Devices',exchange: 'NASDAQ', country: 'US', sector: 'Technology' },
  // US Finance
  { symbol: 'JPM',   name: 'JPMorgan Chase',        exchange: 'NYSE',   country: 'US', sector: 'Finance' },
  { symbol: 'GS',    name: 'Goldman Sachs',         exchange: 'NYSE',   country: 'US', sector: 'Finance' },
  { symbol: 'BAC',   name: 'Bank of America',       exchange: 'NYSE',   country: 'US', sector: 'Finance' },
  { symbol: 'V',     name: 'Visa Inc.',             exchange: 'NYSE',   country: 'US', sector: 'Finance' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway',    exchange: 'NYSE',   country: 'US', sector: 'Finance' },
  // US Consumer
  { symbol: 'KO',    name: 'Coca-Cola Co.',         exchange: 'NYSE',   country: 'US', sector: 'Consumer' },
  { symbol: 'MCD',   name: "McDonald's Corp.",      exchange: 'NYSE',   country: 'US', sector: 'Consumer' },
  { symbol: 'NKE',   name: 'Nike Inc.',             exchange: 'NYSE',   country: 'US', sector: 'Consumer' },
  { symbol: 'DIS',   name: 'Walt Disney Co.',       exchange: 'NYSE',   country: 'US', sector: 'Entertainment' },
  { symbol: 'WMT',   name: 'Walmart Inc.',          exchange: 'NYSE',   country: 'US', sector: 'Retail' },
  // International
  { symbol: 'TSM',   name: 'Taiwan Semiconductor',  exchange: 'NYSE',   country: 'TW', sector: 'Technology' },
  { symbol: 'BABA',  name: 'Alibaba Group',         exchange: 'NYSE',   country: 'CN', sector: 'Technology' },
  { symbol: 'ASML',  name: 'ASML Holding',          exchange: 'NASDAQ', country: 'NL', sector: 'Technology' },
  { symbol: 'SAP',   name: 'SAP SE',                exchange: 'NYSE',   country: 'DE', sector: 'Technology' },
  { symbol: 'TM',    name: 'Toyota Motor Corp.',    exchange: 'NYSE',   country: 'JP', sector: 'Automotive' },
  { symbol: 'SONY',  name: 'Sony Group Corp.',      exchange: 'NYSE',   country: 'JP', sector: 'Technology' },
  { symbol: 'LVMUY', name: 'LVMH Moet Hennessy',    exchange: 'OTC',    country: 'FR', sector: 'Luxury' },
  { symbol: 'NVO',   name: 'Novo Nordisk A/S',      exchange: 'NYSE',   country: 'DK', sector: 'Healthcare' },
  { symbol: 'SHEL',  name: 'Shell PLC',             exchange: 'NYSE',   country: 'GB', sector: 'Energy' },
  { symbol: 'RIO',   name: 'Rio Tinto PLC',         exchange: 'NYSE',   country: 'AU', sector: 'Materials' },
  // ETFs
  { symbol: 'SPY',   name: 'SPDR S&P 500 ETF',      exchange: 'NYSE',   country: 'US', sector: 'ETF' },
  { symbol: 'QQQ',   name: 'Invesco QQQ Trust',     exchange: 'NASDAQ', country: 'US', sector: 'ETF' },
  { symbol: 'VTI',   name: 'Vanguard Total Stock',  exchange: 'NYSE',   country: 'US', sector: 'ETF' },
];

export const MARKET_INDICES = [
  { symbol: 'SPX',   name: 'S&P 500',    country: 'US' },
  { symbol: 'IXIC',  name: 'NASDAQ',     country: 'US' },
  { symbol: 'DJI',   name: 'Dow Jones',  country: 'US' },
  { symbol: 'FTSE',  name: 'FTSE 100',   country: 'GB' },
  { symbol: 'DAX',   name: 'DAX',        country: 'DE' },
  { symbol: 'N225',  name: 'Nikkei 225', country: 'JP' },
  { symbol: 'HSI',   name: 'Hang Seng',  country: 'HK' },
  { symbol: 'ASX200',name: 'ASX 200',    country: 'AU' },
];

export const SECTORS = [
  'Technology', 'Finance', 'Healthcare', 'Consumer', 'Energy',
  'Materials', 'Industrials', 'Utilities', 'Real Estate',
  'Entertainment', 'Automotive', 'Retail', 'Luxury', 'ETF',
];

export const STARTING_BALANCE_OPTIONS = [
  { label: '$1,000',   value: 1000,   icon: '💵' },
  { label: '$5,000',   value: 5000,   icon: '💴' },
  { label: '$10,000',  value: 10000,  icon: '💶' },
  { label: '$25,000',  value: 25000,  icon: '💷' },
  { label: '$50,000',  value: 50000,  icon: '💰' },
  { label: '$100,000', value: 100000, icon: '🏦' },
];

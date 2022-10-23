import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button, ChakraProvider, Flex, Input } from '@chakra-ui/react';

import type { Percentage, TickerProps } from './Ticker';
import Ticker from './Ticker';

const API_URL = 'https://api1.binance.com/api/v3/ticker/price';

interface BinanceTicker {
  symbol: string;
  price: string;
}

type TickerType = Omit<TickerProps, 'loading'>;

function App() {
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [tickers, setTickers] = useState<{
    [key: string]: TickerType;
  } | null>(null);
  // set initial value of coinsTicker array with a
  const [coinsTickers, setCoinsTickers] = useState<
    { symbol: string; label: string }[]
    >([
    {
      symbol: 'BTCBUSD',
      label: 'BTC/BUSD',
    },
  ]);
  const [tickerLabel, setTickerLabel] = useState<string>('');
  const [tickerSymbol, setTickerSymbol] = useState<string>('');

  const coinsTickersMem = useMemo(
    () =>
      coinsTickers.reduce<{ [key: string]: string }>(
        (acc, coinTicker) => ({
          ...acc,
          [coinTicker.symbol]: coinTicker.label,
        }),
        {},
      ),
    [coinsTickers],
  );

  const handleInputChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const { value } = evt.target;
    const { name } = evt.target;
    if (name === 'label') {
      setTickerLabel(value);
    } else {
      setTickerSymbol(value);
    }
  };

  const handleAddTickerClick = () => {
    if (tickerSymbol && tickerLabel) {
      setCoinsTickers([
        ...coinsTickers,
        { label: tickerLabel, symbol: tickerSymbol },
      ]);
      setTickerLabel('');
      setTickerSymbol('');
    }
  };

  const togglePolling = () => setPolling(!polling);

  const fetchData = async () => {
    const url = `${API_URL}?symbols=[${coinsTickers.reduce(
      (acc, coinTicker) => {
        if (!acc) {
          return `"${coinTicker.symbol}"`;
        }

        return `${acc},"${coinTicker.symbol}"`;
      },
      '',
    )}]`;
    const response = await fetch(url);
    const data: BinanceTicker[] = await response.json();
    setTickers(prevState => {
      if (prevState === null) {
        return data.reduce<{
          [key: string]: Omit<TickerProps, 'loading'> & { symbol: string };
        }>((acc, binanceTicker) => {
          acc[binanceTicker.symbol] = {
            price: parseFloat(binanceTicker.price ?? '0'),
            percentageType: 'default',
            percentChange: '0',
            symbol: binanceTicker.symbol,
            label: coinsTickersMem[binanceTicker.symbol],
          };
          return acc;
        }, {});
      }
      return data.reduce<{
        [key: string]: Omit<TickerProps, 'loading'> & { symbol: string };
      }>((acc, binanceTicker) => {
        let percentageType: Percentage = 'default';
        const price = parseFloat(binanceTicker.price ?? '0');
        const previousPrice = prevState[binanceTicker.symbol]?.price ?? 0;
        if (previousPrice > price) {
          percentageType = 'decreased';
        } else if (previousPrice < price) {
          percentageType = 'increased';
        }
        const percentChange =
          previousPrice === 0 ? 0 : 100 - (100 * price) / previousPrice;
        acc[binanceTicker.symbol] = {
          price,
          percentageType,
          percentChange: (percentChange < 0
              ? -percentChange
              : percentChange
          ).toFixed(4),
          symbol: binanceTicker.symbol,
          label: coinsTickersMem[binanceTicker.symbol],
        };
        return acc;
      }, {});
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData().then(() => {});
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData().then(() => {});
    }, 5000);

    if (!polling) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [polling, tickers]);

  return (
    <ChakraProvider>
      <Flex gap={8} p={4} direction='column'>
        <Flex gap={8} align='center' maxW='800px'>
          <Input
            value={tickerLabel}
            onChange={handleInputChange}
            name='label'
            size='lg'
            flex={2}
            placeholder='Binance coin ticker label'
          />
          <Input
            value={tickerSymbol}
            onChange={handleInputChange}
            name='symbol'
            size='lg'
            flex={2}
            placeholder='Binance coin ticker symbol e.g. BTCBUSD'
          />
          <Button
            flex={1}
            size='lg'
            disabled={!tickerLabel || !tickerSymbol}
            onClick={handleAddTickerClick}
          >
            Add ticker
          </Button>
        </Flex>
        {coinsTickers.length > 0 && (
          <Flex gap={8} align='center'>
            {coinsTickers.map(coinTicker => {
              const ticker = (tickers ?? {})[coinTicker.symbol] ?? {
                price: 0,
                percentageType: 'default',
                percentChange: '0',
                symbol: coinTicker.symbol,
                label: coinsTickersMem[coinTicker.symbol],
              };
              return (
                <Ticker {...ticker} key={ticker.label} loading={loading} />
              );
            })}
            <Button
              onClick={togglePolling}
              colorScheme={polling ? 'red' : 'green'}
            >
              {polling ? 'Stop' : 'Start'} update
            </Button>
          </Flex>
        )}
      </Flex>
    </ChakraProvider>
  );
}

export default App;

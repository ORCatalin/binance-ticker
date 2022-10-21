import { ChakraProvider } from '@chakra-ui/react';
import { Flex, Box, Text, Button, Skeleton, theme } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

const API_URL = 'https://api1.binance.com/api/v3/ticker/price';

const coinsTickers = [
  { symbol: 'BTCBUSD', label: 'BTC/BUSD' },
  { symbol: 'EGLDBUSD', label: 'EGLD/BUSD' },
];

const coinsTickersMem = coinsTickers.reduce((acc, coinTicker) => ({
  ...acc,
  [coinTicker.symbol]: coinTicker.label,
}), {});

type Percentage = 'decreased' | 'increased' | 'default';

interface BinanceTicker {
  symbol: string;
  price: string;
}

interface TickerProps {
  price: number;
  percentChange: string;
  percentageType: Percentage;
  loading: boolean;
  label: string;
}


const Ticker = ({ percentageType, percentChange, price, loading, label }: TickerProps) => {
  let percentageText = `${percentChange}%`;
  if (percentageType === 'decreased') {
    percentageText = `-${percentageText}`;
  } else if (percentageType === 'increased') {
    percentageText = `+${percentageText}`;
  }

  const percentageElRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (percentageElRef.current) {
      let color = theme.colors.gray['900'];
      if (percentageType === 'decreased') {
        color = theme.colors.red['500'];
      } else if (percentageType === 'increased') {
        color = theme.colors.green['500'];
      }
      percentageElRef.current.style.color = color;
    }
  });
  return (
    <Skeleton isLoaded={!loading}>
      <Flex bg="gray.100" w="200px" h="80px" borderRadius={5} justify="center" align="center">
        <Box>
          <Flex gap={2} align="center">
            <Text fontSize="xl">{label}</Text>
            <Text ref={percentageElRef}>{percentageText}</Text>
          </Flex>
          <Text fontWeight="bold">${price}</Text>
        </Box>
      </Flex>
    </Skeleton>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [tickers, setTickers] = useState<{ [key: string]: Omit<TickerProps, 'loading'> } | null>(null);

  const togglePolling = () => setPolling(!polling);

  const fetchData = async () => {
    const url = `${API_URL}?symbols=[${coinsTickers.reduce((acc, coinTicker) => {
      if (!acc) {
        return `"${coinTicker.symbol}"`;
      }

      return `${acc},"${coinTicker.symbol}"`;
    }, '')}]`;
    const response = await fetch(url);
    const data: BinanceTicker[] = await response.json();
    setTickers(prevState => {
      if (prevState === null) {
        return data.reduce((acc, binanceTicker) => {
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

      return data.reduce((acc, binanceTicker) => {
        let percentageType: Percentage = 'default';
        const price = parseFloat(binanceTicker.price ?? '0');
        const previousPrice = prevState[binanceTicker.symbol].price;
        if (previousPrice > price) {
          percentageType = 'decreased';
        } else if (previousPrice < price) {
          percentageType = 'increased';
        }
        let percentChange = previousPrice === 0 ? 0 : 100 - 100 * price / previousPrice;
        acc[binanceTicker.symbol] = {
          price,
          percentageType,
          percentChange: (percentChange < 0 ? -percentChange : percentChange).toFixed(4),
          symbol: binanceTicker.symbol,
          label: coinsTickersMem[binanceTicker.symbol],
        };
        return acc;
      }, {});
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData().then(() => {
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData().then(() => {
      });
    }, 5000);

    if (!polling) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [polling]);

  return (
    <ChakraProvider>
      <Flex gap={8} p={4} align="center">
        {coinsTickers.map(coinTicker => {
          const ticker = (tickers ?? {})[coinTicker.symbol] ?? {
            price: 0,
            percentageType: 'default',
            percentChange: '0',
            symbol: coinTicker.symbol,
            label: coinsTickersMem[coinTicker.symbol],
          };
          return <Ticker {...ticker} key={ticker.label} loading={loading}/>;
        })}
        <Button onClick={togglePolling}
                colorScheme={polling ? 'red' : 'green'}>{polling ? 'Stop' : 'Start'} update</Button>
      </Flex>
    </ChakraProvider>
  );
}

export default App;

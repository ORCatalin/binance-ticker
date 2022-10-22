import { useEffect, useRef } from 'react';
import { Box, Flex, Skeleton, Text, theme } from '@chakra-ui/react';

export type Percentage = 'decreased' | 'increased' | 'default';

export interface TickerProps {
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

export default Ticker;
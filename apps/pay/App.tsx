import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BalanceScreen from './src/screens/BalanceScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <BalanceScreen />
    </SafeAreaProvider>
  );
}

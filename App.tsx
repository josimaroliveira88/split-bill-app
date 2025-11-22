// App.tsx

import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BillProvider } from './src/context/BillContext';
import { SimpleSplitScreen } from './src/screens/SimpleSplitScreen';
import { DetailedSplitScreen } from './src/screens/DetailedSplitScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack para a navegação de Divisão Detalhada
function DetailedStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="DetailedSplit" component={DetailedSplitScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Resultado' }} />
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <BillProvider>
                <NavigationContainer>
                    <Tab.Navigator
                        screenOptions={{
                            tabBarActiveTintColor: '#007AFF',
                            tabBarInactiveTintColor: '#8E8E93',
                            tabBarStyle: {
                                backgroundColor: '#FFFFFF',
                                borderTopWidth: 1,
                                borderTopColor: '#E5E5EA',
                            },
                            headerStyle: {
                                backgroundColor: '#FFFFFF',
                            },
                            headerTitleStyle: {
                                fontWeight: 'bold',
                            },
                        }}
                    >
                        <Tab.Screen
                            name="SimpleSplit"
                            component={SimpleSplitScreen}
                            options={{
                                title: 'Divisão Simples',
                                tabBarLabel: 'Simples',
                                tabBarIcon: ({ color }) => <TabIcon name="💰" color={color} />,
                            }}
                        />
                        <Tab.Screen
                            name="DetailedStackNav"
                            component={DetailedStack}
                            options={{
                                title: 'Divisão Detalhada',
                                tabBarLabel: 'Detalhada',
                                tabBarIcon: ({ color }) => <TabIcon name="📝" color={color} />,
                                headerShown: false,
                            }}
                        />
                    </Tab.Navigator>
                </NavigationContainer>
            </BillProvider>
        </SafeAreaProvider>
    );
}

// Componente simples para ícones de tabs
const TabIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
    return <Text style={{ fontSize: 24, color: color, opacity: color === '#007AFF' ? 1 : 0.5 }}>{name}</Text>;
};

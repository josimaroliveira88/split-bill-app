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
import { HomeScreen } from './src/screens/HomeScreen';
import { SavedBillDetailScreen } from './src/screens/SavedBillDetailScreen';
import { MainTabParamList, RootStackParamList, DetailedStackParamList } from './src/types/navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const DetailedStackNav = createNativeStackNavigator<DetailedStackParamList>();

// Stack para a navegação de Divisão Detalhada
function DetailedStack() {
    return (
        <DetailedStackNav.Navigator>
            <DetailedStackNav.Screen name="DetailedSplit" component={DetailedSplitScreen} options={{ headerShown: false }} />
            <DetailedStackNav.Screen name="Result" component={ResultScreen} options={{ title: 'Resultado' }} />
        </DetailedStackNav.Navigator>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E5EA',
                },
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Início',
                    tabBarLabel: 'Início',
                    tabBarIcon: ({ color }) => <TabIcon name="🏠" color={color} />,
                }}
            />
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
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <BillProvider>
                <NavigationContainer>
                    <Stack.Navigator>
                        <Stack.Screen
                            name="MainTabs"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SavedBillDetail"
                            component={SavedBillDetailScreen}
                            options={{ title: 'Conta Salva' }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </BillProvider>
        </SafeAreaProvider>
    );
}

// Componente simples para ícones de tabs
const TabIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
    return <Text style={{ fontSize: 24, color: color, opacity: color === '#007AFF' ? 1 : 0.5 }}>{name}</Text>;
};

// App.tsx

import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BillProvider } from './src/context/BillContext';
import { SimpleSplitScreen } from './src/screens/SimpleSplitScreen';
import { DetailedSplitScreen } from './src/screens/DetailedSplitScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { SavedBillDetailScreen } from './src/screens/SavedBillDetailScreen';
import { BackupScreen } from './src/screens/BackupScreen';
import {
    DetailedStackParamList,
    HomeStackParamList,
    MainTabParamList,
    RootStackParamList,
    SimpleStackParamList,
} from './src/types/navigation.types';
import { useBill } from './src/context/BillContext';
import { colors } from './src/theme/colors';

const navTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.card,
        primary: colors.primary,
        text: colors.textPrimary,
        border: colors.border,
    },
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SimpleStack = createNativeStackNavigator<SimpleStackParamList>();
const DetailedStack = createNativeStackNavigator<DetailedStackParamList>();

function HomeStackScreens() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="Home" component={HomeScreen} />
        </HomeStack.Navigator>
    );
}

function SimpleStackScreens() {
    return (
        <SimpleStack.Navigator screenOptions={{ headerShown: false }}>
            <SimpleStack.Screen name="SimpleSplit" component={SimpleSplitScreen} />
        </SimpleStack.Navigator>
    );
}

// Stack para a navegação de Divisão Detalhada
function DetailedStackScreens() {
    return (
        <DetailedStack.Navigator>
            <DetailedStack.Screen name="DetailedSplit" component={DetailedSplitScreen} options={{ headerShown: false }} />
            <DetailedStack.Screen name="Result" component={ResultScreen} options={{ title: 'Resultado' }} />
        </DetailedStack.Navigator>
    );
}

function MainTabs() {
    const { clearBill, setCurrentEntryMeta } = useBill();

    return (
        <Tab.Navigator
            initialRouteName="HomeTab"
            backBehavior="initialRoute"
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopWidth: 0,
                    elevation: 12,
                    height: 70,
                    paddingBottom: 10,
                    borderTopColor: colors.border,
                },
                tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStackScreens}
                options={{
                    title: 'Início',
                    tabBarLabel: 'Início',
                    tabBarIcon: ({ color }) => <TabIcon name="🏠" color={color} />,
                }}
            />
            <Tab.Screen
                name="SimpleTab"
                component={SimpleStackScreens}
                options={{
                    title: 'Divisão Simples',
                    tabBarLabel: 'Simples',
                    tabBarIcon: ({ color }) => <TabIcon name="💰" color={color} />,
                }}
                listeners={({ navigation }) => ({
                    tabPress: () => {
                        setCurrentEntryMeta(null);
                        navigation.navigate('SimpleTab', {
                            screen: 'SimpleSplit',
                            params: { entry: undefined, resetKey: Date.now() },
                        });
                    },
                })}
            />
            <Tab.Screen
                name="DetailedTab"
                component={DetailedStackScreens}
                options={{
                    title: 'Divisão Detalhada',
                    tabBarLabel: 'Detalhada',
                    tabBarIcon: ({ color }) => <TabIcon name="📝" color={color} />,
                    headerShown: false,
                }}
                listeners={({ navigation }) => ({
                    tabPress: () => {
                        clearBill();
                        navigation.navigate('DetailedTab', { screen: 'DetailedSplit' });
                    },
                })}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <BillProvider>
                <NavigationContainer theme={navTheme}>
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
                        <Stack.Screen
                            name="Backup"
                            component={BackupScreen}
                            options={{ title: 'Backup do Histórico' }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </BillProvider>
        </SafeAreaProvider>
    );
}

// Componente simples para ícones de tabs
const TabIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
    const active = color === colors.primary;
    return <Text style={{ fontSize: 26, color, opacity: active ? 1 : 0.55 }}>{name}</Text>;
};

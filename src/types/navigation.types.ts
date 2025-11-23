// src/types/navigation.types.ts

import { NavigatorScreenParams } from '@react-navigation/native';
import { BillHistoryEntry } from './bill.types';

export type HomeStackParamList = {
  Home: undefined;
};

export type SimpleStackParamList = {
  SimpleSplit: { entry?: BillHistoryEntry; resetKey?: number } | undefined;
};

export type DetailedStackParamList = {
  DetailedSplit: undefined;
  Result: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SimpleTab: NavigatorScreenParams<SimpleStackParamList>;
  DetailedTab: NavigatorScreenParams<DetailedStackParamList>;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SavedBillDetail: { entry: BillHistoryEntry };
};

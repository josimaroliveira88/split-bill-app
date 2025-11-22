// src/types/navigation.types.ts

import { NavigatorScreenParams } from '@react-navigation/native';
import { BillHistoryEntry } from './bill.types';

export type DetailedStackParamList = {
  DetailedSplit: undefined;
  Result: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  SimpleSplit: { entry?: BillHistoryEntry } | undefined;
  DetailedStackNav: NavigatorScreenParams<DetailedStackParamList>;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SavedBillDetail: { entry: BillHistoryEntry };
};


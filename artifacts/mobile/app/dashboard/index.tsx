/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetStore,
  useGetProducts,
  useGetDashboardStats,
  useGetDashboardOrders,
  useGetDashboardMessages,
  useGetDashboardReviews,
  useGetConversations,
  getGetConversationsQueryKey,
} from '@workspace/api-client-react';
import { useNotifications } from '@/hooks/useNotifications';

// NOTE: Full file too large for single message - will use alternative

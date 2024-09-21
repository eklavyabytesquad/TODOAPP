import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ApolloProvider } from '@apollo/client';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import TodoListScreen from './TodoListScreen';
import ReferralScreen from './ReferralScreen';
import apolloClient from './apollo';

const Stack = createStackNavigator();

const firebaseConfig = {
  apiKey: "AIzaSyCdNZHbCIQnFwJwKFTaKOIe8qMarIWEblk",
  authDomain: "todo-list-84157.firebaseapp.com",
  projectId: "todo-list-84157",
  storageBucket: "todo-list-84157.appspot.com",
  messagingSenderId: "741559858135",
  appId: "1:741559858135:web:c4ea205d3dded49797d192",
  measurementId: "G-PLDY08ZJGJ"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const App = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="TodoList" component={TodoListScreen} />
          <Stack.Screen name="Referral" component={ReferralScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
};

export default App;
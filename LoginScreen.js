import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, gql } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const GET_REFERRER = gql`
  query GetReferrer($referralCode: String!) {
    referrals(where: {referral_code: {_eq: $referralCode}}) {
      referrer_id
    }
  }
`;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { data: referrerData, refetch: refetchReferrer } = useQuery(GET_REFERRER, {
    variables: { referralCode },
    skip: !referralCode,
  });

  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    formOpacity.value = withTiming(1, { duration: 1000 });
    formTranslateY.value = withSpring(0);
  }, []);

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: formTranslateY.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleLogin = async () => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      await AsyncStorage.setItem('userToken', token);

      if (referralCode) {
        await refetchReferrer();
        if (referrerData && referrerData.referrals.length > 0) {
          const referrerId = referrerData.referrals[0].referrer_id;
          Alert.alert('Welcome', `Welcome to the app, ${user.email}! You were referred by user ${referrerId}.`);
          // Here you might want to update the database to mark this referral as used
        } else {
          Alert.alert('Info', 'Invalid referral code. Proceeding with normal login.');
        }
      }

      navigation.navigate('TodoList');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to log in. Please check your credentials and try again.');
    }
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#2c3e50', '#34495e'] : ['#3498db', '#2980b9']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View style={[styles.formContainer, animatedFormStyle]}>
          <Text style={styles.title}>Welcome Back</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={24} color={isDarkMode ? "#fff" : "#333"} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Email"
              placeholderTextColor={isDarkMode ? "#999" : "#666"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color={isDarkMode ? "#fff" : "#333"} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Password"
              placeholderTextColor={isDarkMode ? "#999" : "#666"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="gift-outline" size={24} color={isDarkMode ? "#fff" : "#333"} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Referral Code (optional)"
              placeholderTextColor={isDarkMode ? "#999" : "#666"}
              value={referralCode}
              onChangeText={setReferralCode}
            />
          </View>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
      <TouchableOpacity
        style={styles.themeToggle}
        onPress={() => setIsDarkMode(!isDarkMode)}
      >
        <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: '#333',
    borderColor: '#555',
    color: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkText: {
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  themeToggle: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
});

export default LoginScreen;
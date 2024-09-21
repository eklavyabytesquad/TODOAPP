import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { useMutation, useQuery, gql } from '@apollo/client';
import { getAuth } from 'firebase/auth';
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Query to get the referral
const GET_REFERRAL = gql`
  query GetReferral($referrerId: String!) {
    referrals(where: { referrer_id: { _eq: $referrerId } }) {
      referral_code
      referred_id
    }
  }
`;

// Mutation to add a referral
const ADD_REFERRAL = gql`
  mutation AddReferral($referrerId: String!, $referralCode: String!) {
    insert_referrals(objects: { referrer_id: $referrerId, referral_code: $referralCode }) {
      returning {
        referral_code
      }
    }
  }
`;

// Create a new context for the theme
const ThemeContext = React.createContext();

const ReferralScreen = ({ navigation }) => {
  const [referralCode, setReferralCode] = useState('');
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [userReferrals, setUserReferrals] = useState([]);
  const [addReferral] = useMutation(ADD_REFERRAL);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const { data: referralData, loading: referralLoading } = useQuery(GET_REFERRAL, {
    variables: { referrerId: userId },
  });

  useEffect(() => {
    if (referralData && referralData.referrals.length > 0) {
      setReferralCode(referralData.referrals[0].referral_code);
      setShowReferralCode(true);
      setUserReferrals(referralData.referrals);
    }
  }, [referralData]);

  const handleGenerateReferralCode = async () => {
    const newReferralCode = `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    try {
      const { data } = await addReferral({
        variables: {
          referrerId: userId,
          referralCode: newReferralCode,
        },
      });

      if (data.insert_referrals.returning.length > 0) {
        setReferralCode(data.insert_referrals.returning[0].referral_code);
        setShowReferralCode(true);
        Alert.alert('Success', 'Referral code generated successfully');
      } else {
        throw new Error('No referral code returned');
      }
    } catch (error) {
      console.error('Error adding referral:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Success', 'Referral code copied to clipboard!');
  };

  const shareReferralCode = async () => {
    const message = `Welcome to miniture.in! We are giving you some amazing offers with this referral code: ${referralCode}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error sharing referral code:', error);
      Alert.alert('Error', 'WhatsApp is not installed or failed to share the referral code.');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      <ScrollView style={styles(isDarkMode).container}>
        <LinearGradient
          colors={isDarkMode ? ['#2c3e50', '#34495e'] : ['#3498db', '#2980b9']}
          style={styles(isDarkMode).header}
        >
          <Text style={styles(isDarkMode).title}>Refer a Friend</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => setIsDarkMode(prevMode => !prevMode)}
            value={isDarkMode}
            style={styles(isDarkMode).themeSwitcher}
          />
        </LinearGradient>
        {!showReferralCode ? (
          <TouchableOpacity style={styles(isDarkMode).generateButton} onPress={handleGenerateReferralCode}>
            <Text style={styles(isDarkMode).generateButtonText}>Generate Referral Code</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles(isDarkMode).codeContainer}>
            <Text style={styles(isDarkMode).codeText}>Your Referral Code:</Text>
            <Text style={styles(isDarkMode).code}>{referralCode}</Text>
            <View style={styles(isDarkMode).buttonContainer}>
              <TouchableOpacity style={styles(isDarkMode).actionButton} onPress={copyToClipboard}>
                <Ionicons name="copy-outline" size={24} color={isDarkMode ? "#fff" : "#333"} />
                <Text style={styles(isDarkMode).actionButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles(isDarkMode).actionButton} onPress={shareReferralCode}>
                <Ionicons name="share-social-outline" size={24} color={isDarkMode ? "#fff" : "#333"} />
                <Text style={styles(isDarkMode).actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles(isDarkMode).referralsTitle}>Your Referrals:</Text>
        {userReferrals.length > 0 ? (
          userReferrals.map((referral, index) => (
            <View key={index} style={styles(isDarkMode).referralItem}>
              <Text style={styles(isDarkMode).referralCode}>{referral.referral_code}</Text>
              <Text style={styles(isDarkMode).referralId}>Referred ID: {referral.referred_id || "N/A"}</Text>
            </View>
          ))
        ) : (
          <Text style={styles(isDarkMode).noReferralsText}>No referrals yet. Start sharing your code!</Text>
        )}
      </ScrollView>
    </ThemeContext.Provider>
  );
};

const styles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  themeSwitcher: {
    alignSelf: 'flex-end',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  codeContainer: {
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
  },
  codeText: {
    fontSize: 18,
    marginBottom: 10,
    color: isDarkMode ? '#fff' : '#333',
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: isDarkMode ? '#4CAF50' : '#2980b9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    backgroundColor: isDarkMode ? '#4CAF50' : '#3498db',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
  },
  actionButtonText: {
    color: isDarkMode ? '#fff' : '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  referralsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 30,
    marginLeft: 20,
    color: isDarkMode ? '#fff' : '#333',
  },
  referralItem: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 2,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#4CAF50' : '#2980b9',
  },
  referralId: {
    fontSize: 16,
    color: isDarkMode ? '#bbb' : '#666',
    marginTop: 5,
  },
  noReferralsText: {
    fontSize: 16,
    color: isDarkMode ? '#bbb' : '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ReferralScreen;
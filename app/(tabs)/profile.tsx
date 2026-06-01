import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.109:3000';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    async function checkLogin() {
      try {
        const res = await fetch('https://7koqa13qm3.execute-api.eu-north-1.amazonaws.com/prod/check_login', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('Failed to fetch login status');

        const data = await res.json();
        setLoggedIn(data.loggedIn);
        setUser(data.loggedIn ? data.user : null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error checking login:', error);
          setError('Unable to check login status. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    checkLogin();

    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Logout failed');

      await res.json();
      setLoggedIn(false);
      setUser(null);

      if (router.pathname !== '/profile') {
        router.replace('/profile');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Logout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="darkblue" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {loggedIn ? (
        <>
          <Text style={styles.welcomeText}>{`Welcome,\n${user.email}!`}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.labelText}>New user? Click below</Text>
          <TouchableOpacity style={styles.authButton1} onPress={() => router.push('/register')}>
            <Text style={styles.authButtonText}>Register</Text>
          </TouchableOpacity>

          <Text style={styles.labelText}>Already registered? Click to login</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push('/login')}>
            <Text style={styles.authButtonText}>Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0ffb3', // Green-yellow background
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#e0ffb3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'darkblue',
    marginBottom: 20,
    textAlign: 'center',
  },
  labelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'darkblue',
    marginBottom: 5,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authButton1: {
    backgroundColor: '#b34700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    marginBottom: 40,
  },
  authButton: {
    backgroundColor: '#000066',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    marginBottom: 80,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
});

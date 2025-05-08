import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: theme.colors.primary }]}>StudySnap</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
            Welcome back!
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            left={<TextInput.Icon icon="lock" />}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            loading={loading}
            disabled={loading}
          >
            Login
          </Button>

          <View style={styles.registerContainer}>
            <Text style={{ color: theme.colors.text }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default LoginScreen;
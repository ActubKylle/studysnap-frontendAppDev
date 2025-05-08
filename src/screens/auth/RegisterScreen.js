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

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(name, email, password, confirmPassword);
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
            Create Account
          </Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

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

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-check" />}
            theme={{ colors: { primary: theme.colors.primary } }}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            loading={loading}
            disabled={loading}
          >
            Register
          </Button>

          <View style={styles.loginContainer}>
            <Text style={{ color: theme.colors.text }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                Login
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
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 24,
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
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  loginContainer: {
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

export default RegisterScreen;
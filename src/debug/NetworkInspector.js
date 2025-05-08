// File: src/components/debug/NetworkInspector.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  TextInput 
} from 'react-native';
import { BASE_URL } from '../services/api/client';

import * as Network from 'expo-network';

/**
 * A component to help debug network connectivity issues
 * 
 * Usage:
 * import NetworkInspector from '../../components/debug/NetworkInspector';
 * ...
 * <NetworkInspector apiUrl={BASE_URL} />
 */
const NetworkInspector = ({ apiUrl = BASE_URL }) => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pingResult, setPingResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiUrl);
  const [pingStatus, setPingStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get network state
      const networkState = await Network.getNetworkStateAsync();
      
      // Get IP address
      const ipAddress = await Network.getIpAddressAsync();
      
      setNetworkInfo({
        ...networkState,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error checking network:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pingServer = async (url = customUrl) => {
    setPingStatus('loading');
    setPingResult(null);
    setError(null);
    
    try {
      const startTime = Date.now();
      
      // First try a HEAD request which is lighter
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        setPingResult({
          success: response.ok,
          statusCode: response.status,
          statusText: response.statusText,
          duration: duration,
          method: 'HEAD',
          timestamp: new Date().toISOString(),
        });
        
        setPingStatus('success');
      } catch (headError) {
        console.log('HEAD request failed, trying GET:', headError);
        
        // If HEAD fails, try a GET request
        try {
          const getStartTime = Date.now();
          const getController = new AbortController();
          const getTimeoutId = setTimeout(() => getController.abort(), 5000);
          
          const getResponse = await fetch(url, {
            method: 'GET',
            signal: getController.signal,
          });
          
          clearTimeout(getTimeoutId);
          
          const getEndTime = Date.now();
          const getDuration = getEndTime - getStartTime;
          
          setPingResult({
            success: getResponse.ok,
            statusCode: getResponse.status,
            statusText: getResponse.statusText,
            duration: getDuration,
            method: 'GET',
            timestamp: new Date().toISOString(),
          });
          
          setPingStatus('success');
        } catch (getError) {
          throw getError;
        }
      }
    } catch (err) {
      console.error('Error pinging server:', err);
      
      setPingResult({
        success: false,
        error: err.message,
        isTimeout: err.name === 'AbortError',
        timestamp: new Date().toISOString(),
      });
      
      setPingStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.title}>Network Inspector</Text>
        <Text style={styles.expandButton}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.content}>
          <TouchableOpacity style={styles.refreshButton} onPress={checkNetwork}>
            <Text style={styles.refreshButtonText}>Refresh Network Info</Text>
          </TouchableOpacity>
          
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : networkInfo ? (
            <ScrollView style={styles.infoContainer}>
              <InfoRow label="Connected" value={networkInfo.isConnected ? 'Yes' : 'No'} />
              <InfoRow label="Connection Type" value={networkInfo.type} />
              <InfoRow label="Is Internet Reachable" value={networkInfo.isInternetReachable ? 'Yes' : 'No'} />
              <InfoRow label="IP Address" value={networkInfo.ipAddress} />
              <InfoRow label="Last Checked" value={new Date(networkInfo.timestamp).toLocaleTimeString()} />
            </ScrollView>
          ) : (
            <Text>No network information available</Text>
          )}
          
          <View style={styles.separator} />
          
          <Text style={styles.sectionTitle}>Ping API Server</Text>
          <View style={styles.pingContainer}>
            <TextInput
              style={styles.urlInput}
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="Enter URL to ping"
            />
            
            <TouchableOpacity 
              style={[
                styles.pingButton, 
                pingStatus === 'loading' ? styles.pingButtonDisabled : null
              ]} 
              onPress={() => pingServer()}
              disabled={pingStatus === 'loading'}
            >
              {pingStatus === 'loading' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.pingButtonText}>Ping</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {pingResult && (
            <View style={styles.pingResultContainer}>
              <InfoRow 
                label="Status" 
                value={pingResult.success ? 'Success' : 'Failed'} 
                valueStyle={{ color: pingResult.success ? 'green' : 'red' }}
              />
              
              {pingResult.statusCode && (
                <InfoRow 
                  label="Status Code" 
                  value={`${pingResult.statusCode} (${pingResult.statusText || ''})`}
                  valueStyle={{ 
                    color: pingResult.statusCode >= 200 && pingResult.statusCode < 300 ? 'green' : 'orange' 
                  }}
                />
              )}
              
              {pingResult.method && (
                <InfoRow label="Method" value={pingResult.method} />
              )}
              
              {pingResult.duration && (
                <InfoRow 
                  label="Response Time" 
                  value={`${pingResult.duration}ms`}
                  valueStyle={{ 
                    color: pingResult.duration < 300 ? 'green' : 
                           pingResult.duration < 1000 ? 'orange' : 'red' 
                  }}
                />
              )}
              
              {pingResult.error && (
                <InfoRow 
                  label="Error" 
                  value={pingResult.error}
                  valueStyle={{ color: 'red' }}
                />
              )}
              
              {pingResult.isTimeout && (
                <InfoRow 
                  label="Timeout" 
                  value="Request timed out after 5 seconds"
                  valueStyle={{ color: 'red' }}
                />
              )}
              
              <InfoRow 
                label="Timestamp" 
                value={new Date(pingResult.timestamp).toLocaleTimeString()} 
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const InfoRow = ({ label, value, valueStyle = {} }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  expandButton: {
    fontSize: 16,
  },
  content: {
    padding: 10,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoContainer: {
    maxHeight: 150,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 140,
  },
  infoValue: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
  },
  pingButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 40,
  },
  pingButtonDisabled: {
    backgroundColor: '#99CCFF',
  },
  pingButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pingResultContainer: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginVertical: 10,
  },
});

export default NetworkInspector;
/**
 * Native-Heavy Test Component
 * 
 * This component is designed to test the analyzer's detection of React Native-specific patterns.
 * Expected Pattern Counts:
 * - StyleSheet.create patterns: 5 occurrences
 * - Platform API patterns: 4 occurrences (Platform.OS, Platform.select)
 * - AsyncStorage patterns: 3 occurrences
 * - React Native component patterns: 20+ occurrences (<View>, <Text>, <ScrollView>, etc.)
 * - onPress patterns: 6 occurrences
 * - styles.* patterns: 15+ occurrences
 * - React Native import patterns: 2 occurrences
 * - Layout style patterns: 10+ occurrences (flexDirection, justifyContent, alignItems)
 * 
 * Total Expected Native Patterns: 65+ patterns
 * Expected Reusability: <40% (heavy React Native-specific code)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
  FlatList,
  Image,
  Alert,
  Platform,
  Dimensions,
  StyleSheet,
  StatusBar
} from 'react-native'; // React Native import pattern 1
import AsyncStorage from '@react-native-async-storage/async-storage'; // React Native import pattern 2

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  lastActive: string;
}

interface NativeHeavyScreenProps {
  navigation: any;
  route: any;
}

export function NativeHeavyScreen({ navigation, route }: NativeHeavyScreenProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Platform-specific initialization
  useEffect(() => {
    initializeScreen();
    loadStoredData();
    
    // Platform-specific status bar
    if (Platform.OS === 'ios') { // Platform.OS pattern 1
      StatusBar.setBarStyle('dark-content');
    } else if (Platform.OS === 'android') { // Platform.OS pattern 2
      StatusBar.setBackgroundColor('#ffffff');
    }
  }, []);

  const initializeScreen = async () => {
    try {
      // AsyncStorage usage
      const storedUsers = await AsyncStorage.getItem('userProfiles'); // AsyncStorage pattern 1
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Load default users
        const defaultUsers = generateMockUsers();
        setUsers(defaultUsers);
        await AsyncStorage.setItem('userProfiles', JSON.stringify(defaultUsers)); // AsyncStorage pattern 2
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data'); // Alert.alert pattern 1
    }
  };

  const loadStoredData = async () => {
    try {
      const selectedId = await AsyncStorage.getItem('selectedUserId'); // AsyncStorage pattern 3
      if (selectedId) {
        setSelectedUser(selectedId);
      }
    } catch (error) {
      console.log('No stored selection found');
    }
  };

  const generateMockUsers = (): UserProfile[] => {
    return [
      { id: '1', name: 'John Doe', avatar: 'https://example.com/avatar1.jpg', lastActive: '2 hours ago' },
      { id: '2', name: 'Jane Smith', avatar: 'https://example.com/avatar2.jpg', lastActive: '1 day ago' },
      { id: '3', name: 'Bob Johnson', avatar: 'https://example.com/avatar3.jpg', lastActive: '3 days ago' }
    ];
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    AsyncStorage.setItem('selectedUserId', userId);
    
    // Platform-specific feedback
    const feedbackStyle = Platform.select({ // Platform.select pattern 1
      ios: 'User selected successfully',
      android: 'Selection saved',
      default: 'User updated'
    });
    
    Alert.alert('Success', feedbackStyle); // Alert.alert pattern 2
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'User list has been updated'); // Alert.alert pattern 3
    }, 2000);
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert( // Alert.alert pattern 4
      'Confirm Delete',
      'Are you sure you want to remove this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedUsers = users.filter(u => u.id !== userId);
            setUsers(updatedUsers);
            AsyncStorage.setItem('userProfiles', JSON.stringify(updatedUsers));
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.userItemContainer}> {/* styles.* pattern 1 */}
      <TouchableOpacity 
        style={[styles.userItem, selectedUser === item.id && styles.selectedUser]} {/* styles.* patterns 2, 3 */}
        onPress={() => handleUserSelect(item.id)} {/* onPress pattern 1 */}
      >
        <Image 
          source={{ uri: item.avatar }} {/* Image source pattern 1 */}
          style={styles.avatar} {/* styles.* pattern 4 */}
        />
        <View style={styles.userInfo}> {/* styles.* pattern 5 */}
          <Text style={styles.userName}>{item.name}</Text> {/* styles.* pattern 6 */}
          <Text style={styles.lastActive}>Last seen: {item.lastActive}</Text> {/* styles.* pattern 7 */}
        </View>
        <TouchableHighlight 
          style={styles.deleteButton} {/* styles.* pattern 8 */}
          onPress={() => handleDeleteUser(item.id)} {/* onPress pattern 2 */}
          underlayColor="#ff4444"
        >
          <Text style={styles.deleteButtonText}>Delete</Text> {/* styles.* pattern 9 */}
        </TouchableHighlight>
      </TouchableOpacity>
    </View>
  );

  // Get screen dimensions for responsive layout
  const screenData = Dimensions.get('window'); // Dimensions.get pattern 1
  const isLandscape = screenData.width > screenData.height;

  return (
    <View style={styles.container}> {/* styles.* pattern 10 */}
      <ScrollView 
        style={styles.scrollView} {/* styles.* pattern 11 */}
        refreshControl={
          <TouchableOpacity onPress={handleRefresh}> {/* onPress pattern 3 */}
            <Text style={styles.refreshText}>Pull to refresh</Text> {/* styles.* pattern 12 */}
          </TouchableOpacity>
        }
      >
        {/* Header */}
        <View style={[styles.header, isLandscape && styles.headerLandscape]}> {/* styles.* patterns 13, 14 */}
          <Text style={styles.headerTitle}>User Profiles</Text> {/* styles.* pattern 15 */}
          <TouchableOpacity 
            style={styles.addButton} {/* styles.* pattern 16 */}
            onPress={() => navigation.navigate('AddUser')} {/* onPress pattern 4 */}
          >
            <Text style={styles.addButtonText}>Add User</Text> {/* styles.* pattern 17 */}
          </TouchableOpacity>
        </View>

        {/* User List */}
        <FlatList 
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          style={styles.userList} {/* styles.* pattern 18 */}
          showsVerticalScrollIndicator={false}
        />

        {/* Platform-specific footer */}
        <View style={styles.footer}> {/* styles.* pattern 19 */}
          <Text style={styles.footerText}> {/* styles.* pattern 20 */}
            Running on {Platform.OS === 'ios' ? 'iOS' : 'Android'} {/* Platform.OS pattern 3 */}
          </Text>
          <TouchableOpacity 
            onPress={() => Alert.alert('Info', `Screen: ${screenData.width}x${screenData.height}`)} {/* onPress pattern 5 */}
          >
            <Text style={styles.infoText}>Device Info</Text> {/* styles.* pattern 21 */}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, Platform.OS === 'ios' ? styles.fabIOS : styles.fabAndroid]} {/* styles.* patterns 22, 23, 24 */}
        onPress={() => handleRefresh()} {/* onPress pattern 6 */}
      >
        <Text style={styles.fabText}>+</Text> {/* styles.* pattern 25 */}
      </TouchableOpacity>
    </View>
  );
}

// StyleSheet.create pattern 1
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    flexDirection: 'column', // flexDirection pattern 1
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row', // flexDirection pattern 2
    justifyContent: 'space-between', // justifyContent pattern 1
    alignItems: 'center', // alignItems pattern 1
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLandscape: {
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

// StyleSheet.create pattern 2
const userStyles = StyleSheet.create({
  userList: {
    marginTop: 20,
  },
  userItemContainer: {
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row', // flexDirection pattern 3
    alignItems: 'center', // alignItems pattern 2
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedUser: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'column', // flexDirection pattern 4
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lastActive: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

// StyleSheet.create pattern 3
const footerStyles = StyleSheet.create({
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center', // alignItems pattern 3
    justifyContent: 'center', // justifyContent pattern 2
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  refreshText: {
    textAlign: 'center',
    color: '#007AFF',
    paddingVertical: 10,
  },
});

// StyleSheet.create pattern 4
const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center', // justifyContent pattern 3
    alignItems: 'center', // alignItems pattern 4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIOS: {
    shadowOpacity: 0.3,
  },
  fabAndroid: {
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});

// StyleSheet.create pattern 5
const platformStyles = StyleSheet.create({
  ...Platform.select({ // Platform.select pattern 2
    ios: {
      container: {
        paddingTop: 20,
      },
      text: {
        fontFamily: 'System',
      },
    },
    android: {
      container: {
        paddingTop: 0,
      },
      text: {
        fontFamily: 'Roboto',
      },
    },
  }),
});

// Combine all styles for easier access
const allStyles = StyleSheet.create({ // StyleSheet.create pattern 6 (bonus)
  ...styles,
  ...userStyles,
  ...footerStyles,
  ...fabStyles,
  ...platformStyles,
});

export default NativeHeavyScreen;
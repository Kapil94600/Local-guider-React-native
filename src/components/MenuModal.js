import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

const MenuModal = ({
  visible,
  onClose,
  profile,
  user,
  onEditProfile,
  onSettings,
  onHelp,
  onPrivacyPolicy,
  onLogout,
  getImageUrl,
}) => {
  
  const getInitial = () => {
    if (profile?.firmName) return profile.firmName.charAt(0).toUpperCase();
    if (profile?.name) return profile.name.charAt(0).toUpperCase();
    if (user?.name) return user.name.charAt(0).toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.firmName) return profile.firmName;
    if (profile?.name) return profile.name;
    if (user?.name) return user.name;
    return 'User';
  };

  const getEmail = () => {
    if (profile?.email) return profile.email;
    if (user?.email) return user.email;
    return 'No email';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            {profile?.featuredImage ? (
              <Image 
                source={{ uri: getImageUrl(profile.featuredImage) }} 
                style={styles.menuAvatar}
              />
            ) : (
              <View style={styles.menuAvatarPlaceholder}>
                <Text style={styles.menuAvatarText}>{getInitial()}</Text>
              </View>
            )}
            <Text style={styles.menuName}>{getDisplayName()}</Text>
            <Text style={styles.menuEmail}>{getEmail()}</Text>
          </View>

          <View style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                onClose();
                onEditProfile();
              }}
            >
              <Ionicons name="person-outline" size={22} color="#2c5a73" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                onClose();
                onSettings();
              }}
            >
              <Ionicons name="settings-outline" size={22} color="#2c5a73" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                onClose();
                onHelp();
              }}
            >
              <Ionicons name="help-circle-outline" size={22} color="#2c5a73" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                onClose();
                onPrivacyPolicy();
              }}
            >
              <Ionicons name="document-text-outline" size={22} color="#2c5a73" />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]} 
              onPress={() => {
                onClose();
                onLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.menuVersion}>Version 1.0.0</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  menuContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#fff',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#2c5a73',
  },
  menuAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2c5a73',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  menuAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  menuEmail: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  menuItems: {
    flex: 1,
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 12,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  menuVersion: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    paddingVertical: 10,
  },
});

export default MenuModal;
import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    Dimensions,
    Platform,
    StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AuthContext } from "../context/AuthContext";
import { LocationContext } from "../context/LocationContext";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function UserMenuOverlay({ visible, onClose, onNavigate }) {
    const { user, refreshUser, logout } = useContext(AuthContext);
    const { location, loading: locationLoading } = useContext(LocationContext);
    const [balance, setBalance] = useState(user?.balance ?? 0);
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        bookings: false,
        explore: false,
        more: true,
    });

    useEffect(() => {
        refreshUser && refreshUser();
    }, []);

    useEffect(() => {
        setBalance(user?.balance ?? 0);
    }, [user?.balance]);

    const userName =
        user?.username ||
        user?.userName ||
        user?.name ||
        user?.fullName ||
        user?.email ||
        "Guest User";

    const profileImage =
        user?.profilePicture || user?.profile
            ? `${BASE_URL}/Uploads/${user?.profilePicture || user?.profile}`
            : null;

    const getLocationText = () => {
        if (locationLoading) return "Detecting location...";
        if (location?.city) {
            return `${location.city}${location.state ? ", " + location.state : ""}`;
        }
        if (location?.error) return "Location unavailable";
        return "Select location";
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            {/* Background Blur */}
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

            {/* Background click to close */}
            <TouchableOpacity style={styles.background} activeOpacity={1} onPress={onClose} />

            {/* Menu Container - Left Edge से Attached */}
            <View style={styles.menuContainer}>
                <LinearGradient
                    colors={['#3c6178', '#3e728f', '#2c454e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileGradient}
                >
                    {/* Close Button - Right side */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>

                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => {
                                onClose();
                                onNavigate("ProfileUpdate");
                            }}
                        >
                            <LinearGradient
                                colors={['#ffffff30', '#ffffff10']}
                                style={styles.avatarGradient}
                            >
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>
                                            {userName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </LinearGradient>
                            <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={12} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.userInfoContainer}>
                            <Text style={styles.userName}>{userName}</Text>
                            {user?.email && (
                                <Text style={styles.userEmail}>{user.email}</Text>
                            )}
                        </View>

                        {/* Location & Balance Row */}
                        <View style={styles.infoRow}>
                            <TouchableOpacity
                                style={styles.locationPill}
                                onPress={() => {
                                    onClose();
                                    onNavigate("LocationSearch");
                                }}
                            >
                                <Ionicons name="location" size={14} color="#fff" />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {getLocationText()}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.balancePill}>
                                <MaterialCommunityIcons name="wallet" size={14} color="#FFD700" />
                                <Text style={styles.balanceText}>
                                    ₹{balance.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Menu Items */}
                <ScrollView
                    style={styles.menuScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.menuContent}
                >
                    {/* Account Section */}
                    <View style={styles.menuSection}>
                        <Text style={styles.sectionHeader}>ACCOUNT</Text>
                        <MenuItem
                            icon="person-outline"
                            label="Edit Profile"
                            badge="New"
                            onPress={() => {
                                onClose();
                                onNavigate("ProfileUpdate");
                            }}
                        />
                        <MenuItem
                            icon="wallet-outline"
                            label="Wallet Balance"
                            value={`₹${balance.toLocaleString()}`}
                            onPress={() => {
                                onClose();
                                onNavigate("AddBalance");
                            }}
                        />
                        <MenuItem
                            icon="receipt-outline"
                            label="Transaction History"
                            onPress={() => {
                                onClose();
                                onNavigate("TransactionHistory");
                            }}
                        />
                    </View>

                    {/* Bookings Section */}
                    <View style={styles.menuSection}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection('bookings')}
                        >
                            <Text style={styles.sectionHeaderText}>BOOKINGS</Text>
                            <Ionicons
                                name={expandedSections.bookings ? "chevron-up" : "chevron-down"}
                                size={16}
                                color="#64748b"
                            />
                        </TouchableOpacity>

                        {expandedSections.bookings && (
                            <View style={styles.sectionContent}>
                                <MenuItem
                                    icon="calendar-outline"
                                    label="My Bookings"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("MyBookings");
                                    }}
                                />
                                <MenuItem
                                    icon="time-outline"
                                    label="Upcoming"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("UpcomingBookings");
                                    }}
                                />
                                <MenuItem
                                    icon="checkmark-done-outline"
                                    label="Completed"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("CompletedBookings");
                                    }}
                                />
                            </View>
                        )}
                    </View>

                    {/* Explore Section */}
                    <View style={styles.menuSection}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection('explore')}
                        >
                            <Text style={styles.sectionHeaderText}>EXPLORE</Text>
                            <Ionicons
                                name={expandedSections.explore ? "chevron-up" : "chevron-down"}
                                size={16}
                                color="#64748b"
                            />
                        </TouchableOpacity>

                        {expandedSections.explore && (
                            <View style={styles.sectionContent}>
                                <MenuItem
                                    icon="map-outline"
                                    label="Explore Places"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("ExplorePlaces");
                                    }}
                                />
                                <MenuItem
                                    icon="people-outline"
                                    label="Find Tour Guides"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("FindTourGuides");
                                    }}
                                />
                                <MenuItem
                                    icon="camera-outline"
                                    label="Find Photographers"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("FindPhotographers");
                                    }}
                                />
                                <MenuItem
                                    icon="heart-outline"
                                    label="Wishlist"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("Wishlist");
                                    }}
                                />
                            </View>
                        )}
                    </View>

                    {/* More Section */}
                    <View style={styles.menuSection}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection('more')}
                        >
                            <Text style={styles.sectionHeaderText}>MORE</Text>
                            <Ionicons
                                name={expandedSections.more ? "chevron-up" : "chevron-down"}
                                size={16}
                                color="#64748b"
                            />
                        </TouchableOpacity>

                        {expandedSections.more && (
                            <View style={styles.sectionContent}>
                                <MenuItem
                                    icon="briefcase-outline"
                                    label="Work with us"
                                    badge="New"
                                    onPress={() => setRoleModalVisible(true)}
                                />
                                <MenuItem
                                    icon="information-circle-outline"
                                    label="About us"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("AboutUs");
                                    }}
                                />
                                <MenuItem
                                    icon="call-outline"
                                    label="Contact us"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("ContactUs");
                                    }}
                                />
                                <MenuItem
                                    icon="shield-checkmark-outline"
                                    label="Privacy Policy"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("PrivacyPolicy");
                                    }}
                                />
                                <MenuItem
                                    icon="document-text-outline"
                                    label="Terms & Conditions"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("TermsConditions");
                                    }}
                                />
                                <MenuItem
                                    icon="help-circle-outline"
                                    label="Help & Support"
                                    onPress={() => {
                                        onClose();
                                        onNavigate("HelpSupport");
                                    }}
                                />
                            </View>
                        )}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={async () => {
                            await logout();
                            onClose();
                        }}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#2e5361" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>Version 2.0.0</Text>
                </ScrollView>
            </View>

            {/* Role Selection Modal */}
            <Modal
                visible={roleModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRoleModalVisible(false)}
            >
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Join as Partner</Text>
                            <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Select your role to get started</Text>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setRoleModalVisible(false);
                                onClose();
                                onNavigate("GuiderRequestScreen");
                            }}
                        >
                            <LinearGradient
                                colors={['#50869a20', '#50869a40']}
                                style={styles.modalOptionGradient}
                            >
                                <View style={[styles.modalIcon, { backgroundColor: '#50869a' }]}>
                                    <Ionicons name="people" size={24} color="#fff" />
                                </View>
                                <View style={styles.modalOptionContent}>
                                    <Text style={styles.modalOptionTitle}>Tour Guide</Text>
                                    <Text style={styles.modalOptionDesc}>
                                        Guide tourists to amazing places
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setRoleModalVisible(false);
                                onClose();
                                onNavigate("PhotographerRequest");
                            }}
                        >
                            <LinearGradient
                                colors={['#e76f5120', '#e76f5140']}
                                style={styles.modalOptionGradient}
                            >
                                <View style={[styles.modalIcon, { backgroundColor: '#e76f51' }]}>
                                    <Ionicons name="camera" size={24} color="#fff" />
                                </View>
                                <View style={styles.modalOptionContent}>
                                    <Text style={styles.modalOptionTitle}>Photographer</Text>
                                    <Text style={styles.modalOptionDesc}>
                                        Capture beautiful moments
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => setRoleModalVisible(false)}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function MenuItem({ icon, label, onPress, color = "#1e293b", badge, value }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon} size={20} color={color} />
                <Text style={[styles.menuItemText, { color }]}>{label}</Text>
            </View>
            <View style={styles.menuItemRight}>
                {value && <Text style={styles.menuItemValue}>{value}</Text>}
                {badge && (
                    <View style={[styles.badge, badge === 'New' && styles.newBadge]}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    background: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "transparent",
    },
    menuContainer: {
        position: "absolute",
        top: 0,
        left: 0,  // LEFT EDGE SE ATTACHED
        width: width * 0.85,
        maxWidth: 280,
        backgroundColor: "#fff",
        height: "100%",
        borderTopRightRadius: 24,  // Right side rounded (क्योंकि left edge attached है)
        borderBottomRightRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },  // Right side shadow
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    profileGradient: {
        paddingTop: STATUSBAR_HEIGHT + 20,
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    closeBtn: {
        position: "absolute",
        top: STATUSBAR_HEIGHT + 12,
        right: 16,  // RIGHT SIDE (क्योंकि menu left में है)
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    profileSection: {
        alignItems: "center",
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },
    avatarGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: "#fff",
        overflow: "hidden",
    },
    avatarImg: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
    },
    editBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#50869a",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    userInfoContainer: {
        alignItems: "center",
        marginBottom: 12,
    },
    userName: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    userEmail: {
        color: "#e0f2f1",
        fontSize: 12,
    },
    infoRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },
    locationPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    locationText: {
        color: "#fff",
        fontSize: 12,
        maxWidth: 100,
    },
    balancePill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    balanceText: {
        color: "#FFD700",
        fontSize: 12,
        fontWeight: "600",
    },
    menuScroll: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    menuContent: {
        paddingVertical: 12,
    },
    menuSection: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sectionHeaderText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748b",
        letterSpacing: 0.5,
    },
    sectionContent: {
        backgroundColor: "#fff",
        paddingVertical: 4,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    menuItemText: {
        marginLeft: 12,
        fontSize: 14,
        fontWeight: "500",
    },
    menuItemRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    menuItemValue: {
        fontSize: 13,
        color: "#50869a",
        fontWeight: "500",
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: "center",
    },
    newBadge: {
        backgroundColor: "#50869a",
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "600",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 8,
        paddingVertical: 14,
        backgroundColor: "#e0e4e6",
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        color: "#2e5361",
        fontSize: 15,
        fontWeight: "600",
    },
    versionText: {
        textAlign: "center",
        fontSize: 10,
        color: "#94a3b8",
        marginBottom: 20,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        width: "90%",
        maxWidth: 340,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1e293b",
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 24,
    },
    modalOption: {
        marginBottom: 12,
        overflow: "hidden",
        borderRadius: 16,
    },
    modalOptionGradient: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    modalIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    modalOptionContent: {
        flex: 1,
    },
    modalOptionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 2,
    },
    modalOptionDesc: {
        fontSize: 12,
        color: "#64748b",
    },
    modalCancelBtn: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        marginTop: 8,
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#64748b",
    },
});
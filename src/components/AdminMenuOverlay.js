import React, { useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function AdminMenuOverlay({ onClose, onNavigate }) {
    const { logout } = useContext(AuthContext);
    const [expandedSections, setExpandedSections] = useState({
        users: false,
        bookings: false,
        payments: false,
        content: false,
        system: false,
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <View style={styles.overlay}>
            {/* 🔙 BACK BUTTON */}
            <TouchableOpacity style={styles.backBtn} onPress={onClose}>
                <Ionicons name="arrow-back" size={28} color="#111" />
            </TouchableOpacity>

            {/* 📋 ADMIN MENU TITLE */}
            <View style={styles.header}>
                <Ionicons name="shield-outline" size={28} color="#42738f" />
                <Text style={styles.adminTitle}>Admin Panel</Text>
            </View>

            {/* 📋 ACCORDION MENU */}
            <ScrollView 
                style={styles.menuContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* 🎯 DASHBOARD */}
                <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                        onClose();
                        onNavigate("AdminDashboard");
                    }}
                >
                    <Ionicons name="speedometer-outline" size={22} color="#42738f" />
                    <Text style={styles.menuText}>Dashboard</Text>
                </TouchableOpacity>

                {/* 👥 USERS MANAGEMENT */}
                <TouchableOpacity 
                    style={styles.accordionHeader}
                    onPress={() => toggleSection('users')}
                >
                    <View style={styles.accordionTitle}>
                        <Ionicons name="people-outline" size={22} color="#42738f" />
                        <Text style={styles.accordionText}>Users Management</Text>
                    </View>
                    <Ionicons 
                        name={expandedSections.users ? "chevron-up" : "chevron-down"} 
                        size={22} 
                        color="#666" 
                    />
                </TouchableOpacity>
                
                {expandedSections.users && (
                    <View style={styles.subMenu}>
                        <SubMenuItem 
                            label="All Users" 
                            onPress={() => {
                                onClose();
                                onNavigate("UserList");
                            }}
                        />
                        <SubMenuItem 
                            label="Tour Guides" 
                            onPress={() => {
                                onClose();
                                onNavigate("GuiderList");
                            }}
                        />
                        <SubMenuItem 
                            label="Photographers" 
                            onPress={() => {
                                onClose();
                                onNavigate("PhotographerList");
                            }}
                        />
                        <SubMenuItem 
                            label="User Reports" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminUserReports");
                            }}
                        />
                    </View>
                )}

                {/* 📅 BOOKINGS & APPOINTMENTS */}
                <TouchableOpacity 
                    style={styles.accordionHeader}
                    onPress={() => toggleSection('bookings')}
                >
                    <View style={styles.accordionTitle}>
                        <Ionicons name="calendar-outline" size={22} color="#42738f" />
                        <Text style={styles.accordionText}>Bookings & Appointments</Text>
                    </View>
                    <Ionicons 
                        name={expandedSections.bookings ? "chevron-up" : "chevron-down"} 
                        size={22} 
                        color="#666" 
                    />
                </TouchableOpacity>
                
                {expandedSections.bookings && (
                    <View style={styles.subMenu}>
                        <SubMenuItem 
                            label="All Bookings" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminAllBookings");
                            }}
                        />
                        <SubMenuItem 
                            label="Pending Approval" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminPendingBookings");
                            }}
                        />
                        <SubMenuItem 
                            label="Booking History" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminBookingHistory");
                            }}
                        />
                        <SubMenuItem 
                            label="Cancelled Bookings" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminCancelledBookings");
                            }}
                        />
                    </View>
                )}

                {/* 💰 PAYMENTS & TRANSACTIONS */}
                <TouchableOpacity 
                    style={styles.accordionHeader}
                    onPress={() => toggleSection('payments')}
                >
                    <View style={styles.accordionTitle}>
                        <Ionicons name="cash-outline" size={22} color="#42738f" />
                        <Text style={styles.accordionText}>Payments & Transactions</Text>
                    </View>
                    <Ionicons 
                        name={expandedSections.payments ? "chevron-up" : "chevron-down"} 
                        size={22} 
                        color="#666" 
                    />
                </TouchableOpacity>
                
                {expandedSections.payments && (
                    <View style={styles.subMenu}>
                        <SubMenuItem 
                            label="All Transactions" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminTransactions");
                            }}
                        />
                        <SubMenuItem 
                            label="Withdrawal Requests" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminWithdrawals");
                            }}
                        />
                        <SubMenuItem 
                            label="Revenue Reports" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminRevenue");
                            }}
                        />
                        <SubMenuItem 
                            label="Refund Requests" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminRefunds");
                            }}
                        />
                    </View>
                )}

                {/* 📝 CONTENT MANAGEMENT */}
                <TouchableOpacity 
                    style={styles.accordionHeader}
                    onPress={() => toggleSection('content')}
                >
                    <View style={styles.accordionTitle}>
                        <Ionicons name="document-text-outline" size={22} color="#42738f" />
                        <Text style={styles.accordionText}>Content Management</Text>
                    </View>
                    <Ionicons 
                        name={expandedSections.content ? "chevron-up" : "chevron-down"} 
                        size={22} 
                        color="#666" 
                    />
                </TouchableOpacity>
                
                {expandedSections.content && (
                    <View style={styles.subMenu}>
                        <SubMenuItem 
                            label="Places & Destinations" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminPlaces");
                            }}
                        />
                        <SubMenuItem 
                            label="Packages & Services" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminPackages");
                            }}
                        />
                        <SubMenuItem 
                            label="Blogs & Articles" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminBlogs");
                            }}
                        />
                        <SubMenuItem 
                            label="Reviews & Ratings" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminReviews");
                            }}
                        />
                        <SubMenuItem 
                            label="FAQ Management" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminFAQ");
                            }}
                        />
                    </View>
                )}

                {/* ⚙️ SYSTEM SETTINGS */}
                <TouchableOpacity 
                    style={styles.accordionHeader}
                    onPress={() => toggleSection('system')}
                >
                    <View style={styles.accordionTitle}>
                        <Ionicons name="settings-outline" size={22} color="#42738f" />
                        <Text style={styles.accordionText}>System Settings</Text>
                    </View>
                    <Ionicons 
                        name={expandedSections.system ? "chevron-up" : "chevron-down"} 
                        size={22} 
                        color="#666" 
                    />
                </TouchableOpacity>
                
                {expandedSections.system && (
                    <View style={styles.subMenu}>
                        <SubMenuItem 
                            label="General Settings" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminSettings");
                            }}
                        />
                        <SubMenuItem 
                            label="Commission Rates" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminCommission");
                            }}
                        />
                        <SubMenuItem 
                            label="Notification Settings" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminNotifications");
                            }}
                        />
                        <SubMenuItem 
                            label="Backup & Restore" 
                            onPress={() => {
                                onClose();
                                onNavigate("AdminBackup");
                            }}
                        />
                    </View>
                )}

                {/* 📊 REPORTS & ANALYTICS */}
                <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                        onClose();
                        onNavigate("AdminReports");
                    }}
                >
                    <Ionicons name="stats-chart-outline" size={22} color="#42738f" />
                    <Text style={styles.menuText}>Reports & Analytics</Text>
                </TouchableOpacity>

                {/* 🚨 SUPPORT & ISSUES */}
                <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                        onClose();
                        onNavigate("AdminSupport");
                    }}
                >
                    <Ionicons name="help-circle-outline" size={22} color="#42738f" />
                    <Text style={styles.menuText}>Support & Issues</Text>
                </TouchableOpacity>

                {/* 🔐 LOGOUT */}
                <TouchableOpacity 
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={async () => {
                        await logout();
                        onClose();
                    }}
                >
                    <Ionicons name="log-out-outline" size={22} color="#dc2626" />
                    <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

/* SUBMENU ITEM */
function SubMenuItem({ label, onPress }) {
    return (
        <TouchableOpacity style={styles.subMenuItem} onPress={onPress}>
            <View style={styles.subMenuDot} />
            <Text style={styles.subMenuText}>{label}</Text>
        </TouchableOpacity>
    );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
    overlay: { 
        position: "absolute", 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: "#f8fafc",
        zIndex: 999,
        paddingTop: 50,
    },
    backBtn: { 
        position: "absolute", 
        left: 16, 
        top: 16, 
        zIndex: 1000,
        padding: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        backgroundColor: "#fff",
    },
    adminTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#42738f",
        marginLeft: 12,
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    menuText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1e293b",
        marginLeft: 16,
        flex: 1,
    },
    accordionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    accordionTitle: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    accordionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1e293b",
        marginLeft: 16,
    },
    subMenu: {
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        marginBottom: 8,
        paddingVertical: 8,
        marginLeft: 16,
        borderLeftWidth: 2,
        borderLeftColor: "#cbd5e1",
    },
    subMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginLeft: 16,
    },
    subMenuDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#94a3b8",
        marginRight: 12,
    },
    subMenuText: {
        fontSize: 14,
        color: "#475569",
        fontWeight: "500",
    },
    logoutItem: {
        marginTop: 20,
        marginBottom: 40,
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
    },
    logoutText: {
        color: "#dc2626",
    },
});
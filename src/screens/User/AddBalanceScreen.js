import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function AddBalanceScreen({ navigation }) {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [addAmount, setAddAmount] = useState("");
    const [processing, setProcessing] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState([]);

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            // Get user profile with balance
            const response = await api.post(API.GET_PROFILE);
            if (response.data?.status) {
                setBalance(response.data.data?.balance || 0);
            }

            // Get recent transactions
            const txResponse = await api.post(API.GET_TRANSACTION, {
                page: 1,
                perPage: 5,
            });
            if (txResponse.data?.status) {
                setRecentTransactions(txResponse.data.data || []);
            }
        } catch (error) {
            console.error("Error loading wallet:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBalance = async () => {
        if (!addAmount || parseFloat(addAmount) <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post(API.ADD_BALANCE, {
                amount: parseFloat(addAmount),
            });

            if (response.data?.status) {
                Alert.alert("Success", "Balance added successfully");
                setAddAmount("");
                loadWalletData();
            } else {
                Alert.alert("Error", response.data?.message || "Failed to add balance");
            }
        } catch (error) {
            console.error("Error adding balance:", error);
            Alert.alert("Error", "Failed to add balance");
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const quickAmounts = [100, 500, 1000, 2000, 5000];

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#3c6178', '#3e728f', '#2c454e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wallet Balance</Text>
                <TouchableOpacity onPress={loadWalletData} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3e728f" />
                    <Text style={styles.loadingText}>Loading wallet...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Balance Card */}
                    <LinearGradient
                        colors={['#3c6178', '#3e728f', '#50869a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <Text style={styles.balanceLabel}>Current Balance</Text>
                        <Text style={styles.balanceAmount}>₹{balance.toLocaleString()}</Text>
                        <Text style={styles.balanceNote}>Available for bookings</Text>
                    </LinearGradient>

                    {/* Add Money Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Add Money</Text>
                        
                        {/* Quick Amount Buttons */}
                        <View style={styles.quickAmounts}>
                            {quickAmounts.map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[
                                        styles.quickAmountBtn,
                                        addAmount === amount.toString() && styles.quickAmountBtnActive,
                                    ]}
                                    onPress={() => setAddAmount(amount.toString())}
                                >
                                    <Text style={[
                                        styles.quickAmountText,
                                        addAmount === amount.toString() && styles.quickAmountTextActive,
                                    ]}>
                                        ₹{amount}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Amount Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter amount"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                value={addAmount}
                                onChangeText={setAddAmount}
                            />
                        </View>

                        {/* Add Button */}
                        <TouchableOpacity
                            style={[styles.addButton, processing && styles.addButtonDisabled]}
                            onPress={handleAddBalance}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="wallet" size={20} color="#fff" />
                                    <Text style={styles.addButtonText}>Add to Wallet</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Recent Transactions */}
                    {recentTransactions.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Transactions</Text>
                            {recentTransactions.map((item, index) => (
                                <View key={index} style={styles.transactionItem}>
                                    <View style={styles.transactionLeft}>
                                        <View style={[
                                            styles.transactionIcon,
                                            { backgroundColor: item.amount > 0 ? '#d1fae5' : '#fee2e2' }
                                        ]}>
                                            <Ionicons
                                                name={item.amount > 0 ? "arrow-down" : "arrow-up"}
                                                size={16}
                                                color={item.amount > 0 ? '#10b981' : '#ef4444'}
                                            />
                                        </View>
                                        <View>
                                            <Text style={styles.transactionTitle}>
                                                {item.description || (item.amount > 0 ? "Money Added" : "Payment")}
                                            </Text>
                                            <Text style={styles.transactionDate}>
                                                {formatDate(item.createdAt || item.createdOn)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[
                                        styles.transactionAmount,
                                        { color: item.amount > 0 ? '#10b981' : '#ef4444' }
                                    ]}>
                                        {item.amount > 0 ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
                                    </Text>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={styles.viewAllBtn}
                                onPress={() => navigation.navigate("TransactionHistory")}
                            >
                                <Text style={styles.viewAllText}>View All Transactions</Text>
                                <Ionicons name="arrow-forward" size={16} color="#50869a" />
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 50,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748b",
    },
    balanceCard: {
        margin: 16,
        padding: 24,
        borderRadius: 20,
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    balanceLabel: {
        fontSize: 14,
        color: "#e0f2f1",
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 4,
    },
    balanceNote: {
        fontSize: 12,
        color: "#e0f2f1",
    },
    section: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 16,
    },
    quickAmounts: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
    },
    quickAmountBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    quickAmountBtnActive: {
        backgroundColor: "#50869a",
        borderColor: "#50869a",
    },
    quickAmountText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#64748b",
    },
    quickAmountTextActive: {
        color: "#fff",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        backgroundColor: "#f8fafc",
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: "#1e293b",
    },
    addButton: {
        backgroundColor: "#50869a",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    addButtonDisabled: {
        opacity: 0.6,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    transactionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    transactionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    transactionTitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1e293b",
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 11,
        color: "#64748b",
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: "600",
    },
    viewAllBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        gap: 4,
    },
    viewAllText: {
        fontSize: 14,
        color: "#50869a",
        fontWeight: "500",
    },
});
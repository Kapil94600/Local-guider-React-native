import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function TransactionHistory({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all"); // all, credit, debit

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            const response = await api.post(API.GET_TRANSACTION, {
                page: 1,
                perPage: 50,
            });

            if (response.data?.status) {
                const data = response.data.data || [];
                // Sort by date (newest first)
                const sorted = data.sort((a, b) => 
                    new Date(b.createdAt || b.createdOn) - new Date(a.createdAt || a.createdOn)
                );
                setTransactions(sorted);
            }
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTransactions();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFilteredTransactions = () => {
        if (filter === "all") return transactions;
        return transactions.filter(t => 
            filter === "credit" ? t.amount > 0 : t.amount < 0
        );
    };

    const getBalanceStats = () => {
        let credits = 0, debits = 0;
        transactions.forEach(t => {
            if (t.amount > 0) credits += t.amount;
            else debits += Math.abs(t.amount);
        });
        return { credits, debits };
    };

    const stats = getBalanceStats();
    const filteredTransactions = getFilteredTransactions();

    const renderTransaction = ({ item }) => (
        <View style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: item.amount > 0 ? '#d1fae5' : '#fee2e2' }
                ]}>
                    <Ionicons
                        name={item.amount > 0 ? "arrow-down" : "arrow-up"}
                        size={20}
                        color={item.amount > 0 ? '#10b981' : '#ef4444'}
                    />
                </View>
                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                        {item.description || (item.amount > 0 ? "Money Added" : "Payment")}
                    </Text>
                    <Text style={styles.transactionDate}>
                        {formatDate(item.createdAt || item.createdOn)}
                    </Text>
                    {item.transactionId && (
                        <Text style={styles.transactionId}>
                            ID: {item.transactionId}
                        </Text>
                    )}
                </View>
            </View>
            <View style={styles.transactionRight}>
                <Text style={[
                    styles.transactionAmount,
                    { color: item.amount > 0 ? '#10b981' : '#ef4444' }
                ]}>
                    {item.amount > 0 ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
                </Text>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'completed' ? '#d1fae5' : '#fed7aa' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: item.status === 'completed' ? '#10b981' : '#f97316' }
                    ]}>
                        {item.status || 'completed'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const FilterButton = ({ title, value }) => (
        <TouchableOpacity
            style={[
                styles.filterBtn,
                filter === value && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(value)}
        >
            <Text style={[
                styles.filterBtnText,
                filter === value && styles.filterBtnTextActive,
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

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
                <Text style={styles.headerTitle}>Transaction History</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Credits</Text>
                    <Text style={[styles.statValue, { color: '#10b981' }]}>
                        ₹{stats.credits.toLocaleString()}
                    </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Debits</Text>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>
                        ₹{stats.debits.toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <FilterButton title="All" value="all" />
                <FilterButton title="Credits" value="credit" />
                <FilterButton title="Debits" value="debit" />
            </View>

            {/* Transactions List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3e728f" />
                    <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
            ) : filteredTransactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={60} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No transactions found</Text>
                    <Text style={styles.emptyText}>
                        {filter === "all" 
                            ? "You haven't made any transactions yet"
                            : `No ${filter} transactions found`}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTransactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#3e728f"]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
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
    statsContainer: {
        flexDirection: "row",
        backgroundColor: "#fff",
        margin: 16,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statCard: {
        flex: 1,
        alignItems: "center",
    },
    statLabel: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
    },
    statDivider: {
        width: 1,
        backgroundColor: "#e2e8f0",
        marginHorizontal: 16,
    },
    filterContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    filterBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
    },
    filterBtnActive: {
        backgroundColor: "#50869a",
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#64748b",
    },
    filterBtnTextActive: {
        color: "#fff",
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
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    transactionCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: "500",
        color: "#1e293b",
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 11,
        color: "#64748b",
        marginBottom: 2,
    },
    transactionId: {
        fontSize: 10,
        color: "#94a3b8",
    },
    transactionRight: {
        alignItems: "flex-end",
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "500",
        textTransform: "capitalize",
    },
});
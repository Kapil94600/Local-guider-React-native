// src/screens/Admin/payments/AdminRevenue.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

export default function AdminRevenue({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
    const [timeFilter, setTimeFilter] = useState("monthly"); // daily, weekly, monthly, yearly
    const [revenueData, setRevenueData] = useState({
        summary: {
            totalRevenue: 125400,
            totalBookings: 386,
            averageBooking: 325,
            commissionEarned: 25080,
            pendingPayouts: 12000,
        },
        monthlyRevenue: [
            { month: "Jan", revenue: 12000, bookings: 30 },
            { month: "Feb", revenue: 19000, bookings: 45 },
            { month: "Mar", revenue: 15000, bookings: 38 },
            { month: "Apr", revenue: 22000, bookings: 55 },
            { month: "May", revenue: 18000, bookings: 42 },
            { month: "Jun", revenue: 25000, bookings: 62 },
            { month: "Jul", revenue: 28000, bookings: 70 },
            { month: "Aug", revenue: 24000, bookings: 60 },
        ],
        revenueByService: [
            { name: "Tour Guide", revenue: 45000, color: "#FF6384", percentage: 36 },
            { name: "Photographer", revenue: 35000, color: "#36A2EB", percentage: 28 },
            { name: "Hotel Booking", revenue: 25000, color: "#FFCE56", percentage: 20 },
            { name: "Transport", revenue: 15000, color: "#4BC0C0", percentage: 12 },
            { name: "Packages", revenue: 5400, color: "#9966FF", percentage: 4 },
        ],
        topPerformers: [
            { id: 1, name: "Rahul Sharma", type: "Tour Guide", earnings: 15000, bookings: 25 },
            { id: 2, name: "Priya Patel", type: "Photographer", earnings: 12000, bookings: 20 },
            { id: 3, name: "Amit Kumar", type: "Tour Guide", earnings: 9500, bookings: 18 },
            { id: 4, name: "Sneha Singh", type: "Photographer", earnings: 8000, bookings: 15 },
            { id: 5, name: "Rajesh Verma", type: "Tour Guide", earnings: 7500, bookings: 14 },
        ],
        recentTransactions: [
            { id: 1, user: "John Doe", amount: 5000, type: "Tour Guide", date: "2024-02-10", status: "completed" },
            { id: 2, user: "Jane Smith", amount: 3000, type: "Photographer", date: "2024-02-09", status: "completed" },
            { id: 3, user: "Mike Johnson", amount: 15000, type: "Tour Package", date: "2024-02-08", status: "completed" },
            { id: 4, user: "Sarah Williams", amount: 8000, type: "Hotel", date: "2024-02-07", status: "completed" },
            { id: 5, user: "Robert Brown", amount: 4500, type: "Transport", date: "2024-02-06", status: "completed" },
        ],
    });

    useEffect(() => {
        // In real app, fetch data based on timeFilter
        fetchRevenueData();
    }, [timeFilter]);

    const fetchRevenueData = async () => {
        // Mock API call
        // Update data based on timeFilter
        setRefreshing(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRevenueData();
        setRefreshing(false);
    };

    const StatCard = ({ title, value, icon, color, subText }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statHeader}>
                <Ionicons name={icon} size={24} color={color} />
                <Text style={styles.statValue}>{value}</Text>
            </View>
            <Text style={styles.statTitle}>{title}</Text>
            {subText && <Text style={styles.statSubText}>{subText}</Text>}
        </View>
    );

    const PerformerItem = ({ item, index }) => (
        <TouchableOpacity style={styles.performerItem}>
            <View style={styles.performerRank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
            <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{item.name}</Text>
                <Text style={styles.performerType}>{item.type}</Text>
            </View>
            <View style={styles.performerStats}>
                <Text style={styles.earningsText}>₹{item.earnings.toLocaleString()}</Text>
                <Text style={styles.bookingsText}>{item.bookings} bookings</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Revenue Analytics</Text>
                <TouchableOpacity onPress={() => Alert.alert("Export", "Export report feature")}>
                    <Ionicons name="download-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* TIME FILTER */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity 
                            style={[styles.timeFilterBtn, timeFilter === "daily" && styles.timeFilterBtnActive]}
                            onPress={() => setTimeFilter("daily")}
                        >
                            <Text style={[styles.timeFilterText, timeFilter === "daily" && styles.timeFilterTextActive]}>
                                Daily
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.timeFilterBtn, timeFilter === "weekly" && styles.timeFilterBtnActive]}
                            onPress={() => setTimeFilter("weekly")}
                        >
                            <Text style={[styles.timeFilterText, timeFilter === "weekly" && styles.timeFilterTextActive]}>
                                Weekly
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.timeFilterBtn, timeFilter === "monthly" && styles.timeFilterBtnActive]}
                            onPress={() => setTimeFilter("monthly")}
                        >
                            <Text style={[styles.timeFilterText, timeFilter === "monthly" && styles.timeFilterTextActive]}>
                                Monthly
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.timeFilterBtn, timeFilter === "yearly" && styles.timeFilterBtnActive]}
                            onPress={() => setTimeFilter("yearly")}
                        >
                            <Text style={[styles.timeFilterText, timeFilter === "yearly" && styles.timeFilterTextActive]}>
                                Yearly
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* SUMMARY STATS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Revenue Summary</Text>
                    <View style={styles.statsGrid}>
                        <StatCard 
                            title="Total Revenue" 
                            value={`₹${revenueData.summary.totalRevenue.toLocaleString()}`} 
                            icon="cash-outline" 
                            color="#10B981"
                            subText="All time"
                        />
                        <StatCard 
                            title="Total Bookings" 
                            value={revenueData.summary.totalBookings} 
                            icon="calendar-outline" 
                            color="#3B82F6"
                            subText={`Avg: ₹${revenueData.summary.averageBooking}`}
                        />
                        <StatCard 
                            title="Commission Earned" 
                            value={`₹${revenueData.summary.commissionEarned.toLocaleString()}`} 
                            icon="trending-up-outline" 
                            color="#F59E0B"
                            subText="20% platform fee"
                        />
                        <StatCard 
                            title="Pending Payouts" 
                            value={`₹${revenueData.summary.pendingPayouts.toLocaleString()}`} 
                            icon="time-outline" 
                            color="#EF4444"
                            subText="To service providers"
                        />
                    </View>
                </View>

                {/* REVENUE TREND CHART */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Revenue Trend</Text>
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={{
                                labels: revenueData.monthlyRevenue.map(d => d.month),
                                datasets: [{
                                    data: revenueData.monthlyRevenue.map(d => d.revenue / 1000),
                                }]
                            }}
                            width={width - 40}
                            height={220}
                            chartConfig={{
                                backgroundColor: "#fff",
                                backgroundGradientFrom: "#fff",
                                backgroundGradientTo: "#fff",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                                style: { borderRadius: 16 },
                                barPercentage: 0.5,
                            }}
                            style={styles.chart}
                        />
                    </View>
                </View>

                {/* REVENUE BY SERVICE */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Revenue by Service</Text>
                    <View style={styles.revenueByService}>
                        <PieChart
                            data={revenueData.revenueByService}
                            width={width - 40}
                            height={200}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            }}
                            accessor="revenue"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                        <View style={styles.serviceLegend}>
                            {revenueData.revenueByService.map((service, index) => (
                                <View key={index} style={styles.legendItem}>
                                    <View style={[styles.legendColor, { backgroundColor: service.color }]} />
                                    <View style={styles.legendTextContainer}>
                                        <Text style={styles.legendText}>{service.name}</Text>
                                        <Text style={styles.legendSubText}>
                                            ₹{service.revenue.toLocaleString()} ({service.percentage}%)
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* TOP PERFORMERS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top Performers</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("UserListScreen")}>
                            <Text style={styles.seeAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.performersContainer}>
                        {revenueData.topPerformers.map((performer, index) => (
                            <PerformerItem key={performer.id} item={performer} index={index} />
                        ))}
                    </View>
                </View>

                {/* RECENT TRANSACTIONS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent High-Value Transactions</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("AdminTransactions")}>
                            <Text style={styles.seeAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.transactionsContainer}>
                        {revenueData.recentTransactions.map((transaction) => (
                            <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
                                <View style={styles.transactionIcon}>
                                    <Ionicons 
                                        name={transaction.type.includes("Tour") ? "map-outline" : 
                                              transaction.type.includes("Photo") ? "camera-outline" : 
                                              transaction.type.includes("Hotel") ? "business-outline" : "car-outline"} 
                                        size={20} 
                                        color="#42738f" 
                                    />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionUser}>{transaction.user}</Text>
                                    <Text style={styles.transactionType}>{transaction.type}</Text>
                                </View>
                                <View style={styles.transactionAmount}>
                                    <Text style={styles.amountText}>₹{transaction.amount.toLocaleString()}</Text>
                                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* BOTTOM SPACER */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#f8fafc" 
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#10B981",
        paddingTop: 40,
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#fff" 
    },
    filterContainer: {
        padding: 16,
        backgroundColor: "#fff",
    },
    timeFilterBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        marginRight: 12,
    },
    timeFilterBtnActive: {
        backgroundColor: "#10B981",
    },
    timeFilterText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    timeFilterTextActive: {
        color: "#fff",
    },
    section: { 
        marginHorizontal: 20, 
        marginBottom: 24 
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#1e293b" 
    },
    seeAllText: { 
        fontSize: 14, 
        color: "#10B981", 
        fontWeight: "600" 
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statCard: {
        backgroundColor: "#fff",
        width: "48%",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    statValue: { 
        fontSize: 20, 
        fontWeight: "700", 
        color: "#1e293b" 
    },
    statTitle: { 
        fontSize: 14, 
        color: "#64748b", 
        fontWeight: "500" 
    },
    statSubText: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 4,
    },
    chartContainer: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    chart: { 
        borderRadius: 16, 
        marginVertical: 8 
    },
    revenueByService: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    serviceLegend: { 
        flex: 1, 
        marginLeft: 16 
    },
    legendItem: { 
        flexDirection: "row", 
        alignItems: "center", 
        marginBottom: 12 
    },
    legendColor: { 
        width: 12, 
        height: 12, 
        borderRadius: 6, 
        marginRight: 8 
    },
    legendTextContainer: {
        flex: 1,
    },
    legendText: { 
        fontSize: 14, 
        color: "#475569", 
        fontWeight: "500" 
    },
    legendSubText: { 
        fontSize: 12, 
        color: "#94a3b8", 
        marginTop: 2 
    },
    performersContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    performerItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    performerRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rankText: { 
        fontSize: 14, 
        fontWeight: "700", 
        color: "#42738f" 
    },
    performerInfo: {
        flex: 1,
    },
    performerName: { 
        fontSize: 14, 
        fontWeight: "600", 
        color: "#1e293b", 
        marginBottom: 2 
    },
    performerType: { 
        fontSize: 12, 
        color: "#64748b" 
    },
    performerStats: {
        alignItems: "flex-end",
    },
    earningsText: { 
        fontSize: 16, 
        fontWeight: "700", 
        color: "#10B981", 
        marginBottom: 2 
    },
    bookingsText: { 
        fontSize: 12, 
        color: "#94a3b8" 
    },
    transactionsContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    transactionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionUser: { 
        fontSize: 14, 
        fontWeight: "600", 
        color: "#1e293b", 
        marginBottom: 2 
    },
    transactionType: { 
        fontSize: 12, 
        color: "#64748b" 
    },
    transactionAmount: {
        alignItems: "flex-end",
    },
    amountText: { 
        fontSize: 16, 
        fontWeight: "700", 
        color: "#1e293b", 
        marginBottom: 2 
    },
    transactionDate: { 
        fontSize: 12, 
        color: "#94a3b8" 
    },
    bottomSpacer: {
        height: 80,
    },
});
import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Modal, Image, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';

type OrderSummary = {
  order_id: number;
  total_price: string; // could be string or number
  status: string;
  restaurant_name: string;
  logo_url: string;
};

type OrderDetails = {
  order_id: number;
  total_price: string;
  status: string;
  restaurant_name: string;
  logo_url: string;
  items: {
    item_id: number;
    quantity: number;
    name: string;
    price: string;
    image_url: string;
  }[];
};

type TimeLeftResponse = {
  time_left: string; // Adjust according to the response format from the API
};

export default function Orders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // For displaying order details in a modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);  // New state for time left
  
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`https://46v7j70nxk.execute-api.ap-south-1.amazonaws.com/dev/orders`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        setOrders(data.orders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleViewOrTrackOrder = async (orderId: number) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`https://46v7j70nxk.execute-api.ap-south-1.amazonaws.com/dev/order/${orderId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        Alert.alert('Error', 'Failed to fetch order details');
        setDetailsLoading(false);
        return;
      }
      const data = await res.json();
      setSelectedOrder(data.order);
      setModalVisible(true);
      setTimeLeft(null);  // Reset time left when opening the modal
    } catch (err) {
      console.error('Error fetching order details:', err);
      Alert.alert('Error', 'Failed to fetch order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const trackOrder = async (orderId: number) => {
    try {
      const res = await fetch(`https://46v7j70nxk.execute-api.ap-south-1.amazonaws.com/dev/time-left/${orderId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        Alert.alert('Error', 'Failed to fetch time left for order');
        return;
      }
      const data: TimeLeftResponse = await res.json();
      setTimeLeft('Please check you SMS/Inbox for the order status.');  // Set the time left from API response
    } catch (err) {
      console.error('Error fetching time left:', err);
      Alert.alert('Error', 'Failed to track order');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
    setTimeLeft(null);  // Reset time left when closing the modal
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="darkblue" />
      </View>
    );
  }

  const activeOrders = orders.filter(order => order.status === 'Pending');
  const pastOrders = orders.filter(order => order.status === 'Delivered');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Active Orders</Text>
        {activeOrders.map(order => (
          <View key={order.order_id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Image source={{ uri: order.logo_url }} style={styles.restaurantLogo} />
              <View style={styles.orderInfo}>
                <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
                <Text style={styles.orderStatus}>Status: {order.status}</Text>
              </View>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderId}>Order ID: {order.order_id}</Text>
              <Text style={styles.orderTotal}>
                Total: ₹ {Number(order.total_price).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.orderButton, styles.pendingButton]}
              onPress={() => handleViewOrTrackOrder(order.order_id)}
            >
              <Text style={styles.orderButtonText}>Out for Delivery</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionHeader}>Past Orders</Text>
        {pastOrders.map(order => (
          <View key={order.order_id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Image source={{ uri: order.logo_url }} style={styles.restaurantLogo} />
              <View style={styles.orderInfo}>
                <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
                <Text style={styles.orderStatus}>Status: {order.status}</Text>
              </View>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderId}>Order ID: {order.order_id}</Text>
              <Text style={styles.orderTotal}>
                Total: ₹ {Number(order.total_price).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.orderButton, styles.deliveredButton]}
              onPress={() => handleViewOrTrackOrder(order.order_id)}
            >
              <Text style={styles.orderButtonText}>Delivered</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Order Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {detailsLoading ? (
              <ActivityIndicator size="large" color="darkblue" />
            ) : selectedOrder ? (
              <>
                <View style={styles.modalHeader}>
                  <Image source={{ uri: selectedOrder.logo_url }} style={styles.modalRestaurantLogo} />
                  <Text style={styles.modalRestaurantName}>{selectedOrder.restaurant_name}</Text>
                </View>
                <ScrollView style={styles.modalContent}>
                  {selectedOrder.items.map(item => (
                    <View key={item.item_id} style={styles.modalItem}>
                      <Image source={{ uri: item.image_url }} style={styles.modalItemImage} />
                      <View style={styles.modalItemDetails}>
                        <Text style={styles.modalItemName}>{item.name}</Text>
                        <Text style={styles.modalItemQuantity}>Quantity: {item.quantity}</Text>
                        <Text style={styles.modalItemPrice}>
                          ₹ {Number(item.price).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.modalSummary}>
                  <Text style={styles.modalTotalText}>
                    Total: ₹ {Number(selectedOrder.total_price).toFixed(2)}
                  </Text>
                  <Text style={styles.modalStatus}>Status: {selectedOrder.status}</Text>
                  {timeLeft && (
                    <Text style={styles.modalStatus}>{timeLeft}</Text> // Display time left if available
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.modalTrackButton} 
                  onPress={() => trackOrder(selectedOrder.order_id)}
                >
                  <Text style={styles.modalTrackButtonText}>Track Order</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={closeModal}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0ffb3',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#e0ffb3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1, // Added to ensure proper scrolling
    padding: 16,
    paddingBottom: 30,
  },
  sectionHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'darkblue',
    marginBottom: 16,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'darkblue',
  },
  orderStatus: {
    fontSize: 16,
    color: 'darkblue',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    color: 'darkblue',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'darkblue',
  },
  orderButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  pendingButton: {
    backgroundColor: 'orange',
  },
  deliveredButton: {
    backgroundColor: 'green',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalRestaurantLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  modalRestaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'darkblue',
  },
  modalContent: {
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#e0ffb3',
    borderRadius: 8,
    padding: 8,
  },
  modalItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 8,
  },
  modalItemDetails: {
    justifyContent: 'center',
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'darkblue',
  },
  modalItemQuantity: {
    fontSize: 16,
    color: 'darkblue',
  },
  modalItemPrice: {
    fontSize: 16,
    color: 'darkblue',
  },
  modalSummary: {
    borderTopWidth: 1,
    borderColor: 'darkblue',
    paddingTop: 12,
    marginBottom: 12,
  },
  modalTotalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'darkblue',
    textAlign: 'right',
  },
  modalStatus: {
    fontSize: 18,
    color: 'darkblue',
    textAlign: 'right',
  },
  modalCloseButton: {
    backgroundColor: 'darkblue',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTrackButton: {
    backgroundColor: 'orange',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  modalTrackButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

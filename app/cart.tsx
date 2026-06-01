import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';

type CartItem = {
  cart_item_id: number;
  item_id: number;
  quantity: number;
  name: string;
  price: number | string;
  image_url: string;
};

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch('https://1rkf50t813.execute-api.eu-north-1.amazonaws.com/prod/1', {
          method: 'GET',
          credentials: 'include'
        });
        const data = await res.json();
        setCartItems(data.cartItems);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to fetch cart');
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const deliveryCharge = 30; // fixed delivery charge
  const total = subtotal + tax + deliveryCharge;

  const handlePlaceOrder = async () => {
    try {
      const res = await fetch('https://1rkf50t813.execute-api.eu-north-1.amazonaws.com/prod/order', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setOrderPlaced(true);
        // Show the order placed animation for 3 seconds then navigate
        setTimeout(() => {
          setOrderPlaced(false);
          router.push('/');
        }, 3000);
      } else {
        Alert.alert('Error', data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'An error occurred while placing order.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="darkblue" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerText}>Your Cart</Text>
        {cartItems.map((item) => (
          <View key={item.cart_item_id} style={styles.cartItem}>
            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹ {Number(item.price).toFixed(2)}</Text>
              <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
            </View>
          </View>
        ))}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>Subtotal: ₹ {subtotal.toFixed(2)}</Text>
          <Text style={styles.summaryText}>Tax (10%): ₹ {tax.toFixed(2)}</Text>
          <Text style={styles.summaryText}>Delivery Charge: ₹ {deliveryCharge.toFixed(2)}</Text>
          <Text style={styles.totalText}>Total: ₹ {total.toFixed(2)}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder}>
        <Text style={styles.orderButtonText}>Place Order</Text>
      </TouchableOpacity>

      {orderPlaced && (
        <View style={styles.overlay}>
          <Image 
            source={{ uri: 'https://media.tenor.com/TvJUrCWgPTsAAAAj/check-mark-good.gif' }} 
            style={styles.orderPlacedGif} 
          />
          <Text style={styles.orderPlacedText}>Order placed</Text>
        </View>
      )}
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
    padding: 16,
    paddingBottom: 120,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'darkblue',
    marginBottom: 16,
    textAlign: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'darkblue',
  },
  itemPrice: {
    fontSize: 18,
    color: 'darkblue',
    marginVertical: 4,
  },
  itemQuantity: {
    fontSize: 16,
    color: 'darkblue',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryText: {
    fontSize: 18,
    color: 'darkblue',
    marginVertical: 2,
  },
  totalText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'darkblue',
    marginTop: 8,
    textAlign: 'right',
  },
  orderButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'darkblue',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderPlacedGif: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  orderPlacedText: {
    fontSize: 26,
    color: 'white',
    fontWeight: 'bold',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

type Restaurant = {
  restaurant_id: number;
  name: string;
  logo_url: string;
};

type MenuItem = {
  item_id: number;
  name: string;
  price: number | string; // Can be a number or string from API
  image_url: string;
};

export default function MenuSubway() {

    const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const restaurantId = 3; // Hardcoded for KFC; change as needed for other restaurants
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const resRestaurants = await fetch('https://7koqa13qm3.execute-api.eu-north-1.amazonaws.com/prod/restaurants');
        const restaurantsData: Restaurant[] = await resRestaurants.json();
        const currentRestaurant = restaurantsData.find(r => r.restaurant_id === restaurantId);
        setRestaurant(currentRestaurant || null);

        const resMenu = await fetch('https://x0r7l4fplb.execute-api.eu-north-1.amazonaws.com/prod/3');
        const menuData: MenuItem[] = await resMenu.json();

        // Ensure price is always a number
        const processedMenu = menuData.map(item => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        }));

        setMenuItems(processedMenu);

        const initialQuantities: { [key: number]: number } = {};
        processedMenu.forEach(item => {
          initialQuantities[item.item_id] = 0;
        });
        setQuantities(initialQuantities);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const updateCartOnIncrement = async (itemId: number) => {
    try {
      await fetch('https://1rkf50t813.execute-api.eu-north-1.amazonaws.com/prod/add', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: [itemId] }),
      });
    } catch (error) {
      console.error('Error updating cart on increment', error);
      Alert.alert('Error', 'Failed to update cart');
    }
  };

  const updateCartOnDecrement = async (itemId: number) => {
    try {
      await fetch('https://1rkf50t813.execute-api.eu-north-1.amazonaws.com/prod/add', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: [itemId], remove: true }),
      });
    } catch (error) {
      console.error('Error updating cart on decrement', error);
      Alert.alert('Error', 'Failed to update cart');
    }
  };

  const handleIncrement = (itemId: number) => {
    setQuantities(prev => {
      const updated = { ...prev, [itemId]: prev[itemId] + 1 };
      return updated;
    });
    updateCartOnIncrement(itemId);
  };

  const handleDecrement = (itemId: number) => {
    if (quantities[itemId] > 0) {
      setQuantities(prev => {
        const updated = { ...prev, [itemId]: Math.max(prev[itemId] - 1, 0) };
        return updated;
      });
      updateCartOnDecrement(itemId);
    }
  };

  const handleGoToCart = () => {
    router.push('/cart');
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
        {restaurant && (
          <LinearGradient
          colors={['#0f9b0f', '#004d00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Image source={{ uri: restaurant.logo_url }} style={styles.restaurantLogo} />
          
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <MaterialIcons name="location-on" size={18} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 13 }}>
                VR Mall, Anna Nagar, Ch-600040
              </Text>
            </View>
          </View>
        </LinearGradient>
        )}

        <View style={styles.menuContainer}>
          {menuItems.map(item => (
            <LinearGradient key={item.item_id} colors={['#f5f5f5', '#e6e6e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.menuItem}>
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹ {item.price.toFixed(2)}</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => handleDecrement(item.item_id)} style={styles.quantityButton}>
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantities[item.item_id]}</Text>
                  <TouchableOpacity onPress={() => handleIncrement(item.item_id)} style={styles.quantityButton}>
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.cartButton} onPress={handleGoToCart}>
        <Text style={styles.cartButtonText}>Go to Cart</Text>
      </TouchableOpacity>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ebffcc',
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 100,
    height: 100,
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
    marginVertical: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: 'darkblue',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 4,
  },
  quantityText:{
    fontSize: 18,
    padding: 7,
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'darkblue',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  cartButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

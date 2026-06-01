import { useState, useEffect } from "react";
import { Image, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { images } from '@/constants/images';
import { icons } from '@/constants/icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';


// Style for the app
const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
const cardStyle = {
  borderRadius: 20,
  padding: 24,
  transform: [{ scale: 1 }],
  transition: 'transform 0.3s ease-in-out',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 8,
  marginRight: 16, // spacing between cards
  width: 250, // Fixed width for cards
};
const App = () => {
  return (
    <View style={styles2.container}>
      {/* Set the status bar to dark background with light icons */}
      <StatusBar style="dark" backgroundColor="black" />
      
      <Text>Welcome to My App!</Text>
    </View>
  );
};



export default function Index() {
  <StatusBar style="dark" />
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const styles = StyleSheet.create({
    scrollView: {
      padding: 16,
    },
    card: {
      backgroundColor: '#f0f0f0',  // Very light, almost white, ultra-clean look // Light grey background for the card
      borderRadius: 20,
      padding: 24,
      transform: [{ scale: 1 }],
      transition: 'transform 0.3s ease-in-out',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
      marginRight: 16, // spacing between cards
      width: 250, // Fixed width for cards
    },
    image: {
      width: 210, // Adjusted size for the logo
      height: 175, // Adjusted height to maintain aspect ratio
      borderRadius: 10, // Rounded rectangle style
      borderWidth: 4,
      borderColor: 'black', // Light green border for the logo
      marginBottom: 0,
      marginTop: 0,
      marginLeft: 0,
    },
    restaurantName: {
      marginTop: 8,
      fontSize: 26,
      fontFamily: 'Serif', // Beautiful, professional font
      fontWeight: '700', // Bolder for better emphasis
      textAlign: 'center',
      color: 'black', // dark blue
      letterSpacing: 1.2, // Add spacing for a refined look
    },
    button: {
      marginTop: 16,
      backgroundColor: '#008080', // teal green
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius:5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 3,
    },
    buttonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: '600',
    },
    featuredTitle: {
      fontSize: 29,
      fontFamily: 'Georgia', // Elegant, classic font
      fontWeight: '900', // Bold for a strong presence
      textAlign: 'center',
      color: '#2f4f4f', // Dark blue for elegance
      marginBottom: 8,
      letterSpacing: -0.5, // Increase letter spacing for a more refined look
    },
    subHeading: {
      fontSize: 17,
      fontFamily: 'Georgia', // Elegant and readable
      textAlign: 'center',
      color: '#2f4f4f',
      marginBottom: 16,
    },
  });

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        // Replace the URL with your backend endpoint if needed.
        const res = await fetch('https://7koqa13qm3.execute-api.eu-north-1.amazonaws.com/prod/restaurants');
        const data = await res.json();
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, []);

  return (
    <View className="flex-1 bg-[#e0ffb3]">
      <Image source={images.bg} className="absolute w-full h-full z-0" /> 
      
      <ScrollView className="flex-1 px-5">
        <View className="flex-1 justify-start items-center"> 
          {/* Even larger logo */}
          <Image source={icons.logo} className="w-48 h-40 mt-5" /> 
          <Text className="mt-0 mb-7 text-1xl font-extrabold text-center text-green-500 tracking-wide" style={{ fontFamily: 'Comic Sans MS', fontStyle: 'italic' }}>
            Dashin' dishes to your doorstep..
          </Text> 
        </View>

        {/* New horizontal scrollable section for restaurants */}
        <View className="mt-10">
          <Text style={styles.featuredTitle}>
            Featured Restaurants
          </Text>
          <Text style={styles.subHeading}>
            Discover the best eats in town.
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color="darkblue" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
              {restaurants.map((restaurant) => (
                <LinearGradient key={restaurant.restaurant_id} colors={['#f5f5f5', '#e6e6e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cardStyle} >
                  <Image 
                    source={{ uri: restaurant.logo_url }} 
                    style={styles.image}
                  />
                  <Text style={styles.restaurantName}>
                    {restaurant.name}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      const restaurantId = restaurant.restaurant_id;
                      let route = '';

                      if (restaurantId === 1) {
                        route = '/menu_kfc';
                      } else if (restaurantId === 2) {
                        route = '/menu_a2b';
                      } else if (restaurantId === 3) {
                        route = '/menu_subway';
                      } else {
                        route = `/restaurant/${restaurantId}`; // Fallback route
                      }

                      router.push(route);
                    }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>View Menu</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

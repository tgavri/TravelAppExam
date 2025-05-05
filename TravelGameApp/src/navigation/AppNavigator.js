import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import new screens
import QuestSelectionScreen from '../screens/QuestSelectionScreen';
import CityIntroScreen from '../screens/CityIntroScreen';
import LandmarkScreen from '../screens/LandmarkScreen';
import QuestCompleteScreen from '../screens/QuestCompleteScreen';

const Stack = createNativeStackNavigator();

// Neo-Brutalist Header Style Options
const headerStyleOptions = {
    headerStyle: {
        backgroundColor: '#FFFFFF', // White background
    },
    headerTintColor: '#000000', // Black text/icons
    headerTitleStyle: {
        fontWeight: 'bold', // Bold title
        fontSize: 20,
    },
    headerShadowVisible: false, // Hide default shadow
    headerBackTitleVisible: false,
    // Add border manually if needed, or style container view
};

function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="QuestSelection" // Start at the new selection screen
                screenOptions={headerStyleOptions} // Apply common styles
            >
                <Stack.Screen
                    name="QuestSelection"
                    component={QuestSelectionScreen}
                    options={{ title: 'Select Quest' }} />
                <Stack.Screen
                    name="CityIntro"
                    component={CityIntroScreen}
                    options={({ route }) => ({ title: route.params?.city?.name || 'City Quest' })}
                />
                <Stack.Screen
                    name="Landmark"
                    component={LandmarkScreen}
                // Title is set dynamically within LandmarkScreen using navigation.setOptions
                // options={({ route }) => ({ title: route.params?.currentLandmark?.name || 'Landmark' })}
                />
                <Stack.Screen
                    name="QuestComplete"
                    component={QuestCompleteScreen}
                    options={{ title: 'Quest Complete' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default AppNavigator; 
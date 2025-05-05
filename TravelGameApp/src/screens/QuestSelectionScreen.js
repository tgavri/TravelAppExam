import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import citiesData from '../data/cities.json';

// Shared Colors (Should be moved to a constants file)
const COLORS = {
    background: '#FFFFFF',
    primary: '#FF8C00', // Deep Orange
    secondary: '#0000FF', // Bright Blue
    text: '#000000',
    border: '#000000',
    buttonPressedBg: '#e0e0e0',
};

function QuestSelectionScreen({ navigation }) {
    const cities = citiesData;

    const handleCityPress = (city) => {
        // Navigate to the new CityIntroScreen
        navigation.navigate('CityIntro', { city });
    };

    return (
        <View style={styles.container}>
            {/* Updated Title */}
            <Text style={styles.title}>Which City do you want to History Quest in?</Text>
            <FlatList
                data={cities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={() => handleCityPress(item)}
                    >
                        <Text style={styles.buttonText}>{item.name}</Text>
                    </Pressable>
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

// Styles remain largely the same, maybe adjust title font size if needed
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 15,
        borderTopWidth: 2,
        borderTopColor: COLORS.border,
    },
    title: {
        fontSize: 26, // Adjusted size slightly
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 25,
        textAlign: 'center',
        borderBottomWidth: 2,
        borderColor: COLORS.border,
        paddingBottom: 10,
    },
    listContent: {
        alignItems: 'stretch',
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        shadowColor: COLORS.border,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    buttonPressed: {
        backgroundColor: COLORS.secondary,
        shadowOffset: { width: 2, height: 2 },
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});

export default QuestSelectionScreen; 
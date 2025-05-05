import * as FileSystem from 'expo-file-system';
import piexif from 'piexifjs';

export const getExifData = async (imageUri) => {
    try {
        // 1. Read the image file as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Add the required prefix for piexifjs
        const base64WithPrefix = `data:image/jpeg;base64,${base64}`;

        // 2. Extract EXIF data using piexifjs
        const exifData = piexif.load(base64WithPrefix);

        // 3. Extract relevant fields (GPS and DateTimeOriginal)
        const gps = exifData['GPS'];
        const dateTimeOriginal = exifData['Exif']?.[piexif.ExifIFD.DateTimeOriginal];

        let latitude = null;
        let longitude = null;

        if (gps && gps[piexif.GPSIFD.GPSLatitude] && gps[piexif.GPSIFD.GPSLongitude] && gps[piexif.GPSIFD.GPSLatitudeRef] && gps[piexif.GPSIFD.GPSLongitudeRef]) {
            const lat = gps[piexif.GPSIFD.GPSLatitude];
            const lon = gps[piexif.GPSIFD.GPSLongitude];
            const latRef = gps[piexif.GPSIFD.GPSLatitudeRef];
            const lonRef = gps[piexif.GPSIFD.GPSLongitudeRef];

            // Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
            latitude = (lat[0][0] / lat[0][1]) + (lat[1][0] / lat[1][1] / 60) + (lat[2][0] / lat[2][1] / 3600);
            longitude = (lon[0][0] / lon[0][1]) + (lon[1][0] / lon[1][1] / 60) + (lon[2][0] / lon[2][1] / 3600);

            // Adjust sign based on reference (N/S, E/W)
            if (latRef === 'S') latitude = -latitude;
            if (lonRef === 'W') longitude = -longitude;
        }

        return {
            latitude,
            longitude,
            dateTimeOriginal,
        };

    } catch (error) {
        console.error('Error reading EXIF data:', error);
        return null;
    }
}; 
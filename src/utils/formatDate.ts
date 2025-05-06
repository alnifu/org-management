import { format } from 'date-fns';

export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return format(date, 'MMMM d, yyyy'); // You can adjust the format string as needed
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date'; // Or some other fallback
    }
};

// Example of another useful format
export const formatDateTime = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return format(date, 'MMMM d, yyyy h:mm a');
    } catch (error) {
        console.error('Error formatting date and time:', error);
        return 'Invalid Date';
    }
};

// Example of a short date format
export const formatShortDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return format(date, 'yyyy-MM-dd');
    } catch (error) {
        console.error('Error formatting short date:', error);
        return 'Invalid Date';
    }
};
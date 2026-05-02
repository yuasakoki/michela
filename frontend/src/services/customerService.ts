import { API_ENDPOINTS } from '@/constants/api';
import { authFetch } from './authService';

export interface Customer {
    id: string;
    name: string;
    age: number;
    height: number;
    weight: number;
    favorite_food: string;
    completion_date: string;
}

/**
 * 顧客情報を取得
 */
export const fetchCustomerApi = async (customerId: string): Promise<Customer | null> => {
    try {
        const response = await authFetch(API_ENDPOINTS.CUSTOMER(customerId));
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
};

/**
 * 全顧客一覧を取得
 */
export const fetchAllCustomersApi = async (): Promise<Customer[]> => {
    try {
        const response = await authFetch(API_ENDPOINTS.CUSTOMERS);
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
};

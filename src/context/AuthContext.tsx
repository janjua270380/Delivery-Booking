import  React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  workerPermissions: {
    viewCustomers: boolean;
    manageBookings: boolean;
    viewPricing: boolean;
    managePricing: boolean;
  } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, company?: string, phone?: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workerPermissions, setWorkerPermissions] = useState<{
    viewCustomers: boolean;
    manageBookings: boolean;
    viewPricing: boolean;
    managePricing: boolean;
  } | null>(null);

  useEffect(() => {
    // Check for saved user in localStorage on initial load
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // If worker, get permissions
      if (parsedUser.isWorker) {
        setWorkerPermissions(parsedUser.workerPermissions || {
          viewCustomers: false,
          manageBookings: false,
          viewPricing: false,
          managePricing: false
        });
      }
    }

    // Create a default user if no users are registered yet
    const usersStr = localStorage.getItem('registeredUsers');
    if (!usersStr || JSON.parse(usersStr).length === 0) {
      // Create a demo user and admin
      const defaultUsers = [
        {
          id: 'demo1',
          name: 'Demo User',
          email: 'demo@example.com',
          password: 'password',
          company: 'Demo Company Ltd',
          phone: '07700 900123',
          registeredAt: new Date().toISOString()
        },
        {
          id: 'admin1',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          company: 'Delivery Company Ltd',
          phone: '07700 900456',
          registeredAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('registeredUsers', JSON.stringify(defaultUsers));
      console.log('Default users created:', defaultUsers);
    }

    setIsLoading(false);
  }, []);

  // For demo, we'll use a mock login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // This is just for demo, in a real app we'd make an API call
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if this email is already registered
      const usersStr = localStorage.getItem('registeredUsers');
      const users = usersStr ? JSON.parse(usersStr) : [];
      const existingUser = users.find((u: any) => u.email === email);
      
      if (!existingUser) {
        throw new Error('User not found. Please register first.');
      }
      
      // Admin account
      if (email === 'admin@example.com') {
        const adminUser: User = {
          id: 'admin1',
          name: 'Admin User',
          email: 'admin@example.com',
          company: 'Delivery Company Ltd',
          phone: existingUser.phone || '',
          avatar: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBhZG1pbiUyMGRhc2hib2FyZCUyMHVzZXIlMjBwZXJtaXNzaW9uJTIwbWFuYWdlbWVudHxlbnwwfHx8fDE3NDM5NTgzMjl8MA&ixlib=rb-4.0.3&fit=fillmax&h=500&w=800',
          isAdmin: true
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        setWorkerPermissions(null);
      } else if (existingUser.isWorker) {
        // Worker account
        const workerUser: User = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          company: existingUser.company || 'Delivery Company Ltd',
          phone: existingUser.phone || '',
          avatar: `https://avatars.dicebear.com/api/initials/${encodeURIComponent(existingUser.name)}.svg`,
          isAdmin: false,
          isWorker: true,
          workerPermissions: existingUser.workerPermissions || {
            viewCustomers: false,
            manageBookings: false, 
            viewPricing: false,
            managePricing: false
          }
        };
        
        setUser(workerUser);
        localStorage.setItem('user', JSON.stringify(workerUser));
        setWorkerPermissions(workerUser.workerPermissions || {
          viewCustomers: false,
          manageBookings: false,
          viewPricing: false,
          managePricing: false
        });
      } else {
        // Regular users
        const mockUser: User = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          company: existingUser.company,
          phone: existingUser.phone || '',
          avatar: `https://avatars.dicebear.com/api/initials/${encodeURIComponent(existingUser.name)}.svg`,
          isAdmin: false,
          isWorker: false
        };
        
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setWorkerPermissions(null);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error((error as Error).message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, company?: string, phone?: string) => {
    setIsLoading(true);
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if the email is already registered
      const usersStr = localStorage.getItem('registeredUsers');
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      if (users.some((user: any) => user.email === email)) {
        throw new Error('This email is already registered. Please log in instead.');
      }
      
      // Generate a unique ID
      const id = Math.random().toString(36).substr(2, 9);
      
      // Create the new user
      const newUser = {
        id,
        name,
        email,
        company,
        phone,
        password, // In a real app, this would be hashed
        registeredAt: new Date().toISOString()
      };
      
      // Save the user to "database"
      const updatedUsers = [...users, newUser];
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      
      // Now create the user object to return (without password)
      const userObject: User = {
        id,
        name,
        email,
        company,
        phone,
        avatar: `https://avatars.dicebear.com/api/initials/${encodeURIComponent(name)}.svg`,
        isAdmin: false,
        isWorker: false
      };
      
      setUser(userObject);
      localStorage.setItem('user', JSON.stringify(userObject));
      setWorkerPermissions(null);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error((error as Error).message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('No user is logged in');
    }

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Update the user in localStorage
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Also update in the registered users list
      const usersStr = localStorage.getItem('registeredUsers');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const updatedUsers = users.map((registeredUser: any) => {
          if (registeredUser.id === user.id) {
            return {
              ...registeredUser,
              name: updatedUser.name,
              email: updatedUser.email,
              company: updatedUser.company,
              phone: updatedUser.phone
            };
          }
          return registeredUser;
        });
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  const logout = () => {
    setUser(null);
    setWorkerPermissions(null);
    localStorage.removeItem('user');
    // Don't remove deliveryBookings from localStorage anymore
    // This allows admin to see all bookings even after users log out
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: !!user?.isAdmin,
      isWorker: !!user?.isWorker,
      workerPermissions,
      isLoading,
      login,
      logout,
      register,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
 
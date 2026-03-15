// Family types
export interface Family {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    mealConfig: MealConfig;
}

export interface MealConfig {
    breakfast: MealSlotConfig;
    lunch: MealSlotConfig;
    dinner: MealSlotConfig;
}

export interface MealSlotConfig {
    time: string; // "HH:mm" e.g. "08:00"
    schedulerOffsetMins: number; // how many mins before meal time to pick dish
    enabled: boolean;
}

// Member types
export interface Member {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
    fcmToken?: string;
    joinedAt: Date;
    avatarColor?: string;
}

// Invite
export interface Invite {
    id: string;
    email: string;
    name: string;
    invitedBy: string;
    invitedByName: string;
    familyId: string;
    familyName: string;
    status: 'pending' | 'accepted' | 'expired';
    token: string;
    createdAt: Date;
}

// Dish types
export type MealSlotType = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_SLOT_EMOJIS: Record<MealSlotType, string> = {
    breakfast: '☀️',
    lunch: '🌤️',
    dinner: '🌙',
};

export interface Dish {
    id: string;
    name: string;
    mealSlots: MealSlotType[];
    addedBy: string;
    addedByName: string;
    description?: string;
    isVeg: boolean;
    imageUrl?: string;
    createdAt: Date;
}

// Meal Slot Day types
export interface MealSlotDay {
    id: string; // e.g. "2024-02-25_dinner"
    date: string; // "2024-02-25"
    slot: MealSlotType;
    scheduledDishId?: string;
    scheduledDishName?: string; // For static dishes or display
    scheduledDish?: Dish;
    scheduledAt?: Date;
    status: 'pending' | 'scheduled' | 'confirmed';
    autoScheduled?: boolean; // Flag to indicate auto-scheduled dish
}

// Nomination & Voting
export interface Comment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
}

export interface Nomination {
    id: string;
    dishId: string;
    dish?: Dish;
    nominatedBy: string;
    nominatedByName: string;
    nominatedAt: Date;
    votes: Record<string, true>; // { userId: true }
    comments: Comment[];
}

// Auth
export interface AppUser {
    uid: string;
    email: string;
    displayName: string;
    familyId?: string;
    avatarColor?: string;
}

// Unique ID generator (replaces nanoid dependency)
export const nanoid = (length = 21): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Avatar color based on name
const AVATAR_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFA726', '#FFCA28',
    '#66BB6A', '#26C6DA', '#42A5F5', '#7E57C2',
    '#EC407A', '#AB47BC',
];

export const generateAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Format date as "Mon, 25 Feb"
export const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
};

// Format time "HH:mm" → "8:00 AM"
export const formatTime = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const getMealSlotLabel = (slot: string): string => {
    const labels: Record<string, string> = {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner',
    };
    return labels[slot] ?? slot;
};

export const getWhatsAppShareText = (
    inviteeName: string,
    familyName: string,
    inviterName: string,
    inviteLink: string
): string => {
    return encodeURIComponent(
        `Hi ${inviteeName}! 👋\n\n` +
        `${inviterName} has invited you to join the *${familyName}* family on *Aaj Kya Banega?* 🍽️\n\n` +
        `This app helps your family decide what to cook for breakfast, lunch and dinner — no more endless debates!\n\n` +
        `Click the link below to join:\n${inviteLink}\n\n` +
        `_If the link doesn't open automatically, download the app first and then click the link._`
    );
};

export const getTodayDateString = (): string => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

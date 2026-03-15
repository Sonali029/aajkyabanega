import React from 'react';
import { addDays, subDays, startOfDay, isSameDay, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateStripProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

const DateStrip: React.FC<DateStripProps> = ({
    selectedDate,
    onSelectDate,
}) => {
    const today = startOfDay(new Date());

    // Generate array of 3 dates: yesterday, today, tomorrow (relative to selectedDate)
    const dates = [
        subDays(selectedDate, 1),
        selectedDate,
        addDays(selectedDate, 1),
    ];

    const handlePrev = () => onSelectDate(subDays(selectedDate, 1));
    const handleNext = () => onSelectDate(addDays(selectedDate, 1));

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
                onClick={handlePrev}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', color: 'var(--text-secondary)'
                }}
            >
                <ChevronLeft size={20} />
            </button>

            {dates.map((date) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);

                return (
                    <div
                        key={date.toISOString()}
                        onClick={() => onSelectDate(date)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '42px',
                            height: '56px',
                            borderRadius: '12px',
                            background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            color: isSelected ? 'white' : 'var(--text)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 8px rgba(var(--primary-rgb), 0.3)' : 'none'
                        }}
                    >
                        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                            {format(date, 'EEE')}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1, margin: '1px 0' }}>
                            {format(date, 'd')}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                            {format(date, 'MMM')}
                        </div>
                    </div>
                );
            })}

            <button
                onClick={handleNext}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', color: 'var(--text-secondary)'
                }}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default DateStrip;

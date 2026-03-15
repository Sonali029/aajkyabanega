import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateMealConfig } from '../../services/family.service';
import { MealConfig, MealSlotType, MEAL_SLOT_EMOJIS } from '../../types';
import { getMealSlotLabel, formatTime } from '../../utils/helpers';

const SLOTS: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

const OFFSET_OPTIONS = [
    { label: '30 min before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '3 hours before', value: 180 },
    { label: 'Custom', value: -1 },
];

const MealConfigPage: React.FC = () => {
    const { family, refreshFamily } = useAuth();
    const [config, setConfig] = useState<MealConfig>(
        family?.mealConfig ?? {
            breakfast: { time: '08:00', schedulerOffsetMins: 60, enabled: true },
            lunch: { time: '13:00', schedulerOffsetMins: 60, enabled: true },
            dinner: { time: '20:00', schedulerOffsetMins: 60, enabled: true },
        }
    );
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const updateSlotConfig = (slot: MealSlotType, field: string, value: unknown) => {
        setConfig(prev => ({
            ...prev,
            [slot]: { ...prev[slot], [field]: value },
        }));
    };

    const handleOffsetChange = (slot: MealSlotType, value: number) => {
        if (value === -1) {
            // Custom: keep current custom value
        } else {
            updateSlotConfig(slot, 'schedulerOffsetMins', value);
        }
    };

    const handleSave = async () => {
        if (!family?.id) return;
        setSaving(true);
        try {
            await updateMealConfig(family.id, config);
            await refreshFamily();
            showToast('✅ Settings saved!');
        } catch {
            showToast('❌ Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const slotColors: Record<MealSlotType, string> = {
        breakfast: 'linear-gradient(135deg, #FF9A3C, #FFD166)',
        lunch: 'linear-gradient(135deg, #06D6A0, #4CC9F0)',
        dinner: 'linear-gradient(135deg, #7B2FBE, #EC407A)',
    };

    return (
        <div className="animate-up" style={{ paddingBottom: 100 }}>
            <div className="page-header">
                <h1 className="page-header-title">⚙️ Meal Settings</h1>
                <p className="page-header-sub">Configure meal times & scheduler</p>
            </div>

            <div style={{ padding: '0 16px' }}>
                {SLOTS.map(slot => {
                    const sc = config[slot];
                    const isCustomOffset = !OFFSET_OPTIONS.some(o => o.value === sc.schedulerOffsetMins && o.value !== -1);

                    return (
                        <div key={slot} className="config-card">
                            <div className="config-header">
                                <div
                                    className="config-slot-icon"
                                    style={{ background: slotColors[slot] }}
                                >
                                    {MEAL_SLOT_EMOJIS[slot]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{getMealSlotLabel(slot)}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        Scheduled at {formatTime(sc.time)}
                                    </div>
                                </div>
                                <div
                                    className={`toggle ${sc.enabled ? 'on' : ''}`}
                                    onClick={() => updateSlotConfig(slot, 'enabled', !sc.enabled)}
                                />
                            </div>

                            {sc.enabled && (
                                <div className="config-body">
                                    {/* Meal time */}
                                    <div className="config-row">
                                        <div>
                                            <div className="config-row-label">Meal time</div>
                                        </div>
                                        <input
                                            type="time"
                                            value={sc.time}
                                            onChange={e => updateSlotConfig(slot, 'time', e.target.value)}
                                            style={{
                                                background: 'var(--bg-input)', border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                                                color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 14,
                                                outline: 'none',
                                            }}
                                        />
                                    </div>

                                    {/* Scheduler offset */}
                                    <div className="field-group">
                                        <label className="field-label">Pick dish automatically</label>
                                        <select
                                            className="field-select"
                                            value={isCustomOffset ? -1 : sc.schedulerOffsetMins}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                handleOffsetChange(slot, val);
                                            }}
                                        >
                                            {OFFSET_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {isCustomOffset && (
                                        <div className="field-group">
                                            <label className="field-label">Custom offset (minutes before meal)</label>
                                            <input
                                                type="number"
                                                className="field-input"
                                                min={5} max={480}
                                                value={sc.schedulerOffsetMins}
                                                onChange={e => updateSlotConfig(slot, 'schedulerOffsetMins', Number(e.target.value))}
                                            />
                                        </div>
                                    )}

                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>
                                        💡 Scheduler will automatically pick a random dish{' '}
                                        <strong style={{ color: 'var(--accent)' }}>{sc.schedulerOffsetMins} mins</strong>{' '}
                                        before {getMealSlotLabel(slot)} ({formatTime(sc.time)})
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <button
                    className="btn btn-primary btn-full"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: 8 }}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>

                {/* Scheduler Info */}
                <div style={{
                    marginTop: 16, padding: 16,
                    background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.15)',
                    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7
                }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>⏰ How the Scheduler Works</div>
                    <p>The app will automatically pick a random dish from your configured menu at the offset time you set here. </p>
                    <p style={{ marginTop: 6 }}>All family members will receive a notification when a dish is picked or nominated. You can always override or nominate your own dish!</p>
                </div>
            </div>

            {toast && <div className="toast success">{toast}</div>}
        </div>
    );
};

export default MealConfigPage;

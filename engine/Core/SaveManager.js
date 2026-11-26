export default class SaveManager {
    constructor(prefix = "game_", version = 1) {
        this.prefix = prefix;
        this.version = version;
    }

    getKey(slot) {
        return this.prefix + slot;
    }

    save(slot, data) {
        const payload = {
            version: this.version,
            timestamp: Date.now(),
            data: data
        }

        try {
            localStorage.setItem(this.getKey(slot), JSON.stringify(payload));
            return true;
        } catch (err) {
            console.error("ERROR: Game Save Failed - ", err);
            return false;
        }
    }

    load(slot, defaultData = null) {
        const raw = localStorage.getItem(this.getKey(slot));

        if (raw == null) {
            return defaultData;
        }

        try {
            const payload = JSON.parse(raw);
            return payload.data ?? defaultData;
        } catch (err) {
            console.error("ERROR: Game Save Load Failed - ", err);
            return defaultData;
        }
    }

    hasSave(slot) {
        return localStorage.getItem(this.getKey(slot)) != null;
    }

    deleteSave(slot) {
        localStorage.removeItem(this.getKey(slot));
    }

    listSlots() {
        const slots = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const slotName = key.slice(this.prefix.length);
                slots.push(slotName);
            }
        }

        return slots;
    }

    clearAll() {
        for (let slot of this.listSlots()) {
            this.deleteSave(slot)
        }
    }
    
    saveSettings(settingsObj) {
        return this.save("__settings__", settingsObj);
    }

    loadSettings(defaultSettings = {}) {
        return this.load("__settings__", defaultSettings);
    }
}
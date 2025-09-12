import { defineStore } from 'pinia';

export const useAgentsStore = defineStore('agents', {
    state: () => ({
        agents: [],
        colorByCode: {},
        colorByName: {},
        loaded: false,
    }),
    actions: {
        setAgents(list = []) {
            this.agents = Array.isArray(list) ? list : [];
            const byCode = {};
            const byName = {};
            for (const a of this.agents) {
                const color = a.color || null; // API already provides hex like #CCD070
                const code = (a.code || '').toString().trim().toUpperCase();
                if (code) byCode[code] = color;
                const f = (a.agent_name || a.name || '').toString().trim();
                const l = (a.agent_surname || a.surname || '').toString().trim();
                const full = `${f} ${l}`.trim().toLowerCase();
                if (full) byName[full] = color;
            }
            this.colorByCode = byCode;
            this.colorByName = byName;
            this.loaded = true;
        },
        bgStyleFor(agentLike) {
            const code = (agentLike?.code || '').toString().trim().toUpperCase();
            const f = (agentLike?.name || '').toString().trim();
            const l = (agentLike?.surname || '').toString().trim();
            const full = `${f} ${l}`.trim().toLowerCase();
            const hex = (code && this.colorByCode[code]) || (full && this.colorByName[full]) || agentLike?.color || '#e5e7eb';
            return { backgroundColor: hex, color: '#ffffff' };
        },
        initialsFor(agentLike) {
            const f = (agentLike?.name || '').toString().trim();
            const l = (agentLike?.surname || '').toString().trim();
            if (f || l) return `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();
            const code = (agentLike?.code || '').toString().trim();
            return code ? code.slice(0, 2).toUpperCase() : '??';
        },
        displayNameFor(agentLike) {
            const f = (agentLike?.name || '').toString().trim();
            const l = (agentLike?.surname || '').toString().trim();
            const code = (agentLike?.code || '').toString().trim();
            return f || l ? `${f} ${l}`.trim() : code || 'Agent';
        }
    }
});



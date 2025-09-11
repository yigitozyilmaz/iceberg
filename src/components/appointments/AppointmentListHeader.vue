<template>
  <div class="px-6 py-4">
    <!-- Filters Row -->
    <div class="flex items-center justify-between mb-4">
      <!-- Left Side: Agent Filters and Other Filters -->
      <div class="flex items-center gap-4">
        <!-- Agent Filters -->
        <div class="flex -space-x-2" style="height: 2.5rem">
          <!-- Loading Spinner when no agents -->
          <div
            v-if="!computedAgents || computedAgents.length === 0"
            class="flex items-center justify-center"
            style="width: 2.5rem; height: 2.5rem"
          >
            <i class="pi pi-spin pi-spinner text-gray-600"></i>
          </div>

          <!-- Agent Avatars when loaded -->
          <template v-else>
            <div
              v-for="(agent, index) in limitedAgents"
              :key="agent.key || index"
              :title="getAgentDisplayName(agent)"
              :class="[
                'rounded-full flex items-center justify-center text-sm font-semibold border-2 border-white shadow-sm cursor-pointer select-none',
                agentClassWithFallback(agent),
                isSelected(agent) ? 'ring-2 ring-offset-1 ring-gray-700' : '',
              ]"
              :style="agentStyle(agent)"
              style="width: 2.5rem; height: 2.5rem"
              @click="toggleAgent(agentKey(agent))"
            >
              {{ getAgentLabel(agent) }}
            </div>
            <div v-if="extraCount > 0" class="relative" ref="overflowRef">
              <div
                class="rounded-full flex items-center justify-center text-sm font-semibold border-2 border-white bg-gray-200 text-gray-700 shadow-sm cursor-pointer"
                style="width: 2.5rem; height: 2.5rem"
                @click.stop="toggleOverflow()"
              >
                +{{ extraCount }}
              </div>
              <div
                v-show="overflowOpen"
                class="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-primary border border-gray-200 rounded-md shadow-lg p-2 text-xs text-gray-700 whitespace-nowrap z-20 w-56"
                @click.stop
              >
                <div
                  class="px-2 py-1 text-[11px] text-gray-500"
                  v-text="$t('appointments.labels.otherAgents')"
                />
                <div
                  v-for="(agent, i) in overflowAgents"
                  :key="agent.key || i"
                  class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                  @click="toggleAgent(agentKey(agent))"
                >
                  <div
                    :class="[
                      'rounded-full flex items-center justify-center text-xs font-semibold border border-white shadow-sm',
                      agentClassWithFallback(agent),
                      isSelected(agent) ? 'ring-1 ring-gray-700' : '',
                    ]"
                    :style="agentStyle(agent)"
                    style="width: 1.5rem; height: 1.5rem"
                  >
                    {{ getAgentLabel(agent) }}
                  </div>
                  <div class="truncate">{{ getAgentDisplayName(agent) }}</div>
                </div>
                <div class="mt-2 flex justify-end">
                  <button
                    class="px-2 py-1 text-xs rounded-md bg-black text-white hover:bg-black/90 border border-black"
                    @click="overflowOpen = false"
                  >
                    {{ $t("common.close") }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Status Filter -->
        <Dropdown
          v-model="filters.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="All Statuses"
          style="width: 16rem; border: 2px solid var(--color-primary)"
          class="custom-dropdown text-sm p-1"
          @change="emitFilters"
        />

        <!-- Date Range Filters -->
        <div class="flex items-center gap-4">
          <Calendar
            v-model="filters.dateRange[0]"
            style="width: 18rem"
            class="calendar-input"
            :showTime="true"
            :placeholder="$t('appointments.placeholders.dateFrom')"
            :showIcon="true"
            @date-select="emitFilters"
          />
          <Calendar
            v-model="filters.dateRange[1]"
            style="width: 18rem"
            class="calendar-input"
            :showTime="true"
            :placeholder="$t('appointments.placeholders.dateTo')"
            :showIcon="true"
            @date-select="emitFilters"
          />
        </div>
      </div>

      <!-- Right Side: Search -->
      <div class="relative">
        <span class="p-input-icon-right">
          <i
            class="pi pi-search absolute top-1/2 -translate-y-1/2 text-sm border-2 border-secondary rounded-r-md right-0 custom-search-icon"
            style="padding: 0.6rem"
          />
          <InputText
            v-model="filters.search"
            :placeholder="$t('appointments.placeholders.search')"
            class="w-96 pl-3 pr-8 py-2 text-base border-2 border-primary rounded-md custom-search text-center"
            @input="debounceSearch"
          />
        </span>
      </div>
    </div>

    <!-- Divider -->
    <div class="border-b border-gray-200 mt-4"></div>
  </div>
</template>

<script>
export default {
  name: "AppointmentListHeader",
  props: {
    agents: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      filters: {
        status: null,
        dateRange: [null, null],
        search: "",
      },
      selectedAgents: [],
      overflowOpen: false,
      statusOptions: [
        { label: this.$t("appointments.status.all"), value: null },
        { label: this.$t("appointments.status.upcoming"), value: "upcoming" },
        { label: this.$t("appointments.status.completed"), value: "completed" },
        { label: this.$t("appointments.status.cancelled"), value: "cancelled" },
      ],
      searchTimeout: null,
    };
  },
  computed: {
    computedAgents() {
      return (this.agents || []).map((a) => ({
        key: a.key || this.agentKey(a),
        code: a.code || null,
        name: a.name || null,
        surname: a.surname || null,
        color: a.color || null,
      }));
    },
    limitedAgents() {
      return this.computedAgents.slice(0, 5);
    },
    overflowAgents() {
      return this.computedAgents.slice(5);
    },
    extraCount() {
      const extra = this.computedAgents.length - 5;
      return extra > 0 ? extra : 0;
    },
  },
  methods: {
    agentKey(agent) {
      const code = (agent?.code || "").toString().trim().toUpperCase();
      if (code) return code;
      const f = (agent?.name || "").toString().trim();
      const l = (agent?.surname || "").toString().trim();
      if (f || l) {
        const fi = f ? f[0] : "";
        const li = l ? l[0] : "";
        const initials = (fi + li).toUpperCase();
        return initials || null;
      }
      return null;
    },
    agentClassWithFallback(agent) {
      const colorToken = agent?.color || "gray";
      const colors = {
        yellow: "bg-yellow-300 text-yellow-900",
        orange: "bg-orange-300 text-orange-900",
        purple: "bg-purple-300 text-purple-900",
        green: "bg-green-300 text-green-900",
        blue: "bg-blue-300 text-blue-900",
        pink: "bg-pink-300 text-pink-900",
        gray: "bg-gray-300 text-gray-700",
      };
      return colors[colorToken] || colors.gray;
    },
    agentStyle(agent) {
      const colorToken = agent?.color || null;
      if (typeof colorToken === "string" && colorToken.startsWith("#")) {
        return {
          backgroundColor: colorToken,
          color: this.contrastText(colorToken),
        };
      }
      return null;
    },
    contrastText(hex) {
      try {
        const clean = hex.replace("#", "");
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 140 ? "#111827" : "#ffffff";
      } catch (e) {
        return "#111827";
      }
    },
    getAgentLabel(agent) {
      const code = (agent?.code || "").toString().trim();
      if (code) return code.toUpperCase().slice(0, 2);
      const f = (agent?.name || "").toString().trim();
      const l = (agent?.surname || "").toString().trim();
      const fi = f ? f[0] : "";
      const li = l ? l[0] : "";
      return (fi + li).toUpperCase() || "??";
    },
    getAgentDisplayName(agent) {
      const f = (agent?.name || "").toString().trim();
      const l = (agent?.surname || "").toString().trim();
      const code = (agent?.code || "").toString().trim();
      return f || l ? `${f} ${l}`.trim() : code || "Agent";
    },
    isSelected(agent) {
      const key = this.agentKey(agent);
      return key ? this.selectedAgents.includes(key) : false;
    },
    toggleAgent(agentKey) {
      if (!agentKey) return;
      const index = this.selectedAgents.indexOf(agentKey);
      if (index === -1) {
        this.selectedAgents.push(agentKey);
      } else {
        this.selectedAgents.splice(index, 1);
      }
      this.emitFilters();
    },
    toggleOverflow() {
      this.overflowOpen = !this.overflowOpen;
      if (this.overflowOpen) {
        window.addEventListener("click", this.onOutsideClick, { once: true });
      }
    },
    onOutsideClick(e) {
      const el = this.$refs.overflowRef;
      if (el && !el.contains(e.target)) {
        this.overflowOpen = false;
      }
    },
    emitFilters() {
      const filters = {
        ...this.filters,
        agents: this.selectedAgents.length > 0 ? this.selectedAgents : null,
      };
      // eslint-disable-next-line no-console
      console.log("[Header] emit filters:", filters);
      this.$emit("filters-change", filters);
    },
    debounceSearch() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.emitFilters();
      }, 300);
    },
  },
  emits: ["filters-change"],
};
</script>

<style scoped>
/* Dropdown Styling */
:deep(.custom-dropdown .p-dropdown) {
  height: 40px;
  border: 2px solid var(--color-primary) !important;
  border-radius: 0.375rem;
  font-size: 16px;
}
:deep(.custom-dropdown .p-dropdown-label) {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  color: black;
  font-size: 16px;
}
:deep(.custom-dropdown .p-dropdown-items .p-dropdown-item) {
  color: black;
  font-size: 16px;
}
:deep(.custom-dropdown .p-dropdown-items .p-dropdown-item:hover) {
  background-color: var(--color-secondary) !important;
  color: white;
}
:deep(.custom-dropdown .p-dropdown-label.p-placeholder) {
  color: black;
}

/* Calendar Styling */
:deep(.p-calendar) {
  border: 2px solid var(--color-primary);
  border-radius: 0.375rem;
}
:deep(.p-calendar .p-inputtext) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-radius: 0.375rem;
}

:deep(.calendar-input .p-inputtext::placeholder) {
  text-align: left;
  font-size: 8px;
  position: relative;
  top: -10px;
  padding-left: 10px;
  color: black;
}

/* Search Input Styling */
:deep(.custom-search.p-inputtext) {
  border: 2px solid var(--color-primary);
  border-radius: 0.375rem;
  font-size: 16px;
}
:deep(.custom-search.p-inputtext::placeholder) {
  color: black;
}
</style>

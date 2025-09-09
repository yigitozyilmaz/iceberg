<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-3">
      <!-- Agent Filters -->
      <div class="flex items-center gap-1">
        <button
          v-for="agent in agents"
          :key="agent.code"
          class="h-6 px-2 rounded-full text-xs font-medium"
          :class="[
            getAgentClass(agent),
            selectedAgents.includes(agent.code) ? 'ring-2 ring-offset-1' : '',
          ]"
          @click="toggleAgent(agent.code)"
        >
          {{ agent.code }}
        </button>
      </div>

      <!-- Search and Create -->
      <div class="flex items-center gap-2">
        <Dropdown
          v-model="filters.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="All Statuses"
          class="w-[140px]"
          @change="emitFilters"
        />
        <div class="flex items-center gap-1">
          <Calendar
            v-model="filters.dateRange[0]"
            :showTime="true"
            :placeholder="$t('appointments.placeholders.dateFrom')"
            class="w-[160px]"
            :showIcon="true"
            @date-select="emitFilters"
          />
          <Calendar
            v-model="filters.dateRange[1]"
            :showTime="true"
            :placeholder="$t('appointments.placeholders.dateTo')"
            class="w-[160px]"
            :showIcon="true"
            @date-select="emitFilters"
          />
        </div>
        <div class="relative">
          <span class="p-input-icon-right">
            <i
              class="pi pi-search absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
            />
            <InputText
              v-model="filters.search"
              :placeholder="$t('appointments.placeholders.search')"
              class="w-[180px] pl-2 pr-6 py-1.5 text-sm"
              @input="debounceSearch"
            />
          </span>
        </div>
        <Button
          :label="$t('appointments.create')"
          icon="pi pi-plus"
          @click="$emit('new-appointment')"
          class="p-button-sm"
        />
      </div>
    </div>

    <!-- Total Count -->
    <div class="text-xs text-gray-600 mb-3">
      {{ $t("appointments.count.found", { count: totalRecords }) }}
    </div>
  </div>
</template>

<script>
export default {
  name: "AppointmentListHeader",
  props: {
    totalRecords: {
      type: Number,
      required: true,
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
      statusOptions: [
        { label: this.$t("appointments.status.all"), value: null },
        { label: this.$t("appointments.status.upcoming"), value: "upcoming" },
        { label: this.$t("appointments.status.completed"), value: "completed" },
        { label: this.$t("appointments.status.cancelled"), value: "cancelled" },
      ],
      agents: [
        { code: "LK", color: "yellow" },
        { code: "JD", color: "orange" },
        { code: "MH", color: "purple" },
        { code: "YT", color: "green" },
        { code: "+4", color: "gray" },
      ],
      searchTimeout: null,
    };
  },
  watch: {
    totalRecords(val) {
      // Debug for header count and filters
      // Remove later
      // eslint-disable-next-line no-console
      console.log(
        "[Header] totalRecords:",
        val,
        "current filters:",
        this.filters
      );
    },
  },
  methods: {
    getAgentClass(agent) {
      const colors = {
        yellow: "bg-yellow-100 text-yellow-800",
        orange: "bg-orange-100 text-orange-800",
        purple: "bg-purple-100 text-purple-800",
        green: "bg-green-100 text-green-800",
        gray: "bg-gray-100 text-gray-600",
      };
      return colors[agent.color] || colors.gray;
    },
    toggleAgent(agentCode) {
      const index = this.selectedAgents.indexOf(agentCode);
      if (index === -1) {
        this.selectedAgents.push(agentCode);
      } else {
        this.selectedAgents.splice(index, 1);
      }
      this.emitFilters();
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
  emits: ["new-appointment", "filters-change"],
};
</script>

<style scoped>
:deep(.p-dropdown) {
  height: 32px;
}
:deep(.p-dropdown-label) {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
:deep(.p-calendar) {
  height: 32px;
}
:deep(.p-calendar .p-inputtext) {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
:deep(.p-inputtext) {
  height: 32px;
}
</style>

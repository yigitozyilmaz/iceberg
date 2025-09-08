<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <!-- Agent Filters -->
        <div class="flex items-center gap-2">
          <button
            v-for="agent in agents"
            :key="agent.code"
            class="h-7 px-3 rounded-full text-sm font-medium"
            :class="getAgentClass(agent)"
          >
            {{ agent.code }}
          </button>
        </div>

        <!-- Search and Create -->
        <div class="flex items-center gap-4">
          <Dropdown
            v-model="filters.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            class="w-[180px]"
            @change="onFiltersChange"
          />
          <div class="flex items-center gap-2">
            <Calendar
              v-model="filters.dateRange[0]"
              :showTime="true"
              :placeholder="$t('appointments.placeholders.dateFrom')"
              class="w-[200px]"
              :showIcon="true"
              @date-select="onFiltersChange"
            />
            <Calendar
              v-model="filters.dateRange[1]"
              :showTime="true"
              :placeholder="$t('appointments.placeholders.dateTo')"
              class="w-[200px]"
              :showIcon="true"
              @date-select="onFiltersChange"
            />
          </div>
          <div class="relative">
            <span class="p-input-icon-right">
              <i
                class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <InputText
                v-model="filters.search"
                :placeholder="$t('appointments.placeholders.search')"
                class="w-[240px] pl-4 pr-10 py-2"
                @input="debounceSearch"
              />
            </span>
          </div>
          <Button
            :label="$t('appointments.create')"
            icon="pi pi-plus"
            @click="$emit('new-appointment')"
            class="bg-[#E91E63] hover:bg-[#D81B60] border-none px-4 h-10 rounded-full"
          />
        </div>
      </div>

      <!-- Total Count -->
      <div class="text-sm text-gray-600 mb-4">
        {{ $t("appointments.count.found", { count: totalRecords }) }}
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <!-- Appointment List -->
    <div v-else class="space-y-[1px] bg-gray-100">
      <div
        v-for="appointment in appointments"
        :key="appointment.id"
        class="bg-white py-4 px-6"
      >
        <div class="flex justify-between items-center">
          <!-- Contact Info -->
          <div class="flex items-center gap-8">
            <div class="flex flex-col gap-1 min-w-[200px]">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-gray-400"></i>
                <span class="font-medium">{{ appointment.contact_name }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <i class="pi pi-envelope text-gray-400"></i>
                <span>{{ appointment.contact_email }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <i class="pi pi-phone text-gray-400"></i>
                <span>{{ appointment.contact_phone || "N/A" }}</span>
              </div>
            </div>

            <!-- Address -->
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <i class="pi pi-map-marker text-gray-400"></i>
              <span>{{ appointment.appointment_address }}</span>
            </div>
          </div>

          <!-- Status and Time -->
          <div class="flex items-center gap-6">
            <div
              :class="[
                'px-4 py-1 rounded-full text-sm font-medium',
                getStatusClass(appointment),
              ]"
            >
              {{ getStatusText(appointment) }}
              <span v-if="getTimeUntil(appointment)" class="ml-2 text-xs">
                {{ getTimeUntil(appointment) }}
              </span>
            </div>

            <div class="flex items-center gap-2 min-w-[150px]">
              <i class="pi pi-calendar text-gray-400"></i>
              <span class="text-sm">{{
                formatDate(appointment.appointment_date)
              }}</span>
            </div>

            <!-- Agents -->
            <div class="flex -space-x-2">
              <div
                v-for="(agent, index) in appointment.agents || []"
                :key="index"
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white',
                  getAgentClass(agent),
                ]"
              >
                {{ getAgentInitials(agent) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="p-4 bg-white border-t">
      <Paginator
        v-model:first="pagination.first"
        :rows="pagination.rows"
        :totalRecords="totalRecords"
        @page="onPageChange($event)"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "AppointmentList",
  props: {
    appointments: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
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
      statusOptions: [
        { label: this.$t("appointments.status.all"), value: null },
        { label: this.$t("appointments.status.upcoming"), value: "upcoming" },
        { label: this.$t("appointments.status.completed"), value: "completed" },
        { label: this.$t("appointments.status.cancelled"), value: "cancelled" },
      ],
      pagination: {
        first: 0,
        rows: 10,
      },
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
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleString(
        this.$i18n.locale === "tr" ? "tr-TR" : "en-US",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    },
    getStatusText(appointment) {
      if (appointment.is_cancelled)
        return this.$t("appointments.status.cancelled");
      return new Date(appointment.appointment_date) > new Date()
        ? this.$t("appointments.status.upcoming")
        : this.$t("appointments.status.completed");
    },
    getStatusClass(appointment) {
      if (appointment.is_cancelled) return "bg-[#FFE4E4] text-[#FF4444]";
      const date = new Date(appointment.appointment_date);
      const now = new Date();
      if (date > now) {
        const hours = Math.floor((date - now) / (1000 * 60 * 60));
        if (hours <= 2) return "bg-[#FFF4E5] text-[#FF9900]";
        return "bg-[#E3F5FF] text-[#2196F3]";
      }
      return "bg-[#E8FFE3] text-[#4CAF50]";
    },
    getTimeUntil(appointment) {
      if (appointment.is_cancelled) return null;
      const date = new Date(appointment.appointment_date);
      const now = new Date();
      const diff = date - now;

      if (diff < 0) return null;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      if (days > 0) return `${days} days`;
      if (hours > 0) return `${hours} hours`;
      return "< 1 hour";
    },
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
    getAgentInitials(agent) {
      return agent.code || "??";
    },
    onPageChange(event) {
      this.pagination.first = event.first;
      this.$emit("load-data", {
        page: Math.floor(event.first / this.pagination.rows) + 1,
        perPage: this.pagination.rows,
        filters: this.filters,
      });
    },
    onFiltersChange() {
      this.pagination.first = 0;
      this.$emit("load-data", {
        page: 1,
        perPage: this.pagination.rows,
        filters: this.filters,
      });
    },
    debounceSearch() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.onFiltersChange();
      }, 300);
    },
  },
  emits: ["new-appointment", "edit-appointment", "load-data"],
};
</script>

<style scoped>
:deep(.p-dropdown) {
  height: 40px;
}
:deep(.p-dropdown-label) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
:deep(.p-calendar) {
  height: 40px;
}
:deep(.p-calendar .p-inputtext) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
:deep(.p-inputtext) {
  height: 40px;
}
:deep(.p-paginator) {
  background: transparent;
  border: none;
}
:deep(.p-button) {
  height: 40px;
}
</style>

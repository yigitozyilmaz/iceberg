<template>
  <div class="bg-white min-h-screen">
    <AppointmentListHeader
      :total-records="filteredAppointments.length"
      :agents="agentsForHeader"
      @new-appointment="$emit('new-appointment')"
      @filters-change="onFiltersChange"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <!-- Appointment List -->
    <div v-else class="bg-white">
      <DataTable
        :value="filteredAppointments"
        :rows="rows"
        :paginator="true"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        class="p-datatable-sm"
        @page="onPageChange"
      >
        <Column :bodyClass="'app-row-cell'">
          <template #body="slotProps">
            <AppointmentRow
              :appointment="slotProps.data"
              :agent-color-by-code="agentColorByCode"
              :agent-color-by-name="agentColorByName"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import AppointmentListHeader from "./AppointmentListHeader.vue";
import AppointmentRow from "./AppointmentRow.vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { AgentService } from "../../api/services/agent.service";

export default {
  components: {
    AppointmentListHeader,
    AppointmentRow,
    DataTable,
    Column,
  },
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
  },
  data() {
    return {
      filteredAppointments: [],
      currentFilters: {},
      rows: 10,
      allAgents: [],
    };
  },
  computed: {
    agentsForHeader() {
      return (this.allAgents || []).map((a) => ({
        key: (a.code || "").toString().trim().toUpperCase() || null,
        code: a.code || null,
        name: a.agent_name || a.name || null,
        surname: a.agent_surname || a.surname || null,
        color: a.color || null,
      }));
    },
    agentColorByCode() {
      const map = {};
      for (const a of this.allAgents || []) {
        const code = (a.code || "").toString().trim().toUpperCase();
        if (code) map[code] = a.color || null;
      }
      return map;
    },
    agentColorByName() {
      const map = {};
      for (const a of this.allAgents || []) {
        const f = (a.agent_name || a.name || "").toString().trim();
        const l = (a.agent_surname || a.surname || "").toString().trim();
        const full = `${f} ${l}`.trim().toLowerCase();
        if (full) map[full] = a.color || null;
      }
      return map;
    },
  },
  watch: {
    appointments: {
      immediate: true,
      handler(newAppointments) {
        this.filteredAppointments = [...newAppointments];
        this.applyFilters();
      },
    },
  },
  methods: {
    async loadAgents() {
      try {
        const response = await AgentService.getAgents();
        this.allAgents = response.data || [];
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load agents", error);
        this.allAgents = [];
      }
    },
    normalizeAgentKey(agent) {
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
    onPageChange(event) {
      this.rows = event.rows;
    },
    onFiltersChange(filters) {
      this.currentFilters = filters;
      this.applyFilters();
    },
    sortByNearestDate(list) {
      const now = new Date();
      const valid = list.filter(
        (a) => !isNaN(new Date(a.appointment_date).getTime())
      );
      const invalid = list.filter((a) =>
        isNaN(new Date(a.appointment_date).getTime())
      );

      const future = valid
        .filter((a) => new Date(a.appointment_date) >= now)
        .sort(
          (a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)
        );

      const past = valid
        .filter((a) => new Date(a.appointment_date) < now)
        .sort(
          (a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)
        );

      return [...future, ...past, ...invalid];
    },
    applyFilters() {
      let filtered = [...this.appointments];

      // Status filter
      if (this.currentFilters.status) {
        const now = new Date();
        filtered = filtered.filter((appointment) => {
          const appointmentDate = new Date(appointment.appointment_date);
          switch (this.currentFilters.status) {
            case "cancelled":
              return appointment.is_cancelled;
            case "upcoming":
              return !appointment.is_cancelled && appointmentDate > now;
            case "completed":
              return !appointment.is_cancelled && appointmentDate <= now;
            default:
              return true;
          }
        });
      }

      // Date range filter
      if (
        this.currentFilters.dateRange?.[0] ||
        this.currentFilters.dateRange?.[1]
      ) {
        filtered = filtered.filter((appointment) => {
          const appointmentDate = new Date(appointment.appointment_date);
          const startDate = this.currentFilters.dateRange[0]
            ? new Date(this.currentFilters.dateRange[0])
            : null;
          const endDate = this.currentFilters.dateRange[1]
            ? new Date(this.currentFilters.dateRange[1])
            : null;

          if (startDate && endDate) {
            return appointmentDate >= startDate && appointmentDate <= endDate;
          } else if (startDate) {
            return appointmentDate >= startDate;
          } else if (endDate) {
            return appointmentDate <= endDate;
          }
          return true;
        });
      }

      // Search filter
      if (this.currentFilters.search) {
        const searchLower = this.currentFilters.search.toLowerCase();
        filtered = filtered.filter(
          (appointment) =>
            appointment.contact_name?.toLowerCase().includes(searchLower) ||
            appointment.contact_email?.toLowerCase().includes(searchLower) ||
            appointment.contact_phone?.toLowerCase().includes(searchLower) ||
            appointment.appointment_address?.toLowerCase().includes(searchLower)
        );
      }

      // Agent filter (AND logic: appointment must include all selected agents)
      if (this.currentFilters.agents?.length) {
        filtered = filtered.filter((appointment) => {
          const keys = this.appointmentAgentKeys(appointment);
          return this.currentFilters.agents.every((key) => keys.includes(key));
        });
      }

      // Global sort by nearest date (upcoming earliest first)
      filtered = this.sortByNearestDate(filtered);

      this.filteredAppointments = filtered;
    },
    appointmentAgentKeys(appointment) {
      const keys = [];
      // Structured agents
      if (Array.isArray(appointment?.agents)) {
        for (const a of appointment.agents) {
          const k = this.normalizeAgentKey(a);
          if (k) keys.push(k);
        }
      }
      // Fallback: parallel name/surname arrays or single strings
      const names = Array.isArray(appointment?.agent_name)
        ? appointment.agent_name
        : appointment?.agent_name
        ? [appointment.agent_name]
        : [];
      const surnames = Array.isArray(appointment?.agent_surname)
        ? appointment.agent_surname
        : appointment?.agent_surname
        ? [appointment.agent_surname]
        : [];
      const len = Math.max(names.length, surnames.length);
      for (let i = 0; i < len; i++) {
        const obj = { name: names[i] || null, surname: surnames[i] || null };
        const k = this.normalizeAgentKey(obj); // will return initials
        if (k) keys.push(k);
      }
      return keys;
    },
  },
  emits: ["new-appointment"],
  mounted() {
    this.loadAgents();
  },
};
</script>

<style scoped>
/* Add vertical spacing between table rows and remove default collapse */
:deep(.p-datatable-table) {
  border-collapse: separate;
  border-spacing: 0 12px; /* gap between rows */
}
/* Remove default td padding so our cell looks like a card */
:deep(.p-datatable-tbody > tr > td.app-row-cell) {
  padding: 0 !important;
  background: transparent;
}
/* Card styling on the single cell */
:deep(.p-datatable-tbody > tr.p-row-even > td.app-row-cell) {
  background-color: theme("colors.primary");
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 12px;
  overflow: hidden;
}
:deep(.p-datatable-tbody > tr.p-row-odd > td.app-row-cell) {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
</style>

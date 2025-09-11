<template>
  <div class="bg-white min-h-screen">
    <AppointmentListHeader
      :agents="agentsForHeader"
      @filters-change="onFiltersChange"
    />

    <!-- Count and Create Button Row -->
    <div class="px-6 pb-4 flex items-center justify-between">
      <div class="font-bold text-gray-900">
        {{
          $t("appointments.count.found", { count: filteredAppointments.length })
        }}
      </div>
      <Button
        label="Create Appointment"
        icon="pi pi-plus"
        @click="$emit('new-appointment')"
        class="bg-secondary text-white border-secondary hover:bg-secondary/90 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <!-- Appointment List -->
    <div v-else class="bg-white px-6">
      <DataTable
        :value="filteredAppointments"
        :rows="rows"
        :paginator="true"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :showHeader="false"
        class="p-datatable-sm"
        @page="onPageChange"
      >
        <Column :bodyClass="'app-row-cell'">
          <template #body="slotProps">
            <AppointmentRow
              :appointment="slotProps.data"
              :agent-color-by-code="agentColorByCode"
              :agent-color-by-name="agentColorByName"
              @edit="handleEdit"
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
import Button from "primevue/button";
import { AgentService } from "../../api/services/agent.service";

export default {
  components: {
    AppointmentListHeader,
    AppointmentRow,
    DataTable,
    Column,
    Button,
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
    agents: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      filteredAppointments: [],
      currentFilters: {},
      rows: 10,
    };
  },
  computed: {
    agentsForHeader() {
      return (this.agents || []).map((a) => ({
        key: (a.code || "").toString().trim().toUpperCase() || null,
        code: a.code || null,
        name: a.agent_name || a.name || null,
        surname: a.agent_surname || a.surname || null,
        color: a.color || null,
      }));
    },
    agentColorByCode() {
      const map = {};
      for (const a of this.agents || []) {
        const code = (a.code || "").toString().trim().toUpperCase();
        if (code) map[code] = a.color || null;
      }
      return map;
    },
    agentColorByName() {
      const map = {};
      for (const a of this.agents || []) {
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
    handleEdit(appointment) {
      this.$emit("edit-appointment", appointment);
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
        filtered = filtered.filter((appointment) => {
          // Güvenli string dönüşümü için helper fonksiyon
          const safeToString = (value) => {
            if (!value) return "";
            if (Array.isArray(value)) return value.join(" ");
            return value.toString();
          };

          const contactName = safeToString(
            appointment.contact_name
          ).toLowerCase();
          const contactEmail = safeToString(
            appointment.contact_email
          ).toLowerCase();
          const contactPhone = safeToString(
            appointment.contact_phone
          ).toLowerCase();
          const address = safeToString(
            appointment.appointment_address
          ).toLowerCase();

          return (
            contactName.includes(searchLower) ||
            contactEmail.includes(searchLower) ||
            contactPhone.includes(searchLower) ||
            address.includes(searchLower)
          );
        });
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
  emits: ["new-appointment", "edit-appointment"],
  // mounted() {
  //   this.loadAgents(); // App.vue'da yükleniyor artık
  // },
};
</script>

<style scoped>
/* Hide table header */
:deep(.p-datatable-thead) {
  display: none !important;
}
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
  border: 2px solid #e5e7eb; /* gray-200 */
  border-radius: 12px;
  overflow: hidden;
}
:deep(.p-datatable-tbody > tr.p-row-odd > td.app-row-cell) {
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
/* DataTable Paginator Rows Per Page Dropdown */
:deep(.p-paginator .p-paginator-rpp-options .p-dropdown) {
  border: 1px solid var(--color-primary) !important;
  border-radius: 0.375rem;
}

:deep(.p-paginator .p-dropdown) {
  border: 1px solid var(--color-primary) !important;
  border-radius: 0.375rem;
}

:deep(.p-datatable .p-paginator .p-dropdown) {
  border: 1px solid var(--color-primary) !important;
  border-radius: 0.375rem;
}
</style>

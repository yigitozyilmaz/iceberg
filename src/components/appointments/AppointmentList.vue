<template>
  <div class="bg-white min-h-screen">
    <AppointmentListHeader
      :total-records="filteredAppointments.length"
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
            <AppointmentRow :appointment="slotProps.data" />
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
    };
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

      // Agent filter
      if (this.currentFilters.agents?.length) {
        filtered = filtered.filter((appointment) =>
          appointment.agents?.some((agent) =>
            this.currentFilters.agents.includes(agent.code)
          )
        );
      }

      // Global sort by nearest date (upcoming earliest first)
      filtered = this.sortByNearestDate(filtered);

      this.filteredAppointments = filtered;
    },
  },
  emits: ["new-appointment"],
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
  background-color: #f7f8fb;
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

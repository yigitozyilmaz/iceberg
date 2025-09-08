<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-semibold text-gray-800">
            {{ $t("common.appTitle") }}
          </h1>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto">
      <AppointmentList
        :appointments="appointments"
        :loading="loading"
        :totalRecords="totalRecords"
        @new-appointment="showModal = true"
        @edit-appointment="editAppointment"
        @load-data="loadAppointments"
      />
    </main>

    <!-- Modal -->
    <AppointmentModal
      v-model="showModal"
      :appointment="selectedAppointment"
      :loading="saving"
      @save="saveAppointment"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script>
import AppointmentList from "./components/appointments/AppointmentList.vue";
import AppointmentModal from "./components/appointments/AppointmentModal.vue";
import { appointmentApi } from "./services/api";

export default {
  name: "App",
  components: {
    AppointmentList,
    AppointmentModal,
  },
  data() {
    return {
      appointments: [],
      loading: true,
      saving: false,
      showModal: false,
      selectedAppointment: null,
      totalRecords: 0,
    };
  },
  methods: {
    async loadAppointments({ page = 1, perPage = 10, filters = {} } = {}) {
      try {
        this.loading = true;
        const response = await appointmentApi.getAll({
          page,
          perPage,
          filters,
        });
        this.appointments = response.data;
        this.totalRecords = response.pagination.total;
      } catch (error) {
        console.error("Error:", error);
        this.$toast.add({
          severity: "error",
          summary: this.$t("common.error"),
          detail: this.$t("appointments.messages.loadError"),
          life: 3000,
        });
      } finally {
        this.loading = false;
      }
    },
    editAppointment(appointment) {
      this.selectedAppointment = appointment;
      this.showModal = true;
    },
    async saveAppointment(formData) {
      try {
        this.saving = true;
        if (this.selectedAppointment) {
          await appointmentApi.update(this.selectedAppointment.id, formData);
          this.$toast.add({
            severity: "success",
            summary: this.$t("common.success"),
            detail: this.$t("appointments.messages.updateSuccess"),
            life: 3000,
          });
        } else {
          await appointmentApi.create(formData);
          this.$toast.add({
            severity: "success",
            summary: this.$t("common.success"),
            detail: this.$t("appointments.messages.createSuccess"),
            life: 3000,
          });
        }
        await this.loadAppointments();
        this.showModal = false;
        this.selectedAppointment = null;
      } catch (error) {
        console.error("Error:", error);
        this.$toast.add({
          severity: "error",
          summary: this.$t("common.error"),
          detail: this.$t("appointments.messages.saveError"),
          life: 3000,
        });
      } finally {
        this.saving = false;
      }
    },
  },
  mounted() {
    this.loadAppointments();
  },
};
</script>

<style>
@import "./style.css";
@import "primevue/resources/themes/lara-light-blue/theme.css";
@import "primevue/resources/primevue.min.css";
@import "primeicons/primeicons.css";
</style>

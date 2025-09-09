<template>
  <div class="min-h-screen">
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
        @new-appointment="showModal = true"
        @edit-appointment="editAppointment"
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
import { AppointmentService } from "./api/services/appointment.service";

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
    };
  },
  methods: {
    async loadAppointments() {
      try {
        this.loading = true;
        const response = await AppointmentService.getAppointments();
        this.appointments = response.data;
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
          await AppointmentService.updateAppointment(
            this.selectedAppointment.id,
            formData
          );
          this.$toast.add({
            severity: "success",
            summary: this.$t("common.success"),
            detail: this.$t("appointments.messages.updateSuccess"),
            life: 3000,
          });
        } else {
          await AppointmentService.createAppointment(formData);
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
